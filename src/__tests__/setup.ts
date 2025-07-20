/**
 * Global test setup
 * Configures Jest environment and global test utilities
 */

// Increase timeout for all tests
jest.setTimeout(10000);

// Suppress console output during tests
const originalConsole = {
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  log: console.log,
};

beforeAll(() => {
  // Only suppress if not in debug mode
  if (process.env.NODE_ENV !== "test-debug") {
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
    console.log = jest.fn();
  }
});

afterAll(() => {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
  console.log = originalConsole.log;
});

// Global test utilities
(global as Record<string, unknown>).testUtils = {
  // Create a mock HTTP client for testing
  createMockHttpClient: (responses: Record<string, unknown> = {}) => ({
    request: jest.fn().mockImplementation((config: Record<string, unknown>) => {
      const key = `${config.method}_${config.url}`;
      const response = responses[key];

      if (response) {
        return Promise.resolve(response);
      }

      // Default success response
      return Promise.resolve({
        data: { id: 1, name: "Test User" },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      });
    }),
  }),

  // Create a mock logger for testing
  createMockLogger: () => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  }),

  // Wait for a specified number of milliseconds
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Create test data
  createTestUser: () => ({
    id: 1,
    name: "Test User",
    email: "test@example.com",
  }),

  // Create test error
  createTestError: (message: string, code?: string) => {
    const error = new Error(message);
    if (code) {
      (error as unknown as Record<string, unknown>).code = code;
    }
    return error;
  },
};

// Export test utilities for use in tests
export const testUtils = (global as Record<string, unknown>).testUtils;
