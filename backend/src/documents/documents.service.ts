/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Document,
  DocumentDocument,
  DocumentStatus,
} from '../schemas/document.schema';
import { MinioService } from '../storage/minio.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
    private minioService: MinioService,
  ) {}

  async uploadDocument(
    file: Express.Multer.File,
    uploadDto: UploadDocumentDto,
    userId: string,
  ) {
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Seuls les fichiers PDF sont acceptés');
    }

    const logicalPath =
      uploadDto.logicalPath || this.generateLogicalPath(uploadDto);
    const minioPath = await this.minioService.uploadFile(file, logicalPath);

    const document = new this.documentModel({
      fileName: file.originalname,
      logicalPath,
      metadataPath: logicalPath,
      department: uploadDto.department,
      documentType: uploadDto.documentType,
      documentStatus: DocumentStatus.PENDING,
      minioPath,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: new Types.ObjectId(userId),
      metadata: {},
    });

    await document.save();
    return document;
  }

  async findAll(userId?: string) {
    if (userId) {
      return this.documentModel
        .find({ uploadedBy: new Types.ObjectId(userId) as any })
        .populate('uploadedBy', 'firstName lastName email')
        .sort({ createdAt: -1 });
    }
    return this.documentModel
      .find()
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const document = await this.documentModel
      .findById(id)
      .populate('uploadedBy', 'firstName lastName email');
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  async getFileUrl(id: string) {
    const document = await this.findOne(id);
    return await this.minioService.getFileUrl(document.minioPath);
  }

  async delete(id: string) {
    const document = await this.findOne(id);
    await this.minioService.deleteFile(document.minioPath);
    await this.documentModel.findByIdAndDelete(id);
    return { message: 'Document deleted successfully' };
  }

  private generateLogicalPath(uploadDto: UploadDocumentDto): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const cleanDepartment = uploadDto.department.trim().replace(/\s+/g, '_');
    const cleanDocumentType = uploadDto.documentType
      .trim()
      .replace(/\s+/g, '_');
    return `${cleanDepartment}/${cleanDocumentType}/${year}/${month}`;
  }
}
