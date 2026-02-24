import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, calendar_v3 } from 'googleapis';

@Injectable()
export class CalendarService {
    private readonly logger = new Logger(CalendarService.name);
    private calendar: calendar_v3.Calendar | null = null;
    private isConfigured = false;
    private readonly calendarId: string;

    constructor(private configService: ConfigService) {
        this.calendarId = this.configService.get<string>('GOOGLE_CALENDAR_ID') || 'primary';

        const clientEmail = this.configService.get<string>('GOOGLE_CLIENT_EMAIL');
        let privateKey = this.configService.get<string>('GOOGLE_PRIVATE_KEY');

        if (clientEmail && privateKey) {
            try {
                // Ensure private key is properly formatted with newlines if passed in inline in env var
                privateKey = privateKey.replace(/\\n/g, '\n');

                const auth = new google.auth.JWT({
                    email: clientEmail,
                    key: privateKey,
                    scopes: ['https://www.googleapis.com/auth/calendar']
                });

                this.calendar = google.calendar({ version: 'v3', auth });
                this.isConfigured = true;
                this.logger.log(`Google Calendar service configured for calendar: ${this.calendarId}`);
            } catch (error) {
                this.logger.error('Failed to configure Google Calendar:', error.message);
            }
        } else {
            this.logger.warn('Google Service Account credentials not configured. Calendar notifications disable');
        }
    }

    /**
     * Create an appointment event and invite the patient.
     * Their calendar/email client will handle reminding them.
     */
    async createAppointmentEvent(params: {
        patientEmail: string;
        patientName: string;
        dentistName: string;
        appointmentDate: Date;
        clinicName?: string;
        clinicAddress?: string;
    }): Promise<boolean> {
        this.logger.log(`[Calendar] createAppointmentEvent called for ${params.patientEmail} at ${params.appointmentDate.toISOString()}`);
        this.logger.log(`[Calendar] isConfigured: ${this.isConfigured}, calendar instance: ${this.calendar ? 'exists' : 'null'}`);
        if (!this.isConfigured || !this.calendar) {
            this.logger.warn('Google Calendar service not configured. Skipping event creation.');
            return false;
        }

        try {
            const endTime = new Date(params.appointmentDate.getTime() + 60 * 60 * 1000);

            this.logger.log(`[Calendar] Creating event in ${this.calendarId}: start=${params.appointmentDate.toISOString()}, end=${endTime.toISOString()}`);

            const event = {
                summary: `Dental Appointment - ${params.patientName}`,
                location: params.clinicAddress || '',
                description: `Appointment with Dr. ${params.dentistName} for ${params.patientName}.\nPatient email: ${params.patientEmail}`,
                start: {
                    dateTime: params.appointmentDate.toISOString(),
                },
                end: {
                    dateTime: endTime.toISOString(),
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 30 }
                    ],
                },
            };

            const result = await this.calendar.events.insert({
                calendarId: this.calendarId,
                requestBody: event,
            });

            this.logger.log(`Calendar event created for ${params.patientName}. Link: ${result.data.htmlLink}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to create calendar event for ${params.patientEmail}:`, error.message);
            return false;
        }
    }

    /**
     * Delete an appointment event.
     */
    async cancelAppointmentEvent(params: {
        patientEmail: string;
    }): Promise<boolean> {
        this.logger.warn('Cancel calendar event requires storing event ID in DB');
        return false;
    }

    /**
     * Check if Calendar service is configured
     */
    isSmsEnabled(): boolean {
        return this.isConfigured;
    }
}
