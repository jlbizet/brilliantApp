import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export class TestAuthHelper {
    constructor(private app: INestApplication) {}

    async registerAndLogin(userData: any = {}) {
        const defaultUser = {
            email: `test-${Date.now()}@example.com`,
            password: 'Password123!',
            firstName: 'Test',
            lastName: 'User',
            role: 'RECEPTIONIST',
            ...userData,
        };

        const registerResponse = await request(this.app.getHttpServer())
            .post('/api/v1/auth/register')
            .send(defaultUser);

        return {
            accessToken: registerResponse.body.accessToken,
            refreshToken: registerResponse.body.refreshToken,
            user: registerResponse.body.user,
        };
    }

    async login(credentials: { email: string; password: string }) {
        const response = await request(this.app.getHttpServer())
            .post('/api/v1/auth/login')
            .send(credentials);

        return {
            accessToken: response.body.accessToken,
            refreshToken: response.body.refreshToken,
            user: response.body.user,
        };
    }
}

export const createTestPatient = () => ({
    firstName: 'Jane',
    lastName: 'Smith',
    email: `jane-${Date.now()}@example.com`,
    phone: '+1-555-5678',
    dateOfBirth: '1990-05-15',
    gender: 'FEMALE',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    emergencyContact: 'John Smith',
    emergencyPhone: '+1-555-9999',
    insuranceProvider: 'Blue Cross',
    insurancePolicyNumber: 'BC123456789',
    insuranceGroupNumber: 'GRP001',
    notes: 'Regular patient',
});

export const createTestAppointment = (patientId: string, dentistId: string) => ({
    patientId,
    dentistId,
    title: 'Regular Checkup',
    description: 'Annual dental checkup',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    type: 'general',
    notes: null,
    isRecurring: false,
});

export const createTestInvoice = (patientId: string) => ({
    patientId,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tax: 20.00,
    discount: 0.00,
    notes: 'Payment due within 30 days',
    items: [
        {
            description: 'Dental Cleaning',
            quantity: 1,
            unitPrice: 100.00,
        },
    ],
});

export const expectPaginatedResponse = (response: any) => {
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('totalPages');
    expect(Array.isArray(response.body.data)).toBe(true);
};

export const expectErrorResponse = (response: any, statusCode: number, message?: string) => {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('statusCode');
    if (message) {
        expect(response.body.message).toContain(message);
    }
};
