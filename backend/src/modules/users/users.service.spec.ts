import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

describe('UsersService', () => {
    let service: UsersService;
    let prisma: any;

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
        lastLoginAt: new Date(),
        createdAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                            delete: jest.fn(),
                            count: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    describe('findAll', () => {
        const query = {
            page: 1,
            limit: 10,
            get skip() { return ((this.page ?? 1) - 1) * (this.limit ?? 20); },
        };

        it('should return paginated users', async () => {
            const mockUsers = [mockUser];
            prisma.user.findMany.mockResolvedValue(mockUsers);
            prisma.user.count.mockResolvedValue(1);

            const result = await service.findAll(query as any);

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
            expect(prisma.user.findMany).toHaveBeenCalledWith({
                where: {},
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    phone: true,
                    specialization: true,
                    licenseNumber: true,
                    isActive: true,
                    lastLoginAt: true,
                    createdAt: true,
                },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should filter users by search term', async () => {
            const searchQuery = {
                ...query,
                search: 'John',
            };
            prisma.user.findMany.mockResolvedValue([mockUser]);
            prisma.user.count.mockResolvedValue(1);

            await service.findAll(searchQuery as any);

            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        OR: [
                            { firstName: { contains: 'John', mode: 'insensitive' } },
                            { lastName: { contains: 'John', mode: 'insensitive' } },
                            { email: { contains: 'John', mode: 'insensitive' } },
                        ],
                    },
                }),
            );
        });
    });

    describe('findOne', () => {
        it('should return user by id', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.findOne('user-123');

            expect(result).toEqual(mockUser);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user-123' },
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

        it('should throw NotFoundException if user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
            await expect(service.findOne('non-existent')).rejects.toThrow('User not found');
        });
    });

    describe('create', () => {
        const createDto: CreateUserDto = {
            email: 'new@example.com',
            password: 'Password123!',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'RECEPTIONIST',
        };

        it('should create a new user', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
            prisma.user.create.mockResolvedValue({
                ...mockUser,
                email: createDto.email,
                firstName: createDto.firstName,
                lastName: createDto.lastName,
                role: createDto.role,
                password: undefined,
            });

            const result = await service.create(createDto);

            expect(result.email).toBe(createDto.email);
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: {
                    ...createDto,
                    password: 'hashedPassword',
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    phone: true,
                    specialization: true,
                    licenseNumber: true,
                    isActive: true,
                    createdAt: true,
                },
            });
        });

        it('should throw ConflictException if email already exists', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);

            await expect(service.create(createDto)).rejects.toThrow(ConflictException);
            await expect(service.create(createDto)).rejects.toThrow('Email already exists');
        });
    });

    describe('update', () => {
        const updateDto: UpdateUserDto = {
            firstName: 'Updated',
            phone: '+1-555-9999',
        };

        it('should update user successfully', async () => {
            prisma.user.findUnique.mockResolvedValueOnce(mockUser);
            prisma.user.update.mockResolvedValue({ ...mockUser, ...updateDto });

            const result = await service.update('user-123', updateDto);

            expect(result.firstName).toBe('Updated');
            expect(result.phone).toBe('+1-555-9999');
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: updateDto,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    phone: true,
                    specialization: true,
                    licenseNumber: true,
                    isActive: true,
                },
            });
        });

        it('should hash password if provided', async () => {
            const dtoWithPassword = { ...updateDto, password: 'NewPassword123!' };
            prisma.user.findUnique.mockResolvedValueOnce(mockUser);
            (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
            prisma.user.update.mockResolvedValue({ ...mockUser, ...dtoWithPassword });

            await service.update('user-123', dtoWithPassword);

            expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 12);
            expect(prisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        password: 'newHashedPassword',
                    }),
                }),
            );
        });

        it('should throw NotFoundException if user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.update('non-existent', updateDto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should delete user', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            prisma.user.delete.mockResolvedValue({});

            const result = await service.remove('user-123');

            expect(result).toEqual({ message: 'User deleted successfully' });
            expect(prisma.user.delete).toHaveBeenCalledWith({
                where: { id: 'user-123' },
            });
        });

        it('should throw NotFoundException if user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getDentists', () => {
        it('should return all active dentists and hygienists', async () => {
            const mockDentists = [
                { ...mockUser, role: 'DENTIST' },
                { ...mockUser, id: 'user-124', role: 'HYGIENIST' },
            ];
            prisma.user.findMany.mockResolvedValue(mockDentists);

            const result = await service.getDentists();

            expect(result).toHaveLength(2);
            expect(prisma.user.findMany).toHaveBeenCalledWith({
                where: {
                    role: { in: ['DENTIST', 'HYGIENIST'] },
                    isActive: true,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    specialization: true,
                    licenseNumber: true,
                },
                orderBy: { firstName: 'asc' },
            });
        });
    });

    describe('updatePassword', () => {
        const userId = 'user-123';
        const currentPassword = 'CurrentPass123!';
        const newPassword = 'NewPass123!';

        it('should update password successfully', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
            prisma.user.update.mockResolvedValue({});

            const result = await service.updatePassword(userId, currentPassword, newPassword);

            expect(result).toEqual({ message: 'Password updated successfully' });
            expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, mockUser.password);
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { password: 'newHashedPassword' },
            });
        });

        it('should throw NotFoundException if user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.updatePassword(userId, currentPassword, newPassword)).rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException for incorrect current password', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.updatePassword(userId, currentPassword, newPassword)).rejects.toThrow(ConflictException);
            await expect(service.updatePassword(userId, currentPassword, newPassword)).rejects.toThrow('Current password is incorrect');
        });
    });
});
