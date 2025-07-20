import type { AxiosRequestConfig } from "axios";
import type { TypeGuardFn } from "guardz";
import type { SafeRequestConfig } from "../types/SafeRequestConfig";
import type { SafeRequestResult } from "../types/SafeRequestResult";
import { executeRequest } from "../internal/executeRequest";

/**
 * Pattern 1: Curried Function (Google/Ramda style)
 * Usage: const getUserSafely = safeGet({ guard: isUser, onTypeMismatch: ... });
 *        const result = await getUserSafely('/users/1');
 */
export function safeGet<T>(config: SafeRequestConfig<T>) {
  return async (
    url: string,
    axiosConfig?: AxiosRequestConfig,
  ): Promise<SafeRequestResult<T>> => {
    return executeRequest(
      {
        ...axiosConfig,
        url,
        method: "GET",
      },
      config,
    );
  };
}
