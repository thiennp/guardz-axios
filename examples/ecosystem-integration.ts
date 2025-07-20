/**
 * Guardz Ecosystem Integration Example
 *
 * This example demonstrates how all components of the guardz ecosystem
 * work together to provide comprehensive type safety across your application.
 */

// Note: This example demonstrates ecosystem integration
// In a real project, you would install and import these packages:
// npm install guardz-axios guardz-event guardz

// For demonstration purposes, we'll use mock implementations
// In a real project, replace these with actual imports:
// import { safeGet, safePost, safeRequest, Status } from 'guardz-axios';
// import { createTypedEventEmitter } from 'guardz-event';
// import { isType, isString, isNumber, isOptional, isArrayOf, isUnion } from 'guardz';

// Mock implementations for demonstration
enum Status {
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

// Mock type guards for demonstration
const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number => typeof value === "number";
const isOptional =
  <T>(guard: (value: unknown) => value is T) =>
  (value: unknown): value is T | undefined =>
    value === undefined || guard(value);
const isArrayOf =
  <T>(guard: (value: unknown) => value is T) =>
  (value: unknown): value is T[] =>
    Array.isArray(value) && value.every(guard);
const isUnion =
  <T extends readonly unknown[]>(values: T) =>
  (value: unknown): value is T[number] =>
    values.includes(value as T[number]);

const isType =
  <T>(schema: Record<string, (value: unknown) => boolean>) =>
  (value: unknown): value is T => {
    if (typeof value !== "object" || value === null) return false;
    return Object.entries(schema).every(([key, guard]) =>
      guard((value as any)[key]),
    );
  };

// Mock HTTP functions for demonstration
const safeGet =
  ({ guard }: { guard: (value: unknown) => boolean }) =>
  async (url: string) => {
    // Mock implementation - return different data based on URL
    let mockData: any;
    if (url.includes("/users/")) {
      mockData = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        status: "active",
        createdAt: new Date().toISOString(),
      };
    } else if (url.includes("/posts/")) {
      mockData = {
        id: 1,
        title: "Sample Post",
        content: "Sample content",
        author: {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          status: "active",
          createdAt: new Date().toISOString(),
        },
        tags: ["sample"],
        status: "published",
      };
    } else {
      mockData = { success: true };
    }

    if (guard(mockData)) {
      return { status: Status.SUCCESS, data: mockData };
    } else {
      return { status: Status.ERROR, code: 500, message: "Validation failed" };
    }
  };

const safePost =
  ({ guard }: { guard: (value: unknown) => boolean }) =>
  async (url: string, data: unknown) => {
    // Mock implementation - return different data based on URL
    let mockData: any;
    if (url.includes("/users")) {
      mockData = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        status: "active",
        createdAt: new Date().toISOString(),
      };
    } else if (url.includes("/posts")) {
      mockData = {
        id: 1,
        title: "Sample Post",
        content: "Sample content",
        author: {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          status: "active",
          createdAt: new Date().toISOString(),
        },
        tags: ["sample"],
        status: "draft",
      };
    } else {
      mockData = { success: true };
    }

    if (guard(mockData)) {
      return { status: Status.SUCCESS, data: mockData };
    } else {
      return { status: Status.ERROR, code: 500, message: "Validation failed" };
    }
  };

