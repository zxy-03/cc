import axios from 'axios';
import { ModelInfo, Message, ChatResponse, RoundtableResult } from '../types';
import { CoordinationResult } from '../types/coordination';

const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return axios(error.config);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const getModels = async (): Promise<ModelInfo[]> => {
  const response = await api.get('/models');
  return response.data;
};

export const chat = async (modelId: string, messages: Message[]): Promise<ChatResponse> => {
  const response = await api.post('/chat', { modelId, messages });
  return response.data;
};

export const roundtable = async (modelIds: string[], messages: Message[]): Promise<RoundtableResult[]> => {
  const response = await api.post('/roundtable', { modelIds, messages });
  return response.data;
};

export const collaboration = async (modelIds: string[], mainQuestion: string): Promise<CoordinationResult> => {
  const response = await api.post('/collaboration', { modelIds, mainQuestion });
  return response.data;
};