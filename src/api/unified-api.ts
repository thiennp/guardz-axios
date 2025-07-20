/**
 * Unified API Layer
 * Integrates domain-driven architecture with existing patterns
 * Following Composition over Inheritance (CoI) principles
 */

import {
  RequestService,
  HttpClient,
  Logger,
} from "../services/request-service";
import {
  CompleteRequestConfig,
  RequestResult,
  RequestStatus,
  ErrorType,
} from "../domain/types";
import { ValidationGuard } from "../domain/types";
import axios, { AxiosInstance } from "axios";

/**
 * Axios HTTP Client Adapter
 * Adapts Axios to our HttpClient interface
 */
class AxiosHttpClient implements HttpClient {
  private axiosInstance: AxiosInstance;

  constructor(axiosInstance?: AxiosInstance) {
    this.axiosInstance = axiosInstance || axios;
  }

  async request(config: any): Promise<any> {
    return this.axiosInstance.request(config);
  }
}

/**
 * Console Logger Implementation
 */
class ConsoleLogger implements Logger {
  error(message: string, context?: unknown): void {
    console.error(`[ERROR] ${message}`, context);
  }

  warn(message: string, context?: unknown): void {
    console.warn(`[WARN] ${message}`, context);
  }

  info(message: string, context?: unknown): void {
    console.info(`[INFO] ${message}`, context);
  }

  debug(message: string, context?: unknown): void {
    console.debug(`[DEBUG] ${message}`, context);
  }
}

/**
 * Unified API Configuration
 */
export interface UnifiedApiConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  axiosInstance?: AxiosInstance;
  logger?: Logger;
  defaultRetryConfig?: {
    attempts: number;
    delay: number;
    backoff: "linear" | "exponential";
  };
}

/**
 * Unified API Class
 * Provides a clean interface combining all patterns
 */
export class UnifiedApi {
  private requestService: RequestService;
  private defaultConfig: Partial<CompleteRequestConfig<any>>;

  constructor(config: UnifiedApiConfig = {}) {
    const httpClient = new AxiosHttpClient(config.axiosInstance);
    const logger = config.logger || new ConsoleLogger();

    this.requestService = new RequestService({
      httpClient,
      logger,
      defaultTimeout: config.timeout || 5000,
      defaultRetryConfig: config.defaultRetryConfig || {
        attempts: 3,
        delay: 1000,
        backoff: "exponential",
      },
    });

    this.defaultConfig = {
      baseURL: config.baseURL,
      headers: config.headers,
    };
  }

  /**
   * Pattern 1: Curried Functions (Functional Style)
   */
  createSafeGet<T>(guard: ValidationGuard<T>) {
    return async (
      url: string,
      config?: Partial<CompleteRequestConfig<T>>,
    ): Promise<RequestResult<T>> => {
      const fullConfig: CompleteRequestConfig<T> = {
        ...this.defaultConfig,
        ...config,
        url,
        method: "GET",
        guard,
        headers: config?.headers
          ? {
              ...this.defaultConfig.headers,
              ...config.headers,
            }
          : this.defaultConfig.headers,
      };
      return this.requestService.executeRequest(fullConfig);
    };
  }

  createSafePost<T>(guard: ValidationGuard<T>) {
    return async (
      url: string,
      data?: unknown,
      config?: Partial<CompleteRequestConfig<T>>,
    ): Promise<RequestResult<T>> => {
      const fullConfig: CompleteRequestConfig<T> = {
        ...this.defaultConfig,
        ...config,
        url,
        method: "POST",
        data,
        guard,
        headers: config?.headers
          ? {
              ...this.defaultConfig.headers,
              ...config.headers,
            }
          : this.defaultConfig.headers,
      };
      return this.requestService.executeRequest(fullConfig);
    };
  }

  createSafePut<T>(guard: ValidationGuard<T>) {
    return async (
      url: string,
      data?: unknown,
      config?: Partial<CompleteRequestConfig<T>>,
    ): Promise<RequestResult<T>> => {
      const fullConfig: CompleteRequestConfig<T> = {
        ...this.defaultConfig,
        ...config,
        url,
        method: "PUT",
        data,
        guard,
      };
      return this.requestService.executeRequest(fullConfig);
    };
  }

