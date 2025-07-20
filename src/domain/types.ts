/**
 * Domain Types - Core business concepts
 * Following Domain-Driven Design (DDD) principles
 */

import { TypeGuardFn } from "guardz";

/**
 * HTTP Method - Domain concept for HTTP operations
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Request Status - Domain concept for request outcomes
 */
export enum RequestStatus {
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

/**
 * Error Type - Domain concept for error categorization
 */
export type ErrorType =
  | "validation"
  | "network"
  | "timeout"
  | "http"
  | "unknown";

/**
 * HTTP Status Code - Domain concept for HTTP responses
 */
export type HttpStatusCode = number;

/**
 * Request Result - Domain concept for API operation results
 * Following Functional Programming principles with discriminated unions
 */
export type RequestResult<T> =
  | { status: RequestStatus.SUCCESS; data: T }
  | {
      status: RequestStatus.ERROR;
      code: HttpStatusCode;
      message: string;
      type: ErrorType;
    };

/**
 * Validation Guard - Domain concept for data validation
 */
export type ValidationGuard<T> = TypeGuardFn<T>;

/**
 * Request Configuration - Domain concept for request setup
 */
export interface RequestConfig {
  url: string;
  method: HttpMethod;
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  baseURL?: string;
}

/**
 * Validation Configuration - Domain concept for validation setup
 */
export interface ValidationConfig<T> {
  guard: ValidationGuard<T>;
  tolerance?: boolean;
  identifier?: string;
  onError?: (error: string, context: ValidationContext) => void;
}

/**
 * Validation Context - Domain concept for validation error context
 */
export interface ValidationContext {
  type: ErrorType;
  url: string;
  method: HttpMethod;
  statusCode?: HttpStatusCode;
  originalError?: unknown;
}

/**
 * Retry Configuration - Domain concept for retry logic
 */
export interface RetryConfig {
  attempts: number;
  delay: number;
  backoff: "linear" | "exponential";
  retryOn?: (error: unknown) => boolean;
}

/**
 * Complete Request Configuration - Domain concept combining all configs
 */
export interface CompleteRequestConfig<T>
  extends RequestConfig,
    ValidationConfig<T> {
  retry?: RetryConfig;
  axiosInstance?: any; // External dependency, kept loosely typed
}
