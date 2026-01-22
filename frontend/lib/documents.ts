import api from './api';

export interface Document {
  _id: string;
  fileName: string;
  logicalPath: string;
  metadataPath: string;
  department: string;
  documentType: string;
  documentStatus: 'pending' | 'valid' | 'incomplete';
  minioPath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UploadDocumentDto {
  department: string;
  documentType: string;
  logicalPath?: string;
}

export const documentsApi = {
  upload: async (file: File, data: UploadDocumentDto, onProgress?: (progress: number) => void): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('department', data.department);
    formData.append('documentType', data.documentType);
    if (data.logicalPath) {
      formData.append('logicalPath', data.logicalPath);
    }

    return api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    }).then((response) => response.data);
  },

  getAll: async (): Promise<Document[]> => {
    return api.get('/documents').then((response) => response.data);
  },

  getOne: async (id: string): Promise<Document> => {
    return api.get(`/documents/${id}`).then((response) => response.data);
  },

  getFileUrl: async (id: string): Promise<string> => {
    return api.get(`/documents/${id}/url`).then((response) => response.data.url);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/documents/${id}`).then(() => undefined);
  },
};
