import { TypeGuardFn } from 'guardz';
import { HttpStatus, SuccessStatus, RedirectStatus, ClientErrorStatus, ServerErrorStatus } from '@/types/axios-types';

/**
 * Type guard for valid HTTP status codes
 */
export const isHttpStatus: TypeGuardFn<HttpStatus> = function (value: unknown, config?: any): value is HttpStatus {
  if (typeof value !== 'number') {
    return false;
  }
  
  return value >= 100 && value < 600;
};

/**
 * Type guard for success status codes (2xx)
 */
export const isSuccessStatus: TypeGuardFn<SuccessStatus> = function (value: unknown, config?: any): value is SuccessStatus {
  if (!isHttpStatus(value, config)) {
    return false;
  }
  
  return value >= 200 && value < 300;
};

/**
 * Type guard for redirect status codes (3xx)
 */
export const isRedirectStatus: TypeGuardFn<RedirectStatus> = function (value: unknown, config?: any): value is RedirectStatus {
  if (!isHttpStatus(value, config)) {
    return false;
  }
  
  return value >= 300 && value < 400;
};

/**
 * Type guard for client error status codes (4xx)
 */
export const isClientErrorStatus: TypeGuardFn<ClientErrorStatus> = function (value: unknown, config?: any): value is ClientErrorStatus {
  if (!isHttpStatus(value, config)) {
    return false;
  }
  
  return value >= 400 && value < 500;
};

/**
 * Type guard for server error status codes (5xx)
 */
export const isServerErrorStatus: TypeGuardFn<ServerErrorStatus> = function (value: unknown, config?: any): value is ServerErrorStatus {
  if (!isHttpStatus(value, config)) {
    return false;
  }
  
  return value >= 500 && value < 600;
};

/**
 * Type guard for specific status codes
 */
export const isStatus200: TypeGuardFn<200> = (value: unknown, config?: any): value is 200 => value === 200;
export const isStatus201: TypeGuardFn<201> = (value: unknown, config?: any): value is 201 => value === 201;
export const isStatus204: TypeGuardFn<204> = (value: unknown, config?: any): value is 204 => value === 204;
export const isStatus400: TypeGuardFn<400> = (value: unknown, config?: any): value is 400 => value === 400;
export const isStatus401: TypeGuardFn<401> = (value: unknown, config?: any): value is 401 => value === 401;
export const isStatus403: TypeGuardFn<403> = (value: unknown, config?: any): value is 403 => value === 403;
export const isStatus404: TypeGuardFn<404> = (value: unknown, config?: any): value is 404 => value === 404;
export const isStatus422: TypeGuardFn<422> = (value: unknown, config?: any): value is 422 => value === 422;
export const isStatus429: TypeGuardFn<429> = (value: unknown, config?: any): value is 429 => value === 429;
export const isStatus500: TypeGuardFn<500> = (value: unknown, config?: any): value is 500 => value === 500;
export const isStatus502: TypeGuardFn<502> = (value: unknown, config?: any): value is 502 => value === 502;
export const isStatus503: TypeGuardFn<503> = (value: unknown, config?: any): value is 503 => value === 503;

/**
 * Creates a type guard for a specific status code
 */
export function createStatusGuard<T extends number>(statusCode: T): TypeGuardFn<T> {
  return function (value: unknown, config?: any): value is T {
    return value === statusCode;
  };
}

/**
 * Status code category checker
 */
export function getStatusCategory(status: number): 'success' | 'redirect' | 'client-error' | 'server-error' | 'unknown' {
  if (isSuccessStatus(status)) return 'success';
  if (isRedirectStatus(status)) return 'redirect';
  if (isClientErrorStatus(status)) return 'client-error';
  if (isServerErrorStatus(status)) return 'server-error';
  return 'unknown';
}

/**
 * Check if status indicates retryable error
 */
export function isRetryableStatus(status: number): boolean {
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  return retryableStatuses.includes(status);
}

/**
 * Check if status indicates success that might have response body
 */
export function hasResponseBody(status: number): boolean {
  // 204 No Content and 304 Not Modified typically don't have response body
  return status !== 204 && status !== 304;
}

/**
 * Common status code validators
 */
export const StatusValidators = {
  isOk: isStatus200,
  isCreated: isStatus201,
  isNoContent: isStatus204,
  isBadRequest: isStatus400,
  isUnauthorized: isStatus401,
  isForbidden: isStatus403,
  isNotFound: isStatus404,
  isValidationError: isStatus422,
  isRateLimit: isStatus429,
  isInternalServerError: isStatus500,
  isBadGateway: isStatus502,
  isServiceUnavailable: isStatus503,
} as const; 