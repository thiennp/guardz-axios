import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { guardWithTolerance } from 'guardz';
import type { TypeGuardFn, TypeGuardFnConfig } from 'guardz';
import { Status } from '../types/status-types';
import { isAxiosResponse } from '../guards/axios-response-guards';

export type ApiResult<T> =
  | { status: Status.SUCCESS; data: T }
  | { status: Status.ERROR; code: number; message: string };

/**
 * Configuration for safe requests that never throw
 */
export interface SafeRequestConfig<T> {
  /** Type guard function to validate response data */
  guard: TypeGuardFn<T>;
  /** Enable tolerance mode (default: false) */
  tolerance?: boolean;
  /** Identifier for error context (default: URL) */
  identifier?: string;
  /** Error callback - only used in tolerance mode */
  onError?: (error: string, context: ErrorContext) => void;
  /** Custom axios instance */
  axiosInstance?: AxiosInstance;
  /** Validate response structure */
  validateResponse?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
}

export interface ErrorContext {
  type: 'validation' | 'network' | 'timeout' | 'unknown';
  url: string;
  method: string;
  statusCode?: number;
  originalError?: unknown;
}

/**
 * Pattern 1: Curried Function (Google/Ramda style)
 * Usage: const getUserSafely = safeGet({ guard: isUser }); 
 *        const result = await getUserSafely('https://api.example.com/users/1');
 *        // result is { status: Status.SUCCESS, data: User } | { status: Status.ERROR, data: AxiosError }
 */
export function safeGet<T>(config: SafeRequestConfig<T>) {
  return async (url: string, axiosConfig?: AxiosRequestConfig): Promise<ApiResult<T>> => {
    return executeRequest({
      ...axiosConfig,
      url,
      method: 'GET'
    }, config);
  };
}

export function safePost<T>(config: SafeRequestConfig<T>) {
  return async (url: string, data?: any, axiosConfig?: AxiosRequestConfig): Promise<ApiResult<T>> => {
    return executeRequest({
      ...axiosConfig,
      url,
      method: 'POST',
      data
    }, config);
  };
}

export function safePut<T>(config: SafeRequestConfig<T>) {
  return async (url: string, data?: any, axiosConfig?: AxiosRequestConfig): Promise<ApiResult<T>> => {
    return executeRequest({
      ...axiosConfig,
      url,
      method: 'PUT',
      data
    }, config);
  };
}

export function safePatch<T>(config: SafeRequestConfig<T>) {
  return async (url: string, data?: any, axiosConfig?: AxiosRequestConfig): Promise<ApiResult<T>> => {
    return executeRequest({
      ...axiosConfig,
      url,
      method: 'PATCH',
      data
    }, config);
  };
}

export function safeDelete<T>(config: SafeRequestConfig<T>) {
  return async (url: string, axiosConfig?: AxiosRequestConfig): Promise<ApiResult<T>> => {
    return executeRequest({
      ...axiosConfig,
      url,
      method: 'DELETE'
    }, config);
  };
}

/**
 * Pattern 2: Configuration-first (Apollo/React Query style)
 * Usage: const result = await safeRequest({ url: '/users/1', method: 'GET', guard: isUser });
 */
export async function safeRequest<T>(
  requestConfig: AxiosRequestConfig & { guard: TypeGuardFn<T> } & Omit<SafeRequestConfig<T>, 'guard'>
): Promise<ApiResult<T>> {
  const { guard, tolerance, identifier, axiosInstance, validateResponse, timeout, ...axiosConfig } = requestConfig;
  
  return executeRequest(axiosConfig, {
    guard,
    tolerance,
    identifier,
    axiosInstance,
    validateResponse,
    timeout
  });
}

/**
 * Pattern 3: Fluent API Builder
 * Usage: const result = await safe().get('/users/1').guard(isUser).execute();
 */
export class SafeRequestBuilder<T = unknown> {
  private config: Partial<SafeRequestConfig<T>> = {};
  private axiosConfig: AxiosRequestConfig = {};

  get(url: string): SafeRequestBuilder<T> {
    this.axiosConfig = { ...this.axiosConfig, method: 'GET', url };
    return this;
  }

