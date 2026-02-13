import { IsString, IsEmail, IsOptional, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class CreatePatientDto {
    @ApiProperty() @IsString() firstName: string;
    @ApiProperty() @IsString() lastName: string;
    @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
    @ApiProperty() @IsString() phone: string;
    @ApiProperty() @IsDateString() dateOfBirth: string;
    @ApiPropertyOptional({ enum: Gender }) @IsOptional() @IsEnum(Gender) gender?: Gender;
    @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() zipCode?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() emergencyContact?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() emergencyPhone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() insuranceProvider?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() insurancePolicyNumber?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() insuranceGroupNumber?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
    @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateMedicalHistoryDto {
    @ApiProperty() @IsString() condition: string;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() diagnosedAt?: string;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() isOngoing?: boolean;
}

export class CreateAllergyDto {
    @ApiProperty() @IsString() allergen: string;
    @ApiProperty() @IsString() severity: string;
    @ApiPropertyOptional() @IsOptional() @IsString() reaction?: string;
}
