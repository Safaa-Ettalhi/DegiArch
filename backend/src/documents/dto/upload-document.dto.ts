import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  department: string;

  @IsString()
  @IsNotEmpty()
  documentType: string;

  @IsString()
  @IsOptional()
  logicalPath?: string;
}
