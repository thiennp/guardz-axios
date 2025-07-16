import type { AxiosRequestConfig } from 'axios';
import type { TypeGuardFn } from 'guardz';
import type { SafeRequestConfig } from '../types/SafeRequestConfig';
import type { SafeRequestResult } from '../types/SafeRequestResult';
import type { ErrorContext } from '../types/ErrorContext';
import type { RetryConfig } from '../types/RetryConfig';
import { executeRequest } from '../internal/executeRequest';

/**
 * Pattern 3: Fluent API Builder
 * Usage: const result = await safe().get('/users/1').guard(isUser).tolerance(false).execute();
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

  onTypeMismatch(callback: (error: string, context: ErrorContext) => void): SafeRequestBuilder<T> {
    this.config.onTypeMismatch = callback;
    return this;
  }

  timeout(ms: number): SafeRequestBuilder<T> {
    this.config.timeout = ms;
    this.axiosConfig.timeout = ms;
    return this;
  }

  retry(config: RetryConfig): SafeRequestBuilder<T> {
    this.config.retry = config;
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

  async execute(): Promise<SafeRequestResult<T>> {
    if (!this.config.guard) {
      throw new Error('Type guard is required. Call .guard(typeGuardFn) before .execute()');
    }

    return executeRequest(this.axiosConfig, this.config as SafeRequestConfig<T>);
  }
} 