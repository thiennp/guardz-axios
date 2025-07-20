import {
  TypeGuardFn,
  isType,
  isNumber,
  isString,
  isNonNullObject,
} from "guardz";
import { AxiosResponse } from "axios";
import {
  AxiosResponseGuarded,
  SuccessStatus,
  RedirectStatus,
  ClientErrorStatus,
  ServerErrorStatus,
} from "@/types/axios-types";

/**
 * Type guard for basic AxiosResponse structure
 */
export const isAxiosResponse: TypeGuardFn<AxiosResponse> = function (
  value,
  config,
): value is AxiosResponse {
  return isType<AxiosResponse>({
    data: (v: unknown): v is any => true, // data can be anything
    status: isNumber,
    statusText: isString,
    headers: (v: unknown): v is any => isNonNullObject(v),
    config: (v: unknown): v is any => isNonNullObject(v),
    request: (v: unknown): v is any => true, // request can be anything
  })(value, config);
};

/**
 * Creates a type guard for AxiosResponse with specific data type validation
 */
export function isAxiosResponseWithData<T>(
  dataGuard: TypeGuardFn<T>,
): TypeGuardFn<AxiosResponseGuarded<T>> {
  return function (value, config): value is AxiosResponseGuarded<T> {
    return isType<AxiosResponseGuarded<T>>({
      data: dataGuard,
      status: isNumber,
      statusText: isString,
      headers: (v: unknown): v is any => isNonNullObject(v),
      config: (v: unknown): v is any => isNonNullObject(v),
      request: (v: unknown): v is any => true,
    })(value, config);
  };
}

/**
 * Type guard for successful HTTP response (2xx status codes)
 */
export const isSuccessResponse: TypeGuardFn<
  AxiosResponse & { status: SuccessStatus }
> = function (
  value,
  config,
): value is AxiosResponse & { status: SuccessStatus } {
  if (!isAxiosResponse(value, config)) {
    return false;
  }

  return value.status >= 200 && value.status < 300;
};

/**
 * Creates a type guard for successful response with specific data type
 */
export function isSuccessResponseWithData<T>(
  dataGuard: TypeGuardFn<T>,
): TypeGuardFn<AxiosResponseGuarded<T> & { status: SuccessStatus }> {
  return function (
    value,
    config,
  ): value is AxiosResponseGuarded<T> & { status: SuccessStatus } {
    return (
      isAxiosResponseWithData(dataGuard)(value, config) &&
      isSuccessResponse(value, config)
    );
  };
}

/**
 * Type guard for redirect response (3xx status codes)
 */
export const isRedirectResponse: TypeGuardFn<
  AxiosResponse & { status: RedirectStatus }
> = function (
  value,
  config,
): value is AxiosResponse & { status: RedirectStatus } {
  if (!isAxiosResponse(value, config)) {
    return false;
  }

  return value.status >= 300 && value.status < 400;
};

/**
 * Type guard for client error response (4xx status codes)
 */
export const isClientErrorResponse: TypeGuardFn<
  AxiosResponse & { status: ClientErrorStatus }
> = function (
  value,
  config,
): value is AxiosResponse & { status: ClientErrorStatus } {
  if (!isAxiosResponse(value, config)) {
    return false;
  }

  return value.status >= 400 && value.status < 500;
};

/**
 * Type guard for server error response (5xx status codes)
 */
export const isServerErrorResponse: TypeGuardFn<
  AxiosResponse & { status: ServerErrorStatus }
> = function (
  value,
  config,
): value is AxiosResponse & { status: ServerErrorStatus } {
  if (!isAxiosResponse(value, config)) {
    return false;
  }

  return value.status >= 500 && value.status < 600;
};

/**
 * Type guard for specific status code
 */
export function isResponseWithStatus<T extends number>(
  statusCode: T,
): TypeGuardFn<AxiosResponse & { status: T }> {
  return function (value, config): value is AxiosResponse & { status: T } {
    return isAxiosResponse(value, config) && value.status === statusCode;
  };
}

/**
 * Type guard for response with specific content type
 */
export function isResponseWithContentType(
  contentType: string,
): TypeGuardFn<AxiosResponse> {
  return function (value, config): value is AxiosResponse {
    if (!isAxiosResponse(value, config)) {
      return false;
    }

    const responseContentType =
      value.headers["content-type"] || value.headers["Content-Type"];
    return (
      typeof responseContentType === "string" &&
      responseContentType.includes(contentType)
    );
  };
}

/**
 * Type guard for JSON response
 */
export const isJsonResponse: TypeGuardFn<AxiosResponse> =
  isResponseWithContentType("application/json");

/**
 * Type guard for empty response (204 No Content)
 */
export const isEmptyResponse: TypeGuardFn<AxiosResponse & { status: 204 }> =
  function (value, config) {
    return isResponseWithStatus(204)(value, config);
  };

/**
 * Type guard for created response (201 Created)
 */
export const isCreatedResponse: TypeGuardFn<AxiosResponse & { status: 201 }> =
  function (value, config) {
    return isResponseWithStatus(201)(value, config);
  };

/**
 * Creates a type guard for created response with specific data type
 */
export function isCreatedResponseWithData<T>(
  dataGuard: TypeGuardFn<T>,
): TypeGuardFn<AxiosResponseGuarded<T> & { status: 201 }> {
  return function (
    value,
    config,
  ): value is AxiosResponseGuarded<T> & { status: 201 } {
    return (
      isAxiosResponseWithData(dataGuard)(value, config) &&
      isCreatedResponse(value, config)
    );
  };
}
