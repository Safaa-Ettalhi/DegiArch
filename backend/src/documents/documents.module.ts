import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AuditService } from './audit.service';
import { Document, DocumentSchema } from '../schemas/document.schema';
import { AuditLog, AuditLogSchema } from '../schemas/audit-log.schema';
import { StorageModule } from '../storage/storage.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Document.name, schema: DocumentSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    StorageModule,
    LlmModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, AuditService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
