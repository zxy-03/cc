import { api } from './client';
import { DataSourceType } from '../types/dataflow';

export const datauploadAPI = {
  upload: async (name: string, content: string) => {
    const response = await api.post('/dataupload/upload', { name, content });
    return response.data;
  },

  list: async () => {
    const response = await api.get('/dataupload/list');
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get(`/dataupload/${id}`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/dataupload/${id}`);
    return response.data;
  },

  parse: async (content: string) => {
    const response = await api.post('/dataupload/parse', { content });
    return response.data;
  },
};

export interface UploadResponse {
  success: boolean;
  dataSource?: {
    id: string;
    name: string;
    type: DataSourceType;
    columns: string[];
    rowCount: number;
    uploadedAt: string;
    size: number;
  };
  error?: string;
}

export interface ParseResponse {
  success: boolean;
  type: DataSourceType;
  columns: string[];
  rowCount: number;
  sampleData: Record<string, any>[];
  error?: string;
}