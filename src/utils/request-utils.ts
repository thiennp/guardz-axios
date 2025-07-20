/**
 * Request Utilities - Pure functions for request handling
 * Following Functional Programming (FP) principles
 */

import {
  RequestConfig,
  HttpMethod,
  RequestResult,
  RequestStatus,
  ErrorType,
} from "../domain/types";

/**
 * Creates a request configuration object with validation
 * Pure function - no side effects, deterministic output
 *
 * @param url - Request URL
 * @param method - HTTP method
 * @param data - Request data (optional)
 * @param headers - Request headers (optional)
 * @param timeout - Request timeout in milliseconds (optional)
 * @param baseURL - Base URL (optional)
 * @returns Request configuration object
 */
export function createRequestConfig(
  url: string,
  method: HttpMethod,
  data?: unknown,
  headers?: Record<string, string>,
  timeout?: number,
  baseURL?: string,
): RequestConfig {
  // Validate inputs
  if (!url || typeof url !== "string") {
    throw new Error("URL must be a non-empty string");
  }

  if (!method || typeof method !== "string") {
    throw new Error("HTTP method must be a non-empty string");
  }

  if (timeout !== undefined && (typeof timeout !== "number" || timeout < 0)) {
    throw new Error("Timeout must be a non-negative number");
  }

  return {
    url: url.trim(),
    method: method.toUpperCase() as HttpMethod,
    data,
    headers: headers ? { ...headers } : undefined,
    timeout,
    baseURL: baseURL?.trim(),
  };
}

/**
 * Merges multiple request configurations with deep merging for headers
 * Pure function - no side effects, deterministic output
 *
 * @param base - Base request configuration
 * @param override - Override configuration
 * @returns Merged request configuration
 */
export function mergeRequestConfigs(
  base: RequestConfig,
  override: Partial<RequestConfig>,
): RequestConfig {
  if (!base || typeof base !== "object") {
    throw new Error("Base configuration must be a valid object");
  }

  const merged = {
    ...base,
    ...override,
  };

  // Deep merge headers
  if (override.headers) {
    merged.headers = {
      ...base.headers,
      ...override.headers,
    };
  }

  return merged;
}

/**
 * Validates request configuration with comprehensive checks
 * Pure function - no side effects, deterministic output
 *
 * @param config - Request configuration to validate
 * @returns Error message if invalid, null if valid
 */
export function validateRequestConfig(config: RequestConfig): string | null {
  if (!config || typeof config !== "object") {
    return "Request configuration must be an object";
  }

  if (!config.url || typeof config.url !== "string") {
    return "URL is required and must be a string";
  }

  if (!config.method || typeof config.method !== "string") {
    return "HTTP method is required and must be a string";
  }

  // Validate HTTP method
  const validMethods: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  if (!validMethods.includes(config.method as HttpMethod)) {
    return `HTTP method must be one of: ${validMethods.join(", ")}`;
  }

  if (
    config.timeout !== undefined &&
    (typeof config.timeout !== "number" || config.timeout < 0)
  ) {
    return "Timeout must be a non-negative number";
  }

  if (config.headers && typeof config.headers !== "object") {
    return "Headers must be an object";
  }

  if (config.baseURL && typeof config.baseURL !== "string") {
    return "Base URL must be a string";
  }

  return null;
}

/**
 * Creates a success result with type safety
 * Pure function - no side effects, deterministic output
 *
 * @param data - Success data
 * @returns Success result object
 */
export function createSuccessResult<T>(data: T): RequestResult<T> {
  return {
    status: RequestStatus.SUCCESS,
    data,
  };
}

/**
 * Creates an error result with comprehensive error information
 * Pure function - no side effects, deterministic output
 *
 * @param code - Error code (HTTP status code or custom code)
 * @param message - Error message
 * @param type - Error type
 * @returns Error result object
 */
export function createErrorResult<T>(
  code: number,
  message: string,
  type: ErrorType = "unknown",
): RequestResult<T> {
  // Validate inputs
  if (typeof code !== "number" || code < 100 || code > 599) {
    throw new Error("Error code must be a valid HTTP status code (100-599)");
  }

  if (!message || typeof message !== "string") {
    throw new Error("Error message must be a non-empty string");
  }

  const validErrorTypes: ErrorType[] = [
    "validation",
    "network",
    "timeout",
    "http",
    "unknown",
  ];
  if (!validErrorTypes.includes(type)) {
    throw new Error(`Error type must be one of: ${validErrorTypes.join(", ")}`);
  }

  return {
    status: RequestStatus.ERROR,
    code,
    message: message.trim(),
    type,
  };
}

/**
 * Type guard to check if a result is successful
 * Pure function - no side effects, deterministic output
 *
 * @param result - Request result to check
 * @returns True if the result is successful
 */
export function isSuccessResult<T>(
  result: RequestResult<T>,
): result is { status: RequestStatus.SUCCESS; data: T } {
  return result.status === RequestStatus.SUCCESS;
}

/**
 * Type guard to check if a result is an error
 * Pure function - no side effects, deterministic output
 *
 * @param result - Request result to check
 * @returns True if the result is an error
 */
export function isErrorResult<T>(
  result: RequestResult<T>,
): result is {
  status: RequestStatus.ERROR;
  code: number;
  message: string;
  type: ErrorType;
} {
  return result.status === RequestStatus.ERROR;
}

/**
 * Extracts data from a success result with null safety
 * Pure function - no side effects, deterministic output
 *
 * @param result - Request result
 * @returns Data if successful, null if error
 */
export function extractData<T>(result: RequestResult<T>): T | null {
  return isSuccessResult(result) ? result.data : null;
}

/**
 * Extracts error information from an error result with null safety
 * Pure function - no side effects, deterministic output
 *
 * @param result - Request result
 * @returns Error information if error, null if successful
 */
export function extractError<T>(
  result: RequestResult<T>,
): { code: number; message: string; type: ErrorType } | null {
  return isErrorResult(result)
    ? { code: result.code, message: result.message, type: result.type }
    : null;
}

/**
 * Safely extracts data with a default value
 * Pure function - no side effects, deterministic output
 *
 * @param result - Request result
 * @param defaultValue - Default value to return if error
 * @returns Data if successful, default value if error
 */
export function extractDataWithDefault<T>(
  result: RequestResult<T>,
  defaultValue: T,
): T {
  return isSuccessResult(result) ? result.data : defaultValue;
}

/**
 * Maps a successful result to a new type
 * Pure function - no side effects, deterministic output
 *
 * @param result - Request result
 * @param mapper - Function to transform successful data
 * @returns New result with transformed data or original error
 */
export function mapSuccessResult<T, U>(
  result: RequestResult<T>,
  mapper: (data: T) => U,
): RequestResult<U> {
  if (isSuccessResult(result)) {
    return createSuccessResult(mapper(result.data));
  }

  return result as RequestResult<U>;
}
