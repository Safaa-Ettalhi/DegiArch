import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../src/schemas/user.schema';
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

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<User>;

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
  });

  afterAll(async () => {
    if (userModel) {
      await userModel
        .deleteMany({
          email: { $in: ['testauth@example.com', 'newuser@example.com'] },
        })
        .catch(() => {});
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          role: 'ARCHIVE_MANAGER',
        })
        .expect(201);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body._id).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.email).toBe('newuser@example.com');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.role).toBe('ARCHIVE_MANAGER');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.isActive).toBe(true);
    });

    it('should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'testauth@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: 'ARCHIVE_MANAGER',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'testauth@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: 'ARCHIVE_MANAGER',
        })
        .expect(401);
    });

    it('should reject invalid data', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Too short
          firstName: 'Test',
          lastName: 'User',
          role: 'ARCHIVE_MANAGER',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await userModel
        .deleteOne({ email: 'testauth@example.com' })
        .catch(() => {});
      const hashedPassword = await bcrypt.hash('password123', 10);
      await userModel.create({
        email: 'testauth@example.com',
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'ARCHIVE_MANAGER',
        isActive: true,
      });
    });

    afterEach(async () => {
      await userModel
        .deleteOne({ email: 'testauth@example.com' })
        .catch(() => {});
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testauth@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.user.email).toBe('testauth@example.com');
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testauth@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should reject login for inactive account', async () => {
      await userModel
        .deleteOne({ email: 'inactive@example.com' })
        .catch(() => {});
      const hashedPassword = await bcrypt.hash('password123', 10);
      const inactiveUser = await userModel.create({
        email: 'inactive@example.com',
        passwordHash: hashedPassword,
        firstName: 'Inactive',
        lastName: 'User',
        role: 'ARCHIVE_MANAGER',
        isActive: false,
      });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'password123',
        })
        .expect(401);

      await userModel.deleteOne({ _id: inactiveUser._id }).catch(() => {});
    });
  });

  describe('GET /auth/profile', () => {
    let authToken: string;

    beforeAll(async () => {
      await userModel
        .deleteOne({ email: 'profiletest@example.com' })
        .catch(() => {});
      const hashedPassword = await bcrypt.hash('password123', 10);
      await userModel.create({
        email: 'profiletest@example.com',
        passwordHash: hashedPassword,
        firstName: 'Profile',
        lastName: 'Test',
        role: 'ARCHIVE_MANAGER',
        isActive: true,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'profiletest@example.com',
          password: 'password123',
        });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      authToken = loginResponse.body.access_token;
    });

    afterAll(async () => {
      if (userModel) {
        await userModel
          .deleteOne({ email: 'profiletest@example.com' })
          .catch(() => {});
      }
    });

    it('should return user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('email');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.email).toBe('profiletest@example.com');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should reject access without token', () => {
      return request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should reject access with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
