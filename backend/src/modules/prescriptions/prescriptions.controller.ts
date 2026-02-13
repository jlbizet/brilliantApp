import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto, UpdatePrescriptionDto } from './dto';

@ApiTags('Prescriptions')
@Controller('prescriptions')
@UseGuards(AuthGuard('jwt'))
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
    @ApiOperation({ summary: 'Create a new prescription' })
    create(@Body() dto: CreatePrescriptionDto) {
        return this.prescriptionsService.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a prescription' })
    update(@Param('id') id: string, @Body() dto: UpdatePrescriptionDto) {
        return this.prescriptionsService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a prescription' })
    remove(@Param('id') id: string) {
        return this.prescriptionsService.remove(id);
    }
}
