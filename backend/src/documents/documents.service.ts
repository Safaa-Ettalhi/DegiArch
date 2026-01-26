/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ForbiddenException,
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
import { AuditService } from './audit.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateMetadataDto } from './dto/update-metadata.dto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
    private minioService: MinioService,
    private llmService: LlmService,
    private auditService: AuditService,
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

      await this.auditService.logDocumentCreation(
        document._id.toString(),
        userId,
        `Document créé: ${document.fileName}`,
      );

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

  async getStatistics() {
    const total = await this.documentModel.countDocuments();
    const byDepartment = await this.documentModel.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const byStatus = await this.documentModel.aggregate([
      { $group: { _id: '$documentStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const byType = await this.documentModel.aggregate([
      { $group: { _id: '$documentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const verificationRequired = await this.documentModel.countDocuments({
      humanVerificationRequired: true,
    });

    const withSignature = await this.documentModel.countDocuments({
      signatureDetected: true,
    });

    const last7Months: Array<{ month: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = await this.documentModel.countDocuments({
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      });

      last7Months.push({
        month: date.toLocaleDateString('fr-FR', {
          month: 'short',
          year: 'numeric',
        }),
        count,
      });
    }

    return {
      total,
      byDepartment: byDepartment.map((item) => ({
        department: item._id,
        count: item.count,
      })),
      byStatus: byStatus.map((item) => ({
        status: item._id,
        count: item.count,
      })),
      byType: byType.map((item) => ({
        type: item._id,
        count: item.count,
      })),
      verificationRequired,
      withSignature,
      last7Months,
    };
  }

  async getFileUrl(id: string) {
    const document = await this.findOne(id);
    return await this.minioService.getFileUrl(document.minioPath);
  }

  async delete(id: string, userId: string) {
    const document = await this.findOne(id);

    await this.minioService.deleteFile(document.minioPath);
    await this.documentModel.findByIdAndDelete(id);

    await this.auditService.logDocumentDeletion(
      id,
      userId,
      `Document supprimé: ${document.fileName}`,
    );

    return { message: 'Document deleted successfully' };
  }

  async updateMetadata(
    id: string,
    updateDto: UpdateMetadataDto,
    userId: string,
    userRole: string,
  ) {
    const document = await this.findOne(id);
    let uploadedById: string | undefined;

    if (document.uploadedBy) {
      const userObj = document.uploadedBy as any;
      if (userObj._id) {
        uploadedById = String(userObj._id);
      } else {
        uploadedById = userObj.toString ? userObj.toString() : String(userObj);
      }
    }

    const normalizedUserId = userId ? String(userId).trim() : undefined;
    const normalizedUploadedById = uploadedById
      ? String(uploadedById).trim()
      : undefined;

    this.logger.log(
      `[Update] Vérification permissions - userId: ${normalizedUserId}, uploadedById: ${normalizedUploadedById}, userRole: ${userRole}`,
    );
    this.logger.log(
      `[Update] document.uploadedBy type: ${typeof document.uploadedBy}, value: ${JSON.stringify(document.uploadedBy)}`,
    );

    if (userRole !== 'ADMIN' && normalizedUploadedById !== normalizedUserId) {
      this.logger.warn(
        `[Update] Permission refusée - userId: ${normalizedUserId} !== uploadedById: ${normalizedUploadedById}`,
      );
      throw new ForbiddenException(
        "Vous n'avez pas la permission de modifier ce document",
      );
    }

    const oldValue = {
      firstName: document.firstName,
      lastName: document.lastName,
      cin: document.cin,
      department: document.department,
      documentType: document.documentType,
      documentStatus: document.documentStatus,
    };

    const updates: Partial<Document> = {};
    if (updateDto.firstName !== undefined)
      updates.firstName = updateDto.firstName || undefined;
    if (updateDto.lastName !== undefined)
      updates.lastName = updateDto.lastName || undefined;
    if (updateDto.cin !== undefined) updates.cin = updateDto.cin || undefined;
    if (updateDto.department !== undefined)
      updates.department = updateDto.department;
    if (updateDto.documentType !== undefined)
      updates.documentType = updateDto.documentType;
    if (updateDto.documentStatus !== undefined)
      updates.documentStatus = updateDto.documentStatus;

    if (
      updateDto.firstName !== undefined ||
      updateDto.lastName !== undefined ||
      updateDto.cin !== undefined ||
      updateDto.department !== undefined ||
      updateDto.documentType !== undefined
    ) {
      const newFirstName = updateDto.firstName ?? document.firstName;
      const newLastName = updateDto.lastName ?? document.lastName;
      const newCin = updateDto.cin ?? document.cin;
      const newDepartment = updateDto.department ?? document.department;
      const newDocumentType = updateDto.documentType ?? document.documentType;

      const newLogicalPath = await this.generateLogicalPath(
        {
          firstName: newFirstName,
          lastName: newLastName,
          cin: newCin,
          department: newDepartment,
          documentType: newDocumentType,
        },
        {
          department: newDepartment,
          documentType: newDocumentType,
        },
      );

      updates.logicalPath = newLogicalPath;
      updates.metadataPath = newLogicalPath;

      if (newLogicalPath !== document.logicalPath) {
        this.logger.log(
          `[Update] Chemin logique changé: ${document.logicalPath} -> ${newLogicalPath}`,
        );
      }
    }

    const finalFirstName = updates.firstName ?? document.firstName;
    const finalLastName = updates.lastName ?? document.lastName;
    const finalCin = updates.cin ?? document.cin;
    updates.humanVerificationRequired =
      !finalCin || !finalFirstName || !finalLastName;

    if (updates.logicalPath) {
      const updatedMetadata = {
        ...document.metadata,
        department_description: updates.department || document.department,
        document_description: updates.documentType || document.documentType,
        document_type: updates.documentType || document.documentType,
        document_status: updates.documentStatus || document.documentStatus,
        human_verification_required: updates.humanVerificationRequired,
        extracted_data: {
          firstName: finalFirstName || null,
          lastName: finalLastName || null,
          cin: finalCin || null,
        },
        last_modified: new Date().toISOString(),
        modified_by: userId,
      };

      await this.saveMetadataJson(updates.logicalPath, updatedMetadata);
      updates.metadata = updatedMetadata;
    }

    const updatedDocument = await this.documentModel
      .findByIdAndUpdate(id, { $set: updates }, { new: true })
      .populate('uploadedBy', 'firstName lastName email');

    if (!updatedDocument) {
      throw new NotFoundException('Document not found after update');
    }

    await this.auditService.logDocumentUpdate(
      id,
      userId,
      oldValue,
      {
        firstName: updatedDocument.firstName,
        lastName: updatedDocument.lastName,
        cin: updatedDocument.cin,
        department: updatedDocument.department,
        documentType: updatedDocument.documentType,
        documentStatus: updatedDocument.documentStatus,
      },
      `Métadonnées mises à jour par ${userRole === 'ADMIN' ? 'Admin' : 'Archive Manager'}`,
    );

    this.logger.log(
      `[Update] Métadonnées mises à jour pour le document: ${id}`,
    );
    return updatedDocument;
  }

  async getDocumentHistory(id: string) {
    const document = await this.findOne(id);
    return this.auditService.getDocumentHistory(id);
  }
}
