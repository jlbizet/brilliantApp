import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
    @ApiProperty() @IsEmail() email: string;
    @ApiProperty() @IsString() password: string;
    @ApiProperty() @IsString() firstName: string;
    @ApiProperty() @IsString() lastName: string;
    @ApiPropertyOptional({ enum: UserRole }) @IsOptional() @IsEnum(UserRole) role?: UserRole;
    @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() specialization?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() licenseNumber?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