  post(url: string, data?: any): SafeRequestBuilder<T> {
    this.axiosConfig = { ...this.axiosConfig, method: 'POST', url, data };
    return this;
  }

  put(url: string, data?: any): SafeRequestBuilder<T> {
    this.axiosConfig = { ...this.axiosConfig, method: 'PUT', url, data };
    return this;
  }

  patch(url: string, data?: any): SafeRequestBuilder<T> {
    this.axiosConfig = { ...this.axiosConfig, method: 'PATCH', url, data };
    return this;
  }

  delete(url: string): SafeRequestBuilder<T> {
    this.axiosConfig = { ...this.axiosConfig, method: 'DELETE', url };
    return this;
  }

  guard<U>(guardFn: TypeGuardFn<U>): SafeRequestBuilder<U> {
    const newBuilder = this as any as SafeRequestBuilder<U>;
    newBuilder.config.guard = guardFn;
    return newBuilder;
  }

  tolerance(enabled: boolean = true): SafeRequestBuilder<T> {
    this.config.tolerance = enabled;
    return this;
  }

  identifier(id: string): SafeRequestBuilder<T> {
    this.config.identifier = id;
    return this;
  }

  timeout(ms: number): SafeRequestBuilder<T> {
    this.config.timeout = ms;
    this.axiosConfig.timeout = ms;
    return this;
  }

  headers(headers: Record<string, string>): SafeRequestBuilder<T> {
    this.axiosConfig.headers = { ...this.axiosConfig.headers, ...headers };
    return this;
  }

  baseURL(url: string): SafeRequestBuilder<T> {
    this.axiosConfig.baseURL = url;
    return this;
  }

  async execute(): Promise<ApiResult<T>> {
    if (!this.config.guard) {
      throw new Error('Guard function is required. Use .guard() method to set it.');
    }

    return executeRequest(this.axiosConfig, this.config as SafeRequestConfig<T>);
  }
}

export function safe(): SafeRequestBuilder {
  return new SafeRequestBuilder();
}

/**
 * Pattern 4: Context API (React Context style)
 * Usage: const api = createSafeApiContext({ baseURL: 'https://api.example.com' });
 *        const result = await api.get('/users/1', { guard: isUser });
 */
export interface SafeApiContextConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  defaultTolerance?: boolean;
  axiosInstance?: AxiosInstance;
}

export function createSafeApiContext(contextConfig: SafeApiContextConfig = {}) {
  const {
    baseURL,
    timeout,
    headers,
    defaultTolerance = false,
    axiosInstance = axios.create()
  } = contextConfig;

  if (baseURL) axiosInstance.defaults.baseURL = baseURL;
  if (timeout) axiosInstance.defaults.timeout = timeout;
  if (headers) axiosInstance.defaults.headers = { ...axiosInstance.defaults.headers, ...headers };

  return {
    get: <T>(url: string, config: Required<Pick<SafeRequestConfig<T>, 'guard'>> & Omit<SafeRequestConfig<T>, 'axiosInstance' | 'guard'>) =>
      safeGet<T>({ ...config, tolerance: config.tolerance ?? defaultTolerance, axiosInstance })(url),
    post: <T>(url: string, config: Required<Pick<SafeRequestConfig<T>, 'guard'>> & Omit<SafeRequestConfig<T>, 'axiosInstance' | 'guard'>, data?: any) =>
      safePost<T>({ ...config, tolerance: config.tolerance ?? defaultTolerance, axiosInstance })(url, data),
    put: <T>(url: string, config: Required<Pick<SafeRequestConfig<T>, 'guard'>> & Omit<SafeRequestConfig<T>, 'axiosInstance' | 'guard'>, data?: any) =>
      safePut<T>({ ...config, tolerance: config.tolerance ?? defaultTolerance, axiosInstance })(url, data),
    patch: <T>(url: string, config: Required<Pick<SafeRequestConfig<T>, 'guard'>> & Omit<SafeRequestConfig<T>, 'axiosInstance' | 'guard'>, data?: any) =>
      safePatch<T>({ ...config, tolerance: config.tolerance ?? defaultTolerance, axiosInstance })(url, data),
    delete: <T>(url: string, config: Required<Pick<SafeRequestConfig<T>, 'guard'>> & Omit<SafeRequestConfig<T>, 'axiosInstance' | 'guard'>) =>
      safeDelete<T>({ ...config, tolerance: config.tolerance ?? defaultTolerance, axiosInstance })(url),
    request: <T>(config: AxiosRequestConfig & { guard: TypeGuardFn<T> } & Omit<SafeRequestConfig<T>, 'axiosInstance' | 'guard'>) =>
      safeRequest<T>({ ...config, tolerance: config.tolerance ?? defaultTolerance, axiosInstance })
  };
}