  createSafePatch<T>(guard: ValidationGuard<T>) {
    return async (
      url: string,
      data?: unknown,
      config?: Partial<CompleteRequestConfig<T>>,
    ): Promise<RequestResult<T>> => {
      const fullConfig: CompleteRequestConfig<T> = {
        ...this.defaultConfig,
        ...config,
        url,
        method: "PATCH",
        data,
        guard,
      };
      return this.requestService.executeRequest(fullConfig);
    };
  }

  createSafeDelete<T>(guard: ValidationGuard<T>) {
    return async (
      url: string,
      config?: Partial<CompleteRequestConfig<T>>,
    ): Promise<RequestResult<T>> => {
      const fullConfig: CompleteRequestConfig<T> = {
        ...this.defaultConfig,
        ...config,
        url,
        method: "DELETE",
        guard,
      };
      return this.requestService.executeRequest(fullConfig);
    };
  }

  /**
   * Pattern 2: Configuration-first (Apollo/React Query style)
   */
  async safeRequest<T>(
    config: CompleteRequestConfig<T>,
  ): Promise<RequestResult<T>> {
    const fullConfig: CompleteRequestConfig<T> = {
      ...this.defaultConfig,
      ...config,
      headers: config.headers
        ? {
            ...this.defaultConfig.headers,
            ...config.headers,
          }
        : this.defaultConfig.headers,
    };
    return this.requestService.executeRequest(fullConfig);
  }

  /**
   * Pattern 3: Fluent API Builder
   */
  safe() {
    return new SafeRequestBuilder(this.requestService, this.defaultConfig);
  }

  /**
   * Pattern 4: Context API (React Context style)
   */
  createContext() {
    return new SafeApiContext(this.requestService, this.defaultConfig);
  }

  /**
   * Utility Methods
   */
  isSuccess<T>(
    result: RequestResult<T>,
  ): result is { status: RequestStatus.SUCCESS; data: T } {
    return result.status === RequestStatus.SUCCESS;
  }

  isError<T>(
    result: RequestResult<T>,
  ): result is {
    status: RequestStatus.ERROR;
    code: number;
    message: string;
    type: ErrorType;
  } {
    return result.status === RequestStatus.ERROR;
  }

  extractData<T>(result: RequestResult<T>): T | null {
    return this.isSuccess(result) ? result.data : null;
  }

  extractError<T>(
    result: RequestResult<T>,
  ): { code: number; message: string; type: ErrorType } | null {
    return this.isError(result)
      ? { code: result.code, message: result.message, type: result.type }
      : null;
  }
}

/**
 * Fluent API Builder
 */
class SafeRequestBuilder<T = unknown> {
  private config: Partial<CompleteRequestConfig<T>> = {};
  private requestService: RequestService;
  private defaultConfig: Partial<CompleteRequestConfig<any>>;

  constructor(
    requestService: RequestService,
    defaultConfig: Partial<CompleteRequestConfig<any>>,
  ) {
    this.requestService = requestService;
    this.defaultConfig = defaultConfig;
  }

  get(url: string): SafeRequestBuilder<T> {
    this.config = { ...this.config, method: "GET", url };
    return this;
  }

  post(url: string, data?: unknown): SafeRequestBuilder<T> {
    this.config = { ...this.config, method: "POST", url, data };
    return this;
  }

  put(url: string, data?: unknown): SafeRequestBuilder<T> {
    this.config = { ...this.config, method: "PUT", url, data };
    return this;
  }

  patch(url: string, data?: unknown): SafeRequestBuilder<T> {
    this.config = { ...this.config, method: "PATCH", url, data };
    return this;
  }

  delete(url: string): SafeRequestBuilder<T> {
    this.config = { ...this.config, method: "DELETE", url };
    return this;
  }

  guard<U>(guardFn: ValidationGuard<U>): SafeRequestBuilder<U> {
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
    return this;
  }

  headers(headers: Record<string, string>): SafeRequestBuilder<T> {
    this.config.headers = { ...this.config.headers, ...headers };
    return this;
  }

  retry(config: {
    attempts: number;
    delay: number;
    backoff: "linear" | "exponential";
  }): SafeRequestBuilder<T> {
    this.config.retry = config;
    return this;
  }

