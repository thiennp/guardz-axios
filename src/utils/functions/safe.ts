import { SafeRequestBuilder } from "../builders/SafeRequestBuilder";

/**
 * Pattern 3: Fluent API Builder factory
 * Usage: const result = await safe().get('/users/1').guard(isUser).tolerance(false).execute();
 */
export function safe(): SafeRequestBuilder {
  return new SafeRequestBuilder();
}
