import type { AxiosRequestConfig } from 'axios';
import type { TypeGuardFn } from 'guardz';
import type { SafeRequestConfig } from '../types/SafeRequestConfig';
import type { SafeRequestResult } from '../types/SafeRequestResult';
import { executeRequest } from '../internal/executeRequest';

/**
 * Pattern 2: Configuration-first (Apollo/React Query style)
 * Usage: const result = await safeRequest({ url: '/users/1', method: 'GET', guard: isUser, ... });
 */
export async function safeRequest<T>(
  requestConfig: AxiosRequestConfig & { guard: TypeGuardFn<T> } & Omit<SafeRequestConfig<T>, 'guard'>
): Promise<SafeRequestResult<T>> {
  const { guard, tolerance, identifier, onTypeMismatch, axiosInstance, validateResponse, retry, timeout, ...axiosConfig } = requestConfig;
  
  return executeRequest(axiosConfig, {
    guard,
    tolerance,
    identifier,
    onTypeMismatch,
    axiosInstance,
    validateResponse,
    retry,
    timeout
  });
} 