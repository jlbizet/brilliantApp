# WhatsApp Integration with Kapso

This document describes the WhatsApp integration for Brilliant Dental CRM using the Kapso WhatsApp Cloud API.

## Overview

The WhatsApp integration allows the dental clinic to:
- Send automated appointment reminders to patients
- Send appointment confirmations
- Send same-day reminders (morning of the appointment)
- Track message delivery status
- Receive incoming messages from patients (prepared for future AI chatbot integration)
- Store all WhatsApp communication history in the database

## Features

### Implemented
1. **Appointment Reminders** - Sent 24 hours before appointment
2. **Appointment Confirmations** - Sent when appointment is created/confirmed
3. **Same-Day Reminders** - Sent on the day of the appointment
4. **Message Logging** - All messages stored in database with delivery status
5. **Patient Opt-in** - Patients must opt-in to receive WhatsApp messages
6. **Webhook Handler** - Receives delivery confirmations and status updates

### Message Templates (Spanish)

The following templates must be created in your Meta Business Manager:

1. **appointment_reminder** (Category: Utility)
   ```
   Hola {{1}}, le recordamos que tiene una cita dental programada para el {{2}} a las {{3}} con el Dr./Dra. {{4}}.
   
   Variables:
   - {{1}}: Patient name
   - {{2}}: Appointment date
   - {{3}}: Appointment time
   - {{4}}: Dentist name
   ```

2. **appointment_confirmation** (Category: Utility)
   ```
   Hola {{1}}, su cita dental ha sido confirmada para el {{2}} a las {{3}} con el Dr./Dra. {{4}}. ¡Le esperamos!
   
   Variables:
   - {{1}}: Patient name
   - {{2}}: Appointment date
   - {{3}}: Appointment time
   - {{4}}: Dentist name
   ```

3. **same_day_reminder** (Category: Utility)
   ```
   Hola {{1}}, le recordamos que hoy tiene una cita dental a las {{2}} con el Dr./Dra. {{3}}.
   
   Variables:
   - {{1}}: Patient name
   - {{2}}: Appointment time
   - {{3}}: Dentist name
   ```

## Setup Instructions

### 1. Sign Up for Kapso

1. Go to https://kapso.ai
2. Sign up for an account
3. Complete the onboarding process
4. Get your API key from Settings > API

### 2. Connect WhatsApp Business Account

1. In Kapso dashboard, go to WhatsApp > Setup
2. Connect your WhatsApp Business Account
3. Verify your phone number
4. Note down your Phone Number ID

### 3. Create Message Templates in Meta Business Manager

1. Go to https://business.facebook.com
2. Select your WhatsApp Business Account
3. Navigate to Account tools > Message templates
4. Create the three templates listed above
5. Submit for approval (takes 24-48 hours)

### 4. Configure Environment Variables

Add to your `.env` file:

```bash
# WhatsApp Configuration (Kapso)
KAPSO_API_KEY="your_kapso_api_key_here"
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id_here"
ENABLE_WHATSAPP_NOTIFICATIONS="true"

# Webhook Configuration
WHATSAPP_WEBHOOK_VERIFY_TOKEN="your_secure_verify_token"
META_APP_SECRET="your_meta_app_secret" # Optional
```

### 5. Run Database Migration

```bash
cd backend
npx prisma migrate dev --name add_whatsapp_support
```

### 6. Configure Webhook (Optional for incoming messages)

1. In Kapso dashboard, go to Webhooks
2. Add webhook URL: `https://your-domain.com/api/v1/whatsapp/webhook`
3. Set verify token to match `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
4. Enable webhook events for:
   - Messages
   - Message status updates

### 7. Enable WhatsApp Notifications

Update patient preferences in the database or via API:

```sql
UPDATE patients 
SET whatsapp_opt_in = true, 
    whatsapp_notifications_enabled = true 
WHERE id = 'patient_id';
```

## API Endpoints

### Webhook Endpoints

- **GET** `/api/v1/whatsapp/webhook` - Webhook verification (Meta/Kapso calls this)
- **POST** `/api/v1/whatsapp/webhook` - Receive messages and status updates

### Service Methods

```typescript
// Send appointment reminder
await whatsAppService.sendAppointmentReminder(
    patientPhone: string,
    patientName: string,
    appointmentDate: string,  // e.g., "lunes, 15 de enero de 2024"
    appointmentTime: string,  // e.g., "10:00 AM"
    dentistName: string
);

