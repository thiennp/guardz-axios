import axios, { AxiosInstance } from 'axios';
import type { AxiosRequestConfig } from 'axios';
import type { TypeGuardFn } from 'guardz';
import type { SafeRequestConfig } from '../types/SafeRequestConfig';
import type { SafeRequestResult } from '../types/SafeRequestResult';
import type { SafeApiContextConfig } from '../types/SafeApiContextConfig';
import { executeRequest } from '../internal/executeRequest';
import { safe } from '../functions/safe';

/**
 * Pattern 4: Context/Provider (React style)
 * Usage: const safeApi = createSafeApiContext({ baseURL: '...', defaultTolerance: false });
 *        const result = await safeApi.get('/users/1', { guard: isUser });
 */
export function createSafeApiContext(contextConfig: SafeApiContextConfig = {}) {
  const instance = contextConfig.axiosInstance || axios.create({
    baseURL: contextConfig.baseURL,
    timeout: contextConfig.timeout,
    headers: contextConfig.headers,
  });

  return {
    get: <T>(url: string, config: { guard: TypeGuardFn<T> } & Partial<SafeRequestConfig<T>>, axiosConfig?: AxiosRequestConfig) => 
      executeRequest(
        { ...axiosConfig, url, method: 'GET' },
        { ...contextConfig, ...config, axiosInstance: instance }
      ),

    post: <T>(url: string, data: any, config: { guard: TypeGuardFn<T> } & Partial<SafeRequestConfig<T>>, axiosConfig?: AxiosRequestConfig) => 
      executeRequest(
        { ...axiosConfig, url, method: 'POST', data },
        { ...contextConfig, ...config, axiosInstance: instance }
      ),

    put: <T>(url: string, data: any, config: { guard: TypeGuardFn<T> } & Partial<SafeRequestConfig<T>>, axiosConfig?: AxiosRequestConfig) => 
      executeRequest(
        { ...axiosConfig, url, method: 'PUT', data },
        { ...contextConfig, ...config, axiosInstance: instance }
      ),

    patch: <T>(url: string, data: any, config: { guard: TypeGuardFn<T> } & Partial<SafeRequestConfig<T>>, axiosConfig?: AxiosRequestConfig) => 
      executeRequest(
        { ...axiosConfig, url, method: 'PATCH', data },
        { ...contextConfig, ...config, axiosInstance: instance }
      ),

    delete: <T>(url: string, config: { guard: TypeGuardFn<T> } & Partial<SafeRequestConfig<T>>, axiosConfig?: AxiosRequestConfig) => 
      executeRequest(
        { ...axiosConfig, url, method: 'DELETE' },
        { ...contextConfig, ...config, axiosInstance: instance }
      ),

    // Provide builder access
    safe: () => {
      const builder = safe().baseURL(contextConfig.baseURL || '');
      if (contextConfig.timeout) {
        builder.timeout(contextConfig.timeout);
      }
      return builder;
    },

    // Direct instance access
    instance,
  };
} 