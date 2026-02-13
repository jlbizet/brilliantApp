import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateInvoiceDto, CreatePaymentDto, UpdateInvoiceStatusDto, InvoicePaginationDto } from './dto';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { UserRole } from '@prisma/client';

@ApiTags('Billing')
@Controller('billing')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    @Get('invoices')
    @Roles(UserRole.ADMIN, UserRole.DENTIST, UserRole.RECEPTIONIST)
    @ApiOperation({ summary: 'Get all invoices' })
    findAllInvoices(@Query() query: InvoicePaginationDto) {
        return this.billingService.findAllInvoices(query);
    }

    @Get('invoices/:id')
    @ApiOperation({ summary: 'Get invoice details' })
    findOneInvoice(@Param('id') id: string) {
        return this.billingService.findOneInvoice(id);
    }

    @Post('invoices')
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
    @ApiOperation({ summary: 'Create a new invoice' })
    createInvoice(@Body() dto: CreateInvoiceDto) {
        return this.billingService.createInvoice(dto);
    }

    @Post('payments')
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
    @ApiOperation({ summary: 'Record a payment' })
    createPayment(@Body() dto: CreatePaymentDto) {
        return this.billingService.createPayment(dto);
    }

    @Get('reports/revenue')
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
    @ApiOperation({ summary: 'Get revenue report for date range' })
    getRevenueReport(@Query('startDate') start: string, @Query('endDate') end: string) {
        return this.billingService.getRevenueReport(start, end);
    }

    @Patch('invoices/:id/status')
    @ApiOperation({ summary: 'Update invoice status' })
    updateInvoiceStatus(@Param('id') id: string, @Body() dto: UpdateInvoiceStatusDto) {
        return this.billingService.updateInvoiceStatus(id, dto);
    }

    @Delete('invoices/:id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete an invoice' })
    deleteInvoice(@Param('id') id: string) {
        return this.billingService.deleteInvoice(id);
    }
}