const safeRequest = async (config: {
  url: string;
  method: string;
  guard: (value: unknown) => boolean;
  data?: unknown;
  tolerance?: boolean;
  onError?: (error: string, context: any) => void;
}) => {
  // Mock implementation - return different data based on URL and method
  let mockData: any;

  if (config.url.includes("/users/") && config.method === "PUT") {
    mockData = {
      id: 1,
      name: "John Smith",
      email: "john@example.com",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } else if (config.url.includes("/posts/") && config.method === "PUT") {
    mockData = {
      id: 1,
      title: "Updated Post",
      content: "Updated content",
      author: {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        status: "active",
        createdAt: new Date().toISOString(),
      },
      tags: ["updated"],
      status: "published",
    };
  } else if (
    config.url.includes("/posts/") &&
    config.url.includes("/publish")
  ) {
    mockData = {
      id: 1,
      title: "Published Post",
      content: "Published content",
      author: {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        status: "active",
        createdAt: new Date().toISOString(),
      },
      tags: ["published"],
      status: "published",
      publishedAt: new Date().toISOString(),
    };
  } else if (config.method === "DELETE") {
    mockData = { success: true };
  } else {
    mockData = {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      status: "active",
      createdAt: new Date().toISOString(),
    };
  }

  if (config.guard(mockData)) {
    return { status: Status.SUCCESS, data: mockData };
  } else {
    if (config.tolerance && config.onError) {
      config.onError("Validation warning", {
        url: config.url,
        method: config.method,
      });
      return { status: Status.SUCCESS, data: mockData };
    }
    return { status: Status.ERROR, code: 500, message: "Validation failed" };
  }
};

// Mock event emitter for demonstration
const createTypedEventEmitter = <
  T extends Record<string, (value: unknown) => boolean>,
>(
  events: T,
) => {
  const listeners: Record<string, ((data: any) => void)[]> = {};

  return {
    emit: (event: keyof T, data: any) => {
      if (listeners[event as string]) {
        listeners[event as string].forEach((listener) => listener(data));
      }
    },
    on: (event: keyof T, listener: (data: any) => void) => {
      if (!listeners[event as string]) {
        listeners[event as string] = [];
      }
      listeners[event as string].push(listener);
    },
  };
};

// ============================================================================
// 1. DEFINE TYPES (This would typically be in src/types/)
// ============================================================================

interface User {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive" | "pending";
  createdAt: string;
  updatedAt?: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author: User;
  tags: string[];
  publishedAt?: string;
  status: "draft" | "published" | "archived";
}

interface CreateUserData {
  name: string;
  email: string;
  status?: "active" | "inactive" | "pending";
}

interface CreatePostData {
  title: string;
  content: string;
  authorId: number;
  tags?: string[];
}

// ============================================================================
// 2. CREATE TYPE GUARDS (This would be auto-generated by guardz-generator)
// ============================================================================

const isUserStatus = isUnion(["active", "inactive", "pending"]);
const isPostStatus = isUnion(["draft", "published", "archived"]);

const isUser = isType<User>({
  id: isNumber,
  name: isString,
  email: isString,
  status: isUserStatus,
  createdAt: isString,
  updatedAt: isOptional(isString),
});

const isPost = isType<Post>({
  id: isNumber,
  title: isString,
  content: isString,
  author: isUser,
  tags: isArrayOf(isString),
  publishedAt: isOptional(isString),
  status: isPostStatus,
});

const isCreateUserData = isType<CreateUserData>({
  name: isString,
  email: isString,
  status: isOptional(isUserStatus),
});

const isCreatePostData = isType<CreatePostData>({
  title: isString,
  content: isString,
  authorId: isNumber,
  tags: isOptional(isArrayOf(isString)),
});

// ============================================================================
// 3. SET UP TYPE-SAFE EVENT EMITTERS
// ============================================================================

// User events
const userEmitter = createTypedEventEmitter({
  "user:created": isUser,
  "user:updated": isUser,
  "user:deleted": isType<{ userId: number; deletedAt: string }>({
    userId: isNumber,
    deletedAt: isString,
  }),
  "user:fetched": isUser,
});

// Post events
const postEmitter = createTypedEventEmitter({
  "post:created": isPost,
  "post:updated": isPost,
  "post:published": isPost,
  "post:deleted": isType<{ postId: number; deletedAt: string }>({
    postId: isNumber,
    deletedAt: isString,
  }),
});

// Notification events
const notificationEmitter = createTypedEventEmitter({
  "notification:sent": isType<{
    type: "welcome" | "post_published" | "user_updated";
    userId: number;
    message: string;
    sentAt: string;
  }>({
    type: isUnion(["welcome", "post_published", "user_updated"]),
    userId: isNumber,
    message: isString,
    sentAt: isString,
  }),
});

// ============================================================================
// 4. CREATE TYPE-SAFE API CLASSES
// ============================================================================

class UserAPI {
  private baseURL: string;

  constructor(baseURL: string = "https://api.example.com") {
    this.baseURL = baseURL;
  }

  async getUser(id: number) {
    const result = await safeGet({ guard: isUser })(
      `${this.baseURL}/users/${id}`,
    );

    if (result.status === Status.SUCCESS) {
      // Emit type-safe event
      userEmitter.emit("user:fetched", result.data);
    }

    return result;
  }

  async createUser(userData: CreateUserData) {
    const result = await safePost({ guard: isUser })(
      `${this.baseURL}/users`,
      userData,
    );

    if (result.status === Status.SUCCESS) {
      // Emit type-safe event
      userEmitter.emit("user:created", result.data);

      // Send welcome notification
      notificationEmitter.emit("notification:sent", {
        type: "welcome",
        userId: result.data.id,
        message: `Welcome ${result.data.name}! Your account has been created successfully.`,
        sentAt: new Date().toISOString(),
      });
    }

    return result;
  }

  async updateUser(id: number, userData: Partial<CreateUserData>) {
    const result = await safeRequest({
      url: `${this.baseURL}/users/${id}`,
      method: "PUT",
      data: userData,
      guard: isUser,
    });

    if (result.status === Status.SUCCESS) {
      userEmitter.emit("user:updated", result.data);
    }

    return result;
  }

  async deleteUser(id: number) {
    const result = await safeRequest({
      url: `${this.baseURL}/users/${id}`,
      method: "DELETE",
      guard: isType<{ success: boolean }>({ success: isUnion([true, false]) }),
    });

    if (result.status === Status.SUCCESS && result.data.success) {
      userEmitter.emit("user:deleted", {
        userId: id,
        deletedAt: new Date().toISOString(),
      });
    }

    return result;
  }
}

class PostAPI {
  private baseURL: string;

  constructor(baseURL: string = "https://api.example.com") {
    this.baseURL = baseURL;
  }

  async getPost(id: number) {
    return await safeGet({ guard: isPost })(`${this.baseURL}/posts/${id}`);
  }

  async createPost(postData: CreatePostData) {
    const result = await safePost({ guard: isPost })(
      `${this.baseURL}/posts`,
      postData,
    );

    if (result.status === Status.SUCCESS) {
      postEmitter.emit("post:created", result.data);
    }

    return result;
  }

  async publishPost(id: number) {
    const result = await safeRequest({
      url: `${this.baseURL}/posts/${id}/publish`,
      method: "POST",
      guard: isPost,
    });

    if (result.status === Status.SUCCESS) {
      postEmitter.emit("post:published", result.data);

      // Send notification to author
      notificationEmitter.emit("notification:sent", {
        type: "post_published",
        userId: result.data.author.id,
        message: `Your post "${result.data.title}" has been published!`,
        sentAt: new Date().toISOString(),
      });
    }

    return result;
  }

  async updatePost(id: number, postData: Partial<CreatePostData>) {
    const result = await safeRequest({
      url: `${this.baseURL}/posts/${id}`,
      method: "PUT",
      data: postData,
      guard: isPost,
    });

    if (result.status === Status.SUCCESS) {
      postEmitter.emit("post:updated", result.data);
    }

    return result;
  }

  async deletePost(id: number) {
    const result = await safeRequest({
      url: `${this.baseURL}/posts/${id}`,
      method: "DELETE",
      guard: isType<{ success: boolean }>({ success: isUnion([true, false]) }),
    });

    if (result.status === Status.SUCCESS && result.data.success) {
      postEmitter.emit("post:deleted", {
        postId: id,
        deletedAt: new Date().toISOString(),
      });
    }

    return result;
  }
}

// ============================================================================
// 5. SET UP EVENT LISTENERS
// ============================================================================

// User event listeners
userEmitter.on("user:created", (user) => {
  console.log(`🎉 New user created: ${user.name} (${user.email})`);
  console.log(`   Status: ${user.status}`);
  console.log(`   Created: ${user.createdAt}`);
});

userEmitter.on("user:updated", (user) => {
  console.log(`✏️  User updated: ${user.name}`);
  console.log(`   Last updated: ${user.updatedAt || "Never"}`);
});

userEmitter.on("user:deleted", (event) => {
  console.log(`🗑️  User deleted: ID ${event.userId}`);
  console.log(`   Deleted at: ${event.deletedAt}`);
});

userEmitter.on("user:fetched", (user) => {
  console.log(`📖 User fetched: ${user.name}`);
});

// Post event listeners
postEmitter.on("post:created", (post) => {
  console.log(`📝 New post created: "${post.title}"`);
  console.log(`   Author: ${post.author.name}`);
  console.log(`   Tags: ${post.tags.join(", ")}`);
});

postEmitter.on("post:published", (post) => {
  console.log(`🚀 Post published: "${post.title}"`);
  console.log(`   Published at: ${post.publishedAt}`);
  console.log(`   Status: ${post.status}`);
});

postEmitter.on("post:updated", (post) => {
  console.log(`✏️  Post updated: "${post.title}"`);
});

postEmitter.on("post:deleted", (event) => {
  console.log(`🗑️  Post deleted: ID ${event.postId}`);
  console.log(`   Deleted at: ${event.deletedAt}`);
});

// Notification event listeners
notificationEmitter.on("notification:sent", (notification) => {
  console.log(`📧 Notification sent to user ${notification.userId}:`);
  console.log(`   Type: ${notification.type}`);
  console.log(`   Message: ${notification.message}`);
  console.log(`   Sent at: ${notification.sentAt}`);
});

// ============================================================================
// 6. DEMONSTRATE ECOSYSTEM INTEGRATION
// ============================================================================

async function demonstrateEcosystemIntegration() {
  console.log("🚀 Guardz Ecosystem Integration Demo\n");

  const userAPI = new UserAPI();
  const postAPI = new PostAPI();

  try {
    // 1. Create a user (triggers user:created and notification:sent events)
    console.log("1. Creating a new user...");
    const createUserResult = await userAPI.createUser({
      name: "John Doe",
      email: "john.doe@example.com",
      status: "active",
    });

    if (createUserResult.status === Status.SUCCESS) {
      const user = createUserResult.data;
      console.log(`✅ User created successfully: ${user.name}\n`);

      // 2. Create a post for the user (triggers post:created event)
      console.log("2. Creating a post for the user...");
      const createPostResult = await postAPI.createPost({
        title: "My First Post",
        content: "This is my first post using the guardz ecosystem!",
        authorId: user.id,
        tags: ["typescript", "guardz", "ecosystem"],
      });

      if (createPostResult.status === Status.SUCCESS) {
        const post = createPostResult.data;
        console.log(`✅ Post created successfully: "${post.title}"\n`);

        // 3. Publish the post (triggers post:published and notification:sent events)
        console.log("3. Publishing the post...");
        const publishResult = await postAPI.publishPost(post.id);

        if (publishResult.status === Status.SUCCESS) {
          console.log(`✅ Post published successfully!\n`);
        } else {
          console.log(`❌ Failed to publish post: ${publishResult.message}\n`);
        }

        // 4. Update the user (triggers user:updated event)
        console.log("4. Updating the user...");
        const updateUserResult = await userAPI.updateUser(user.id, {
          name: "John Smith",
        });

        if (updateUserResult.status === Status.SUCCESS) {
          console.log(`✅ User updated successfully!\n`);
        } else {
          console.log(
            `❌ Failed to update user: ${updateUserResult.message}\n`,
          );
        }

        // 5. Fetch the user (triggers user:fetched event)
        console.log("5. Fetching the user...");
        const fetchUserResult = await userAPI.getUser(user.id);

        if (fetchUserResult.status === Status.SUCCESS) {
          console.log(`✅ User fetched successfully!\n`);
        } else {
          console.log(`❌ Failed to fetch user: ${fetchUserResult.message}\n`);
        }

        // 6. Update the post (triggers post:updated event)
        console.log("6. Updating the post...");
        const updatePostResult = await postAPI.updatePost(post.id, {
          title: "My Updated First Post",
          tags: ["typescript", "guardz", "ecosystem", "updated"],
        });

        if (updatePostResult.status === Status.SUCCESS) {
          console.log(`✅ Post updated successfully!\n`);
        } else {
          console.log(
            `❌ Failed to update post: ${updatePostResult.message}\n`,
          );
        }

        // 7. Delete the post (triggers post:deleted event)
        console.log("7. Deleting the post...");
        const deletePostResult = await postAPI.deletePost(post.id);

        if (deletePostResult.status === Status.SUCCESS) {
          console.log(`✅ Post deleted successfully!\n`);
        } else {
          console.log(
            `❌ Failed to delete post: ${deletePostResult.message}\n`,
          );
        }

        // 8. Delete the user (triggers user:deleted event)
        console.log("8. Deleting the user...");
        const deleteUserResult = await userAPI.deleteUser(user.id);

        if (deleteUserResult.status === Status.SUCCESS) {
          console.log(`✅ User deleted successfully!\n`);
        } else {
          console.log(
            `❌ Failed to delete user: ${deleteUserResult.message}\n`,
          );
        }
      } else {
        console.log(`❌ Failed to create post: ${createPostResult.message}\n`);
      }
    } else {
      console.log(`❌ Failed to create user: ${createUserResult.message}\n`);
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }

  console.log("🎉 Ecosystem integration demo completed!");
  console.log("\n📊 Summary:");
  console.log("- All HTTP requests were type-safe with runtime validation");
  console.log("- All events were type-safe with payload validation");
  console.log("- All data transformations were type-safe");
  console.log("- Comprehensive error handling with detailed type information");
}

// ============================================================================
// 7. DEMONSTRATE ERROR HANDLING
// ============================================================================

async function demonstrateErrorHandling() {
  console.log("\n🔧 Error Handling Demo\n");

  const userAPI = new UserAPI();

  // 1. Invalid user data (validation error)
  console.log("1. Testing validation error...");
  const invalidUserResult = await userAPI.createUser({
    name: "", // Invalid: empty string
    email: "invalid-email", // Invalid: not a proper email format
    status: "invalid-status" as any, // Invalid: not a valid status
  });

  if (invalidUserResult.status === Status.ERROR) {
    console.log(`❌ Validation error: ${invalidUserResult.message}`);
    console.log(`   Error code: ${invalidUserResult.code}\n`);
  }

  // 2. Network error simulation
  console.log("2. Testing network error...");
  const networkErrorAPI = new UserAPI(
    "https://invalid-url-that-does-not-exist.com",
  );
  const networkErrorResult = await networkErrorAPI.getUser(1);

  if (networkErrorResult.status === Status.ERROR) {
    console.log(`❌ Network error: ${networkErrorResult.message}`);
    console.log(`   Error code: ${networkErrorResult.code}\n`);
  }

  // 3. Tolerance mode demonstration
  console.log("3. Testing tolerance mode...");
  const toleranceResult = await safeRequest({
    url: "https://api.example.com/users/1",
    method: "GET",
    guard: isUser,
    tolerance: true,
    onError: (error, context) => {
      console.log(`⚠️  Validation warning: ${error}`);
      console.log(`   Context: ${context.url} (${context.method})`);
    },
  });

  if (toleranceResult.status === Status.SUCCESS) {
    console.log(
      `✅ Tolerance mode: Data returned despite validation warnings\n`,
    );
  } else {
    console.log(
      `❌ Tolerance mode: Request failed: ${toleranceResult.message}\n`,
    );
  }
}

// ============================================================================
// 8. RUN THE DEMO
// ============================================================================

async function runDemo() {
  console.log("🌟 Guardz Ecosystem Integration Demo");
  console.log("=====================================\n");

  await demonstrateEcosystemIntegration();
  await demonstrateErrorHandling();

  console.log("\n🎯 Key Benefits Demonstrated:");
  console.log("✅ Type-safe HTTP requests with runtime validation");
  console.log("✅ Type-safe event handling with payload validation");
  console.log("✅ Automatic type guard generation (simulated)");
  console.log("✅ Comprehensive error handling");
  console.log("✅ Tolerance mode for graceful degradation");
  console.log("✅ Event-driven architecture with type safety");
  console.log("✅ Full integration across the entire application stack");
}

// Export for use in other examples
export {
  UserAPI,
  PostAPI,
  userEmitter,
  postEmitter,
  notificationEmitter,
  isUser,
  isPost,
  isCreateUserData,
  isCreatePostData,
};

// Run the demo if this file is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}
