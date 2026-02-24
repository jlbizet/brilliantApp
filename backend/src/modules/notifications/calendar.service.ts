import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, calendar_v3 } from 'googleapis';

@Injectable()
export class CalendarService {
    private readonly logger = new Logger(CalendarService.name);
    private calendar: calendar_v3.Calendar | null = null;
    private isConfigured = false;

    constructor(private configService: ConfigService) {
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
                this.logger.log('Google Calendar service configured');
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

            this.logger.log(`[Calendar] Creating event: start=${params.appointmentDate.toISOString()}, end=${endTime.toISOString()}`);

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
                // Note: attendees removed — service accounts require Domain-Wide Delegation
                // to invite external users. The clinic calendar tracks the appointment internally.
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 30 }
                    ],
                },
            };

            const result = await this.calendar.events.insert({
                calendarId: 'primary',
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
        // Ideally we need an event ID but we would need to store it in DB.
        // For now, this is a placeholder or relies on the patient deleting from their calendar.
    }): Promise<boolean> {
        // Implementation note: Storing the event.id returned by createAppointmentEvent
        // in your DB would allow you to delete it here.
        this.logger.warn('Cancel calendar event requires storing event ID in DB');
        return false;
    }

    /**
     * Check if Calendar service is configured
     */
    isSmsEnabled(): boolean {
        // Just keeping this named isSmsEnabled so we don't have to rename everything immediately,
        // or we rename it to isCalendarEnabled when refactoring the caller.
        return this.isConfigured;
    }
}
