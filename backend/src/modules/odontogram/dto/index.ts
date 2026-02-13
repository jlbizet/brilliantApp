import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { NumberingSystem, ConditionType, Surface } from '@prisma/client';

export class CreateOdontogramDto {
    @IsNotEmpty()
    @IsString()
    patientId: string;

    @IsOptional()
    @IsEnum(NumberingSystem)
    numberingSystem?: NumberingSystem;

    @IsOptional()
    @IsBoolean()
    isDeciduous?: boolean;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateOdontogramDto {
    @IsOptional()
    @IsEnum(NumberingSystem)
    numberingSystem?: NumberingSystem;

    @IsOptional()
    @IsBoolean()
    isDeciduous?: boolean;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class CreateToothConditionDto {
    @IsNotEmpty()
    @IsString()
    tooth: string;

    @IsNotEmpty()
    @IsEnum(ConditionType)
    type: ConditionType;

    @IsOptional()
    @IsArray()
    @IsEnum(Surface, { each: true })
    surfaces?: Surface[];

    @IsOptional()
    @IsString()
    severity?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    performedAt?: Date;
}

export class UpdateToothConditionDto {
    @IsOptional()
    @IsEnum(ConditionType)
    type?: ConditionType;

    @IsOptional()
    @IsArray()
    @IsEnum(Surface, { each: true })
    surfaces?: Surface[];

    @IsOptional()
    @IsString()
    severity?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    performedAt?: Date;
}
