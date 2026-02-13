import { Controller, Get, Post, Delete, Param, Query, UseGuards, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DocumentsService } from './documents.service';

const storage = diskStorage({
    destination: './uploads',
    filename: (_req, file, cb) => {
        const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

@ApiTags('Documents')
@Controller('documents')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    @Get('patient/:patientId')
    @ApiOperation({ summary: 'Get documents for a patient' })
    findByPatient(@Param('patientId') patientId: string) {
        return this.documentsService.findByPatient(patientId);
    }

    @Post('upload')
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload a document' })
    @UseInterceptors(FileInterceptor('file', { storage }))
    upload(
        @UploadedFile() file: Express.Multer.File,
        @Body('patientId') patientId: string,
        @Body('type') type: string,
        @Body('description') description?: string,
    ) {
        return this.documentsService.upload(patientId, file, type, description);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get document metadata' })
    findOne(@Param('id') id: string) {
        return this.documentsService.findOne(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a document' })
    remove(@Param('id') id: string) {
        return this.documentsService.remove(id);
    }
}
