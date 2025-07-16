import axios, { AxiosRequestConfig } from 'axios';
import { guardWithTolerance } from 'guardz';
import type { TypeGuardFn, TypeGuardFnConfig } from 'guardz';
import { isAxiosError, categorizeAxiosError } from '../../guards/axios-error-guards';
import { isAxiosResponse } from '../../guards/axios-response-guards';
import { Status } from '../../types/status-types';
import type { SafeRequestConfig } from '../types/SafeRequestConfig';
import type { SafeRequestResult } from '../types/SafeRequestResult';
import type { ErrorContext } from '../types/ErrorContext';
import { isRetryableError } from './isRetryableError';

/**
 * Core execution function with retry logic and comprehensive error handling
 */
export async function executeRequest<T>(
  axiosConfig: AxiosRequestConfig,
  safeConfig: SafeRequestConfig<T>
): Promise<SafeRequestResult<T>> {
  const {
    guard,
    tolerance = false,
    identifier,
    onTypeMismatch,
    axiosInstance = axios,
    validateResponse = true,
    retry,
    timeout
  } = safeConfig;

  const finalConfig = {
    ...axiosConfig,
    timeout: timeout || axiosConfig.timeout,
  };

  const url = finalConfig.url || '';
  const method = (finalConfig.method || 'GET').toUpperCase();
  let attempt = 0;
  const maxAttempts = retry?.attempts || 1;

  while (attempt < maxAttempts) {
    attempt++;

    try {
      // Add delay for retries
      if (attempt > 1 && retry) {
        const delay = retry.backoff === 'exponential' 
          ? retry.delay * Math.pow(2, attempt - 2)
          : retry.delay * (attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const response = await axiosInstance.request(finalConfig);

      // Validate response structure if requested
      if (validateResponse && !isAxiosResponse(response)) {
        const errorMsg = 'Invalid response structure';
        const context: ErrorContext = {
          type: 'validation',
          url,
          method,
          originalError: response,
        };

        onTypeMismatch?.(errorMsg, context);

        if (!tolerance) {
          return { status: Status.ERROR, code: 500, message: errorMsg };
        }
      }

      // Validate response data
      let validatedData: T;
      let isValidated = true;
      let validationErrors: string[] = [];

      if (tolerance) {
        // Use tolerance mode
        const errorMessages: string[] = [];
        const toleranceConfig: TypeGuardFnConfig = {
          identifier: identifier || url,
          callbackOnError: (errorMessage: string) => {
            errorMessages.push(errorMessage);
            onTypeMismatch?.(errorMessage, {
              type: 'validation',
              url,
              method,
              originalError: response.data,
            });
          }
        };

        validatedData = guardWithTolerance(response.data, guard, toleranceConfig);
        
        if (errorMessages.length > 0) {
          isValidated = false;
          validationErrors = errorMessages;
        }
      } else {
        // Strict mode
        const errorMessages: string[] = [];
        const strictConfig: TypeGuardFnConfig = {
          identifier: identifier || url,
          callbackOnError: (errorMessage: string) => {
            errorMessages.push(errorMessage);
          }
        };

        if (guard(response.data, strictConfig)) {
          validatedData = response.data;
        } else {
          const errorMsg = errorMessages.length > 0 
            ? `Response data validation failed: ${errorMessages.join(', ')}`
            : 'Response data validation failed';
          const context: ErrorContext = {
            type: 'validation',
            url,
            method,
            originalError: response.data,
          };

          onTypeMismatch?.(errorMsg, context);

          return { status: Status.ERROR, code: 500, message: errorMsg };
        }
      }

      return { status: Status.SUCCESS, data: validatedData };

    } catch (error) {
      // Check if we should retry
      const shouldRetry = attempt < maxAttempts && 
        Boolean(retry?.retryOn ? retry.retryOn(error) : isRetryableError(error));

      if (!shouldRetry) {
        // Handle final error
        let errorType: ErrorContext['type'] = 'unknown';
        let statusCode: number | undefined;

        if (isAxiosError(error)) {
          const categorized = categorizeAxiosError(error);
          errorType = categorized.category === 'network' ? 'network' : 
                     categorized.category === 'timeout' ? 'timeout' : 'unknown';
          statusCode = categorized.statusCode;
        }

        const context: ErrorContext = {
          type: errorType,
          url,
          method,
          statusCode,
          originalError: error,
        };

        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        onTypeMismatch?.(errorMsg, context);

        return { status: Status.ERROR, code: 500, message: errorMsg };
      }
      // If shouldRetry is true, continue to next iteration
    }
  }

  // This should never be reached, but TypeScript requires it
  return { status: Status.ERROR, code: 500, message: 'Maximum retry attempts exceeded' };
} 