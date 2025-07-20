import type { AxiosRequestConfig } from "axios";
import type { SafeRequestConfig } from "../types/SafeRequestConfig";
import type { SafeRequestResult } from "../types/SafeRequestResult";
import { executeRequest } from "../internal/executeRequest";

/**
 * Pattern 1: Curried Function for PATCH requests
 * Usage: const patchUserSafely = safePatch({ guard: isUser });
 *        const result = await patchUserSafely('/users/1', userData);
 */
export function safePatch<T>(config: SafeRequestConfig<T>) {
  return async (
    url: string,
    data?: any,
    axiosConfig?: AxiosRequestConfig,
  ): Promise<SafeRequestResult<T>> => {
    return executeRequest(
      {
        ...axiosConfig,
        url,
        method: "PATCH",
        data,
      },
      config,
    );
  };
}
