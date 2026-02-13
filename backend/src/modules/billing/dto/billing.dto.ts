import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { PaginationDto } from '../../../common/dto';

export class InvoicePaginationDto extends PaginationDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    patientId?: string;
}

export class InvoiceItemDto {
    @ApiProperty() @IsString() description: string;
    @ApiProperty() @IsInt() quantity: number;
    @ApiProperty() @IsNumber() unitPrice: number;
}

export class CreateInvoiceDto {
    @ApiProperty() @IsString() patientId: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() tax?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() discount?: number;
    @ApiProperty() @IsDateString() dueDate: string;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
    @ApiProperty({ type: [InvoiceItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDto)
    items: InvoiceItemDto[];
}

export class CreatePaymentDto {
    @ApiProperty() @IsString() invoiceId: string;
    @ApiProperty() @IsNumber() amount: number;
    @ApiPropertyOptional({ enum: PaymentMethod }) @IsOptional() @IsEnum(PaymentMethod) method?: PaymentMethod;
    @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

import { PaymentStatus } from '@prisma/client';

export class UpdateInvoiceStatusDto {
    @ApiProperty({ enum: PaymentStatus })
    @IsEnum(PaymentStatus)
    status: PaymentStatus;
}
