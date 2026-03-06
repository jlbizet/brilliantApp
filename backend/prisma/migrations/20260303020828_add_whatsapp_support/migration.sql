-- DropIndex
DROP INDEX "appointments_googleCalendarEventId_idx";

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "appointmentRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "marketingEmailsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "smsNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "whatsappNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "whatsappMessageId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "templateName" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_messages_whatsappMessageId_key" ON "whatsapp_messages"("whatsappMessageId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_patientId_idx" ON "whatsapp_messages"("patientId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_phoneNumber_idx" ON "whatsapp_messages"("phoneNumber");

-- CreateIndex
CREATE INDEX "whatsapp_messages_whatsappMessageId_idx" ON "whatsapp_messages"("whatsappMessageId");

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
