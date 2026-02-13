import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { TreatmentsService } from './treatments.service';
import { CreateTreatmentPlanDto, UpdateTreatmentPlanDto, CreateTreatmentDto, UpdateTreatmentDto } from './dto';

@ApiTags('Treatments')
@Controller('treatments')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TreatmentsController {
    constructor(private readonly treatmentsService: TreatmentsService) { }

    @Get('plans')
    @ApiOperation({ summary: 'Get all treatment plans' })
    findAllPlans(@Query('patientId') patientId?: string) {
        return this.treatmentsService.findAllPlans(patientId);
    }

    @Get('plans/:id')
    @ApiOperation({ summary: 'Get treatment plan details' })
    findOnePlan(@Param('id') id: string) {
        return this.treatmentsService.findOnePlan(id);
    }

    @Post('plans')
    @ApiOperation({ summary: 'Create a treatment plan' })
    createPlan(@Body() dto: CreateTreatmentPlanDto) {
        return this.treatmentsService.createPlan(dto);
    }

    @Patch('plans/:id')
    @ApiOperation({ summary: 'Update a treatment plan' })
    updatePlan(@Param('id') id: string, @Body() dto: UpdateTreatmentPlanDto) {
        return this.treatmentsService.updatePlan(id, dto);
    }

    @Delete('plans/:id')
    @ApiOperation({ summary: 'Delete a treatment plan' })
    deletePlan(@Param('id') id: string) {
        return this.treatmentsService.deletePlan(id);
    }

    @Post()
    @ApiOperation({ summary: 'Add a treatment to a plan' })
    createTreatment(@Body() dto: CreateTreatmentDto) {
        return this.treatmentsService.createTreatment(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a treatment' })
    updateTreatment(@Param('id') id: string, @Body() dto: UpdateTreatmentDto) {
        return this.treatmentsService.updateTreatment(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a treatment' })
    deleteTreatment(@Param('id') id: string) {
        return this.treatmentsService.deleteTreatment(id);
    }
}
