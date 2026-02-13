import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        const [
            totalPatients,
            activePatients,
            todayAppointments,
            monthAppointments,
            pendingInvoices,
            monthRevenue,
            lowStockItems,
        ] = await Promise.all([
            this.prisma.patient.count(),
            this.prisma.patient.count({ where: { isActive: true } }),
            this.prisma.appointment.count({
                where: { startTime: { gte: today, lt: tomorrow }, status: { notIn: ['CANCELLED'] } },
            }),
            this.prisma.appointment.count({
                where: { startTime: { gte: monthStart }, status: { notIn: ['CANCELLED'] } },
            }),
            this.prisma.invoice.count({ where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } } }),
            this.prisma.invoice.aggregate({
                where: { 
                    createdAt: { gte: monthStart }
                },
                _sum: { total: true },
            }),
            this.prisma.$queryRaw`SELECT COUNT(*) as count FROM inventory_items WHERE quantity <= "minQuantity"` as any,
        ]);

        return {
            totalPatients,
            activePatients,
            todayAppointments,
            monthAppointments,
            pendingInvoices,
            monthRevenue: Number(monthRevenue._sum?.total || 0),
            lowStockItems: Number(lowStockItems?.[0]?.count || 0),
        };
    }

    async getRevenueChart(months: number = 12, startDate?: string, endDate?: string) {
        // If date range is provided, filter by date range and group by month
        if (startDate && endDate) {
            const results = [];
            const start = new Date(startDate);
            const end = new Date(endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            // Calculate number of months between dates
            const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;

            for (let i = 0; i < monthDiff; i++) {
                const monthStart = new Date(start);
                monthStart.setMonth(start.getMonth() + i, 1);
                monthStart.setHours(0, 0, 0, 0);

                const monthEnd = new Date(monthStart);
                monthEnd.setMonth(monthEnd.getMonth() + 1);

                // Don't go beyond the end date
                if (monthStart > end) break;

                const actualEnd = monthEnd > end ? end : monthEnd;

                const revenue = await this.prisma.invoice.aggregate({
                    where: { createdAt: { gte: monthStart, lte: actualEnd } },
                    _sum: { total: true },
                });

                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                results.push({
                    month: monthNames[monthStart.getMonth()],
                    revenue: Number(revenue._sum?.total || 0),
                });
            }
            return results;
        }

        // Default behavior: last N months
        const results = [];
        for (let i = months - 1; i >= 0; i--) {
            const start = new Date();
            start.setMonth(start.getMonth() - i, 1);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setMonth(end.getMonth() + 1);

            const revenue = await this.prisma.invoice.aggregate({
                where: { createdAt: { gte: start, lt: end } },
                _sum: { total: true },
            });

            results.push({
                month: start.toISOString().slice(0, 7),
                revenue: Number(revenue._sum?.total || 0),
            });
        }
        return results;
    }

    async getAppointmentStats() {
        const statusCounts = await this.prisma.appointment.groupBy({
            by: ['status'],
            _count: true,
        });

        const typeCounts = await this.prisma.appointment.groupBy({
            by: ['type'],
            _count: true,
        });

        return { byStatus: statusCounts, byType: typeCounts };
    }

    async getPatientGrowth(months: number = 12) {
        const results = [];
        for (let i = months - 1; i >= 0; i--) {
            const start = new Date();
            start.setMonth(start.getMonth() - i, 1);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setMonth(end.getMonth() + 1);

            const count = await this.prisma.patient.count({
                where: { createdAt: { gte: start, lt: end } },
            });

            results.push({ month: start.toISOString().slice(0, 7), newPatients: count });
        }
        return results;
    }

    async getRecentActivity() {
        return this.prisma.auditLog.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { firstName: true, lastName: true } } },
        });
    }
}
