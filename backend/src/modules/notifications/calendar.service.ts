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
     * Create an appointment event and return the Google Calendar event ID.
     * Returns null if creation fails.
     */
    async createAppointmentEvent(params: {
        patientEmail: string;
        patientName: string;
        dentistName: string;
        appointmentDate: Date;
        endTime?: Date;
        clinicName?: string;
        clinicAddress?: string;
        description?: string;
    }): Promise<string | null> {
        this.logger.log(`[Calendar] createAppointmentEvent called for ${params.patientEmail} at ${params.appointmentDate.toISOString()}`);
        
        if (!this.isConfigured || !this.calendar) {
            this.logger.warn('Google Calendar service not configured. Skipping event creation.');
            return null;
        }

        try {
            const endTime = params.endTime || new Date(params.appointmentDate.getTime() + 60 * 60 * 1000);

            this.logger.log(`[Calendar] Creating event in ${this.calendarId}: start=${params.appointmentDate.toISOString()}, end=${endTime.toISOString()}`);

            const event: calendar_v3.Schema$Event = {
                summary: params.clinicName ? `${params.clinicName} - ${params.patientName}` : `Dental Appointment - ${params.patientName}`,
                location: params.clinicAddress || '',
                description: params.description || `Appointment with Dr. ${params.dentistName} for ${params.patientName}.\nPatient email: ${params.patientEmail}`,
                start: {
                    dateTime: params.appointmentDate.toISOString(),
                    timeZone: this.configService.get<string>('CLINIC_TIMEZONE') || 'UTC',
                },
                end: {
                    dateTime: endTime.toISOString(),
                    timeZone: this.configService.get<string>('CLINIC_TIMEZONE') || 'UTC',
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

            const eventId = result.data.id;
            this.logger.log(`Calendar event created for ${params.patientName}. Event ID: ${eventId}, Link: ${result.data.htmlLink}`);
            return eventId || null;
        } catch (error) {
            this.logger.error(`Failed to create calendar event for ${params.patientEmail}:`, error.message);
            return null;
        }
    }

    /**
     * Delete a calendar event by its ID.
     * Returns true if successful, false otherwise.
     */
    async deleteAppointmentEvent(eventId: string): Promise<boolean> {
        this.logger.log(`[Calendar] deleteAppointmentEvent called for event ID: ${eventId}`);
        
        if (!this.isConfigured || !this.calendar) {
            this.logger.warn('Google Calendar service not configured. Cannot delete event.');
            return false;
        }

        try {
            await this.calendar.events.delete({
                calendarId: this.calendarId,
                eventId: eventId,
            });
            
            this.logger.log(`Calendar event ${eventId} deleted successfully`);
            return true;
        } catch (error) {
            // Event might already be deleted or not exist
            if (error.code === 410 || error.message?.includes('notFound')) {
                this.logger.log(`Calendar event ${eventId} was already deleted or not found`);
                return true; // Consider it a success since the event doesn't exist
            }
            this.logger.error(`Failed to delete calendar event ${eventId}:`, error.message);
            return false;
        }
    }

    /**
     * Update an existing calendar event.
     * If event doesn't exist, creates a new one.
     * Returns the event ID (new or existing).
     */
    async updateAppointmentEvent(eventId: string | null | undefined, params: {
        patientEmail: string;
        patientName: string;
        dentistName: string;
        appointmentDate: Date;
        endTime?: Date;
        clinicName?: string;
        clinicAddress?: string;
        description?: string;
    }): Promise<string | null> {
        this.logger.log(`[Calendar] updateAppointmentEvent called for event ID: ${eventId}`);
        
        // If no event ID, create a new event
        if (!eventId) {
            this.logger.log('No existing event ID, creating new event');
            return this.createAppointmentEvent(params);
        }

        if (!this.isConfigured || !this.calendar) {
            this.logger.warn('Google Calendar service not configured. Cannot update event.');
            return null;
        }

        try {
            const endTime = params.endTime || new Date(params.appointmentDate.getTime() + 60 * 60 * 1000);

            const event: calendar_v3.Schema$Event = {
                summary: params.clinicName ? `${params.clinicName} - ${params.patientName}` : `Dental Appointment - ${params.patientName}`,
                location: params.clinicAddress || '',
                description: params.description || `Appointment with Dr. ${params.dentistName} for ${params.patientName}.\nPatient email: ${params.patientEmail}`,
                start: {
                    dateTime: params.appointmentDate.toISOString(),
                    timeZone: this.configService.get<string>('CLINIC_TIMEZONE') || 'UTC',
                },
                end: {
                    dateTime: endTime.toISOString(),
                    timeZone: this.configService.get<string>('CLINIC_TIMEZONE') || 'UTC',
                },
            };

            const result = await this.calendar.events.update({
                calendarId: this.calendarId,
                eventId: eventId,
                requestBody: event,
            });

            const updatedEventId = result.data.id;
            this.logger.log(`Calendar event ${eventId} updated successfully. Link: ${result.data.htmlLink}`);
            return updatedEventId || eventId;
        } catch (error) {
            // If event doesn't exist, create a new one
            if (error.code === 404 || error.message?.includes('notFound')) {
                this.logger.log(`Event ${eventId} not found, creating new event`);
                return this.createAppointmentEvent(params);
            }
            this.logger.error(`Failed to update calendar event ${eventId}:`, error.message);
            return null;
        }
    }

    /**
     * Check if Calendar service is configured
     */
    isSmsEnabled(): boolean {
        return this.isConfigured;
    }
}
