/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('minio.endpoint');
    const port = this.configService.get<number>('minio.port');
    const useSSL = this.configService.get<boolean>('minio.useSSL');
    const accessKey = this.configService.get<string>('minio.accessKey');
    const secretKey = this.configService.get<string>('minio.secretKey');

    this.bucketName =
      this.configService.get<string>('minio.bucketName') || 'archives';

    this.minioClient = new Client({
      endPoint: endpoint || 'localhost',
      port: port || 9000,
      useSSL: useSSL || false,
      accessKey: accessKey || 'minioadmin',
      secretKey: secretKey || 'minioadmin',
    });

    console.log(
      ` MinIO configuré: ${endpoint || 'localhost'}:${port || 9000}, Bucket: ${this.bucketName}`,
    );
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        console.log(`✅ Bucket "${this.bucketName}" créé avec succès`);
      } else {
        console.log(`✅ Bucket "${this.bucketName}" existe déjà`);
      }
    } catch (error) {
      console.error(
        ' Erreur lors de la vérification/création du bucket:',
        error,
      );
      throw error;
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folderPath: string,
  ): Promise<string> {
    const cleanFolderPath = folderPath
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9/_-]/g, '')
      .toLowerCase();
    const cleanFileName = file.originalname
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');

    const fileName = `${cleanFolderPath}/${Date.now()}-${cleanFileName}`;
    const metaData = {
      'Content-Type': file.mimetype,
    };

    try {
      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        file.buffer,
        file.size,
        metaData,
      );
      return fileName;
    } catch (error: any) {
      console.error(' Erreur MinIO upload:', error);
      if (error.code === 'AccessDenied') {
        throw new Error(
          `Accès refusé à MinIO. Vérifiez les credentials dans .env (MINIO_ACCESS_KEY et MINIO_SECRET_KEY doivent correspondre à docker-compose.yml)`,
        );
      }
      throw error;
    }
  }

  async getFileUrl(
    objectName: string,
    expiry: number = 7 * 24 * 60 * 60,
  ): Promise<string> {
    return await this.minioClient.presignedGetObject(
      this.bucketName,
      objectName,
      expiry,
    );
  }

  async deleteFile(objectName: string): Promise<void> {
    await this.minioClient.removeObject(this.bucketName, objectName);
  }

  async fileExists(objectName: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(this.bucketName, objectName);
      return true;
    } catch {
      return false;
    }
  }
}
