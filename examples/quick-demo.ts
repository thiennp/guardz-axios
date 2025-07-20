import { safeGet, safeRequest, safe, createSafeApiContext } from "../src/index";
import { isType, isString, isNumber, isBoolean } from "guardz";
import { Status } from "../src/types/status-types";

// Define data structure
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

async function demonstrateAPIPatterns() {
  console.log("🚀 Safe Axios API Demo\n");

  // Pattern 1: Curried Functions
  console.log("📋 Pattern 1: Curried Functions");
  const getUserSafely = safeGet({
    guard: isUser,
    tolerance: true,
    onError: (error) => console.warn(`⚠️  Warning: ${error}`),
  });

  const userResult = await getUserSafely(
    "https://jsonplaceholder.typicode.com/users/1",
  );
  if (userResult.status === Status.SUCCESS) {
    console.log(`✅ User loaded: ${userResult.data.name}\n`);
  } else {
    console.log(`❌ Failed to load user: ${userResult.message}\n`);
  }

  // Pattern 2: Configuration-first
  console.log("📋 Pattern 2: Configuration-first");
  const configResult = await safeRequest({
    url: "https://jsonplaceholder.typicode.com/users/2",
    method: "GET",
    guard: isUser,
    tolerance: true,
    timeout: 5000,
  });
  if (configResult.status === Status.SUCCESS) {
    console.log(`✅ Config success: ${configResult.data.name}\n`);
  } else {
    console.log(`❌ Config failed: ${configResult.message}\n`);
  }

  // Pattern 3: Fluent API Builder
  console.log("📋 Pattern 3: Fluent API Builder");
  const fluentResult = await safe()
    .get("https://jsonplaceholder.typicode.com/users/3")
    .guard(isUser)
    .tolerance(true)
    .timeout(3000)
    .execute();
  if (fluentResult.status === Status.SUCCESS) {
    console.log(`✅ Fluent success: ${fluentResult.data.name}\n`);
  } else {
    console.log(`❌ Fluent failed: ${fluentResult.message}\n`);
  }

  // Pattern 4: Context/Provider
  console.log("📋 Pattern 4: Context/Provider");
  const api = createSafeApiContext({
    baseURL: "https://jsonplaceholder.typicode.com",
    defaultTolerance: true,
  });

  const contextResult = await api.get("/users/4", { guard: isUser });
  if (contextResult.status === Status.SUCCESS) {
    console.log(`✅ Context success: ${contextResult.data.name}\n`);
  } else {
    console.log(`❌ Context failed: ${contextResult.message}\n`);
  }

  console.log("✅ All API patterns demonstrated successfully!");
}

// Export for use in other files
export { demonstrateAPIPatterns };

// Uncomment to run when executing this file directly
// demonstrateAPIPatterns();
