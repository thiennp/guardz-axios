import type { AxiosRequestConfig } from 'axios';
import type { SafeRequestConfig } from '../types/SafeRequestConfig';
import type { SafeRequestResult } from '../types/SafeRequestResult';
import { executeRequest } from '../internal/executeRequest';

/**
 * Pattern 1: Curried Function for PUT requests
 * Usage: const updateUserSafely = safePut({ guard: isUser }); 
 *        const result = await updateUserSafely('/users/1', userData);
 */
export function safePut<T>(config: SafeRequestConfig<T>) {
  return async (url: string, data?: any, axiosConfig?: AxiosRequestConfig): Promise<SafeRequestResult<T>> => {
    return executeRequest({
      ...axiosConfig,
      url,
      method: 'PUT',
      data
    }, config);
  };
} 