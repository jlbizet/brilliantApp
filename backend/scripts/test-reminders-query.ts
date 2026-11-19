import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Configure backend/.env or export it before running this script.');
    process.exit(1);
}

const prisma = new PrismaClient();

async function testSameDayReminders() {
    console.log('[SameDayReminders] Starting hourly reminder check...');

    const now = new Date();
    // Fixed: widened window from 5 minutes to 1.5 hours (1.5h to 3h)
    const oneHourLater = new Date(now.getTime() + 1.5 * 60 * 60 * 1000);
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    console.log(`Now: ${now.toISOString()}`);
    console.log(`Looking for appointments between: ${oneHourLater.toISOString()} and ${threeHoursLater.toISOString()}`);

    const upcoming = await prisma.appointment.findMany({
        where: {
            startTime: {
                gte: oneHourLater,
                lt: threeHoursLater
            },
            status: 'SCHEDULED',
        },
        include: { patient: true, dentist: true },
    });

    console.log(`Found ${upcoming.length} appointments`);

    for (const apt of upcoming) {
        console.log(`  - Patient: ${apt.patient.firstName} ${apt.patient.lastName} (${apt.patient.email})`);
        console.log(`    Start time: ${apt.startTime.toISOString()}`);
        console.log(`    Dentist: Dr. ${apt.dentist.firstName} ${apt.dentist.lastName}`);
    }

    return upcoming;
}

testSameDayReminders()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
