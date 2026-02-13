import { IsString, IsDateString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
    @ApiProperty() @IsString() patientId: string;
    @ApiProperty() @IsString() dentistId: string;
    @ApiProperty() @IsString() title: string;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
    @ApiProperty() @IsDateString() startTime: string;
    @ApiProperty() @IsDateString() endTime: string;
    @ApiPropertyOptional({ default: 'general' }) @IsOptional() @IsString() type?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() isRecurring?: boolean;
    @ApiPropertyOptional() @IsOptional() @IsString() recurringPattern?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() recurringEndDate?: string;
}

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
    @ApiPropertyOptional({ enum: AppointmentStatus }) @IsOptional() @IsEnum(AppointmentStatus) status?: AppointmentStatus;
}

export class AppointmentQueryDto {
    @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() dentistId?: string;
    @ApiPropertyOptional({ enum: AppointmentStatus }) @IsOptional() @IsEnum(AppointmentStatus) status?: AppointmentStatus;
}
