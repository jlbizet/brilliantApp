import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentQueryDto } from './dto';
import { PaginationDto } from '../../common/dto';

@ApiTags('Appointments')
@Controller('appointments')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all appointments with filtering' })
    findAll(@Query() query: PaginationDto & AppointmentQueryDto) {
        return this.appointmentsService.findAll(query);
    }

    @Get('calendar')
    @ApiOperation({ summary: 'Get appointments for calendar view' })
    getCalendar(@Query() query: AppointmentQueryDto) {
        return this.appointmentsService.getCalendar(query);
    }

    @Get('today-count')
    @ApiOperation({ summary: 'Get today\'s appointment count' })
    getTodayCount() {
        return this.appointmentsService.getTodayCount();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get appointment details' })
    findOne(@Param('id') id: string) {
        return this.appointmentsService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new appointment' })
    create(@Body() dto: CreateAppointmentDto) {
        return this.appointmentsService.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an appointment' })
    update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
        return this.appointmentsService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Cancel an appointment' })
    remove(@Param('id') id: string) {
        return this.appointmentsService.remove(id);
    }
}
