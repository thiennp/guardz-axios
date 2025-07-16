import type { TypeGuardFn } from 'guardz';
import { safePost } from '../functions/safePost';

/**
 * Utility function to create a typed safe POST function
 */
export function createTypedSafePost<T>(guard: TypeGuardFn<T>) {
  return safePost({ guard });
} 