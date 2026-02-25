import { PrismaClient } from '@prisma/client';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AppointmentsService } from '../src/modules/appointments/appointments.service';

async function main() {
    const prisma = new PrismaClient();
    console.log('Connecting to database...');

    // Cleanup old test appointments
    await prisma.appointment.deleteMany({
        where: { title: 'TEST REMINDER APPOINTMENT' }
    });

    // 1. Get IDs
    const patient = await prisma.patient.findFirst({ where: { isActive: true } });
    const dentist = await prisma.user.findFirst({ where: { role: 'DENTIST', isActive: true } });

    if (!patient || !dentist) {
        // Fallback for staff role
        const staff = await prisma.user.findFirst({ where: { isActive: true } });
        if (!patient || !staff) {
            console.error('Could not find active patient or staff member.');
            process.exit(1);
        }
        console.log(`Using Patient: ${patient.firstName} (${patient.id})`);
        console.log(`Using Staff (as fallback for dentist): ${staff.firstName} (${staff.id})`);

        await runVerification(prisma, patient.id, staff.id);
    } else {
        console.log(`Using Patient: ${patient.firstName} (${patient.id})`);
        console.log(`Using Dentist: ${dentist.firstName} (${dentist.id})`);
        await runVerification(prisma, patient.id, dentist.id);
    }
}

async function runVerification(prisma: any, patientId: string, dentistId: string) {
    // 2. Create appointment for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 0, 0, 0);

    const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000);

    console.log(`Creating test appointment for tomorrow at ${tomorrow.toISOString()}...`);

    await prisma.appointment.create({
        data: {
            patientId: patientId,
            dentistId: dentistId,
            title: 'TEST REMINDER APPOINTMENT',
            startTime: tomorrow,
            endTime: endTime,
            status: 'SCHEDULED'
        }
    });

    console.log('Test appointment created successfully.');

    // 3. Run reminders
    console.log('Bootstrapping NestJS context...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const appointmentsService = app.get(AppointmentsService);

    console.log('\n--- EXECUTING: DAILY REMINDERS ---');
    await appointmentsService.handleReminders();

    console.log('\n--- EXECUTING: SAME-DAY REMINDERS (Expected 0) ---');
    await appointmentsService.handleSameDayReminders();

    // 4. Create one for 2 hours from now to test same-day
    const soon = new Date(Date.now() + 122 * 60 * 1000); // 2 hours and 2 minutes from now
    const soonEnd = new Date(soon.getTime() + 30 * 60 * 1000);

    console.log(`\nCreating same-day test appointment at ${soon.toISOString()}...`);
    await prisma.appointment.create({
        data: {
            patientId: patientId,
            dentistId: dentistId,
            title: 'TEST REMINDER APPOINTMENT',
            startTime: soon,
            endTime: soonEnd,
            status: 'SCHEDULED'
        }
    });

    console.log('--- EXECUTING: SAME-DAY REMINDERS (Expected 1) ---');
    await appointmentsService.handleSameDayReminders();

    await app.close();
    await prisma.$disconnect();
    console.log('\nVerification Script Completed.');
}

main().catch(console.error);
