import { safeGet, safePost, safeRequest } from "../src/utils/safe-axios";
import {
  isType,
  isString,
  isNumber,
  isBoolean,
  isArrayWithEachItem,
} from "guardz";
import { Status } from "../src/types/status-types";

// Define complex data structures to demonstrate detailed error messages
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
  profile: {
    bio: string;
    avatar: string;
  };
  preferences: {
    notifications: boolean;
    theme: string;
  };
  tags: string[];
}

interface Product {
  id: number;
  title: string;
  price: number;
  category: string;
  inStock: boolean;
  variants: {
    size: string;
    color: string;
    price: number;
  }[];
}

// Type guards with detailed validation
const isUser = isType<User>({
  id: isNumber,
  name: isString,
  email: isString,
  age: isNumber,
  isActive: isBoolean,
  profile: isType({
    bio: isString,
    avatar: isString,
  }),
  preferences: isType({
    notifications: isBoolean,
    theme: isString,
  }),
  tags: isArrayWithEachItem(isString),
});

const isProduct = isType<Product>({
  id: isNumber,
  title: isString,
  price: isNumber,
  category: isString,
  inStock: isBoolean,
  variants: isArrayWithEachItem(
    isType({
      size: isString,
      color: isString,
      price: isNumber,
    }),
  ),
});

// Example 1: Demonstrate Guardz Feedback Messages
function demonstrateGuardzFeedback() {
  console.log("\n=== Example 1: Guardz Feedback Messages ===");

  // Test the type guards directly to see feedback messages
  const invalidUserData = {
    id: "1", // Should be number
    name: "John Doe",
    email: undefined, // Missing required field
    age: "25", // Should be number
    isActive: "true", // Should be boolean
    profile: {
      bio: "Software developer",
      avatar: 123, // Should be string
    },
    preferences: {
      notifications: "yes", // Should be boolean
      theme: "dark",
    },
    tags: ["developer", 123, "typescript"], // Mixed array
  };

  console.log("Testing validation with invalid data:");
  console.log("Data:", JSON.stringify(invalidUserData, null, 2));

  // Collect error messages
  const errorMessages: string[] = [];
  const config = {
    identifier: "userData",
    callbackOnError: (error: string) => {
      errorMessages.push(error);
      console.log(`  ❌ ${error}`);
    },
  };

  const isValid = isUser(invalidUserData, config);
  console.log(`\nValidation result: ${isValid ? "✅ Valid" : "❌ Invalid"}`);
  console.log(`Total errors found: ${errorMessages.length}`);
}

// Example 2: Demonstrate Error Response Structure
function demonstrateErrorStructure() {
  console.log("\n=== Example 2: Error Response Structure ===");

  // Show the structure of error responses
  const errorResponseExample = {
    status: Status.ERROR,
    code: 500,
    message:
      'Response data validation failed: Expected userData.id ("1") to be "number", Expected userData.email (undefined) to be "string"',
  };

  console.log("Error response structure:");
  console.log(JSON.stringify(errorResponseExample, null, 2));
}

// Example 3: Demonstrate Different Error Types
function demonstrateErrorTypes() {
  console.log("\n=== Example 3: Error Types ===");

  const errorTypes = [
    {
      type: "Validation Error",
      code: 500,
      message:
        "Response data validation failed: Expected userData.id to be a number",
      description: "When response data doesn't match the expected type",
    },
    {
      type: "Network Error",
      code: 500,
      message: "Network Error",
      description: "When network requests fail",
    },
    {
      type: "Timeout Error",
      code: 500,
      message: "timeout of 5000ms exceeded",
      description: "When requests timeout",
    },
    {
      type: "HTTP Status Error",
      code: 404,
      message: "Not Found",
      description: "When the server returns error status codes",
    },
  ];

  errorTypes.forEach((errorType) => {
    console.log(`\n${errorType.type}:`);
    console.log(`  Code: ${errorType.code}`);
    console.log(`  Message: ${errorType.message}`);
    console.log(`  Description: ${errorType.description}`);
  });
}

// Example 4: Demonstrate Best Practices
function demonstrateBestPractices() {
  console.log("\n=== Example 4: Error Handling Best Practices ===");

  console.log("1. Always check the status first:");
  console.log(`
    const result = await safeGet({ guard: isUser })('/users/1');
    
    if (result.status === Status.SUCCESS) {
      // Handle success
      console.log('User:', result.data);
    } else {
      // Handle error
      console.error('Error:', result.code, result.message);
    }
  `);

  console.log("\n2. Handle different error types appropriately:");
  console.log(`
    if (result.status === Status.ERROR) {
      switch (result.code) {
        case 404:
          // Handle not found
          break;
        case 500:
          // Handle server errors
          break;
      }
    }
  `);

  console.log("\n3. Use tolerance mode for graceful degradation:");
  console.log(`
    const result = await safeGet({ 
      guard: isUser,
      tolerance: true 
    })('/users/1');
    
    if (result.status === Status.SUCCESS) {
      // Use data confidently
      console.log('User:', result.data);
    } else {
      // Handle error
      console.error('Error:', result.message);
    }
  `);
}

// Example 5: Demonstrate Success Response
function demonstrateSuccessResponse() {
  console.log("\n=== Example 5: Success Response ===");

  const successResponseExample = {
    status: Status.SUCCESS,
    data: {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      age: 30,
      isActive: true,
      profile: {
        bio: "Software developer",
        avatar: "https://example.com/avatar.jpg",
      },
      preferences: {
        notifications: true,
        theme: "dark",
      },
      tags: ["developer", "typescript"],
    },
  };

  console.log("Success response structure:");
  console.log(JSON.stringify(successResponseExample, null, 2));
  console.log("\nKey benefits:");
  console.log("  • Type-safe data access");
  console.log("  • No optional properties");
  console.log("  • Clear success/error distinction");
}

// Run all examples
function runAllExamples() {
  console.log("🚀 Guardz Axios Error Handling Documentation");
  console.log("=============================================\n");

  demonstrateGuardzFeedback();
  demonstrateErrorStructure();
  demonstrateErrorTypes();
  demonstrateBestPractices();
  demonstrateSuccessResponse();

  console.log("\n✨ Documentation completed!");
  console.log("\nKey Benefits:");
  console.log("✅ Discriminated union for type safety");
  console.log("✅ No optional properties to check");
  console.log("✅ Clear success/error distinction");
  console.log("✅ Detailed error messages with guardz feedback");
  console.log("✅ Structured error responses with code and message");
}

// Export for use in other files
export {
  demonstrateGuardzFeedback,
  demonstrateErrorStructure,
  demonstrateErrorTypes,
  demonstrateBestPractices,
  demonstrateSuccessResponse,
  runAllExamples,
};

// Run if this file is executed directly
if (typeof require !== "undefined" && require.main === module) {
  runAllExamples();
}
