import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { TestAuthHelper, createTestPatient, expectPaginatedResponse, expectErrorResponse } from './test-helpers';

describe('PatientsController (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authHelper: TestAuthHelper;
    let authToken: string;
    let dentistToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        app.setGlobalPrefix('api/v1');

        await app.init();
        prisma = moduleFixture.get<PrismaService>(PrismaService);
        authHelper = new TestAuthHelper(app);
    });

    beforeEach(async () => {
        // Create test users
        const receptionist = await authHelper.registerAndLogin({ role: 'RECEPTIONIST' });
        authToken = receptionist.accessToken;

        const dentist = await authHelper.registerAndLogin({ role: 'DENTIST' });
        dentistToken = dentist.accessToken;
    });

    afterEach(async () => {
        // Clean up test data
        await prisma.appointment.deleteMany();
        await prisma.medicalHistory.deleteMany();
        await prisma.allergy.deleteMany();
        await prisma.patient.deleteMany({
            where: {
                email: {
                    contains: '@example.com',
                },
            },
        });
        await prisma.user.deleteMany({
            where: {
                email: {
                    contains: '@example.com',
                },
            },
        });
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/v1/patients', () => {
        it('should return paginated patients list', async () => {
            // Create a patient first
            const patientData = createTestPatient();
            await request(app.getHttpServer())
                .post('/api/v1/patients')
                .set('Authorization', `Bearer ${authToken}`)
                .send(patientData);

            const response = await request(app.getHttpServer())
                .get('/api/v1/patients')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expectPaginatedResponse(response);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should filter patients by search term', async () => {
            const patientData = createTestPatient();
            await request(app.getHttpServer())
                .post('/api/v1/patients')
                .set('Authorization', `Bearer ${authToken}`)
                .send(patientData);

            const response = await request(app.getHttpServer())
                .get('/api/v1/patients?search=Jane')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expectPaginatedResponse(response);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/patients')
                .expect(401);
        });
    });

    describe('POST /api/v1/patients', () => {
        it('should create a new patient', async () => {
            const patientData = createTestPatient();

            const response = await request(app.getHttpServer())
                .post('/api/v1/patients')
                .set('Authorization', `Bearer ${authToken}`)
                .send(patientData)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.firstName).toBe(patientData.firstName);
            expect(response.body.lastName).toBe(patientData.lastName);
            expect(response.body.email).toBe(patientData.email);
        });

        it('should return 400 for invalid patient data', async () => {
            const invalidData = {
                firstName: '', // Empty first name
                lastName: 'Smith',
            };

            await request(app.getHttpServer())
                .post('/api/v1/patients')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);
        });

        it('should allow dentist to create patients', async () => {
            const patientData = createTestPatient();

            await request(app.getHttpServer())
                .post('/api/v1/patients')
                .set('Authorization', `Bearer ${dentistToken}`)
                .send(patientData)
                .expect(201);
        });
    });

    describe('GET /api/v1/patients/:id', () => {
        let patientId: string;

        beforeEach(async () => {
            const patientData = createTestPatient();
            const response = await request(app.getHttpServer())
                .post('/api/v1/patients')
                .set('Authorization', `Bearer ${authToken}`)
                .send(patientData);

            patientId = response.body.id;
        });

        it('should return patient with details', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/v1/patients/${patientId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id', patientId);
            expect(response.body).toHaveProperty('medicalHistory');
            expect(response.body).toHaveProperty('allergies');
            expect(response.body).toHaveProperty('appointments');
            expect(response.body).toHaveProperty('treatmentPlans');
            expect(response.body).toHaveProperty('documents');
            expect(response.body).toHaveProperty('_count');
        });

        it('should return 404 for non-existent patient', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/patients/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('PATCH /api/v1/patients/:id', () => {
        let patientId: string;

        beforeEach(async () => {
            const patientData = createTestPatient();
            const response = await request(app.getHttpServer())
                .post('/api/v1/patients')
                .set('Authorization', `Bearer ${authToken}`)
                .send(patientData);

            patientId = response.body.id;
        });

        it('should update patient successfully', async () => {
            const updateData = {
                firstName: 'Updated',
                phone: '+1-555-9999',
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/v1/patients/${patientId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.firstName).toBe('Updated');
            expect(response.body.phone).toBe('+1-555-9999');
        });

        it('should return 404 for non-existent patient', async () => {
            await request(app.getHttpServer())
                .patch('/api/v1/patients/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ firstName: 'Updated' })
                .expect(404);
        });
    });

    describe('DELETE /api/v1/patients/:id', () => {
        let patientId: string;

        beforeEach(async () => {
            const patientData = createTestPatient();
            const response = await request(app.getHttpServer())
                .post('/api/v1/patients')
                .set('Authorization', `Bearer ${authToken}`)
                .send(patientData);

            patientId = response.body.id;
        });

        it('should soft delete patient', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/v1/patients/${patientId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.message).toBe('Patient deactivated successfully');

            // Verify patient is no longer in active list
            const listResponse = await request(app.getHttpServer())
                .get('/api/v1/patients')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const patient = listResponse.body.data.find((p: any) => p.id === patientId);
            expect(patient).toBeUndefined();
        });
    });

    describe('POST /api/v1/patients/:id/medical-history', () => {
        let patientId: string;

        beforeEach(async () => {
            const patientData = createTestPatient();
            const response = await request(app.getHttpServer())
                .post('/api/v1/patients')
                .set('Authorization', `Bearer ${authToken}`)
                .send(patientData);

            patientId = response.body.id;
        });

        it('should add medical history entry', async () => {
            const historyData = {
                condition: 'Diabetes',
                description: 'Type 2 diabetes',
                isOngoing: true,
                diagnosedAt: '2020-01-15',
            };

            const response = await request(app.getHttpServer())
                .post(`/api/v1/patients/${patientId}/medical-history`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(historyData)
                .expect(201);

            expect(response.body.condition).toBe('Diabetes');
            expect(response.body.patientId).toBe(patientId);
        });
    });

    describe('POST /api/v1/patients/:id/allergies', () => {
        let patientId: string;

        beforeEach(async () => {
            const patientData = createTestPatient();
            const response = await request(app.getHttpServer())
                .post('/api/v1/patients')
                .set('Authorization', `Bearer ${authToken}`)
                .send(patientData);

            patientId = response.body.id;
        });

        it('should add allergy entry', async () => {
            const allergyData = {
                allergen: 'Penicillin',
                severity: 'severe',
                reaction: 'Rash and difficulty breathing',
            };

            const response = await request(app.getHttpServer())
                .post(`/api/v1/patients/${patientId}/allergies`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(allergyData)
                .expect(201);

            expect(response.body.allergen).toBe('Penicillin');
            expect(response.body.patientId).toBe(patientId);
        });
    });
});
