import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto, CreatePaymentDto, InvoicePaginationDto } from './dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BillingService {
    constructor(private prisma: PrismaService) { }

    async findAllInvoices(query: InvoicePaginationDto) {
        const where: any = {};
        if (query.patientId) {
            where.patientId = query.patientId;
        }
        if (query.search) {
            where.OR = [
                { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
                { patient: { firstName: { contains: query.search, mode: 'insensitive' } } },
                { patient: { lastName: { contains: query.search, mode: 'insensitive' } } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.invoice.findMany({
                where,
                include: {
                    patient: { select: { id: true, firstName: true, lastName: true } },
                    _count: { select: { payments: true } },
                },
                skip: query.skip,
                take: query.limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.invoice.count({ where }),
        ]);

        return new PaginatedResponseDto(data, total, query.page!, query.limit!);
    }

    async findOneInvoice(id: string) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: { patient: true, items: true, payments: true },
        });
        if (!invoice) throw new NotFoundException('Invoice not found');
        return invoice;
    }

    async createInvoice(dto: CreateInvoiceDto) {
        const items = dto.items.map((item) => ({
            ...item,
            total: item.quantity * item.unitPrice,
        }));

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const tax = dto.tax || 0;
        const discount = dto.discount || 0;
        const total = subtotal + tax - discount;

        return this.prisma.invoice.create({
            data: {
                patientId: dto.patientId,
                invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
                subtotal,
                tax,
                discount,
                total,
                dueDate: new Date(dto.dueDate),
                notes: dto.notes,
                items: { create: items },
            },
            include: { items: true, patient: { select: { id: true, firstName: true, lastName: true } } },
        });
    }

    async createPayment(dto: CreatePaymentDto) {
        const invoice = await this.findOneInvoice(dto.invoiceId);
        const payment = await this.prisma.payment.create({ data: dto as any });

        // Recalculate invoice payment status
        const totalPaid = await this.prisma.payment.aggregate({
            where: { invoiceId: dto.invoiceId },
            _sum: { amount: true },
        });

        const paidAmount = Number(totalPaid._sum.amount || 0);
        const invoiceTotal = Number(invoice.total);
        let status: any = 'PARTIAL';
        if (paidAmount >= invoiceTotal) status = 'PAID';
        if (paidAmount === 0) status = 'PENDING';

        await this.prisma.invoice.update({
            where: { id: dto.invoiceId },
            data: { status },
        });

        return payment;
    }

    async getRevenueReport(startDate: string, endDate: string) {
        const payments = await this.prisma.payment.findMany({
            where: {
                paidAt: { gte: new Date(startDate), lte: new Date(endDate) },
            },
            include: { invoice: { include: { patient: { select: { firstName: true, lastName: true } } } } },
        });

        const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const byMethod = payments.reduce((acc: any, p) => {
            acc[p.method] = (acc[p.method] || 0) + Number(p.amount);
            return acc;
        }, {});

        return { totalRevenue, byMethod, payments: payments.length };
    }

    async updateInvoiceStatus(id: string, dto: any) {
        return this.prisma.invoice.update({
            where: { id },
            data: { status: dto.status },
        });
    }
}
