import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistEntryDto, UpdateWaitlistEntryDto } from './dto/waitlist.dto';
import { RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';

@ApiTags('waitlist')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('waitlist')
export class WaitlistController {
    constructor(private readonly waitlistService: WaitlistService) { }

    @Get()
    @ApiOperation({ summary: 'Get all waitlist entries' })
    findAll() {
        return this.waitlistService.findAll();
    }

    @Get('patient/:patientId')
    @ApiOperation({ summary: 'Get waitlist entries for a specific patient' })
    findByPatient(@Param('patientId') patientId: string) {
        return this.waitlistService.findByPatient(patientId);
    }

    @Post()
    @ApiOperation({ summary: 'Add a patient to the waitlist' })
    create(@Body() createDto: CreateWaitlistEntryDto) {
        return this.waitlistService.create(createDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a waitlist entry' })
    update(@Param('id') id: string, @Body() updateDto: UpdateWaitlistEntryDto) {
        return this.waitlistService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remove a waitlist entry' })
    remove(@Param('id') id: string) {
        return this.waitlistService.remove(id);
    }
}
