/**
 * WhatsApp Message Templates for Brilliant Dental Clinic
 * 
 * These templates use the standard WhatsApp template format with placeholders.
 * You must create these templates in your Meta Business Manager and get them approved.
 * 
 * Template names should match exactly with what's configured in Meta.
 */

interface TemplateComponent {
    type: string;
    parameters: Array<{
        type: string;
        text?: string;
    }>;
}

interface WhatsAppTemplate {
    name: string;
    language: string;
    components: TemplateComponent[];
}

/**
 * Appointment Reminder Template
 * 
 * Template Name: appointment_reminder
 * Language: es (Spanish)
 * 
 * Template content example:
 * "Hola {{1}}, le recordamos que tiene una cita dental programada para el {{2}} a las {{3}} con el Dr./Dra. {{4}}."
 */
export function appointmentReminderTemplate(
    patientName: string,
    appointmentDate: string,
    appointmentTime: string,
    dentistName: string,
): WhatsAppTemplate {
    return {
        name: 'appointment_reminder',
        language: 'es',
        components: [
            {
                type: 'body',
                parameters: [
                    { type: 'text', text: patientName },
                    { type: 'text', text: appointmentDate },
                    { type: 'text', text: appointmentTime },
                    { type: 'text', text: dentistName },
                ],
            },
        ],
    };
}

/**
 * Appointment Confirmation Template
 * 
 * Template Name: appointment_confirmation
 * Language: es (Spanish)
 * 
 * Template content example:
 * "Hola {{1}}, su cita dental ha sido confirmada para el {{2}} a las {{3}} con el Dr./Dra. {{4}}. ¡Le esperamos!"
 */
export function appointmentConfirmationTemplate(
    patientName: string,
    appointmentDate: string,
    appointmentTime: string,
    dentistName: string,
): WhatsAppTemplate {
    return {
        name: 'appointment_confirmation',
        language: 'es',
        components: [
            {
                type: 'body',
                parameters: [
                    { type: 'text', text: patientName },
                    { type: 'text', text: appointmentDate },
                    { type: 'text', text: appointmentTime },
                    { type: 'text', text: dentistName },
                ],
            },
        ],
    };
}

/**
 * Appointment Cancellation Template
 * 
 * Template Name: appointment_cancellation
 * Language: es (Spanish)
 */
export function appointmentCancellationTemplate(
    patientName: string,
    appointmentDate: string,
    appointmentTime: string,
): WhatsAppTemplate {
    return {
        name: 'appointment_cancellation',
        language: 'es',
        components: [
            {
                type: 'body',
                parameters: [
                    { type: 'text', text: patientName },
                    { type: 'text', text: appointmentDate },
                    { type: 'text', text: appointmentTime },
                ],
            },
        ],
    };
}

/**
 * Same-Day Reminder Template (sent morning of appointment)
 * 
 * Template Name: same_day_reminder
 * Language: es (Spanish)
 */
export function sameDayReminderTemplate(
    patientName: string,
    appointmentTime: string,
    dentistName: string,
): WhatsAppTemplate {
    return {
        name: 'same_day_reminder',
        language: 'es',
        components: [
            {
                type: 'body',
                parameters: [
                    { type: 'text', text: patientName },
                    { type: 'text', text: appointmentTime },
                    { type: 'text', text: dentistName },
                ],
            },
        ],
    };
}

/**
 * Payment Reminder Template
 * 
 * Template Name: payment_reminder
 * Language: es (Spanish)
 */
export function paymentReminderTemplate(
    patientName: string,
    invoiceNumber: string,
    amount: string,
    dueDate: string,
): WhatsAppTemplate {
    return {
        name: 'payment_reminder',
        language: 'es',
        components: [
            {
                type: 'body',
                parameters: [
                    { type: 'text', text: patientName },
                    { type: 'text', text: invoiceNumber },
                    { type: 'text', text: amount },
                    { type: 'text', text: dueDate },
                ],
            },
        ],
    };
}

/**
 * Treatment Follow-up Template
 * 
 * Template Name: treatment_followup
 * Language: es (Spanish)
 */
export function treatmentFollowupTemplate(
    patientName: string,
    treatmentName: string,
): WhatsAppTemplate {
    return {
        name: 'treatment_followup',
        language: 'es',
        components: [
            {
                type: 'body',
                parameters: [
                    { type: 'text', text: patientName },
                    { type: 'text', text: treatmentName },
                ],
            },
        ],
    };
}

/**
 * Template creation instructions for Meta Business Manager:
 * 
 * 1. Go to https://business.facebook.com
 * 2. Select your WhatsApp Business Account
 * 3. Go to Account tools > Message templates
 * 4. Click "Create template"
 * 5. Choose category: "Appointment Updates" or "Utility"
 * 6. Enter template name (must match exactly with template functions above)
 * 7. Select language: Spanish (es)
 * 8. Add body text with placeholders: {{1}}, {{2}}, etc.
 * 9. Submit for approval (usually takes 24-48 hours)
 * 
 * Example body text for appointment_reminder:
 * "Hola {{1}}, le recordamos que tiene una cita dental programada para el {{2}} a las {{3}} con el Dr./Dra. {{4}}."
 * 
 * Example body text for appointment_confirmation:
 * "Hola {{1}}, su cita dental ha sido confirmada para el {{2}} a las {{3}} con el Dr./Dra. {{4}}. ¡Le esperamos en Brilliant Dental!"
 */
