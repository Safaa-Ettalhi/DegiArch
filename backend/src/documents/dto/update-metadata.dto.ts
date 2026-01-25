import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DocumentStatus } from '../../schemas/document.schema';

export class UpdateMetadataDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  cin?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  documentType?: string;

  @IsEnum(DocumentStatus)
  @IsOptional()
  documentStatus?: DocumentStatus;
}
