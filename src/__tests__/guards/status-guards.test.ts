/**
 * Status Guards Tests
 * Comprehensive tests for all status guard functions
 */

import {
  isHttpStatus,
  isSuccessStatus,
  isRedirectStatus,
  isClientErrorStatus,
  isServerErrorStatus,
  isStatus200,
  isStatus201,
  isStatus204,
  isStatus400,
  isStatus401,
  isStatus403,
  isStatus404,
  isStatus422,
  isStatus429,
  isStatus500,
  isStatus502,
  isStatus503,
  createStatusGuard,
  getStatusCategory,
  isRetryableStatus,
  hasResponseBody,
  StatusValidators,
} from "../../guards/status-guards";

describe("Status Guards", () => {
  describe("isHttpStatus", () => {
    it("should accept valid HTTP status codes", () => {
      const validStatuses = [100, 200, 300, 400, 500, 599];
      validStatuses.forEach((status) => {
        expect(isHttpStatus(status)).toBe(true);
      });
    });

    it("should reject invalid HTTP status codes", () => {
      const invalidStatuses = [0, 99, 600, 1000, -1];
      invalidStatuses.forEach((status) => {
        expect(isHttpStatus(status)).toBe(false);
      });
    });

    it("should reject non-numbers", () => {
      expect(isHttpStatus("200")).toBe(false);
      expect(isHttpStatus(null)).toBe(false);
      expect(isHttpStatus(undefined)).toBe(false);
      expect(isHttpStatus({})).toBe(false);
    });
  });

  describe("isSuccessStatus", () => {
    it("should accept success status codes (2xx)", () => {
      const successStatuses = [200, 201, 202, 204, 299];
      successStatuses.forEach((status) => {
        expect(isSuccessStatus(status)).toBe(true);
      });
    });

    it("should reject non-success status codes", () => {
      const nonSuccessStatuses = [100, 300, 400, 500];
      nonSuccessStatuses.forEach((status) => {
        expect(isSuccessStatus(status)).toBe(false);
      });
    });
  });

  describe("isRedirectStatus", () => {
    it("should accept redirect status codes (3xx)", () => {
      const redirectStatuses = [300, 301, 302, 303, 304, 307, 308, 399];
      redirectStatuses.forEach((status) => {
        expect(isRedirectStatus(status)).toBe(true);
      });
    });

    it("should reject non-redirect status codes", () => {
      const nonRedirectStatuses = [100, 200, 400, 500];
      nonRedirectStatuses.forEach((status) => {
        expect(isRedirectStatus(status)).toBe(false);
      });
    });
  });

  describe("isClientErrorStatus", () => {
    it("should accept client error status codes (4xx)", () => {
      const clientErrorStatuses = [400, 401, 403, 404, 422, 429, 499];
      clientErrorStatuses.forEach((status) => {
        expect(isClientErrorStatus(status)).toBe(true);
      });
    });

    it("should reject non-client error status codes", () => {
      const nonClientErrorStatuses = [100, 200, 300, 500];
      nonClientErrorStatuses.forEach((status) => {
        expect(isClientErrorStatus(status)).toBe(false);
      });
    });
  });

  describe("isServerErrorStatus", () => {
    it("should accept server error status codes (5xx)", () => {
      const serverErrorStatuses = [500, 502, 503, 504, 599];
      serverErrorStatuses.forEach((status) => {
        expect(isServerErrorStatus(status)).toBe(true);
      });
    });

    it("should reject non-server error status codes", () => {
      const nonServerErrorStatuses = [100, 200, 300, 400];
      nonServerErrorStatuses.forEach((status) => {
        expect(isServerErrorStatus(status)).toBe(false);
      });
    });
  });

  describe("Specific Status Guards", () => {
    it("should correctly identify specific status codes", () => {
      expect(isStatus200(200)).toBe(true);
      expect(isStatus200(201)).toBe(false);

      expect(isStatus201(201)).toBe(true);
      expect(isStatus201(200)).toBe(false);

      expect(isStatus204(204)).toBe(true);
      expect(isStatus204(200)).toBe(false);

      expect(isStatus400(400)).toBe(true);
      expect(isStatus400(401)).toBe(false);

      expect(isStatus401(401)).toBe(true);
      expect(isStatus401(400)).toBe(false);

      expect(isStatus403(403)).toBe(true);
      expect(isStatus403(401)).toBe(false);

      expect(isStatus404(404)).toBe(true);
      expect(isStatus404(400)).toBe(false);

      expect(isStatus422(422)).toBe(true);
      expect(isStatus422(400)).toBe(false);

      expect(isStatus429(429)).toBe(true);
      expect(isStatus429(400)).toBe(false);

      expect(isStatus500(500)).toBe(true);
      expect(isStatus500(400)).toBe(false);

      expect(isStatus502(502)).toBe(true);
      expect(isStatus502(500)).toBe(false);

      expect(isStatus503(503)).toBe(true);
      expect(isStatus503(500)).toBe(false);
    });
  });

  describe("createStatusGuard", () => {
    it("should create guards for specific status codes", () => {
      const is418Error = createStatusGuard(418);

      expect(is418Error(418)).toBe(true);
      expect(is418Error(200)).toBe(false);
      expect(is418Error(500)).toBe(false);
    });

    it("should work with different status code types", () => {
      const isCustomError = createStatusGuard(999);

      expect(isCustomError(999)).toBe(true);
      expect(isCustomError(200)).toBe(false);
    });
  });

  describe("getStatusCategory", () => {
    it("should categorize success statuses", () => {
      expect(getStatusCategory(200)).toBe("success");
      expect(getStatusCategory(201)).toBe("success");
      expect(getStatusCategory(204)).toBe("success");
    });

    it("should categorize redirect statuses", () => {
      expect(getStatusCategory(301)).toBe("redirect");
      expect(getStatusCategory(302)).toBe("redirect");
      expect(getStatusCategory(304)).toBe("redirect");
    });

    it("should categorize client error statuses", () => {
      expect(getStatusCategory(400)).toBe("client-error");
      expect(getStatusCategory(401)).toBe("client-error");
      expect(getStatusCategory(404)).toBe("client-error");
      expect(getStatusCategory(422)).toBe("client-error");
      expect(getStatusCategory(429)).toBe("client-error");
    });

    it("should categorize server error statuses", () => {
      expect(getStatusCategory(500)).toBe("server-error");
      expect(getStatusCategory(502)).toBe("server-error");
      expect(getStatusCategory(503)).toBe("server-error");
      expect(getStatusCategory(504)).toBe("server-error");
    });

    it("should categorize unknown statuses", () => {
      expect(getStatusCategory(0)).toBe("unknown");
      expect(getStatusCategory(99)).toBe("unknown");
      expect(getStatusCategory(600)).toBe("unknown");
    });
  });

  describe("isRetryableStatus", () => {
    it("should identify retryable status codes", () => {
      const retryableStatuses = [408, 429, 500, 502, 503, 504];
      retryableStatuses.forEach((status) => {
        expect(isRetryableStatus(status)).toBe(true);
      });
    });

    it("should reject non-retryable status codes", () => {
      const nonRetryableStatuses = [200, 201, 400, 401, 403, 404, 422];
      nonRetryableStatuses.forEach((status) => {
        expect(isRetryableStatus(status)).toBe(false);
      });
    });
  });

  describe("hasResponseBody", () => {
    it("should identify statuses that typically have response body", () => {
      const statusesWithBody = [200, 201, 400, 401, 404, 500];
      statusesWithBody.forEach((status) => {
        expect(hasResponseBody(status)).toBe(true);
      });
    });

    it("should identify statuses that typically do not have response body", () => {
      expect(hasResponseBody(204)).toBe(false);
      expect(hasResponseBody(304)).toBe(false);
    });
  });

  describe("StatusValidators", () => {
    it("should provide working status validators", () => {
      expect(StatusValidators.isOk(200)).toBe(true);
      expect(StatusValidators.isOk(201)).toBe(false);

      expect(StatusValidators.isCreated(201)).toBe(true);
      expect(StatusValidators.isCreated(200)).toBe(false);

      expect(StatusValidators.isNoContent(204)).toBe(true);
      expect(StatusValidators.isNoContent(200)).toBe(false);

      expect(StatusValidators.isBadRequest(400)).toBe(true);
      expect(StatusValidators.isBadRequest(401)).toBe(false);

      expect(StatusValidators.isUnauthorized(401)).toBe(true);
      expect(StatusValidators.isUnauthorized(400)).toBe(false);

      expect(StatusValidators.isForbidden(403)).toBe(true);
      expect(StatusValidators.isForbidden(401)).toBe(false);

      expect(StatusValidators.isNotFound(404)).toBe(true);
      expect(StatusValidators.isNotFound(400)).toBe(false);

      expect(StatusValidators.isValidationError(422)).toBe(true);
      expect(StatusValidators.isValidationError(400)).toBe(false);

      expect(StatusValidators.isRateLimit(429)).toBe(true);
      expect(StatusValidators.isRateLimit(400)).toBe(false);

      expect(StatusValidators.isInternalServerError(500)).toBe(true);
      expect(StatusValidators.isInternalServerError(400)).toBe(false);

      expect(StatusValidators.isBadGateway(502)).toBe(true);
      expect(StatusValidators.isBadGateway(500)).toBe(false);

      expect(StatusValidators.isServiceUnavailable(503)).toBe(true);
      expect(StatusValidators.isServiceUnavailable(500)).toBe(false);
    });

    it("should be immutable", () => {
      expect(() => {
        (StatusValidators as any).isOk = () => false;
      }).toThrow();
    });
  });
});
