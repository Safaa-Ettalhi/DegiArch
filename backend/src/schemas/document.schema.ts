import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument, Schema as MongooseSchema } from 'mongoose';

export type DocumentDocument = Document & MongoDocument;

export enum DocumentStatus {
  VALID = 'valid',
  INCOMPLETE = 'incomplete',
  PENDING = 'pending',
}

@Schema({ timestamps: true })
export class Document {
  @Prop({ required: true })
  logicalPath: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  metadataPath: string;
  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  cin?: string;

  @Prop({ required: true })
  department: string;

  @Prop({ required: true })
  documentType: string;

  @Prop({
    required: true,
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  documentStatus: DocumentStatus;

  @Prop({ default: false })
  signatureDetected: boolean;

  @Prop({ default: false })
  humanVerificationRequired: boolean;

  @Prop()
  scanDate?: Date;

  @Prop()
  archivingManager?: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  uploadedBy?: MongooseSchema.Types.ObjectId;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);

DocumentSchema.index({ firstName: 1, lastName: 1 });
DocumentSchema.index({ cin: 1 });
DocumentSchema.index({ department: 1 });
DocumentSchema.index({ documentType: 1 });
DocumentSchema.index({ logicalPath: 1 });
