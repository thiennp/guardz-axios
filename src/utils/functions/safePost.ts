import type { AxiosRequestConfig } from "axios";
import type { SafeRequestConfig } from "../types/SafeRequestConfig";
import type { SafeRequestResult } from "../types/SafeRequestResult";
import { executeRequest } from "../internal/executeRequest";

/**
 * Pattern 1: Curried Function for POST requests
 * Usage: const createUserSafely = safePost({ guard: isUser });
 *        const result = await createUserSafely('/users', userData);
 */
export function safePost<T>(config: SafeRequestConfig<T>) {
  return async (
    url: string,
    data?: any,
    axiosConfig?: AxiosRequestConfig,
  ): Promise<SafeRequestResult<T>> => {
    return executeRequest(
      {
        ...axiosConfig,
        url,
        method: "POST",
        data,
      },
      config,
    );
  };
}
