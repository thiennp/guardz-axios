import { safeGet, safePost } from "../src/utils/safe-axios";
import { isType, isString, isNumber, isBoolean } from "guardz";
import { Status } from "../src/types/status-types";

// Define your data structure
interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

// Create type guard
const isUser = isType<User>({
  id: isNumber,
  name: isString,
  email: isString,
  isActive: isBoolean,
});

// Example 1: Basic GET request
async function getUserExample() {
  const result = await safeGet({ guard: isUser })("/users/1");

  if (result.status === Status.SUCCESS) {
    console.log("User:", result.data);
    // TypeScript knows result.data is User
    console.log("Name:", result.data.name);
    console.log("Email:", result.data.email);
  } else {
    console.error("Error:", result.code, result.message);
  }
}

// Example 2: POST request with data
async function createUserExample() {
  const userData = {
    name: "John Doe",
    email: "john@example.com",
    isActive: true,
  };

  const result = await safePost({ guard: isUser })("/users", userData);

  if (result.status === Status.SUCCESS) {
    console.log("Created user:", result.data);
  } else {
    console.error("Failed to create user:", result.message);
  }
}

// Example 3: Error handling
async function errorHandlingExample() {
  const result = await safeGet({ guard: isUser })("/users/999");

  if (result.status === Status.SUCCESS) {
    console.log("User found:", result.data);
  } else {
    switch (result.code) {
      case 404:
        console.log("User not found");
        break;
      case 500:
        console.log("Server error:", result.message);
        break;
      default:
        console.log("Unexpected error:", result.message);
    }
  }
}

// Example 4: Tolerance mode
async function toleranceModeExample() {
  const result = await safeGet({
    guard: isUser,
    tolerance: true,
    onError: (error, context) => {
      console.warn(`Validation warning: ${error}`);
    },
  })("/users/1");

  if (result.status === Status.SUCCESS) {
    console.log("User data (may have validation issues):", result.data);
  } else {
    console.error("Request failed:", result.message);
  }
}

// Example 5: Retry logic
async function retryExample() {
  const result = await safeGet({
    guard: isUser,
    retry: {
      attempts: 3,
      delay: 1000,
      backoff: "exponential",
    },
  })("/users/1");

  if (result.status === Status.SUCCESS) {
    console.log("User retrieved after retries:", result.data);
  } else {
    console.error("Failed after retries:", result.message);
  }
}

// Run examples
async function runExamples() {
  console.log("=== Basic Usage Examples ===\n");

  console.log("1. Basic GET request:");
  await getUserExample();

  console.log("\n2. POST request:");
  await createUserExample();

  console.log("\n3. Error handling:");
  await errorHandlingExample();

  console.log("\n4. Tolerance mode:");
  await toleranceModeExample();

  console.log("\n5. Retry logic:");
  await retryExample();
}

export {
  getUserExample,
  createUserExample,
  errorHandlingExample,
  toleranceModeExample,
  retryExample,
  runExamples,
};

// Run if this file is executed directly
if (typeof require !== "undefined" && require.main === module) {
  runExamples().catch(console.error);
}
