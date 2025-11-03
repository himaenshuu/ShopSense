/**
 * Appwrite Client Configuration for Next.js
 * This file sets up the Appwrite SDK with proper configuration for:
 * - Authentication (email/password, OAuth)
 * - Database operations (chats, messages)
 * - Realtime subscriptions (instant chat updates)
 *
 * SETUP REQUIRED: Configure environment variables in .env.local
 */

import { Client, Account, Databases, Query, ID, OAuthProvider } from "appwrite";

// ============================================================================
// CONFIGURATION - Pull from environment variables
// ============================================================================

const APPWRITE_ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";
const CHATS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_CHATS_COLLECTION_ID || "";
const MESSAGES_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || "";

// Check if Appwrite is properly configured
const isAppwriteConfigured = !!(
  APPWRITE_PROJECT_ID &&
  DATABASE_ID &&
  CHATS_COLLECTION_ID &&
  MESSAGES_COLLECTION_ID
);

if (
  !isAppwriteConfigured &&
  typeof window !== "undefined" &&
  process.env.NODE_ENV === "development"
) {
  console.warn(
    "⚠️ Appwrite is not fully configured. Please set up your .env.local file.\n" +
      "Copy .env.local.example to .env.local and fill in your Appwrite credentials.\n" +
      "Guest mode will still work, but authenticated features require Appwrite setup."
  );
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface User {
  $id: string;
  email: string;
  name: string;
  emailVerification?: boolean;
}

export interface Chat {
  $id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  $id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

// ============================================================================
// CLIENT INITIALIZATION
// ============================================================================

/**
 * Initialize Appwrite Client (Singleton Pattern)
 * This client instance is reused across the entire application
 */
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Initialize service instances
const account = new Account(client);
const databases = new Databases(client);

// ============================================================================
// APPWRITE SERVICE CLASS
// ============================================================================

/**
 * AppwriteService - Centralized service for all Appwrite operations
 *
 * Features:
 * ✅ Real Appwrite SDK integration (not mock)
 * ✅ Email/password authentication
 * ✅ OAuth (Google) support
 * ✅ Chat CRUD operations
 * ✅ Message management
 * ✅ Realtime subscriptions for instant updates
 */
class AppwriteService {
  // ==========================================================================
  // AUTHENTICATION METHODS
  // ==========================================================================

  /**
   * Create a new user account
   * Automatically logs in the user after successful account creation
   */
  async createAccount(
    email: string,
    password: string,
    name: string
  ): Promise<User> {
    try {
      const response = await account.create(ID.unique(), email, password, name);

      // Auto-login after account creation
      await this.login(email, password);

      return {
        $id: response.$id,
        email: response.email,
        name: response.name,
        emailVerification: response.emailVerification,
      };
    } catch (error) {
      console.error("Error creating account:", error);
      throw error;
    }
  }

  /**
   * Log in with email and password
   * Creates an email/password session in Appwrite
   */
  async login(email: string, password: string): Promise<User> {
    try {
      // Create session
      await account.createEmailPasswordSession(email, password);

      // Return current user info
      return (await this.getCurrentUser()) as User;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  }

  /**
   * Get currently authenticated user
   * Returns null if no user is logged in
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      // Check if Appwrite is configured before making request
      if (!isAppwriteConfigured) {
        return null;
      }

      const response = await account.get();
      return {
        $id: response.$id,
        email: response.email,
        name: response.name,
        emailVerification: response.emailVerification,
      };
    } catch {
      // User not authenticated
      return null;
    }
  }

  /**
   * Log out current user
   * Deletes the active session
   */
  async logout(): Promise<void> {
    try {
      await account.deleteSession("current");
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  }

  /**
   * OAuth Login with Google
   * Redirects user to Google OAuth consent screen
   */
  async loginWithGoogle(
    successUrl?: string,
    failureUrl?: string
  ): Promise<void> {
    try {
      // Use current URL as fallback for redirects
      const success =
        successUrl ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const failure =
        failureUrl ||
        (typeof window !== "undefined" ? window.location.origin : "");

      account.createOAuth2Session(OAuthProvider.Google, success, failure);
    } catch (error) {
      console.error("Error with Google OAuth:", error);
      throw error;
    }
  }

  // ==========================================================================
  // CHAT MANAGEMENT
  // ==========================================================================

  /**
   * Create new chat conversation
   * @param userId - Owner of the chat
   * @param title - Chat title (usually first message preview)
   */
  async createChat(userId: string, title: string): Promise<Chat> {
    try {
      const now = new Date().toISOString();
      const response = await databases.createDocument(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        ID.unique(),
        {
          userId,
          title,
          createdAt: now,
          updatedAt: now,
        }
      );

      return response as unknown as Chat;
    } catch (error) {
      console.error("Error creating chat:", error);
      throw error;
    }
  }

  /**
   * Get all chats for a user
   * Returns chats sorted by most recently updated
   */
  async getChats(userId: string): Promise<Chat[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        [
          Query.equal("userId", userId),
          Query.orderDesc("updatedAt"),
          Query.limit(100), // Limit to 100 most recent chats
        ]
      );

      return response.documents as unknown as Chat[];
    } catch (error) {
      console.error("Error getting chats:", error);
      throw error;
    }
  }

  /**
   * Update chat title
   */
  async updateChat(chatId: string, title: string): Promise<Chat> {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        chatId,
        {
          title,
          updatedAt: new Date().toISOString(),
        }
      );

      return response as unknown as Chat;
    } catch (error) {
      console.error("Error updating chat:", error);
      throw error;
    }
  }

  /**
   * Get a single chat by ID
   */
  async getChat(chatId: string): Promise<Chat> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        chatId
      );

      return response as unknown as Chat;
    } catch (error) {
      console.error("Error getting chat:", error);
      throw error;
    }
  }

  /**
   * Delete chat and all associated messages
   * This is a cascading delete operation
   */
  async deleteChat(chatId: string): Promise<void> {
    try {
      // First, delete all messages in the chat
      const messages = await this.getMessages(chatId);
      await Promise.all(
        messages.map((msg) =>
          databases.deleteDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, msg.$id)
        )
      );

      // Then delete the chat itself
      await databases.deleteDocument(DATABASE_ID, CHATS_COLLECTION_ID, chatId);
    } catch (error) {
      console.error("Error deleting chat:", error);
      throw error;
    }
  }

  // ==========================================================================
  // MESSAGE MANAGEMENT
  // ==========================================================================

  /**
   * Create new message in a chat
   * Automatically updates the chat's updatedAt timestamp
   */
  async createMessage(
    chatId: string,
    role: "user" | "assistant",
    content: string
  ): Promise<Message> {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          chatId,
          role,
          content,
          createdAt: new Date().toISOString(),
        }
      );

      // Update parent chat's timestamp
      await databases.updateDocument(DATABASE_ID, CHATS_COLLECTION_ID, chatId, {
        updatedAt: new Date().toISOString(),
      });

      return response as unknown as Message;
    } catch (error) {
      console.error("Error creating message:", error);
      throw error;
    }
  }

  /**
   * Get all messages for a specific chat
   * Returns messages in chronological order (oldest first)
   */
  async getMessages(chatId: string): Promise<Message[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal("chatId", chatId),
          Query.orderAsc("createdAt"),
          Query.limit(1000), // Support up to 1000 messages per chat
        ]
      );

      return response.documents as unknown as Message[];
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  }

  // ==========================================================================
  // REALTIME SUBSCRIPTIONS (ChatGPT-like instant updates)
  // ==========================================================================

  /**
   * Subscribe to real-time chat updates
   * Triggers callback when chats are created, updated, or deleted
   *
   * Usage:
   * ```typescript
   * const unsubscribe = appwrite.subscribeToChats(userId, (response) => {
   *   console.log('Chat updated:', response.payload);
   * });
   * // Later: unsubscribe()
   * ```
   */
  subscribeToChats(
    userId: string,
    callback: (payload: unknown) => void
  ): () => void {
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${CHATS_COLLECTION_ID}.documents`,
      (response) => {
        // Filter: only notify for this user's chats
        const doc = response.payload as { userId?: string };
        if (doc.userId === userId) {
          callback(response);
        }
      }
    );

    return unsubscribe;
  }

  /**
   * Subscribe to real-time message updates
   * Enables instant message delivery similar to ChatGPT streaming
   *
   * Usage:
   * ```typescript
   * const unsubscribe = appwrite.subscribeToMessages(chatId, (response) => {
   *   console.log('New message:', response.payload);
   * });
   * ```
   */
  subscribeToMessages(
    chatId: string,
    callback: (payload: unknown) => void
  ): () => void {
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`,
      (response) => {
        // Filter: only notify for this chat's messages
        const doc = response.payload as { chatId?: string };
        if (doc.chatId === chatId) {
          callback(response);
        }
      }
    );

    return unsubscribe;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Singleton service instance
export const appwrite = new AppwriteService();

// Export client and utilities for advanced use cases
export { client, account, databases, Query, ID };
