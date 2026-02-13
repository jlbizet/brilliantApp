import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateInvoiceDto, CreatePaymentDto, UpdateInvoiceStatusDto, InvoicePaginationDto } from './dto';
import { PaginationDto } from '../../common/dto';

@ApiTags('Billing')
@Controller('billing')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    @Get('invoices')
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
    @ApiOperation({ summary: 'Create a new invoice' })
    createInvoice(@Body() dto: CreateInvoiceDto) {
        return this.billingService.createInvoice(dto);
    }

    @Post('payments')
    @ApiOperation({ summary: 'Record a payment' })
    createPayment(@Body() dto: CreatePaymentDto) {
        return this.billingService.createPayment(dto);
    }

    @Get('reports/revenue')
    @ApiOperation({ summary: 'Get revenue report for date range' })
    getRevenueReport(@Query('startDate') start: string, @Query('endDate') end: string) {
        return this.billingService.getRevenueReport(start, end);
    }

    @Patch('invoices/:id/status')
    @ApiOperation({ summary: 'Update invoice status' })
    updateInvoiceStatus(@Param('id') id: string, @Body() dto: UpdateInvoiceStatusDto) {
        return this.billingService.updateInvoiceStatus(id, dto);
    }
}
