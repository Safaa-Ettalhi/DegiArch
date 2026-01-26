import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { MinioService } from '../src/storage/minio.service';
import { LlmService } from '../src/llm/llm.service';

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

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MinioService)
      .useValue(mockMinioService)
      .overrideProvider(LlmService)
      .useValue(mockLlmService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
