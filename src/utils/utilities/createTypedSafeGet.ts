import type { TypeGuardFn } from "guardz";
import { safeGet } from "../functions/safeGet";

/**
 * Utility function to create a typed safe GET function
 */
export function createTypedSafeGet<T>(guard: TypeGuardFn<T>) {
  return safeGet({ guard });
}
