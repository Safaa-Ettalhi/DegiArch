/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { DocumentsService } from './documents.service';
import { Document, DocumentStatus } from '../schemas/document.schema';
import { MinioService } from '../storage/minio.service';
import { LlmService } from '../llm/llm.service';
import { AuditService } from './audit.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateMetadataDto } from './dto/update-metadata.dto';

describe('DocumentsService', () => {
  let service: DocumentsService;

  const userId = '507f1f77bcf86cd799439011';
  const mockDocument = {
    _id: new Types.ObjectId(),
    fileName: 'test.pdf',
    logicalPath: 'test_user_AB123456/rh/demande_conge',
    metadataPath: 'test_user_AB123456/rh/demande_conge',
    firstName: 'Test',
    lastName: 'User',
    cin: 'AB123456',
    department: 'RH',
    documentType: 'demande_conge',
    documentStatus: DocumentStatus.PENDING,
    signatureDetected: true,
    humanVerificationRequired: false,
    scanDate: new Date(),
    archivingManager: userId,
    minioPath: 'test_user_AB123456/rh/demande_conge/test.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    metadata: {
      department_description: 'Ressources Humaines',
      document_description: 'Demande de congé',
      document_type: 'demande_conge',
      document_status: 'pending',
      signature_detected: true,
      human_verification_required: false,
      scan_date: new Date().toISOString(),
      archiving_manager: userId,
    },
    uploadedBy: new Types.ObjectId(userId),
    save: jest.fn().mockResolvedValue(this),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFile = {
    originalname: 'test.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('fake pdf content'),
    size: 1024,
  } as Express.Multer.File;

  const mockMinioService = {
    uploadFileWithName: jest.fn(),
    uploadBuffer: jest.fn(),
    getFileUrl: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockLlmService = {
    extractTextFromPdf: jest.fn(),
    extractDocumentInfo: jest.fn(),
    detectSignature: jest.fn(),
  };

  const mockAuditService = {
    logDocumentCreation: jest.fn(),
    logDocumentUpdate: jest.fn(),
    logDocumentDeletion: jest.fn(),
    getDocumentHistory: jest.fn(),
  };

  // Mock constructor for documentModel
  const MockDocumentModel = jest.fn().mockImplementation((data: any) => {
    const doc = {
      ...mockDocument,
      ...data,
      save: jest.fn().mockResolvedValue({ ...mockDocument, ...data }),
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return doc;
  }) as jest.Mock & {
    find: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    countDocuments: jest.Mock;
    aggregate: jest.Mock;
  };

  // Add static methods to the constructor
  MockDocumentModel.find = jest.fn();
  MockDocumentModel.findById = jest.fn();
  MockDocumentModel.findByIdAndUpdate = jest.fn();
  MockDocumentModel.findByIdAndDelete = jest.fn();
  MockDocumentModel.countDocuments = jest.fn();
  MockDocumentModel.aggregate = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getModelToken(Document.name),
          useValue: MockDocumentModel,
        },
        {
          provide: MinioService,
          useValue: mockMinioService,
        },
        {
          provide: LlmService,
          useValue: mockLlmService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadDocument', () => {
    const uploadDto: UploadDocumentDto = {
      department: 'RH',
      documentType: 'demande_conge',
    };

    const extractedData = {
      firstName: 'Test',
      lastName: 'User',
      cin: 'AB123456',
      department: 'RH',
      documentType: 'demande_conge',
      departmentDescription: 'Ressources Humaines',
      documentDescription: 'Demande de congé',
    };

    it('should throw BadRequestException if file is not PDF', async () => {
      const nonPdfFile = {
        ...mockFile,
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      await expect(
        service.uploadDocument(nonPdfFile, uploadDto, 'user123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully upload a document with CIN', async () => {
      mockLlmService.extractTextFromPdf.mockResolvedValue('PDF text content');
      mockLlmService.extractDocumentInfo.mockResolvedValue(extractedData);
      mockLlmService.detectSignature.mockResolvedValue(true);
      mockMinioService.uploadFileWithName.mockResolvedValue(
        'test_user_AB123456/rh/demande_conge/test.pdf',
      );
      mockMinioService.uploadBuffer.mockResolvedValue(undefined);
      MockDocumentModel.find.mockResolvedValue([]);

      await service.uploadDocument(mockFile, uploadDto, userId);

      expect(mockLlmService.extractTextFromPdf).toHaveBeenCalledWith(
        mockFile.buffer,
      );
      expect(mockLlmService.extractDocumentInfo).toHaveBeenCalled();
      expect(mockLlmService.detectSignature).toHaveBeenCalledWith(
        mockFile.buffer,
      );
      expect(mockMinioService.uploadFileWithName).toHaveBeenCalled();
      expect(mockMinioService.uploadBuffer).toHaveBeenCalled();
      expect(mockAuditService.logDocumentCreation).toHaveBeenCalled();
    });

    it('should handle document without CIN', async () => {
      const extractedDataNoCin = {
        ...extractedData,
        cin: undefined,
      };

      mockLlmService.extractTextFromPdf.mockResolvedValue('PDF text content');
      mockLlmService.extractDocumentInfo.mockResolvedValue(extractedDataNoCin);
      mockLlmService.detectSignature.mockResolvedValue(false);
      mockMinioService.uploadFileWithName.mockResolvedValue(
        'rh/demande_conge_test_user/test.pdf',
      );
      mockMinioService.uploadBuffer.mockResolvedValue(undefined);
      MockDocumentModel.find.mockResolvedValue([]);

      const result = await service.uploadDocument(mockFile, uploadDto, userId);

      expect(result.humanVerificationRequired).toBe(true);
    });

    it('should generate unique filename when file exists', async () => {
      const existingDoc = {
        ...mockDocument,
        fileName: 'test.pdf',
      };

      mockLlmService.extractTextFromPdf.mockResolvedValue('PDF text content');
      mockLlmService.extractDocumentInfo.mockResolvedValue(extractedData);
      mockLlmService.detectSignature.mockResolvedValue(true);
      MockDocumentModel.find.mockResolvedValue([existingDoc]);
      mockMinioService.uploadFileWithName.mockResolvedValue(
        'test_user_AB123456/rh/demande_conge/test1.pdf',
      );
      mockMinioService.uploadBuffer.mockResolvedValue(undefined);

      await service.uploadDocument(mockFile, uploadDto, userId);

      expect(mockMinioService.uploadFileWithName).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('test1.pdf'),
      );
    });
  });

  describe('findAll', () => {
    it('should return all documents for admin', async () => {
      const documents = [mockDocument];
      MockDocumentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(documents),
        }),
      });

      const result = await service.findAll();

      expect(MockDocumentModel.find).toHaveBeenCalled();
      expect(result).toEqual(documents);
    });

    it('should return only user documents for archive manager', async () => {
      const documents = [mockDocument];
      MockDocumentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(documents),
        }),
      });

      const result = await service.findAll(userId);

      expect(MockDocumentModel.find).toHaveBeenCalledWith({
        uploadedBy: expect.any(Types.ObjectId),
      });
      expect(result).toEqual(documents);
    });
  });

  describe('findOne', () => {
    it('should return a document by id', async () => {
      MockDocumentModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDocument),
      });

      const result = await service.findOne(mockDocument._id.toString());

      expect(MockDocumentModel.findById).toHaveBeenCalledWith(
        mockDocument._id.toString(),
      );
      expect(result).toEqual(mockDocument);
    });

    it('should throw NotFoundException if document not found', async () => {
      MockDocumentModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findOne(new Types.ObjectId().toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMetadata', () => {
    const updateDto: UpdateMetadataDto = {
      documentStatus: DocumentStatus.VALID,
    };

    it('should update document metadata for admin', async () => {
      const updatedDoc = {
        ...mockDocument,
        documentStatus: DocumentStatus.VALID,
      };

      MockDocumentModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDocument),
      });
      MockDocumentModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedDoc),
      });
      mockMinioService.uploadBuffer.mockResolvedValue(undefined);

      const result = await service.updateMetadata(
        mockDocument._id.toString(),
        updateDto,
        'admin123',
        'ADMIN',
      );

      expect(MockDocumentModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(mockAuditService.logDocumentUpdate).toHaveBeenCalled();
      expect(result.documentStatus).toBe(DocumentStatus.VALID);
    });

    it('should allow archive manager to update own documents', async () => {
      const updatedDoc = {
        ...mockDocument,
        documentStatus: DocumentStatus.VALID,
      };

      // Mock document with correct uploadedBy ObjectId
      const docWithCorrectUser = {
        ...mockDocument,
        uploadedBy: new Types.ObjectId('507f1f77bcf86cd799439011'),
      };

      MockDocumentModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(docWithCorrectUser),
      });
      MockDocumentModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedDoc),
      });
      mockMinioService.uploadBuffer.mockResolvedValue(undefined);

      await service.updateMetadata(
        mockDocument._id.toString(),
        updateDto,
        userId,
        'ARCHIVE_MANAGER',
      );

      expect(mockAuditService.logDocumentUpdate).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if archive manager tries to update other user document', async () => {
      MockDocumentModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDocument),
      });

      await expect(
        service.updateMetadata(
          mockDocument._id.toString(),
          updateDto,
          'otheruser',
          'ARCHIVE_MANAGER',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update logical path when name or CIN changes', async () => {
      const updateDtoWithName: UpdateMetadataDto = {
        firstName: 'New',
        lastName: 'Name',
        cin: 'CD789012',
      };

      const updatedDoc = {
        ...mockDocument,
        firstName: 'New',
        lastName: 'Name',
        cin: 'CD789012',
        logicalPath: 'new_name_CD789012/rh/demande_conge',
      };

      MockDocumentModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDocument),
      });
      MockDocumentModel.find.mockResolvedValue([]);
      MockDocumentModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedDoc),
      });
      mockMinioService.uploadBuffer.mockResolvedValue(undefined);

      // Mock document with correct uploadedBy ObjectId
      const docWithCorrectUser = {
        ...mockDocument,
        uploadedBy: new Types.ObjectId('507f1f77bcf86cd799439011'),
      };

      MockDocumentModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(docWithCorrectUser),
      });

      const result = await service.updateMetadata(
        mockDocument._id.toString(),
        updateDtoWithName,
        userId,
        'ARCHIVE_MANAGER',
      );

      expect(result.logicalPath).toContain('new_name_CD789012');
      expect(mockMinioService.uploadBuffer).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a document', async () => {
      MockDocumentModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDocument),
      });
      mockMinioService.deleteFile.mockResolvedValue(undefined);
      MockDocumentModel.findByIdAndDelete.mockResolvedValue(mockDocument);

      await service.delete(mockDocument._id.toString(), userId);

      expect(mockMinioService.deleteFile).toHaveBeenCalledWith(
        mockDocument.minioPath,
      );
      expect(MockDocumentModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockDocument._id.toString(),
      );
      expect(mockAuditService.logDocumentDeletion).toHaveBeenCalled();
    });
  });

  describe('getStatistics', () => {
    it('should return document statistics', async () => {
      const mockStats = {
        total: 100,
        byDepartment: [{ _id: 'RH', count: 50 }],
        byStatus: [{ _id: 'valid', count: 80 }],
        byType: [{ _id: 'demande_conge', count: 30 }],
      };

      MockDocumentModel.countDocuments.mockResolvedValue(100);
      MockDocumentModel.aggregate
        .mockResolvedValueOnce(mockStats.byDepartment)
        .mockResolvedValueOnce(mockStats.byStatus)
        .mockResolvedValueOnce(mockStats.byType)
        .mockResolvedValueOnce([]);
      MockDocumentModel.countDocuments
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(90)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getStatistics();

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('byDepartment');
      expect(result).toHaveProperty('byStatus');
      expect(result).toHaveProperty('byType');
      expect(result).toHaveProperty('verificationRequired');
      expect(result).toHaveProperty('withSignature');
      expect(result).toHaveProperty('last7Months');
    });
  });

  describe('getFileUrl', () => {
    it('should return signed URL for document', async () => {
      const signedUrl = 'http://minio:9000/archives/test.pdf?signature=...';
      MockDocumentModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDocument),
      });
      mockMinioService.getFileUrl.mockResolvedValue(signedUrl);

      const result = await service.getFileUrl(mockDocument._id.toString());

      expect(mockMinioService.getFileUrl).toHaveBeenCalledWith(
        mockDocument.minioPath,
      );
      expect(result).toBe(signedUrl);
    });
  });

  describe('getDocumentHistory', () => {
    it('should return document history', async () => {
      const mockHistory = [
        {
          _id: new Types.ObjectId(),
          action: 'CREATE_DOCUMENT',
          createdAt: new Date(),
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      MockDocumentModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDocument),
      });
      mockAuditService.getDocumentHistory.mockResolvedValue(mockHistory);

      const result = await service.getDocumentHistory(
        mockDocument._id.toString(),
      );

      expect(mockAuditService.getDocumentHistory).toHaveBeenCalledWith(
        mockDocument._id.toString(),
      );
      expect(result).toEqual(mockHistory);
    });
  });
});
