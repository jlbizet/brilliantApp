import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

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
    });

    beforeEach(async () => {
        // Clean up test data
        await prisma.auditLog.deleteMany();
        await prisma.user.deleteMany({
            where: {
                email: {
                    contains: 'test@',
                },
            },
        });
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new user successfully', async () => {
            const registerDto = {
                email: 'test@example.com',
                password: 'Password123!',
                firstName: 'Test',
                lastName: 'User',
                role: 'RECEPTIONIST',
            };

            const response = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send(registerDto)
                .expect(201);

            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(registerDto.email);
            expect(response.body.user.firstName).toBe(registerDto.firstName);
            expect(response.body.user.lastName).toBe(registerDto.lastName);
            expect(response.body.user.role).toBe(registerDto.role);
            expect(response.body.user).not.toHaveProperty('password');
        });

        it('should return 409 for duplicate email', async () => {
            const registerDto = {
                email: 'duplicate@example.com',
                password: 'Password123!',
                firstName: 'Test',
                lastName: 'User',
                role: 'RECEPTIONIST',
            };

            // First registration
            await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send(registerDto)
                .expect(201);

            // Duplicate registration
            const response = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send(registerDto)
                .expect(409);

            expect(response.body.message).toBe('Email already registered');
        });

        it('should return 400 for invalid input', async () => {
            const invalidDto = {
                email: 'invalid-email',
                password: '123', // Too short
                firstName: '',
            };

            await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send(invalidDto)
                .expect(400);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        beforeEach(async () => {
            // Create a test user
            await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'logintest@example.com',
                    password: 'Password123!',
                    firstName: 'Login',
                    lastName: 'Test',
                    role: 'RECEPTIONIST',
                });
        });

        it('should login with valid credentials', async () => {
            const loginDto = {
                email: 'logintest@example.com',
                password: 'Password123!',
            };

            const response = await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send(loginDto)
                .expect(201);

            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(loginDto.email);
        });

        it('should return 401 for invalid credentials', async () => {
            const loginDto = {
                email: 'logintest@example.com',
                password: 'WrongPassword!',
            };

            const response = await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send(loginDto)
                .expect(401);

            expect(response.body.message).toBe('Invalid credentials');
        });

        it('should return 401 for non-existent user', async () => {
            const loginDto = {
                email: 'nonexistent@example.com',
                password: 'Password123!',
            };

            const response = await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send(loginDto)
                .expect(401);

            expect(response.body.message).toBe('Invalid credentials');
        });
    });

    describe('POST /api/v1/auth/refresh', () => {
        let refreshToken: string;

        beforeEach(async () => {
            const registerResponse = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'refreshtest@example.com',
                    password: 'Password123!',
                    firstName: 'Refresh',
                    lastName: 'Test',
                    role: 'RECEPTIONIST',
                });

            refreshToken = registerResponse.body.refreshToken;
        });

        it('should refresh tokens with valid refresh token', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/auth/refresh')
                .send({ refreshToken })
                .expect(201);

            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body).toHaveProperty('user');
        });

        it('should return 401 for invalid refresh token', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: 'invalid-token' })
                .expect(401);
        });
    });

    describe('POST /api/v1/auth/logout', () => {
        let accessToken: string;

        beforeEach(async () => {
            const loginResponse = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'logouttest@example.com',
                    password: 'Password123!',
                    firstName: 'Logout',
                    lastName: 'Test',
                    role: 'RECEPTIONIST',
                });

            accessToken = loginResponse.body.accessToken;
        });

        it('should logout successfully', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(201);
        });

        it('should return 401 without token', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/auth/logout')
                .expect(401);
        });
    });

    describe('GET /api/v1/auth/profile', () => {
        let accessToken: string;

        beforeEach(async () => {
            const loginResponse = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'profiletest@example.com',
                    password: 'Password123!',
                    firstName: 'Profile',
                    lastName: 'Test',
                    role: 'RECEPTIONIST',
                });

            accessToken = loginResponse.body.accessToken;
        });

        it('should get user profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.email).toBe('profiletest@example.com');
            expect(response.body).not.toHaveProperty('password');
        });

        it('should return 401 without token', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/auth/profile')
                .expect(401);
        });
    });
});
