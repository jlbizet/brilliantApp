import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { InventoryService, CreateInventoryItemDto, UpdateInventoryItemDto } from './inventory.service';
import { PaginationDto } from '../../common/dto';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { UserRole } from '@prisma/client';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Get()
    @ApiOperation({ summary: 'Get all inventory items' })
    findAll(@Query() query: PaginationDto) { return this.inventoryService.findAll(query); }

    @Get('low-stock')
    @ApiOperation({ summary: 'Get low-stock items' })
    getLowStock() { return this.inventoryService.getLowStock(); }

    @Get(':id')
    @ApiOperation({ summary: 'Get inventory item' })
    findOne(@Param('id') id: string) { return this.inventoryService.findOne(id); }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
    @ApiOperation({ summary: 'Add inventory item' })
    create(@Body() dto: CreateInventoryItemDto) { return this.inventoryService.create(dto); }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
    @ApiOperation({ summary: 'Update inventory item' })
    update(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto) { return this.inventoryService.update(id, dto); }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete inventory item' })
    remove(@Param('id') id: string) { return this.inventoryService.remove(id); }
}
