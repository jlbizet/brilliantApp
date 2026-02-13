import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto';
import { IsString, IsOptional, IsInt, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateInventoryItemDto {
    @ApiProperty() @IsString() name: string;
    @ApiProperty() @IsString() category: string;
    @ApiPropertyOptional() @IsOptional() @IsString() sku?: string;
    @ApiPropertyOptional() @IsOptional() @IsInt() quantity?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() minQuantity?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() unitPrice?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() supplier?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() supplierContact?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() expiryDate?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateInventoryItemDto extends PartialType(CreateInventoryItemDto) { }

@Injectable()
export class InventoryService {
    constructor(private prisma: PrismaService) { }

    async findAll(query: PaginationDto) {
        const where: any = {};
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { category: { contains: query.search, mode: 'insensitive' } },
                { sku: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.inventoryItem.findMany({
                where, skip: query.skip, take: query.limit,
                orderBy: { [query.sortBy || 'name']: query.sortOrder || 'asc' },
            }),
            this.prisma.inventoryItem.count({ where }),
        ]);

        return new PaginatedResponseDto(data, total, query.page!, query.limit!);
    }

    async findOne(id: string) {
        const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
        if (!item) throw new NotFoundException('Inventory item not found');
        return item;
    }

    async create(dto: CreateInventoryItemDto) {
        const data: any = { ...dto };
        if (dto.expiryDate) data.expiryDate = new Date(dto.expiryDate);
        return this.prisma.inventoryItem.create({ data });
    }

    async update(id: string, dto: UpdateInventoryItemDto) {
        await this.findOne(id);
        const data: any = { ...dto };
        if (dto.expiryDate) data.expiryDate = new Date(dto.expiryDate);
        return this.prisma.inventoryItem.update({ where: { id }, data });
    }

    async remove(id: string) {
        await this.findOne(id);
        await this.prisma.inventoryItem.delete({ where: { id } });
        return { message: 'Item deleted' };
    }

    async getLowStock() {
        return this.prisma.inventoryItem.findMany({
            where: { quantity: { lte: this.prisma.inventoryItem.fields.minQuantity as any } },
        }).then(() =>
            // Prisma doesn't support field comparison directly, use raw
            this.prisma.$queryRaw`SELECT * FROM inventory_items WHERE quantity <= min_quantity ORDER BY quantity ASC`
        );
    }
}
