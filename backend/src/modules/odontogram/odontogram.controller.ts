import { Controller, Get, Post, Body, Param, Put, Delete, NotFoundException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OdontogramService } from './odontogram.service';
import { CreateOdontogramDto, UpdateOdontogramDto, CreateToothConditionDto, UpdateToothConditionDto } from './dto';

@ApiTags('Odontogram')
@Controller('odontogram')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OdontogramController {
    constructor(private readonly odontogramService: OdontogramService) { }

    @Get(':patientId')
    async getOdontogram(@Param('patientId') patientId: string) {
        const odontogram = await this.odontogramService.findByPatient(patientId);
        if (!odontogram) {
            // Return simplified structure or 404. 
            // Frontend expects something to render.
            // We can return null and handle it there, or create one.
            // For now, let's auto-create empty.
            return this.odontogramService.createOrGet({ patientId });
        }
        return odontogram;
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateOdontogramDto) {
        return this.odontogramService.update(id, dto);
    }

    @Post(':patientId/condition')
    addCondition(@Param('patientId') patientId: string, @Body() dto: CreateToothConditionDto) {
        return this.odontogramService.addCondition(patientId, dto);
    }

    @Put('condition/:id')
    updateCondition(@Param('id') id: string, @Body() dto: UpdateToothConditionDto) {
        return this.odontogramService.updateCondition(id, dto);
    }

    @Delete('condition/:id')
    removeCondition(@Param('id') id: string) {
        return this.odontogramService.removeCondition(id);
    }
}
