import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto, CreatePaymentDto, InvoicePaginationDto } from './dto';

describe('BillingService', () => {
    let service: BillingService;
    let prisma: any;

    const mockPatient = {
        id: 'patient-123',
        firstName: 'Jane',
        lastName: 'Smith',
    };

    const mockInvoice = {
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
        patient: mockPatient,
        items: [],
        payments: [],
        _count: { payments: 0 },
    };

    const mockInvoiceItem = {
        id: 'item-123',
        invoiceId: 'invoice-123',
        description: 'Dental Cleaning',
        quantity: 1,
        unitPrice: 100.00,
        total: 100.00,
    };

    const mockPayment = {
        id: 'payment-123',
        invoiceId: 'invoice-123',
        amount: 220.00,
        method: 'CREDIT_CARD',
        reference: 'REF-123',
        notes: 'Full payment',
        paidAt: new Date(),
        createdAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BillingService,
                {
                    provide: PrismaService,
                    useValue: {
                        invoice: {
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                            delete: jest.fn(),
                            count: jest.fn(),
                        },
                        payment: {
                            create: jest.fn(),
                            aggregate: jest.fn(),
                            findMany: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<BillingService>(BillingService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    describe('findAllInvoices', () => {
        const query = {
            page: 1,
            limit: 10,
            get skip() { return ((this.page ?? 1) - 1) * (this.limit ?? 20); },
        };

        it('should return paginated invoices', async () => {
            const mockInvoices = [mockInvoice];
            prisma.invoice.findMany.mockResolvedValue(mockInvoices);
            prisma.invoice.count.mockResolvedValue(1);

            const result = await service.findAllInvoices(query as InvoicePaginationDto);

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
            expect(prisma.invoice.findMany).toHaveBeenCalledWith({
                where: {},
                include: {
                    patient: { select: { id: true, firstName: true, lastName: true } },
                    _count: { select: { payments: true } },
                },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should filter by patientId', async () => {
            const patientQuery = {
                ...query,
                patientId: 'patient-123',
            };
            prisma.invoice.findMany.mockResolvedValue([mockInvoice]);
            prisma.invoice.count.mockResolvedValue(1);

            await service.findAllInvoices(patientQuery as InvoicePaginationDto);

            expect(prisma.invoice.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { patientId: 'patient-123' },
                }),
            );
        });

        it('should filter by search term', async () => {
            const searchQuery = {
                ...query,
                search: 'Jane',
            };
            prisma.invoice.findMany.mockResolvedValue([mockInvoice]);
            prisma.invoice.count.mockResolvedValue(1);

            await service.findAllInvoices(searchQuery as InvoicePaginationDto);

            expect(prisma.invoice.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        OR: [
                            { invoiceNumber: { contains: 'Jane', mode: 'insensitive' } },
                            { patient: { firstName: { contains: 'Jane', mode: 'insensitive' } } },
                            { patient: { lastName: { contains: 'Jane', mode: 'insensitive' } } },
                        ],
                    },
                }),
            );
        });
    });

    describe('findOneInvoice', () => {
        it('should return invoice with relations', async () => {
            prisma.invoice.findUnique.mockResolvedValue({
                ...mockInvoice,
                items: [mockInvoiceItem],
                payments: [],
            });

            const result = await service.findOneInvoice('invoice-123');

            expect(result).toEqual(expect.objectContaining({
                id: 'invoice-123',
                invoiceNumber: 'INV-2026-0001',
            }));
            expect(prisma.invoice.findUnique).toHaveBeenCalledWith({
                where: { id: 'invoice-123' },
                include: { patient: true, items: true, payments: true },
            });
        });

        it('should throw NotFoundException if invoice not found', async () => {
            prisma.invoice.findUnique.mockResolvedValue(null);

            await expect(service.findOneInvoice('non-existent')).rejects.toThrow(NotFoundException);
            await expect(service.findOneInvoice('non-existent')).rejects.toThrow('Invoice not found');
        });
    });

    describe('createInvoice', () => {
        const createDto: CreateInvoiceDto = {
            patientId: 'patient-123',
            dueDate: '2026-03-20',
            tax: 20.00,
            discount: 0.00,
            notes: 'Payment due within 30 days',
            items: [
                {
                    description: 'Dental Cleaning',
                    quantity: 1,
                    unitPrice: 100.00,
                },
                {
                    description: 'X-Ray',
                    quantity: 2,
                    unitPrice: 50.00,
                },
            ],
        };

        it('should create invoice with calculated totals', async () => {
            prisma.invoice.create.mockResolvedValue({
                ...mockInvoice,
                items: [
                    { ...mockInvoiceItem, description: 'Dental Cleaning', total: 100.00 },
                    { ...mockInvoiceItem, id: 'item-124', description: 'X-Ray', quantity: 2, total: 100.00 },
                ],
            });

            const result = await service.createInvoice(createDto);

            expect(result.subtotal).toBe(200.00);
            expect(result.tax).toBe(20.00);
            expect(result.total).toBe(220.00);
            expect(prisma.invoice.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    patientId: 'patient-123',
                    subtotal: 200.00,
                    tax: 20.00,
                    discount: 0.00,
                    total: 220.00,
                    dueDate: new Date('2026-03-20'),
                    items: {
                        create: [
                            { description: 'Dental Cleaning', quantity: 1, unitPrice: 100.00, total: 100.00 },
                            { description: 'X-Ray', quantity: 2, unitPrice: 50.00, total: 100.00 },
                        ],
                    },
                }),
                include: { items: true, patient: { select: { id: true, firstName: true, lastName: true } } },
            });
        });

        it('should calculate totals correctly with discount', async () => {
            const dtoWithDiscount: CreateInvoiceDto = {
                ...createDto,
                discount: 30.00,
            };
            prisma.invoice.create.mockResolvedValue({
                ...mockInvoice,
                subtotal: 200.00,
                tax: 20.00,
                discount: 30.00,
                total: 190.00,
            });

            const result = await service.createInvoice(dtoWithDiscount);

            expect(result.total).toBe(190.00);
        });
    });

    describe('createPayment', () => {
        const createPaymentDto: CreatePaymentDto = {
            invoiceId: 'invoice-123',
            amount: 220.00,
            method: 'CREDIT_CARD',
            reference: 'REF-123',
            notes: 'Full payment',
        };

        it('should create payment and update invoice status to PAID', async () => {
            prisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            prisma.payment.create.mockResolvedValue(mockPayment);
            prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 220.00 } });
            prisma.invoice.update.mockResolvedValue({ ...mockInvoice, status: 'PAID' });

            const result = await service.createPayment(createPaymentDto);

            expect(result).toEqual(mockPayment);
            expect(prisma.invoice.update).toHaveBeenCalledWith({
                where: { id: 'invoice-123' },
                data: { status: 'PAID' },
            });
        });

        it('should update invoice status to PARTIAL when partially paid', async () => {
            prisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            prisma.payment.create.mockResolvedValue({ ...mockPayment, amount: 100.00 });
            prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 100.00 } });
            prisma.invoice.update.mockResolvedValue({ ...mockInvoice, status: 'PARTIAL' });

            await service.createPayment({ ...createPaymentDto, amount: 100.00 });

            expect(prisma.invoice.update).toHaveBeenCalledWith({
                where: { id: 'invoice-123' },
                data: { status: 'PARTIAL' },
            });
        });

        it('should update invoice status to PENDING when no payments', async () => {
            prisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            prisma.payment.create.mockResolvedValue(mockPayment);
            prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
            prisma.invoice.update.mockResolvedValue({ ...mockInvoice, status: 'PENDING' });

            await service.createPayment(createPaymentDto);

            expect(prisma.invoice.update).toHaveBeenCalledWith({
                where: { id: 'invoice-123' },
                data: { status: 'PENDING' },
            });
        });
    });

    describe('getRevenueReport', () => {
        it('should return revenue report for date range', async () => {
            const payments = [
                { ...mockPayment, amount: 100.00, method: 'CASH' },
                { ...mockPayment, id: 'payment-124', amount: 150.00, method: 'CREDIT_CARD', invoice: { patient: { firstName: 'Jane', lastName: 'Smith' } } },
            ];
            prisma.payment.findMany.mockResolvedValue(payments);

            const result = await service.getRevenueReport('2026-02-01', '2026-02-28');

            expect(result.totalRevenue).toBe(250.00);
            expect(result.payments).toBe(2);
            expect(result.byMethod).toEqual({
                CASH: 100.00,
                CREDIT_CARD: 150.00,
            });
            expect(prisma.payment.findMany).toHaveBeenCalledWith({
                where: {
                    paidAt: {
                        gte: new Date('2026-02-01'),
                        lte: new Date('2026-02-28'),
                    },
                },
                include: { invoice: { include: { patient: { select: { firstName: true, lastName: true } } } } },
            });
        });
    });

    describe('updateInvoiceStatus', () => {
        it('should update invoice status', async () => {
            const updatedInvoice = { ...mockInvoice, status: 'PAID' };
            prisma.invoice.update.mockResolvedValue(updatedInvoice);

            const result = await service.updateInvoiceStatus('invoice-123', { status: 'PAID' });

            expect(result).toEqual(updatedInvoice);
            expect(prisma.invoice.update).toHaveBeenCalledWith({
                where: { id: 'invoice-123' },
                data: { status: 'PAID' },
            });
        });
    });

    describe('deleteInvoice', () => {
        it('should delete invoice', async () => {
            prisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            prisma.invoice.delete.mockResolvedValue({});

            const result = await service.deleteInvoice('invoice-123');

            expect(result).toEqual({ message: 'Invoice deleted successfully' });
            expect(prisma.invoice.delete).toHaveBeenCalledWith({
                where: { id: 'invoice-123' },
            });
        });

        it('should throw NotFoundException if invoice not found', async () => {
            prisma.invoice.findUnique.mockResolvedValue(null);

            await expect(service.deleteInvoice('non-existent')).rejects.toThrow(NotFoundException);
        });
    });
});
