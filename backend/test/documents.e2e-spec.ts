/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../src/schemas/user.schema';
import { Document } from '../src/schemas/document.schema';
import { MinioService } from '../src/storage/minio.service';
import { LlmService } from '../src/llm/llm.service';
import * as bcrypt from 'bcrypt';

const mockMinioService = {
  onModuleInit: jest.fn().mockResolvedValue(undefined),
  ensureBucketExists: jest.fn().mockResolvedValue(undefined),
  uploadFile: jest.fn(),
  uploadFileWithName: jest.fn().mockResolvedValue('test/path/document.pdf'),
  uploadBuffer: jest.fn().mockResolvedValue(undefined),
  getFileUrl: jest.fn().mockResolvedValue('http://localhost:9000/test.pdf'),
  deleteFile: jest.fn().mockResolvedValue(undefined),
};

const mockLlmService = {
  extractTextFromPdf: jest.fn().mockResolvedValue('Sample PDF text content'),
  extractDocumentInfo: jest.fn().mockResolvedValue({
    firstName: 'Test',
    lastName: 'User',
    cin: 'AB123456',
    department: 'RH',
    documentType: 'demande_conge',
  }),
  detectSignature: jest.fn().mockResolvedValue(true),
};

describe('Documents (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<User>;
  let documentModel: Model<Document>;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MinioService)
      .useValue(mockMinioService)
      .overrideProvider(LlmService)
      .useValue(mockLlmService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    documentModel = moduleFixture.get<Model<Document>>(
      getModelToken(Document.name),
    );
    const hashedPassword = await bcrypt.hash('password123', 10);
    const testUser = await userModel.create({
      email: 'test@example.com',
      passwordHash: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'ARCHIVE_MANAGER',
      isActive: true,
    });
    userId = testUser._id.toString();
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = (loginResponse.body as { access_token: string }).access_token;
  });

  afterAll(async () => {
    if (userModel) {
      await userModel.deleteMany({ email: 'test@example.com' }).catch(() => {});
    }
    if (documentModel) {
      await documentModel.deleteMany({}).catch(() => {});
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /documents/upload', () => {
    it('should reject upload without authentication', () => {
      return request(app.getHttpServer()).post('/documents/upload').expect(401);
    });

    it('should reject non-PDF files', () => {
      return request(app.getHttpServer())
        .post('/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake image content'), 'test.jpg')
        .field('department', 'RH')
        .field('documentType', 'demande_conge')
        .expect(400);
    });

    it.skip('should reject upload without required fields', () => {
      return request(app.getHttpServer())
        .post('/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake pdf content'), 'test.pdf')
        .field('department', '')
        .field('documentType', '')
        .expect(400);
    });
  });

  describe('GET /documents', () => {
    it('should reject access without authentication', () => {
      return request(app.getHttpServer()).get('/documents').expect(401);
    });

    it('should return documents for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return only user documents for ARCHIVE_MANAGER', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const documents = response.body as { uploadedBy: { _id: string } }[];
      if (documents.length > 0) {
        documents.forEach((doc) => {
          if (doc.uploadedBy && doc.uploadedBy._id) {
            expect(doc.uploadedBy._id).toBe(userId);
          }
        });
      }
    });
  });

  describe('GET /documents/:id', () => {
    let documentId: string;

    beforeAll(async () => {
      const testDoc = await documentModel.create({
        fileName: 'test-document.pdf',
        logicalPath: 'test_user_AB123456/rh/demande_conge',
        metadataPath: 'test_user_AB123456/rh/demande_conge',
        department: 'RH',
        documentType: 'demande_conge',
        documentStatus: 'pending',
        minioPath: 'test_user_AB123456/rh/demande_conge/test-document.pdf',
        uploadedBy: userId as any,
      });
      documentId = testDoc._id.toString();
    });

    it('should reject access without authentication', () => {
      return request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .expect(401);
    });

    it('should return document by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect((response.body as { fileName: string }).fileName).toBe(
        'test-document.pdf',
      );
    });

    it('should return 404 for non-existent document', () => {
      const fakeId = '507f1f77bcf86cd799439011';
      return request(app.getHttpServer())
        .get(`/documents/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /documents/:id', () => {
    let documentId: string;

    beforeAll(async () => {
      const testDoc = await documentModel.create({
        fileName: 'test-update.pdf',
        logicalPath: 'test_user_AB123456/rh/demande_conge',
        metadataPath: 'test_user_AB123456/rh/demande_conge',
        department: 'RH',
        documentType: 'demande_conge',
        documentStatus: 'pending',
        minioPath: 'test_user_AB123456/rh/demande_conge/test-update.pdf',
        uploadedBy: userId as any,
      });
      documentId = testDoc._id.toString();
    });

    it('should reject update without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/documents/${documentId}`)
        .send({ documentStatus: 'valid' })
        .expect(401);
    });

    it('should update document metadata', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ documentStatus: 'valid' })
        .expect(200);

      expect((response.body as { documentStatus: string }).documentStatus).toBe(
        'valid',
      );
    });

    it('should reject update of other user document', async () => {
      // Create another user's document
      const otherUser = await userModel.create({
        email: 'other@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        firstName: 'Other',
        lastName: 'User',
        role: 'ARCHIVE_MANAGER',
        isActive: true,
      });

      const otherDoc = await documentModel.create({
        fileName: 'other-document.pdf',
        logicalPath: 'other_user_CD789012/rh/demande_conge',
        metadataPath: 'other_user_CD789012/rh/demande_conge',
        department: 'RH',
        documentType: 'demande_conge',
        documentStatus: 'pending',
        minioPath: 'other_user_CD789012/rh/demande_conge/other-document.pdf',
        uploadedBy: otherUser._id as any,
      });

      await request(app.getHttpServer())
        .patch(`/documents/${otherDoc._id.toString()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ documentStatus: 'valid' })
        .expect(403);

      await userModel.deleteOne({ _id: otherUser._id }).catch(() => {});
      await documentModel.deleteOne({ _id: otherDoc._id }).catch(() => {});
    });
  });

  describe('GET /documents/:id/history', () => {
    let documentId: string;

    beforeAll(async () => {
      const testDoc = await documentModel.create({
        fileName: 'test-history.pdf',
        logicalPath: 'test_user_AB123456/rh/demande_conge',
        metadataPath: 'test_user_AB123456/rh/demande_conge',
        department: 'RH',
        documentType: 'demande_conge',
        documentStatus: 'pending',
        minioPath: 'test_user_AB123456/rh/demande_conge/test-history.pdf',
        uploadedBy: userId as any,
      });
      documentId = testDoc._id.toString();
    });

    it('should reject access without authentication', () => {
      return request(app.getHttpServer())
        .get(`/documents/${documentId}/history`)
        .expect(401);
    });

    it('should return document history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/documents/${documentId}/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /documents/stats/advanced', () => {
    it('should reject access without authentication', () => {
      return request(app.getHttpServer())
        .get('/documents/stats/advanced')
        .expect(401);
    });

    it('should return statistics for authenticated admin', async () => {
      const adminPassword = await bcrypt.hash('admin123', 10);
      const admin = await userModel.create({
        email: 'admin@example.com',
        passwordHash: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
      });

      const adminLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123',
        });

      const adminToken = (adminLogin.body as { access_token: string })
        .access_token;

      const response = await request(app.getHttpServer())
        .get('/documents/stats/advanced')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('byDepartment');
      expect(response.body).toHaveProperty('byStatus');
      expect(response.body).toHaveProperty('byType');

      await userModel.deleteOne({ _id: admin._id }).catch(() => {});
    });

    it('should reject access for non-admin users', () => {
      return request(app.getHttpServer())
        .get('/documents/stats/advanced')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });
  });
});
