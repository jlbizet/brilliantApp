-- Add Google Calendar Event ID to appointments table
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "googleCalendarEventId" TEXT;

-- Create index for faster lookups by Google Calendar event ID
CREATE INDEX IF NOT EXISTS "appointments_googleCalendarEventId_idx" ON "appointments"("googleCalendarEventId");
