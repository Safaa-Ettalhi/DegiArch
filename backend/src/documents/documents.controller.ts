import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateMetadataDto } from './dto/update-metadata.dto';
import { UserRole } from '../schemas/user.schema';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadDocumentDto,
    @Request() req: { user: { sub: string } },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.documentsService.uploadDocument(file, uploadDto, req.user.sub);
  }

  @Get()
  async findAll(
    @Request() req: { user: { sub: string; role: UserRole | string } },
  ) {
    const userId =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      req.user.role === UserRole.ADMIN || req.user.role === 'ADMIN'
        ? undefined
        : req.user.sub;
    return this.documentsService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/url')
  async getFileUrl(@Param('id') id: string) {
    return { url: await this.documentsService.getFileUrl(id) };
  }

  @Patch(':id')
  async updateMetadata(
    @Param('id') id: string,
    @Body() updateDto: UpdateMetadataDto,
    @Request() req: { user: { sub: string; role: UserRole | string } },
  ) {
    return this.documentsService.updateMetadata(
      id,
      updateDto,
      req.user.sub,
      req.user.role,
    );
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    return this.documentsService.getDocumentHistory(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }
}
