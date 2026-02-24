-- Migration: Add notification preferences to Patient table
-- Created: $(date)

-- Add notification preference columns to patients table
ALTER TABLE "patients" 
ADD COLUMN IF NOT EXISTS "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "smsNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "appointmentRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "paymentRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "marketingEmailsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Update existing patients to have default notification preferences
UPDATE "patients" 
SET 
  "emailNotificationsEnabled" = true,
  "smsNotificationsEnabled" = true,
  "appointmentRemindersEnabled" = true,
  "paymentRemindersEnabled" = true,
  "marketingEmailsEnabled" = false
WHERE "emailNotificationsEnabled" IS NULL;