  async execute(): Promise<RequestResult<T>> {
    if (!this.config.guard) {
      throw new Error(
        "Guard function is required. Use .guard() method to set it.",
      );
    }

    const fullConfig: CompleteRequestConfig<T> = {
      ...this.defaultConfig,
      ...this.config,
      headers: this.config.headers
        ? {
            ...this.defaultConfig.headers,
            ...this.config.headers,
          }
        : this.defaultConfig.headers,
    } as CompleteRequestConfig<T>;

    return this.requestService.executeRequest(fullConfig);
  }
}

/**
 * Safe API Context
 */
class SafeApiContext {
  private requestService: RequestService;
  private defaultConfig: Partial<CompleteRequestConfig<any>>;

  constructor(
    requestService: RequestService,
    defaultConfig: Partial<CompleteRequestConfig<any>>,
  ) {
    this.requestService = requestService;
    this.defaultConfig = defaultConfig;
  }

  async get<T>(
    url: string,
    config: { guard: ValidationGuard<T> } & Partial<CompleteRequestConfig<T>>,
  ): Promise<RequestResult<T>> {
    const fullConfig: CompleteRequestConfig<T> = {
      ...this.defaultConfig,
      ...config,
      url,
      method: "GET",
    };
    return this.requestService.executeRequest(fullConfig);
  }

  async post<T>(
    url: string,
    data: unknown,
    config: { guard: ValidationGuard<T> } & Partial<CompleteRequestConfig<T>>,
  ): Promise<RequestResult<T>> {
    const fullConfig: CompleteRequestConfig<T> = {
      ...this.defaultConfig,
      ...config,
      url,
      method: "POST",
      data,
    };
    return this.requestService.executeRequest(fullConfig);
  }

  async put<T>(
    url: string,
    data: unknown,
    config: { guard: ValidationGuard<T> } & Partial<CompleteRequestConfig<T>>,
  ): Promise<RequestResult<T>> {
    const fullConfig: CompleteRequestConfig<T> = {
      ...this.defaultConfig,
      ...config,
      url,
      method: "PUT",
      data,
    };
    return this.requestService.executeRequest(fullConfig);
  }

  async patch<T>(
    url: string,
    data: unknown,
    config: { guard: ValidationGuard<T> } & Partial<CompleteRequestConfig<T>>,
  ): Promise<RequestResult<T>> {
    const fullConfig: CompleteRequestConfig<T> = {
      ...this.defaultConfig,
      ...config,
      url,
      method: "PATCH",
      data,
    };
    return this.requestService.executeRequest(fullConfig);
  }

  async delete<T>(
    url: string,
    config: { guard: ValidationGuard<T> } & Partial<CompleteRequestConfig<T>>,
  ): Promise<RequestResult<T>> {
    const fullConfig: CompleteRequestConfig<T> = {
      ...this.defaultConfig,
      ...config,
      url,
      method: "DELETE",
    };
    return this.requestService.executeRequest(fullConfig);
  }
}

/**
 * Factory Functions for Easy Usage
 */
export function createUnifiedApi(config?: UnifiedApiConfig): UnifiedApi {
  return new UnifiedApi(config);
}

export function createSafeGet<T>(
  guard: ValidationGuard<T>,
  config?: UnifiedApiConfig,
) {
  const api = new UnifiedApi(config);
  return api.createSafeGet(guard);
}

export function createSafePost<T>(
  guard: ValidationGuard<T>,
  config?: UnifiedApiConfig,
) {
  const api = new UnifiedApi(config);
  return api.createSafePost(guard);
}

export function createSafePut<T>(
  guard: ValidationGuard<T>,
  config?: UnifiedApiConfig,
) {
  const api = new UnifiedApi(config);
  return api.createSafePut(guard);
}

export function createSafePatch<T>(
  guard: ValidationGuard<T>,
  config?: UnifiedApiConfig,
) {
  const api = new UnifiedApi(config);
  return api.createSafePatch(guard);
}

export function createSafeDelete<T>(
  guard: ValidationGuard<T>,
  config?: UnifiedApiConfig,
) {
  const api = new UnifiedApi(config);
  return api.createSafeDelete(guard);
}
