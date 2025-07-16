import { TypeGuardFn, isType, isString, isBoolean, isUndefinedOr } from 'guardz';
import { AxiosError, AxiosResponse } from 'axios';
import { 
  AxiosErrorGuarded, 
  NetworkError, 
  TimeoutError, 
  CancelError, 
  ResponseError,
  ClientErrorStatus,
  ServerErrorStatus 
} from '@/types/axios-types';

/**
 * Type guard for basic AxiosError structure
 */
export const isAxiosError: TypeGuardFn<AxiosError> = function (value: unknown, config?: any): value is AxiosError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const error = value as any;
  
  // Check required properties
  if (typeof error.message !== 'string' || 
      typeof error.name !== 'string' || 
      error.isAxiosError !== true) {
    return false;
  }
  
  // Check optional properties
  if (error.response !== undefined && 
      (typeof error.response !== 'object' || error.response === null)) {
    return false;
  }
  
  if (error.config !== undefined && 
      (typeof error.config !== 'object' || error.config === null)) {
    return false;
  }
  
  if (error.code !== undefined && typeof error.code !== 'string') {
    return false;
  }
  
  if (error.status !== undefined && typeof error.status !== 'number') {
    return false;
  }
  
  return true;
};

/**
 * Type guard for AxiosError with response (4xx/5xx errors)
 */
export const isAxiosErrorWithResponse: TypeGuardFn<ResponseError> = function (value: unknown, config?: any): value is ResponseError {
  if (!isAxiosError(value, config)) {
    return false;
  }
  
  return value.response !== undefined && value.response !== null;
};

/**
 * Type guard for network errors (no response received)
 */
export const isNetworkError: TypeGuardFn<NetworkError> = function (value: unknown, config?: any): value is NetworkError {
  if (!isAxiosError(value, config)) {
    return false;
  }
  
  const networkCodes = ['ECONNABORTED', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ERR_NETWORK'];
  return value.code !== undefined && networkCodes.includes(value.code);
};

/**
 * Type guard for timeout errors
 */
export const isTimeoutError: TypeGuardFn<TimeoutError> = function (value: unknown, config?: any): value is TimeoutError {
  if (!isAxiosError(value, config)) {
    return false;
  }
  
  const timeoutCodes = ['ECONNABORTED', 'ETIMEDOUT'];
  return value.code !== undefined && timeoutCodes.includes(value.code);
};

/**
 * Type guard for cancel errors
 */
export const isCancelError: TypeGuardFn<CancelError> = function (value: unknown, config?: any): value is CancelError {
  if (!isAxiosError(value, config)) {
    return false;
  }
  
  return value.code === 'ERR_CANCELED';
};

/**
 * Type guard for client errors (4xx status codes)
 */
export const isClientError: TypeGuardFn<AxiosError & { response: AxiosResponse & { status: ClientErrorStatus } }> = function (value: unknown, config?: any): value is AxiosError & { response: AxiosResponse & { status: ClientErrorStatus } } {
  if (!isAxiosErrorWithResponse(value, config)) {
    return false;
  }
  
  return value.response.status >= 400 && value.response.status < 500;
};

/**
 * Type guard for server errors (5xx status codes)
 */
export const isServerError: TypeGuardFn<AxiosError & { response: AxiosResponse & { status: ServerErrorStatus } }> = function (value: unknown, config?: any): value is AxiosError & { response: AxiosResponse & { status: ServerErrorStatus } } {
  if (!isAxiosErrorWithResponse(value, config)) {
    return false;
  }
  
  return value.response.status >= 500 && value.response.status < 600;
};

/**
 * Type guard for authentication errors (401 Unauthorized)
 */
export const isAuthenticationError: TypeGuardFn<AxiosError & { response: AxiosResponse & { status: 401 } }> = function (value: unknown, config?: any): value is AxiosError & { response: AxiosResponse & { status: 401 } } {
  if (!isAxiosErrorWithResponse(value, config)) {
    return false;
  }
  
  return value.response.status === 401;
};

/**
 * Type guard for authorization errors (403 Forbidden)
 */
export const isAuthorizationError: TypeGuardFn<AxiosError & { response: AxiosResponse & { status: 403 } }> = function (value: unknown, config?: any): value is AxiosError & { response: AxiosResponse & { status: 403 } } {
  if (!isAxiosErrorWithResponse(value, config)) {
    return false;
  }
  
  return value.response.status === 403;
};

/**
 * Type guard for not found errors (404 Not Found)
 */
export const isNotFoundError: TypeGuardFn<AxiosError & { response: AxiosResponse & { status: 404 } }> = function (value: unknown, config?: any): value is AxiosError & { response: AxiosResponse & { status: 404 } } {
  if (!isAxiosErrorWithResponse(value, config)) {
    return false;
  }
  
  return value.response.status === 404;
};

/**
 * Type guard for validation errors (422 Unprocessable Entity)
 */
export const isValidationError: TypeGuardFn<AxiosError & { response: AxiosResponse & { status: 422 } }> = function (value: unknown, config?: any): value is AxiosError & { response: AxiosResponse & { status: 422 } } {
  if (!isAxiosErrorWithResponse(value, config)) {
    return false;
  }
  
  return value.response.status === 422;
};

/**
 * Type guard for rate limit errors (429 Too Many Requests)
 */
export const isRateLimitError: TypeGuardFn<AxiosError & { response: AxiosResponse & { status: 429 } }> = function (value: unknown, config?: any): value is AxiosError & { response: AxiosResponse & { status: 429 } } {
  if (!isAxiosErrorWithResponse(value, config)) {
    return false;
  }
  
  return value.response.status === 429;
};

/**
 * Type guard for specific error status code
 */
export function isErrorWithStatus<T extends number>(statusCode: T): TypeGuardFn<AxiosError & { response: AxiosResponse & { status: T } }> {
  return function (value: unknown, config?: any): value is AxiosError & { response: AxiosResponse & { status: T } } {
    if (!isAxiosErrorWithResponse(value, config)) {
      return false;
    }
    
    return value.response.status === statusCode;
  };
}

/**
 * Type guard for specific error code
 */
export function isErrorWithCode<T extends string>(errorCode: T): TypeGuardFn<AxiosError & { code: T }> {
  return function (value: unknown, config?: any): value is AxiosError & { code: T } {
    if (!isAxiosError(value, config)) {
      return false;
    }
    
    return value.code === errorCode;
  };
}

/**
 * Comprehensive error categorization function
 */
export function categorizeAxiosError(error: unknown): {
  isAxiosError: boolean;
  category: 'network' | 'timeout' | 'cancel' | 'client' | 'server' | 'unknown';
  statusCode?: number;
  errorCode?: string;
  hasResponse: boolean;
} {
  if (!isAxiosError(error)) {
    return {
      isAxiosError: false,
      category: 'unknown',
      hasResponse: false,
    };
  }

  const result = {
    isAxiosError: true,
    statusCode: error.response?.status,
    errorCode: error.code,
    hasResponse: !!error.response,
    category: 'unknown' as 'network' | 'timeout' | 'cancel' | 'client' | 'server' | 'unknown',
  };

  if (isCancelError(error)) {
    result.category = 'cancel';
  } else if (isTimeoutError(error)) {
    result.category = 'timeout';
  } else if (isNetworkError(error)) {
    result.category = 'network';
  } else if (isClientError(error)) {
    result.category = 'client';
  } else if (isServerError(error)) {
    result.category = 'server';
  }

  return result;
} 