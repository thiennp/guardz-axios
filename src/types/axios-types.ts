import { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';

// Re-export Axios types for convenience
export { AxiosResponse, AxiosError, AxiosRequestConfig };

// Extended types for better type safety
export interface AxiosResponseGuarded<T = any> {
  readonly data: T;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, any>;
  readonly config: Record<string, any>;
  readonly request?: any;
}

export interface AxiosErrorGuarded<T = any, D = any> {
  readonly message: string;
  readonly name: string;
  readonly isAxiosError: true;
  readonly response?: AxiosResponse<T, D>;
  readonly request?: any;
  readonly config?: Record<string, any>;
  readonly code?: string;
  readonly status?: number;
}

// HTTP Status Code categories
export type SuccessStatus = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226;
export type RedirectStatus = 300 | 301 | 302 | 303 | 304 | 305 | 307 | 308;
export type ClientErrorStatus = 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451;
export type ServerErrorStatus = 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;

export type HttpStatus = SuccessStatus | RedirectStatus | ClientErrorStatus | ServerErrorStatus;

// Common error categories
export interface NetworkError extends AxiosErrorGuarded {
  readonly code: 'ECONNABORTED' | 'ENOTFOUND' | 'ECONNREFUSED' | 'ETIMEDOUT' | 'ERR_NETWORK';
}

export interface TimeoutError extends AxiosErrorGuarded {
  readonly code: 'ECONNABORTED' | 'ETIMEDOUT';
}

export interface CancelError extends AxiosErrorGuarded {
  readonly code: 'ERR_CANCELED';
}

export interface ResponseError extends AxiosErrorGuarded {
  readonly response: AxiosResponse;
  readonly status: number;
} 