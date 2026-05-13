import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { logDebugHttp, logDebugResponse } from '../utils/logger.js';
import { getToken } from './tokenManager.js';

function addDebugInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
    const params = config.params as Record<string, unknown> | undefined;
    logDebugHttp(config.method?.toUpperCase() ?? 'GET', url, params, config.data);
    config.metadata = { startTime: Date.now() };
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      const url = `${response.config.baseURL ?? ''}${response.config.url ?? ''}`;
      const start = (response.config.metadata as { startTime: number } | undefined)?.startTime ?? Date.now();
      logDebugResponse(url, response.status, Date.now() - start, response.data);
      return response;
    },
    (error) => {
      if (axios.isAxiosError(error) && error.config) {
        const url = `${error.config.baseURL ?? ''}${error.config.url ?? ''}`;
        const start = (error.config.metadata as { startTime: number } | undefined)?.startTime ?? Date.now();
        logDebugResponse(url, error.response?.status ?? 0, Date.now() - start, error.response?.data);
      }
      return Promise.reject(error);
    },
  );
}

// Obtiene JWT del HTML de ws2.smn.gob.ar y lo inyecta en cada request.
export const smn1Client: AxiosInstance = axios.create({
  baseURL: 'https://ws1.smn.gob.ar',
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0',
    Origin: 'https://ws2.smn.gob.ar',
    Referer: 'https://ws2.smn.gob.ar/',
  },
});

smn1Client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getToken();
  config.headers['Authorization'] = `JWT ${token}`;
  return config;
});

addDebugInterceptors(smn1Client);
