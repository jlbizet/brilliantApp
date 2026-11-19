import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaClient, AppointmentStatus } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Configure backend/.env or export it before running this script.');
    process.exit(1);
}

const prisma = new PrismaClient();

async function createTestAppointment() {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const twoAndHalfHoursLater = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);

    const dentist = await prisma.user.findFirst({
        where: { role: 'DENTIST' }
    });

    const patient = await prisma.patient.findFirst();

    if (!dentist || !patient) {
        console.error('No dentist or patient found in database');
        process.exit(1);
    }

    console.log(`Creating appointment for patient: ${patient.firstName} ${patient.lastName} (${patient.email})`);
    console.log(`With dentist: Dr. ${dentist.firstName} ${dentist.lastName}`);
    console.log(`Start time: ${twoHoursLater.toISOString()}`);
    console.log(`End time: ${twoAndHalfHoursLater.toISOString()}`);

    const appointment = await prisma.appointment.create({
        data: {
            patientId: patient.id,
            dentistId: dentist.id,
            title: 'Test Appointment - Same Day Reminder',
            startTime: twoHoursLater,
            endTime: twoAndHalfHoursLater,
            status: AppointmentStatus.SCHEDULED,
            type: 'CHECKUP',
            notes: 'Test appointment for same-day reminder verification',
        }
    });

    console.log(`✅ Test appointment created with ID: ${appointment.id}`);
    console.log(`📅 Appointment starts at: ${new Date(appointment.startTime).toLocaleString('es-UY', { timeZone: 'America/Montevideo' })}`);
    
    return appointment;
}

createTestAppointment()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
