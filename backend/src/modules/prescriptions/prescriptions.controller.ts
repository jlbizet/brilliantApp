import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto, UpdatePrescriptionDto } from './dto';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { UserRole } from '@prisma/client';

@ApiTags('Prescriptions')
@Controller('prescriptions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class PrescriptionsController {
    constructor(private readonly prescriptionsService: PrescriptionsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all prescriptions' })
    findAll(@Query('patientId') patientId?: string) {
        return this.prescriptionsService.findAll(patientId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get prescription by ID' })
    findOne(@Param('id') id: string) {
        return this.prescriptionsService.findOne(id);
    }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.DENTIST)
    @ApiOperation({ summary: 'Create a new prescription' })
    create(@Body() dto: CreatePrescriptionDto) {
        return this.prescriptionsService.create(dto);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.DENTIST)
    @ApiOperation({ summary: 'Update a prescription' })
    update(@Param('id') id: string, @Body() dto: UpdatePrescriptionDto) {
        return this.prescriptionsService.update(id, dto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.DENTIST)
    @ApiOperation({ summary: 'Delete a prescription' })
    remove(@Param('id') id: string) {
        return this.prescriptionsService.remove(id);
    }
}
