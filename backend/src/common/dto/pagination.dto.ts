import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
    @ApiPropertyOptional({ default: 1, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @ApiPropertyOptional()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional()
    @IsOptional()
    sortBy?: string;

    @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
    @IsOptional()
    sortOrder?: 'asc' | 'desc' = 'desc';

    get skip(): number {
        return ((this.page ?? 1) - 1) * (this.limit ?? 20);
    }
}

export class PaginatedResponseDto<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };

    constructor(data: T[], total: number, page: number, limit: number) {
        this.data = data;
        this.meta = {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}

export class ApiResponseDto<T> {
    success: boolean;
    data?: T;
    message?: string;

    static success<T>(data: T, message?: string): ApiResponseDto<T> {
        const response = new ApiResponseDto<T>();
        response.success = true;
        response.data = data;
        response.message = message;
        return response;
    }

    static error(message: string): ApiResponseDto<null> {
        const response = new ApiResponseDto<null>();
        response.success = false;
        response.message = message;
        return response;
    }
}
