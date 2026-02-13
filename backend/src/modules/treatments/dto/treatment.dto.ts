import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TreatmentStatus } from '@prisma/client';

export class CreateTreatmentPlanDto {
    @ApiProperty() @IsString() patientId: string;
    @ApiProperty() @IsString() name: string;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() estimatedCost?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
    @ApiPropertyOptional({ enum: TreatmentStatus }) @IsOptional() @IsEnum(TreatmentStatus) status?: TreatmentStatus;
}

export class UpdateTreatmentPlanDto extends PartialType(CreateTreatmentPlanDto) {
    @ApiPropertyOptional({ enum: TreatmentStatus }) @IsOptional() @IsEnum(TreatmentStatus) status?: TreatmentStatus;
}

export class CreateTreatmentDto {
    @ApiProperty() @IsString() treatmentPlanId: string;
    @ApiProperty() @IsString() name: string;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() tooth?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() cost?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateTreatmentDto extends PartialType(CreateTreatmentDto) {
    @ApiPropertyOptional({ enum: TreatmentStatus }) @IsOptional() @IsEnum(TreatmentStatus) status?: TreatmentStatus;
}