/**
 * Core execution function that never throws
 */
async function executeRequest<T>(
  axiosConfig: AxiosRequestConfig,
  safeConfig: SafeRequestConfig<T>
): Promise<ApiResult<T>> {
  const {
    guard,
    tolerance = false,
    identifier,
    axiosInstance = axios,
    validateResponse = true,
    timeout
  } = safeConfig;

  const url = axiosConfig.url || '';
  const method = axiosConfig.method || 'GET';
  const requestId = identifier || `${method} ${url}`;

  const configWithHeaders = { ...axiosConfig, headers: axiosConfig.headers ?? {} };
  try {
    // Set timeout if provided
    if (timeout) {
      axiosConfig.timeout = timeout;
    }

    // Make the request
    const response = await axiosInstance.request(configWithHeaders as any);

    // Validate response structure if enabled
    if (validateResponse && !isAxiosResponse(response)) {
      return {
        status: Status.ERROR,
        code: 400, // Assuming 400 for validation errors
        message: `Invalid response structure for ${requestId}`
      };
    }

    // Extract and validate data
    const responseData = response.data;
    
    if (tolerance) {
      // Use tolerance mode - try to extract valid data even if validation fails
      const errorMessages: string[] = [];
      const toleranceConfig: TypeGuardFnConfig = {
        identifier: identifier || requestId,
        callbackOnError: (errorMessage: string) => {
          errorMessages.push(errorMessage);
        }
      };

      const validatedData = guardWithTolerance(responseData, guard, toleranceConfig);
      
      if (errorMessages.length > 0) {
        return {
          status: Status.ERROR,
          code: 400, // Assuming 400 for validation errors
          message: `Data validation failed for ${requestId}: ${errorMessages.join(', ')}`
        };
      } else {
        return {
          status: Status.SUCCESS,
          data: validatedData
        };
      }
    } else {
      // Strict validation
      const errorMessages: string[] = [];
      const strictConfig: TypeGuardFnConfig = {
        identifier: identifier || requestId,
        callbackOnError: (errorMessage: string) => {
          errorMessages.push(errorMessage);
        }
      };

      if (guard(responseData, strictConfig)) {
        return {
          status: Status.SUCCESS,
          data: responseData
        };
      } else {
        const errorMsg = errorMessages.length > 0 
          ? `Data validation failed for ${requestId}: ${errorMessages.join(', ')}`
          : `Data validation failed for ${requestId}`;
        
        return {
          status: Status.ERROR,
          code: 400, // Assuming 400 for validation errors
          message: errorMsg
        };
      }
    }
  } catch (error) {
    // Always return error result, never throw
    if (axios.isAxiosError(error)) {
      return {
        status: Status.ERROR,
        code: error.response?.status || 500,
        message: error.message || 'Network Error'
      };
    } else {
      return {
        status: Status.ERROR,
        code: 500, // Assuming 500 for unexpected errors
        message: `Unexpected error for ${requestId}: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

/**
 * Type helper to extract data type from guard function
 */
export type InferDataType<T> = T extends TypeGuardFn<infer U> ? U : never;

/**
 * Helper to create typed safe get function
 */
export function createTypedSafeGet<T>(guard: TypeGuardFn<T>) {
  return safeGet<T>({ guard });
}

/**
 * Helper to create typed safe post function
 */
export function createTypedSafePost<T>(guard: TypeGuardFn<T>) {
  return safePost<T>({ guard });
} 