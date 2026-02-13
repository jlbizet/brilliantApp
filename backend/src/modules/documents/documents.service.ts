import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto';

@Injectable()
export class DocumentsService {
    constructor(private prisma: PrismaService) { }

    async findByPatient(patientId: string) {
        return this.prisma.document.findMany({
            where: { patientId },
            orderBy: { uploadedAt: 'desc' },
        });
    }

    async upload(patientId: string, file: Express.Multer.File, type: string, description?: string) {
        return this.prisma.document.create({
            data: {
                patientId,
                name: file.originalname,
                type: type as any,
                filePath: file.path,
                fileSize: file.size,
                mimeType: file.mimetype,
                description,
            },
        });
    }

    async findOne(id: string) {
        const doc = await this.prisma.document.findUnique({ where: { id } });
        if (!doc) throw new NotFoundException('Document not found');
        return doc;
    }

    async remove(id: string) {
        await this.findOne(id);
        await this.prisma.document.delete({ where: { id } });
        return { message: 'Document deleted' };
    }
}