// Send appointment confirmation
await whatsAppService.sendAppointmentConfirmation(
    patientPhone: string,
    patientName: string,
    appointmentDate: string,
    appointmentTime: string,
    dentistName: string
);

// Send same-day reminder
await whatsAppService.sendSameDayReminder(
    patientPhone: string,
    patientName: string,
    appointmentTime: string,
    dentistName: string
);

// Send custom text message
await whatsAppService.sendTextMessage(
    patientPhone: string,
    message: string
);
```

## Database Schema

### WhatsAppMessage Model

```prisma
model WhatsAppMessage {
    id                  String    @id @default(uuid())
    patientId           String?
    whatsappMessageId   String?   @unique
    phoneNumber         String
    direction           String    // INBOUND / OUTBOUND
    type                String    // TEXT / TEMPLATE
    content             String?
    templateName        String?
    status              String    // SENT / DELIVERED / READ / FAILED / RECEIVED
    errorMessage        String?
    createdAt           DateTime  @default(now())
    updatedAt           DateTime  @updatedAt
    patient             Patient?  @relation(fields: [patientId], references: [id])
}
```

### Patient Model Updates

```prisma
model Patient {
    // Existing fields...
    
    // WhatsApp preferences
    whatsappNotificationsEnabled Boolean @default(true)
    whatsappOptIn                Boolean @default(false)
    
    // Relations
    whatsappMessages             WhatsAppMessage[]
}
```

## Integration with Notifications

The WhatsApp integration is automatically used when:

1. An appointment reminder is sent (24 hours before)
2. An appointment is confirmed (when created)
3. Same-day reminders can be scheduled separately

The system checks:
- `ENABLE_WHATSAPP_NOTIFICATIONS` environment variable is "true"
- Patient has `whatsappOptIn` set to true
- Patient has `whatsappNotificationsEnabled` set to true
- Patient has a phone number

## Phone Number Formatting

The service automatically formats phone numbers for Uruguay:
- Removes non-digit characters
- Adds country code (+598) if missing
- Example: "091234567" → "+59891234567"

## Testing

To test the WhatsApp integration:

1. Make sure your phone number is added to the WhatsApp Business Account
2. Send a test message using the API or service method
3. Check the database for logged messages
4. Verify webhook receives delivery status updates

### Test Script

```typescript
// In your NestJS app or test file
const whatsAppService = app.get(WhatsAppService);

await whatsAppService.sendTextMessage(
    "+598XXXXXXX", // Your test phone number
    "Test message from Brilliant Dental"
);
```

## Troubleshooting

### Common Issues

1. **"WhatsApp service not configured"**
   - Check that `KAPSO_API_KEY` is set in `.env`
   - Ensure `ENABLE_WHATSAPP_NOTIFICATIONS` is "true"

2. **Template not found**
   - Templates must be approved by Meta before use
   - Template names must match exactly (case-sensitive)
   - Language code must match ("es" for Spanish)

3. **Messages not sending**
   - Check that patient has `whatsappOptIn: true`
   - Verify patient phone number is valid
   - Check logs for specific error messages

4. **Webhook not receiving events**
   - Verify webhook URL is publicly accessible
   - Check that verify token matches
   - Ensure webhook is configured in Kapso dashboard

### Logs

Enable debug logging:
```bash
# In .env
LOG_LEVEL=debug
```

Check WhatsApp-related logs:
```bash
npm run start:dev 2>&1 | grep -i whatsapp
```

## Future Enhancements

- **Two-way chat**: Connect incoming messages to AI chatbot
- **Rich media**: Send appointment cards, invoices as documents
- **Interactive buttons**: Quick reply buttons for confirmations
- **Multi-language**: Support English and Portuguese templates

## Support

For Kapso support:
- Documentation: https://docs.kapso.ai
- Support email: support@kapso.ai

For WhatsApp Business API:
- Meta documentation: https://developers.facebook.com/docs/whatsapp
