import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

describe('AuthService', () => {
    let service: AuthService;
    let prisma: any;
    let jwtService: any;
    let configService: any;

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'DENTIST',
        phone: '+1-555-1234',
        avatar: null,
        specialization: 'Orthodontics',
        licenseNumber: 'DEN123456',
        isActive: true,
        refreshToken: null,
        lastLoginAt: null,
        createdAt: new Date(),
    };

    const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            findUnique: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                        },
                        auditLog: {
                            create: jest.fn(),
                        },
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        signAsync: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            const config: Record<string, string> = {
                                'JWT_SECRET': 'test-secret',
                                'JWT_REFRESH_SECRET': 'test-refresh-secret',
                                'JWT_EXPIRATION': '15m',
                                'JWT_REFRESH_EXPIRATION': '7d',
                            };
                            return config[key];
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        prisma = module.get<PrismaService>(PrismaService);
        jwtService = module.get<JwtService>(JwtService);
        configService = module.get<ConfigService>(ConfigService);

        // Reset mocks
        jest.clearAllMocks();
    });

    describe('register', () => {
        const registerDto: RegisterDto = {
            email: 'new@example.com',
            password: 'password123',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'DENTIST',
        };

        it('should successfully register a new user', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
            prisma.user.create.mockResolvedValue(mockUser);
            jwtService.signAsync
                .mockResolvedValueOnce(mockTokens.accessToken)
                .mockResolvedValueOnce(mockTokens.refreshToken);
            prisma.user.update.mockResolvedValue({ ...mockUser, refreshToken: 'hashedRefreshToken' });
            prisma.auditLog.create.mockResolvedValue({});

            const result = await service.register(registerDto);

            expect(result).toHaveProperty('accessToken', mockTokens.accessToken);
            expect(result).toHaveProperty('refreshToken', mockTokens.refreshToken);
            expect(result.user).toEqual({
                id: mockUser.id,
                email: mockUser.email,
                firstName: mockUser.firstName,
                lastName: mockUser.lastName,
                role: mockUser.role,
            });
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: registerDto.email },
            });
            expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
        });

        it('should throw ConflictException if email already exists', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);

            await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
            await expect(service.register(registerDto)).rejects.toThrow('Email already registered');
        });
    });

    describe('login', () => {
        const loginDto: LoginDto = {
            email: 'test@example.com',
            password: 'password123',
        };

        it('should successfully login with valid credentials', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            jwtService.signAsync
                .mockResolvedValueOnce(mockTokens.accessToken)
                .mockResolvedValueOnce(mockTokens.refreshToken);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedRefreshToken');
            prisma.user.update.mockResolvedValue({ ...mockUser, refreshToken: 'hashedRefreshToken' });
            prisma.auditLog.create.mockResolvedValue({});

            const result = await service.login(loginDto);

            expect(result).toHaveProperty('accessToken', mockTokens.accessToken);
            expect(result).toHaveProperty('refreshToken', mockTokens.refreshToken);
            expect(result.user).toEqual({
                id: mockUser.id,
                email: mockUser.email,
                firstName: mockUser.firstName,
                lastName: mockUser.lastName,
                role: mockUser.role,
            });
        });

        it('should throw UnauthorizedException for non-existent user', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
            await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
        });

        it('should throw UnauthorizedException for inactive account', async () => {
            prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
            await expect(service.login(loginDto)).rejects.toThrow('Account is deactivated');
        });

        it('should throw UnauthorizedException for invalid password', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
            await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
        });
    });

    describe('refreshTokens', () => {
        const userId = 'user-123';
        const refreshToken = 'valid-refresh-token';

        it('should successfully refresh tokens with valid refresh token', async () => {
            prisma.user.findUnique.mockResolvedValue({
                ...mockUser,
                refreshToken: 'hashedRefreshToken',
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            jwtService.signAsync
                .mockResolvedValueOnce('new-access-token')
                .mockResolvedValueOnce('new-refresh-token');
            (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedRefreshToken');
            prisma.user.update.mockResolvedValue({});

            const result = await service.refreshTokens(userId, refreshToken);

            expect(result).toHaveProperty('accessToken', 'new-access-token');
            expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
        });

        it('should throw UnauthorizedException if user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.refreshTokens(userId, refreshToken)).rejects.toThrow(UnauthorizedException);
            await expect(service.refreshTokens(userId, refreshToken)).rejects.toThrow('Access denied');
        });

        it('should throw UnauthorizedException if refresh token is null', async () => {
            prisma.user.findUnique.mockResolvedValue({ ...mockUser, refreshToken: null });

            await expect(service.refreshTokens(userId, refreshToken)).rejects.toThrow(UnauthorizedException);
            await expect(service.refreshTokens(userId, refreshToken)).rejects.toThrow('Access denied');
        });

        it('should throw UnauthorizedException for invalid refresh token', async () => {
            prisma.user.findUnique.mockResolvedValue({
                ...mockUser,
                refreshToken: 'hashedRefreshToken',
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.refreshTokens(userId, refreshToken)).rejects.toThrow(UnauthorizedException);
            await expect(service.refreshTokens(userId, refreshToken)).rejects.toThrow('Invalid refresh token');
        });
    });

    describe('logout', () => {
        const userId = 'user-123';

        it('should successfully logout user', async () => {
            prisma.user.update.mockResolvedValue({});
            prisma.auditLog.create.mockResolvedValue({});

            await service.logout(userId);

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { refreshToken: null },
            });
            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: {
                    userId,
                    action: 'LOGOUT',
                    entity: 'User',
                    entityId: userId,
                },
            });
        });
    });

    describe('getProfile', () => {
        const userId = 'user-123';

        it('should return user profile', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.getProfile(userId);

            expect(result).toEqual(mockUser);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    phone: true,
                    avatar: true,
                    specialization: true,
                    licenseNumber: true,
                    isActive: true,
                    lastLoginAt: true,
                    createdAt: true,
                },
            });
        });

        it('should return null if user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await service.getProfile(userId);

            expect(result).toBeNull();
        });
    });
});
