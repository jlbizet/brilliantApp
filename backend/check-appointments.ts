
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.appointment.count();
    console.log('Total appointments:', count);

    const latest = await prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            patient: { select: { firstName: true, email: true } }
        }
    });

    console.log('Latest 5 appointments:');
    console.dir(latest, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
