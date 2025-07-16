import { 
  // Pattern 1: Curried Functions (Google/Ramda style)
  safeGet, 
  safePost, 
  safePut, 
  safePatch, 
  safeDelete,
  
  // Pattern 2: Configuration-first (Apollo/React Query style)
  safeRequest,
  
  // Pattern 3: Fluent API Builder
  safe,
  
  // Pattern 4: Context/Provider (React style)
  createSafeApiContext,
  
  // Types and utilities
  type SafeRequestResult,
  type SafeRequestConfig,
  type ErrorContext,
  type RetryConfig,
  createTypedSafeGet,
  createTypedSafePost,
} from '../src/utils/safe-axios';
import { Status } from '../src/types/status-types';

import { isType, isString, isNumber, isBoolean, isArrayWithEachItem } from 'guardz';

// Define data models and type guards
interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

interface Product {
  id: number;
  title: string;
  price: number;
  category: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

// Type guards
const isUser = isType<User>({
  id: isNumber,
  name: isString,
  email: isString,
  isActive: isBoolean,
});

const isProduct = isType<Product>({
  id: isNumber,
  title: isString,
  price: isNumber,
  category: isString,
});

const isApiResponse = <T>(dataGuard: (value: unknown) => value is T) =>
  isType<ApiResponse<T>>({
    success: isBoolean,
    data: dataGuard,
    message: (value: unknown): value is string | undefined => 
      value === undefined || isString(value),
    timestamp: isString,
  });

const isUserApiResponse = isApiResponse(isUser);
const isProductApiResponse = isApiResponse(isProduct);
const isUsersArray = isArrayWithEachItem(isUser);

/**
 * Pattern 1: Curried Functions
 * Best for: Reusable, composable API functions
 */
async function pattern1_CurriedFunctions() {
  console.log('\n=== Pattern 1: Curried Functions ===');
  
  // Create specialized functions
  const getUserSafely = safeGet({
    guard: isUser,
    tolerance: false,
    onError: (error, context) => {
      console.error(`❌ Failed to load user from ${context.url}: ${error}`);
    },
    retry: {
      attempts: 3,
      delay: 1000,
      backoff: 'exponential'
    }
  });

  const createUserSafely = safePost({
    guard: isUser,
    tolerance: false,
    onError: (error, context) => {
      console.error(`❌ Failed to create user: ${error}`);
    }
  });

  // Use the specialized functions
  try {
    // GET request
    const userResult = await getUserSafely('https://jsonplaceholder.typicode.com/users/1');
    if (userResult.status === Status.SUCCESS) {
      console.log('User data:', userResult.data);
    } else {
      console.log('Failed to get user:', userResult.message);
    }

    // POST request
    const newUser = {
      name: 'John Doe',
      email: 'john@example.com',
      isActive: true
    };
    
    const createResult = await createUserSafely(
      'https://jsonplaceholder.typicode.com/users',
      newUser
    );
    
    if (createResult.status === Status.SUCCESS) {
      console.log('Created user:', createResult.data);
    } else {
      console.log('Failed to create user:', createResult.message);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

/**
 * Pattern 2: Configuration-first (Apollo/React Query style)
 * Best for: One-off requests with complex configuration
 */
async function pattern2_ConfigurationFirst() {
  console.log('\n=== Pattern 2: Configuration-first ===');

  try {
    // Single configuration object with all options
    const result: SafeRequestResult<User[]> = await safeRequest({
      url: 'https://jsonplaceholder.typicode.com/users',
      method: 'GET',
      guard: isUsersArray,
      tolerance: true,
      timeout: 5000,
      onError: (error, context) => {
        console.warn(`⚠️ Validation issue in ${context.type}: ${error}`);
      },
      retry: {
        attempts: 2,
        delay: 500,
        retryOn: (error) => {
          // Custom retry logic
          return error instanceof Error && error.message.includes('timeout');
        }
      },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SafeAxios/1.0'
      }
    });

    if (result.status === Status.SUCCESS) {
      console.log(`Found ${result.data.length} users`);
    } else {
      console.log('Request failed:', result.message);
    }

  } catch (error) {
    console.error('Configuration-first pattern error:', error);
  }
}

/**
 * Pattern 3: Fluent API Builder
 * Best for: Complex requests with step-by-step configuration
 */
async function pattern3_FluentBuilder() {
  console.log('\n=== Pattern 3: Fluent API Builder ===');

  try {
    // Build request step by step
    const result = await safe()
      .get('https://jsonplaceholder.typicode.com/users/1')
      .guard(isUser)
      .tolerance(true)
      .timeout(3000)
      .headers({
        'Accept': 'application/json',
        'Authorization': 'Bearer fake-token'
      })
      .onError((error, context) => {
        if (context.type === 'validation') {
          console.warn(`⚠️ Data validation issue: ${error}`);
        } else {
          console.error(`❌ ${context.type} error: ${error}`);
        }
      })
      .retry({
        attempts: 3,
        delay: 1000,
        backoff: 'exponential'
      })
      .execute();

    if (result.status === Status.SUCCESS) {
      console.log('Fluent API result:', result.data);
    } else {
      console.log('Fluent API error:', result.message);
    }

    // POST example with fluent API
    const createResult = await safe()
      .post('https://jsonplaceholder.typicode.com/users', {
        name: 'Jane Smith',
        email: 'jane@example.com',
        isActive: true
      })
      .guard(isUser)
      .tolerance(false)
      .identifier('create-user-request')
      .execute();

    if (createResult.status === Status.SUCCESS) {
      console.log('Created user:', createResult.data);
    } else {
      console.log('Failed to create user:', createResult.message);
    }

  } catch (error) {
    console.error('Fluent builder error:', error);
  }
}

/**
 * Pattern 4: Context/Provider (React style)
 * Best for: Shared configuration across multiple requests
 */
async function pattern4_ContextProvider() {
  console.log('\n=== Pattern 4: Context/Provider ===');

  try {
    // Create a shared API context
    const api = createSafeApiContext({
      baseURL: 'https://jsonplaceholder.typicode.com',
      timeout: 5000,
      defaultTolerance: true,
      defaultRetry: {
        attempts: 2,
        delay: 1000,
        backoff: 'exponential'
      },
      onError: (error, context) => {
        console.warn(`⚠️ API Error (${context.type}): ${error}`);
      },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SafeAxios/1.0'
      }
    });

    // Use the context for multiple requests
    const userResult = await api.get('/users/1', { guard: isUser });
    if (userResult.status === Status.SUCCESS) {
      console.log('User from context:', userResult.data);
    } else {
      console.log('Failed to get user:', userResult.message);
    }

    const usersResult = await api.get('/users', { guard: isUsersArray });
    if (usersResult.status === Status.SUCCESS) {
      console.log(`Users from context: ${usersResult.data.length} found`);
    } else {
      console.log('Failed to get users:', usersResult.message);
    }

    // POST with context
    const createResult = await api.post('/users', {
      name: 'Context User',
      email: 'context@example.com',
      isActive: true
    }, { guard: isUser });

    if (createResult.status === Status.SUCCESS) {
      console.log('Created user with context:', createResult.data);
    } else {
      console.log('Failed to create user:', createResult.message);
    }

  } catch (error) {
    console.error('Context provider error:', error);
  }
}

/**
 * Advanced Examples
 */
async function advancedExamples() {
  console.log('\n=== Advanced Examples ===');

  // Example 1: Typed functions
  const typedGetUser = createTypedSafeGet(isUser);
  const typedCreateUser = createTypedSafePost(isUser);

  const typedResult = await typedGetUser('/users/1');
  if (typedResult.status === Status.SUCCESS) {
    console.log('Typed user:', typedResult.data);
  }

  // Example 2: Complex retry logic
  const complexRetryResult = await safeRequest({
    url: '/users/1',
    method: 'GET',
    guard: isUser,
    retry: {
      attempts: 5,
      delay: 2000,
      backoff: 'exponential',
      retryOn: (error) => {
        // Only retry on network errors or 5xx status codes
        if (error instanceof Error) {
          return error.message.includes('Network') || 
                 error.message.includes('timeout');
        }
        return false;
      }
    }
  });

  if (complexRetryResult.status === Status.SUCCESS) {
    console.log('Complex retry succeeded:', complexRetryResult.data);
  } else {
    console.log('Complex retry failed:', complexRetryResult.message);
  }
}

/**
 * Real-world patterns
 */
async function realWorldPatterns() {
  console.log('\n=== Real-world Patterns ===');

  // Service layer pattern
  class UserService {
    private getUser = safeGet({
      guard: isUser,
      tolerance: false,
      retry: { attempts: 3, delay: 1000 }
    });

    private createUser = safePost({
      guard: isUser,
      tolerance: false
    });

    async fetchUser(id: number): Promise<User | null> {
      const result = await this.getUser(`/users/${id}`);
      return result.status === Status.SUCCESS ? result.data : null;
    }

    async createNewUser(userData: Omit<User, 'id'>): Promise<User | null> {
      const result = await this.createUser('/users', userData);
      return result.status === Status.SUCCESS ? result.data : null;
    }
  }

  // Repository pattern
  class UserRepository {
    async findById(id: number): Promise<User | null> {
      const result = await safeRequest({
        url: `/users/${id}`,
        method: 'GET',
        guard: isUser,
        tolerance: true
      });
      return result.status === Status.SUCCESS ? result.data : null;
    }

    async findAll(): Promise<User[]> {
      const result = await safeRequest({
        url: '/users',
        method: 'GET',
        guard: isUsersArray,
        tolerance: true
      });
      return result.status === Status.SUCCESS ? result.data : [];
    }

    async create(user: Omit<User, 'id'>): Promise<User | null> {
      const result = await safeRequest({
        url: '/users',
        method: 'POST',
        guard: isUser,
        data: user
      });
      return result.status === Status.SUCCESS ? result.data : null;
    }
  }

  // Demonstrate the patterns
  const userService = new UserService();
  const userRepo = new UserRepository();

  const serviceUser = await userService.fetchUser(1);
  console.log('Service user:', serviceUser);

  const repoUser = await userRepo.findById(1);
  console.log('Repository user:', repoUser);
}

// Export all examples
export {
  pattern1_CurriedFunctions,
  pattern2_ConfigurationFirst,
  pattern3_FluentBuilder,
  pattern4_ContextProvider,
  advancedExamples,
  realWorldPatterns,
};

// Main function to run all examples
export async function runAdvancedExamples() {
  console.log('🚀 Advanced Safe Axios Patterns');
  console.log('================================\n');

  await pattern1_CurriedFunctions();
  await pattern2_ConfigurationFirst();
  await pattern3_FluentBuilder();
  await pattern4_ContextProvider();
  await advancedExamples();
  await realWorldPatterns();

  console.log('\n✅ All advanced patterns demonstrated!');
}

// Run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAdvancedExamples().catch(console.error);
} 
// runAdvancedExamples(); 