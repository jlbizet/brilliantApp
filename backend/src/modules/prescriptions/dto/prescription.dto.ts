import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreatePrescriptionDto {
    @ApiProperty()
    @IsUUID()
    patientId: string;

    @ApiProperty()
    @IsString()
    medication: string;

    @ApiProperty()
    @IsString()
    dosage: string;

    @ApiProperty()
    @IsString()
    frequency: string;

    @ApiProperty()
    @IsString()
    duration: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdatePrescriptionDto extends PartialType(CreatePrescriptionDto) {}
