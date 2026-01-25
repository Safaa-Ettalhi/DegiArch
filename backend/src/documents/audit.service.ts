import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AuditLog,
  AuditLogDocument,
  AuditAction,
} from '../schemas/audit-log.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async logDocumentUpdate(
    documentId: string,
    userId: string,
    oldValue: Record<string, any>,
    newValue: Record<string, any>,
    description?: string,
  ): Promise<void> {
    try {
      await this.auditLogModel.create({
        documentId,
        userId,
        action: AuditAction.UPDATE_METADATA,
        oldValue,
        newValue,
        description: description || 'Modification des métadonnées du document',
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'audit:", error);
    }
  }

  async logDocumentCreation(
    documentId: string,
    userId: string,
    description?: string,
  ): Promise<void> {
    try {
      await this.auditLogModel.create({
        documentId,
        userId,
        action: AuditAction.CREATE_DOCUMENT,
        description: description || "Création d'un nouveau document",
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'audit:", error);
    }
  }

  async logDocumentDeletion(
    documentId: string,
    userId: string,
    description?: string,
  ): Promise<void> {
    try {
      await this.auditLogModel.create({
        documentId,
        userId,
        action: AuditAction.DELETE_DOCUMENT,
        description: description || "Suppression d'un document",
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'audit:", error);
    }
  }

  async getDocumentHistory(documentId: string) {
    return this.auditLogModel
      .find({ documentId })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }
}
