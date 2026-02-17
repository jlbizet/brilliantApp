import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Mock data factory for creating consistent test data
 */
export const mockData = {
    user: {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'DENTIST',
        phone: '+1-555-1234',
        avatar: null,
        specialization: 'Orthodontics',
        licenseNumber: 'DEN123456',
        isActive: true,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        refreshToken: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
    },

    patient: {
        id: 'patient-123',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-5678',
        dateOfBirth: new Date('1990-05-15'),
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
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },

    appointment: {
        id: 'appointment-123',
        patientId: 'patient-123',
        dentistId: 'user-123',
        title: 'Regular Checkup',
        description: 'Annual dental checkup',
        startTime: new Date('2026-02-20T10:00:00Z'),
        endTime: new Date('2026-02-20T11:00:00Z'),
        status: 'SCHEDULED',
        type: 'general',
        notes: null,
        isRecurring: false,
        recurringPattern: null,
        recurringGroupId: null,
        recurringEndDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    },

    invoice: {
        id: 'invoice-123',
        patientId: 'patient-123',
        invoiceNumber: 'INV-2026-0001',
        subtotal: 200.00,
        tax: 20.00,
        discount: 0.00,
        total: 220.00,
        status: 'PENDING',
        dueDate: new Date('2026-03-20'),
        notes: 'Payment due within 30 days',
        createdAt: new Date(),
        updatedAt: new Date(),
    },

    inventoryItem: {
        id: 'inventory-123',
        name: 'Dental Floss',
        category: 'Supplies',
        sku: 'FLSS-001',
        quantity: 50,
        minQuantity: 10,
        unitPrice: 2.50,
        supplier: 'Dental Supply Co',
        supplierContact: 'supplier@example.com',
        expiryDate: null,
        notes: 'Mint flavor',
        createdAt: new Date(),
        updatedAt: new Date(),
    },

    treatmentPlan: {
        id: 'plan-123',
        patientId: 'patient-123',
        name: 'Full Dental Restoration',
        description: 'Complete dental restoration plan',
        status: 'PLANNED',
        estimatedCost: 5000.00,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-06-01'),
        notes: 'Multi-phase treatment',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
};

/**
 * Deep mock of PrismaService for unit tests
 * Provides mock implementations for all Prisma methods
 */
export const createMockPrismaService = () => ({
    user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    patient: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    appointment: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    invoice: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    invoiceItem: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    payment: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    inventoryItem: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    treatmentPlan: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    treatment: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    medicalHistory: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    allergy: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    document: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
    },
    prescription: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    notification: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    waitlistEntry: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    odontogram: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    toothCondition: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
});

/**
 * Type for the mock Prisma service
 */
export type MockPrismaService = ReturnType<typeof createMockPrismaService>;

/**
 * Helper to create a testing module with mocked Prisma
 */
export async function createTestingModule(providers: any[]) {
    const mockPrisma = createMockPrismaService();
    
    const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
            ...providers,
            {
                provide: PrismaService,
                useValue: mockPrisma,
            },
        ],
    }).compile();

    return { moduleRef, prisma: mockPrisma };
}

/**
 * Mock JWTService for auth tests
 */
export const createMockJwtService = () => ({
    sign: jest.fn(),
    signAsync: jest.fn(),
    verify: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
});

/**
 * Mock ConfigService for tests
 */
export const createMockConfigService = () => ({
    get: jest.fn((key: string) => {
        const config: Record<string, any> = {
            'JWT_SECRET': 'test-secret',
            'JWT_REFRESH_SECRET': 'test-refresh-secret',
            'JWT_EXPIRATION': '15m',
            'JWT_REFRESH_EXPIRATION': '7d',
        };
        return config[key];
    }),
});

/**
 * Helper to reset all mocks
 */
export function resetAllMocks(mockObj: any) {
    Object.values(mockObj).forEach((value: any) => {
        if (typeof value === 'object' && value !== null) {
            Object.values(value).forEach((method: any) => {
                if (typeof method === 'function' && method.mockReset) {
                    method.mockReset();
                }
            });
        }
    });
}
