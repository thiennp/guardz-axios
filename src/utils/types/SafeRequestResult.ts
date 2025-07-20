import { Status } from "../../types/status-types";

/**
 * Result type for safe axios requests
 */
export type SafeRequestResult<T> =
  | { status: Status.SUCCESS; data: T }
  | { status: Status.ERROR; code: number; message: string };
