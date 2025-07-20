import type { AxiosRequestConfig } from "axios";
import type { SafeRequestConfig } from "../types/SafeRequestConfig";
import type { SafeRequestResult } from "../types/SafeRequestResult";
import { executeRequest } from "../internal/executeRequest";

/**
 * Pattern 1: Curried Function for DELETE requests
 * Usage: const deleteUserSafely = safeDelete({ guard: isUser });
 *        const result = await deleteUserSafely('/users/1');
 */
export function safeDelete<T>(config: SafeRequestConfig<T>) {
  return async (
    url: string,
    axiosConfig?: AxiosRequestConfig,
  ): Promise<SafeRequestResult<T>> => {
    return executeRequest(
      {
        ...axiosConfig,
        url,
        method: "DELETE",
      },
      config,
    );
  };
}
