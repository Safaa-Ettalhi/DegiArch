import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

export enum AuditAction {
  CREATE_DOCUMENT = 'CREATE_DOCUMENT',
  UPDATE_METADATA = 'UPDATE_METADATA',
  DELETE_DOCUMENT = 'DELETE_DOCUMENT',
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
}

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Document',
    required: false,
  })
  documentId?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true, enum: AuditAction })
  action: AuditAction;

  @Prop({ type: Object })
  oldValue?: Record<string, any>;

  @Prop({ type: Object })
  newValue?: Record<string, any>;

  @Prop()
  description?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ documentId: 1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ createdAt: -1 });
