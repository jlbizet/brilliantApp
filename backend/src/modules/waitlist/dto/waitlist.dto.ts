import { IsString, IsOptional, IsInt, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWaitlistEntryDto {
    @ApiProperty()
    @IsUUID()
    patientId: string;

    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    dentistId?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    preferredDays?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    preferredTime?: string;

    @ApiProperty({ required: false })
    @IsInt()
    @IsOptional()
    priority?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateWaitlistEntryDto {
    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    dentistId?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    preferredDays?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    preferredTime?: string;

    @ApiProperty({ required: false })
    @IsInt()
    @IsOptional()
    priority?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    status?: string;
}
