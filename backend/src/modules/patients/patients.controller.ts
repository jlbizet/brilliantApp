import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto, CreateMedicalHistoryDto, CreateAllergyDto } from './dto';
import { PaginationDto } from '../../common/dto';

@ApiTags('Patients')
@Controller('patients')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all patients with pagination and search' })
    findAll(@Query() query: PaginationDto) {
        return this.patientsService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get patient details with full history' })
    findOne(@Param('id') id: string) {
        return this.patientsService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new patient' })
    create(@Body() dto: CreatePatientDto) {
        return this.patientsService.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update patient information' })
    update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
        return this.patientsService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Deactivate a patient (soft delete)' })
    remove(@Param('id') id: string) {
        return this.patientsService.remove(id);
    }

    @Post(':id/medical-history')
    @ApiOperation({ summary: 'Add medical history entry' })
    addMedicalHistory(@Param('id') id: string, @Body() dto: CreateMedicalHistoryDto) {
        return this.patientsService.addMedicalHistory(id, dto);
    }

    @Delete('medical-history/:historyId')
    @ApiOperation({ summary: 'Remove medical history entry' })
    removeMedicalHistory(@Param('historyId') id: string) {
        return this.patientsService.removeMedicalHistory(id);
    }

    @Post(':id/allergies')
    @ApiOperation({ summary: 'Add allergy' })
    addAllergy(@Param('id') id: string, @Body() dto: CreateAllergyDto) {
        return this.patientsService.addAllergy(id, dto);
    }

    @Delete('allergies/:allergyId')
    @ApiOperation({ summary: 'Remove allergy' })
    removeAllergy(@Param('allergyId') id: string) {
        return this.patientsService.removeAllergy(id);
    }
}
