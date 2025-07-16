/**
 * Retry configuration for safe axios operations
 */
export interface RetryConfig {
  attempts: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
  retryOn?: (error: unknown) => boolean;
} 