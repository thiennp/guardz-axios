import type { AxiosInstance } from 'axios';
import type { RetryConfig } from './RetryConfig';
import type { ErrorContext } from './ErrorContext';

/**
 * Configuration for SafeApiContext
 */
export interface SafeApiContextConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  defaultTolerance?: boolean;
  defaultRetry?: RetryConfig;
  onError?: (error: string, context: ErrorContext) => void;
  axiosInstance?: AxiosInstance;
} 