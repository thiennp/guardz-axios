/**
 * Status enum for discriminated union results
 */
export enum Status {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

/**
 * Discriminated union for safe API results
 */
export type SafeResult<T, E = Error> = 
  | { status: Status.SUCCESS; data: T }
  | { status: Status.ERROR; data: E };

/**
 * Type helper to extract success data type
 */
export type SuccessData<T> = T extends { status: Status.SUCCESS; data: infer D } ? D : never;

/**
 * Type helper to extract error data type
 */
export type ErrorData<T> = T extends { status: Status.ERROR; data: infer E } ? E : never;

/**
 * Type helper for API response results
 */
export type ApiResult<T> = SafeResult<T, import('axios').AxiosError>; 