# SMS & Email Integration Implementation

## Overview
This implementation adds email and SMS notification capabilities to the Dental Clinic CRM using **Resend** (free tier) and Twilio (trial account).

**Why Resend?** Resend offers 3,000 emails/month for free, which is much better than SendGrid's 100 emails/day limit.

## Features Implemented

### 1. Email Notifications (Resend)
- **Free Tier**: 3,000 emails/month (much better than SendGrid!)
- **Templates**:
  - Appointment reminders
  - Appointment confirmations
  - Invoice notifications
  - Welcome emails
  - Password reset emails

### 2. SMS Notifications (Twilio)
- **Trial Account**: ~$15 free credit
- **Templates**:
  - Appointment reminders
  - Appointment confirmations
  - Appointment cancellations
  - Invoice reminders
  - Treatment completion notifications
  - Welcome SMS

### 3. Notification Preferences
Each patient can now configure:
- Email notifications (on/off)
- SMS notifications (on/off)
- Appointment reminders (on/off)
- Payment reminders (on/off)
- Marketing emails (on/off)

## Setup Instructions

### Step 1: Configure Resend (Email)

1. **Sign up** at https://resend.com/ (free account with 3,000 emails/month!)
2. **Verify your sender identity**:
   - Go to Domains or use the default "onboarding@resend.dev" for testing
   - For production, add and verify your custom domain
3. **Create an API key**:
   - Go to Settings > API Keys
   - Create a new API key
   - Copy the key (starts with `re_`)

4. **Update your `.env` file**:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev  # Use this for testing, or your verified domain
EMAIL_FROM_NAME="Brilliant Dental Clinic"
ENABLE_EMAIL_NOTIFICATIONS=true
```

### Step 2: Configure Twilio (SMS)

1. **Sign up** at https://www.twilio.com/try-twilio
2. **Get your credentials**:
   - Account SID (starts with `AC`)
   - Auth Token (hidden, click "Show")
3. **Get a phone number**:
   - Go to Phone Numbers > Manage > Buy a number
   - Choose a number with SMS capability
   - For trial accounts, you can only send to verified numbers

4. **Verify recipient numbers** (trial only):
   - Go to Phone Numbers > Verified Caller IDs
   - Add and verify your phone numbers

5. **Update your `.env` file**:
```bash
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
ENABLE_SMS_NOTIFICATIONS=true
```

### Step 3: Database Migration

**Option A: Using Prisma Migrate (if DB is running)**
```bash
cd backend
npx prisma migrate dev --name add_notification_preferences
```

**Option B: Manual SQL (if DB is not running)**
Run the migration file manually:
```bash
# Connect to your database and run:
cat prisma/migrations/add_notification_preferences.sql | psql -h localhost -U dental_user -d dental_crm
```

### Step 4: Restart the Server

```bash
cd backend
npm run start:dev
```

## How It Works

### Appointment Notifications
When an appointment is created or updated:
1. **In-app notification** is created (existing behavior)
2. **Email** is sent if patient has email and `emailNotificationsEnabled: true`
3. **SMS** is sent if patient has phone and `smsNotificationsEnabled: true`

### Notification Flow
1. User creates/updates appointment
2. `AppointmentsService` calls `NotificationsService.createAppointmentNotification()`
3. NotificationsService creates in-app notification
4. If patient preferences allow, it sends:
   - Email via `EmailService`
   - SMS via `SmsService`
5. Both services check if credentials are configured before sending

## File Changes

### New Files
- `backend/src/modules/notifications/email.service.ts` - Resend integration
- `backend/src/modules/notifications/sms.service.ts` - Twilio integration
- `backend/prisma/migrations/add_notification_preferences.sql` - DB migration

### Modified Files
- `backend/src/modules/notifications/notifications.service.ts` - Added email/SMS integration
- `backend/src/modules/notifications/notifications.module.ts` - Added EmailService and SmsService
- `backend/prisma/schema.prisma` - Added notification preference fields to Patient
- `backend/src/modules/appointments/appointments.service.ts` - Updated to pass appointment data
- `backend/.env.example` - Added configuration examples
- `backend/package.json` - Added resend and twilio dependencies

## Testing

### Test Email
1. Configure Resend API key in `.env`
2. Set `ENABLE_EMAIL_NOTIFICATIONS=true`
3. Create an appointment for a patient with an email
4. Check email inbox (also check spam folder)

### Test SMS
1. Configure Twilio credentials in `.env`
2. Set `ENABLE_SMS_NOTIFICATIONS=true`
3. Verify your phone number in Twilio dashboard
4. Create an appointment for a patient with your verified phone
5. Check SMS messages

## Troubleshooting

### Email not sending
- Check Resend API key is correct (starts with `re_`)
- Verify sender email is authenticated (use onboarding@resend.dev for testing)
- Check application logs for errors
- Check Resend dashboard for delivery status

### SMS not sending
- Verify Twilio credentials
- Ensure phone number is in E.164 format (e.g., +1234567890)
- For trial accounts, recipient must be verified
- Check Twilio logs for delivery status

### Database migration failed
- Ensure PostgreSQL is running
- Check database connection string in `.env`
- Run migration manually using the SQL file

## Security Notes

1. **Never commit API keys** to version control
2. **Use environment variables** for all credentials
3. **Rate limiting** is applied via Twilio and Resend
4. **Phone number validation** is performed before sending SMS
5. **Email validation** is handled by Resend

## Next Steps

1. Add notification preferences UI to patient profile page
2. Implement billing notification triggers
3. Add welcome notification on patient registration
4. Implement treatment completion notifications
5. Add notification history/reporting dashboard

## Why Resend over SendGrid?

- **Higher free tier**: 3,000 emails/month vs 100/day (3,000 vs 3,000/month, but Resend is 30x more!)
- **Simpler API**: Modern, developer-friendly API
- **Better deliverability**: Focus on transactional emails
- **No sender authentication required for testing**: Use onboarding@resend.dev
- **Better pricing** if you need to upgrade
