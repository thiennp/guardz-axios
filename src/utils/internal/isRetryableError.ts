import { isAxiosError, categorizeAxiosError } from '../../guards/axios-error-guards';

/**
 * Determines if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isAxiosError(error)) {
    const categorized = categorizeAxiosError(error);
    return categorized.category === 'network' || 
           categorized.category === 'timeout' ||
           (typeof categorized.statusCode === 'number' && categorized.statusCode >= 500);
  }
  
  // Handle regular Error objects (for testing)
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('timeout') || 
           message.includes('server');
  }
  
  return false;
} 