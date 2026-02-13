import { PrismaClient, UserRole, Gender, AppointmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@dentalcrm.com' },
        update: {},
        create: {
            email: 'admin@dentalcrm.com',
            password: adminPassword,
            firstName: 'Sarah',
            lastName: 'Johnson',
            role: UserRole.ADMIN,
            phone: '+1-555-0100',
        },
    });

    // Create dentists
    const dentistPassword = await bcrypt.hash('dentist123', 12);
    const dentist1 = await prisma.user.upsert({
        where: { email: 'dr.smith@dentalcrm.com' },
        update: {},
        create: {
            email: 'dr.smith@dentalcrm.com',
            password: dentistPassword,
            firstName: 'Michael',
            lastName: 'Smith',
            role: UserRole.DENTIST,
            phone: '+1-555-0101',
            specialization: 'General Dentistry',
            licenseNumber: 'DEN-2024-001',
        },
    });

    const dentist2 = await prisma.user.upsert({
        where: { email: 'dr.williams@dentalcrm.com' },
        update: {},
        create: {
            email: 'dr.williams@dentalcrm.com',
            password: dentistPassword,
            firstName: 'Emily',
            lastName: 'Williams',
            role: UserRole.DENTIST,
            phone: '+1-555-0102',
            specialization: 'Orthodontics',
            licenseNumber: 'DEN-2024-002',
        },
    });

    // Create receptionist
    const receptionistPassword = await bcrypt.hash('reception123', 12);
    await prisma.user.upsert({
        where: { email: 'reception@dentalcrm.com' },
        update: {},
        create: {
            email: 'reception@dentalcrm.com',
            password: receptionistPassword,
            firstName: 'Maria',
            lastName: 'Garcia',
            role: UserRole.RECEPTIONIST,
            phone: '+1-555-0103',
        },
    });

    // Create patients
    const patients = [];
    const patientData = [
        { firstName: 'James', lastName: 'Anderson', email: 'james.a@example.com', phone: '+1-555-1001', dateOfBirth: new Date('1985-03-15'), gender: Gender.MALE },
        { firstName: 'Emma', lastName: 'Thompson', email: 'emma.t@example.com', phone: '+1-555-1002', dateOfBirth: new Date('1992-07-22'), gender: Gender.FEMALE },
        { firstName: 'Robert', lastName: 'Davis', email: 'robert.d@example.com', phone: '+1-555-1003', dateOfBirth: new Date('1978-11-08'), gender: Gender.MALE },
        { firstName: 'Sophia', lastName: 'Martinez', email: 'sophia.m@example.com', phone: '+1-555-1004', dateOfBirth: new Date('2001-01-30'), gender: Gender.FEMALE },
        { firstName: 'William', lastName: 'Brown', email: 'william.b@example.com', phone: '+1-555-1005', dateOfBirth: new Date('1965-09-12'), gender: Gender.MALE },
        { firstName: 'Olivia', lastName: 'Wilson', email: 'olivia.w@example.com', phone: '+1-555-1006', dateOfBirth: new Date('1998-04-25'), gender: Gender.FEMALE },
        { firstName: 'Daniel', lastName: 'Taylor', email: 'daniel.t@example.com', phone: '+1-555-1007', dateOfBirth: new Date('1988-12-03'), gender: Gender.MALE },
        { firstName: 'Ava', lastName: 'Moore', email: 'ava.m@example.com', phone: '+1-555-1008', dateOfBirth: new Date('1975-06-18'), gender: Gender.FEMALE },
    ];

    for (const p of patientData) {
        const patient = await prisma.patient.upsert({
            where: { email: p.email },
            update: {},
            create: { ...p, address: '123 Main St', city: 'Springfield', state: 'IL', zipCode: '62701' },
        });
        patients.push(patient);
    }

    // Add medical history and allergies for first few patients
    await prisma.medicalHistory.createMany({
        data: [
            { patientId: patients[0].id, condition: 'Hypertension', description: 'Controlled with medication', isOngoing: true },
            { patientId: patients[0].id, condition: 'Previous Root Canal', description: 'Tooth #14, completed 2020', isOngoing: false },
            { patientId: patients[1].id, condition: 'Type 2 Diabetes', description: 'Managed with diet and metformin', isOngoing: true },
            { patientId: patients[2].id, condition: 'Heart Murmur', description: 'Requires antibiotic prophylaxis', isOngoing: true },
        ],
        skipDuplicates: true,
    });

    await prisma.allergy.createMany({
        data: [
            { patientId: patients[0].id, allergen: 'Penicillin', severity: 'severe', reaction: 'Anaphylaxis' },
            { patientId: patients[1].id, allergen: 'Latex', severity: 'moderate', reaction: 'Skin rash' },
            { patientId: patients[3].id, allergen: 'Lidocaine', severity: 'mild', reaction: 'Swelling' },
        ],
        skipDuplicates: true,
    });

    // Create appointments
    const now = new Date();
    const appointmentTypes = ['general', 'cleaning', 'emergency', 'follow-up', 'consultation'];
    const statuses = [AppointmentStatus.COMPLETED, AppointmentStatus.COMPLETED, AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED];

    for (let i = 0; i < 20; i++) {
        const dayOffset = Math.floor(Math.random() * 30) - 10; // -10 to +20 days
        const hour = 8 + Math.floor(Math.random() * 9); // 8am to 5pm
        const start = new Date(now);
        start.setDate(start.getDate() + dayOffset);
        start.setHours(hour, 0, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30 + Math.floor(Math.random() * 3) * 30);

        const status = dayOffset < 0 ? AppointmentStatus.COMPLETED : statuses[Math.floor(Math.random() * statuses.length)];

        await prisma.appointment.create({
            data: {
                patientId: patients[i % patients.length].id,
                dentistId: i % 2 === 0 ? dentist1.id : dentist2.id,
                title: `${appointmentTypes[i % appointmentTypes.length]} checkup`,
                startTime: start,
                endTime: end,
                status,
                type: appointmentTypes[i % appointmentTypes.length],
                notes: status === 'COMPLETED' ? 'Procedure completed successfully.' : undefined,
            },
        });
    }

    // Create treatment plans
    const plan1 = await prisma.treatmentPlan.create({
        data: {
            patientId: patients[0].id,
            name: 'Full Mouth Restoration',
            description: 'Comprehensive restoration plan including crowns and fillings',
            estimatedCost: 4500,
            status: 'IN_PROGRESS',
            treatments: {
                create: [
                    { name: 'Crown - Tooth #14', tooth: '#14', cost: 1200, status: 'COMPLETED', performedAt: new Date() },
                    { name: 'Composite Filling - Tooth #19', tooth: '#19', cost: 350, status: 'COMPLETED', performedAt: new Date() },
                    { name: 'Crown - Tooth #30', tooth: '#30', cost: 1200, status: 'PLANNED' },
                    { name: 'Veneer - Tooth #8', tooth: '#8', cost: 1750, status: 'PLANNED' },
                ],
            },
        },
    });

    const plan2 = await prisma.treatmentPlan.create({
        data: {
            patientId: patients[1].id,
            name: 'Orthodontic Treatment',
            description: 'Clear aligner therapy for mild crowding',
            estimatedCost: 3800,
            status: 'IN_PROGRESS',
            treatments: {
                create: [
                    { name: 'Initial Assessment & Impressions', cost: 200, status: 'COMPLETED', performedAt: new Date() },
                    { name: 'Aligner Set 1-5', cost: 1200, status: 'IN_PROGRESS' },
                    { name: 'Aligner Set 6-10', cost: 1200, status: 'PLANNED' },
                    { name: 'Retainer Fitting', cost: 400, status: 'PLANNED' },
                ],
            },
        },
    });

    // Create invoices and payments
    const inv1 = await prisma.invoice.create({
        data: {
            patientId: patients[0].id,
            invoiceNumber: 'INV-2024-001',
            subtotal: 1550,
            tax: 0,
            discount: 50,
            total: 1500,
            status: 'PAID',
            dueDate: new Date(),
            items: {
                create: [
                    { description: 'Crown - Tooth #14', quantity: 1, unitPrice: 1200, total: 1200 },
                    { description: 'Composite Filling - Tooth #19', quantity: 1, unitPrice: 350, total: 350 },
                ],
            },
            payments: {
                create: [
                    { amount: 1500, method: 'CREDIT_CARD', reference: 'CC-4521' },
                ],
            },
        },
    });

    const inv2 = await prisma.invoice.create({
        data: {
            patientId: patients[1].id,
            invoiceNumber: 'INV-2024-002',
            subtotal: 1400,
            tax: 0,
            discount: 0,
            total: 1400,
            status: 'PARTIAL',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            items: {
                create: [
                    { description: 'Initial Assessment & Impressions', quantity: 1, unitPrice: 200, total: 200 },
                    { description: 'Aligner Set 1-5', quantity: 1, unitPrice: 1200, total: 1200 },
                ],
            },
            payments: {
                create: [
                    { amount: 700, method: 'INSURANCE', reference: 'INS-BC-2024' },
                ],
            },
        },
    });

    // Create inventory items
    await prisma.inventoryItem.createMany({
        data: [
            { name: 'Nitrile Gloves (Box)', category: 'PPE', sku: 'PPE-001', quantity: 45, minQuantity: 20, unitPrice: 12.99, supplier: 'MedSupply Co.' },
            { name: 'Surgical Masks (Box)', category: 'PPE', sku: 'PPE-002', quantity: 30, minQuantity: 15, unitPrice: 8.50, supplier: 'MedSupply Co.' },
            { name: 'Composite Resin', category: 'Materials', sku: 'MAT-001', quantity: 8, minQuantity: 10, unitPrice: 45.00, supplier: 'DentalMaterials Inc.' },
            { name: 'Dental Cement', category: 'Materials', sku: 'MAT-002', quantity: 12, minQuantity: 5, unitPrice: 32.00, supplier: 'DentalMaterials Inc.' },
            { name: 'Anesthetic Cartridges', category: 'Anesthesia', sku: 'ANS-001', quantity: 5, minQuantity: 20, unitPrice: 3.50, supplier: 'PharmaDistrib' },
            { name: 'Dental Burs Set', category: 'Instruments', sku: 'INS-001', quantity: 15, minQuantity: 5, unitPrice: 28.00, supplier: 'InstrumentPro' },
            { name: 'Impression Material', category: 'Materials', sku: 'MAT-003', quantity: 6, minQuantity: 8, unitPrice: 55.00, supplier: 'DentalMaterials Inc.' },
            { name: 'Sterilization Pouches', category: 'Sterilization', sku: 'STE-001', quantity: 200, minQuantity: 50, unitPrice: 15.00, supplier: 'MedSupply Co.' },
        ],
        skipDuplicates: true,
    });

    console.log('✅ Database seeded successfully!');
    console.log('📧 Admin login: admin@dentalcrm.com / admin123');
    console.log('📧 Dentist login: dr.smith@dentalcrm.com / dentist123');
    console.log('📧 Receptionist login: reception@dentalcrm.com / reception123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
