import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Configure backend/.env or export it before running this script.');
    process.exit(1);
}

const prisma = new PrismaClient();

async function findUpcomingAppointments() {
    const now = new Date();
    
    // Find appointments in the next 1-4 hours
    const oneHourLater = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    console.log(`Now: ${now.toISOString()}`);
    console.log(`Looking for SCHEDULED appointments between: ${oneHourLater.toISOString()} and ${fourHoursLater.toISOString()}`);

    const upcoming = await prisma.appointment.findMany({
        where: {
            startTime: {
                gte: oneHourLater,
                lt: fourHoursLater
            },
            status: 'SCHEDULED',
        },
        include: { patient: true, dentist: true },
        orderBy: { startTime: 'asc' }
    });

    console.log(`\nFound ${upcoming.length} appointments in the 1-4 hour window:`);
    
    for (const apt of upcoming) {
        const hoursUntil = (new Date(apt.startTime).getTime() - now.getTime()) / (1000 * 60 * 60);
        console.log(`  - Patient: ${apt.patient.firstName} ${apt.patient.lastName} (${apt.patient.email})`);
        console.log(`    Start time: ${apt.startTime.toISOString()} (${hoursUntil.toFixed(1)} hours from now)`);
        console.log(`    Dentist: Dr. ${apt.dentist.firstName} ${apt.dentist.lastName}`);
        console.log('');
    }
}

findUpcomingAppointments()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
