/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Document,
  DocumentDocument,
  DocumentStatus,
} from '../schemas/document.schema';
import { MinioService } from '../storage/minio.service';
import { LlmService } from '../llm/llm.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
    private minioService: MinioService,
    private llmService: LlmService,
  ) {}

  async uploadDocument(
    file: Express.Multer.File,
    uploadDto: UploadDocumentDto,
    userId: string,
  ) {
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Seuls les fichiers PDF sont acceptés');
    }

    try {
      this.logger.log('=== DÉBUT EXTRACTION LLM ===');
      this.logger.log(`Fichier: ${file.originalname} (${file.size} bytes)`);

      const pdfText = await this.llmService.extractTextFromPdf(file.buffer);
      this.logger.log(`Texte extrait: ${pdfText.substring(0, 200)}...`);

      const extractedData = await this.llmService.extractDocumentInfo(
        pdfText,
        uploadDto.department,
        uploadDto.documentType,
      );
      this.logger.log(
        'Données extraites:',
        JSON.stringify(extractedData, null, 2),
      );

      this.logger.log('[LLM] Détection de signature...');
      const signatureDetected = await this.llmService.detectSignature(
        file.buffer,
      );
      this.logger.log(`[LLM] Signature détectée: ${signatureDetected}`);

      this.logger.log('[Path] Génération du chemin logique...');
      const logicalPath =
        uploadDto.logicalPath ||
        (await this.generateLogicalPath(extractedData, uploadDto));
      this.logger.log(`[Path] Chemin logique généré: ${logicalPath}`);

      this.logger.log('[File] Génération du nom de fichier unique...');
      const uniqueFileName = await this.generateUniqueFileName(
        logicalPath,
        file.originalname,
      );
      this.logger.log(`[File] Nom de fichier unique: ${uniqueFileName}`);

      this.logger.log('[MinIO] Upload du fichier PDF...');
      const minioPath = await this.minioService.uploadFileWithName(
        file,
        uniqueFileName,
      );
      this.logger.log(`[MinIO] Fichier uploadé: ${minioPath}`);

      this.logger.log('[Metadata] Génération des métadonnées...');
      const metadata = this.generateMetadata(
        extractedData,
        signatureDetected,
        userId,
      );
      this.logger.log(
        `[Metadata] Métadonnées générées: ${JSON.stringify(metadata, null, 2)}`,
      );
      await this.saveMetadataJson(logicalPath, metadata);
      this.logger.log('[Metadata] metadata.json sauvegardé dans MinIO');

      const documentStatus = this.determineDocumentStatus(
        extractedData,
        signatureDetected,
      );
      this.logger.log(`[Status] Statut du document: ${documentStatus}`);

      const document = new this.documentModel({
        fileName: uniqueFileName.split('/').pop() || file.originalname,
        logicalPath,
        metadataPath: logicalPath,
        firstName: extractedData.firstName,
        lastName: extractedData.lastName,
        cin: extractedData.cin,
        department: extractedData.department || uploadDto.department,
        documentType: extractedData.documentType || uploadDto.documentType,
        documentStatus,
        signatureDetected,
        humanVerificationRequired:
          !extractedData.cin ||
          !extractedData.firstName ||
          !extractedData.lastName,
        scanDate: new Date(),
        archivingManager: userId,
        minioPath,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: new Types.ObjectId(userId),
        metadata,
      });

      await document.save();
      this.logger.log(`Document créé avec succès: ${document._id.toString()}`);
      return document;
    } catch (error) {
      this.logger.error("Erreur lors de l'upload du document", error);
      throw error;
    }
  }

  private generateLogicalPath(
    extractedData: any,
    uploadDto: UploadDocumentDto,
  ): string {
    const department = extractedData.department || uploadDto.department;
    const documentType = extractedData.documentType || uploadDto.documentType;
    const cleanDepartment = department
      .trim()
      .replace(/\s+/g, '_')
      .toLowerCase();
    const cleanDocumentType = documentType
      .trim()
      .replace(/\s+/g, '_')
      .toLowerCase();

    let folderPath = '';
    if (
      extractedData.cin &&
      extractedData.firstName &&
      extractedData.lastName
    ) {
      const firstName = extractedData.firstName
        .trim()
        .replace(/\s+/g, '_')
        .toLowerCase();
      const lastName = extractedData.lastName
        .trim()
        .replace(/\s+/g, '_')
        .toLowerCase();
      const cin = extractedData.cin.trim().toUpperCase();
      const folderName = `${firstName}_${lastName}_${cin}`;
      folderPath = `${folderName}/${cleanDepartment}/${cleanDocumentType}`;
    } else if (extractedData.firstName && extractedData.lastName) {
      const firstName = extractedData.firstName
        .trim()
        .replace(/\s+/g, '_')
        .toLowerCase();
      const lastName = extractedData.lastName
        .trim()
        .replace(/\s+/g, '_')
        .toLowerCase();
      const folderName = `${firstName}_${lastName}`;
      folderPath = `${cleanDepartment}/${cleanDocumentType}_${folderName}`;
    } else {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      folderPath = `${cleanDepartment}/${cleanDocumentType}/${year}/${month}`;
    }

    return folderPath;
  }

  private async generateUniqueFileName(
    logicalPath: string,
    originalFileName: string,
  ): Promise<string> {
    const baseFileName = originalFileName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    const fileNameWithoutExt = baseFileName.replace(/\.pdf$/i, '');
    const extension = '.pdf';

    const existingDocs = await this.documentModel.find({
      logicalPath: logicalPath,
    });

    const existingFileNames = existingDocs.map((doc) =>
      doc.fileName.toLowerCase(),
    );

    const baseNameLower = fileNameWithoutExt.toLowerCase();
    if (!existingFileNames.some((name) => name.includes(baseNameLower))) {
      return `${logicalPath}/${fileNameWithoutExt}${extension}`;
    }

    let maxNumber = 0;
    const numberPattern = new RegExp(`${fileNameWithoutExt}(\\d+)\\.pdf$`, 'i');

    for (const fileName of existingFileNames) {
      const match = fileName.match(numberPattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    return `${logicalPath}/${fileNameWithoutExt}${maxNumber + 1}${extension}`;
  }
  private generateMetadata(
    extractedData: any,
    signatureDetected: boolean,
    userId: string,
  ): Record<string, any> {
    return {
      department_description:
        extractedData.departmentDescription || extractedData.department || '',
      document_description:
        extractedData.documentDescription || extractedData.documentType || '',
      document_type: extractedData.documentType || '',
      document_status: this.determineDocumentStatus(
        extractedData,
        signatureDetected,
      ),
      signature_detected: signatureDetected,
      human_verification_required:
        !extractedData.cin ||
        !extractedData.firstName ||
        !extractedData.lastName,
      scan_date: new Date().toISOString(),
      archiving_manager: userId,
      extracted_data: {
        firstName: extractedData.firstName || null,
        lastName: extractedData.lastName || null,
        cin: extractedData.cin || null,
      },
    };
  }
  private async saveMetadataJson(
    logicalPath: string,
    metadata: Record<string, any>,
  ): Promise<void> {
    try {
      const metadataJson = JSON.stringify(metadata, null, 2);
      const metadataBuffer = Buffer.from(metadataJson, 'utf-8');
      const metadataFileName = `${logicalPath}/metadata.json`;

      await this.minioService.uploadBuffer(
        metadataBuffer,
        metadataFileName,
        'application/json',
      );

      this.logger.log(`Metadata.json sauvegardé: ${metadataFileName}`);
    } catch (error) {
      this.logger.error('Erreur lors de la sauvegarde de metadata.json', error);
    }
  }

  private determineDocumentStatus(
    extractedData: any,
    signatureDetected: boolean,
  ): DocumentStatus {
    if (
      extractedData.firstName &&
      extractedData.lastName &&
      extractedData.department &&
      extractedData.documentType &&
      signatureDetected
    ) {
      return DocumentStatus.VALID;
    }

    if (
      !extractedData.firstName ||
      !extractedData.lastName ||
      !extractedData.department ||
      !extractedData.documentType
    ) {
      return DocumentStatus.INCOMPLETE;
    }

    return DocumentStatus.PENDING;
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
}
