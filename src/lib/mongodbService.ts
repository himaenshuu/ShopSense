/**
 * MongoDB Service for Chat Application
 * This provides MongoDB-specific implementations of chat and message operations
 * as an alternative to Appwrite
 */

import { ObjectId } from "mongodb";
import { getDatabase } from "./mongodb";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface MongoChat {
  _id?: ObjectId;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoMessage {
  _id?: ObjectId;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

// ============================================================================
// MONGODB SERVICE CLASS
// ============================================================================

class MongoDBService {
  private dbName = "chatai-db";
  private chatsCollection = "chats";
  private messagesCollection = "messages";

  /**
   * Get database instance
   */
  private async getDb() {
    return getDatabase(this.dbName);
  }

  // ==========================================================================
  // CHAT MANAGEMENT
  // ==========================================================================

  /**
   * Create new chat
   */
  async createChat(userId: string, title: string): Promise<MongoChat> {
    const db = await this.getDb();
    const now = new Date();

    const chat: MongoChat = {
      userId,
      title,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection(this.chatsCollection).insertOne(chat);

    return {
      ...chat,
      _id: result.insertedId,
    };
  }

  /**
   * Get all chats for a user
   */
  async getChats(userId: string): Promise<MongoChat[]> {
    const db = await this.getDb();

    const chats = await db
      .collection(this.chatsCollection)
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray();

    return chats as MongoChat[];
  }

  /**
   * Update chat title and timestamp
   */
  async updateChat(chatId: string, title: string): Promise<MongoChat | null> {
    const db = await this.getDb();

    const result = await db.collection(this.chatsCollection).findOneAndUpdate(
      { _id: new ObjectId(chatId) },
      {
        $set: {
          title,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result as MongoChat | null;
  }

  /**
   * Delete chat and all associated messages
   */
  async deleteChat(chatId: string): Promise<void> {
    const db = await this.getDb();

    // Delete all messages first
    await db.collection(this.messagesCollection).deleteMany({ chatId });

    // Delete the chat
    await db
      .collection(this.chatsCollection)
      .deleteOne({ _id: new ObjectId(chatId) });
  }

  // ==========================================================================
  // MESSAGE MANAGEMENT
  // ==========================================================================

  /**
   * Create new message
   */
  async createMessage(
    chatId: string,
    role: "user" | "assistant",
    content: string
  ): Promise<MongoMessage> {
    const db = await this.getDb();

    const message: MongoMessage = {
      chatId,
      role,
      content,
      createdAt: new Date(),
    };

    const result = await db
      .collection(this.messagesCollection)
      .insertOne(message);

    // Update parent chat's timestamp
    await db
      .collection(this.chatsCollection)
      .updateOne(
        { _id: new ObjectId(chatId) },
        { $set: { updatedAt: new Date() } }
      );

    return {
      ...message,
      _id: result.insertedId,
    };
  }

  /**
   * Get all messages for a chat
   */
  async getMessages(chatId: string): Promise<MongoMessage[]> {
    const db = await this.getDb();

    const messages = await db
      .collection(this.messagesCollection)
      .find({ chatId })
      .sort({ createdAt: 1 })
      .limit(1000)
      .toArray();

    return messages as MongoMessage[];
  }

  /**
   * Delete a specific message
   */
  async deleteMessage(messageId: string): Promise<void> {
    const db = await this.getDb();

    await db
      .collection(this.messagesCollection)
      .deleteOne({ _id: new ObjectId(messageId) });
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get chat count for a user
   */
  async getChatCount(userId: string): Promise<number> {
    const db = await this.getDb();
    return db.collection(this.chatsCollection).countDocuments({ userId });
  }

  /**
   * Get message count for a chat
   */
  async getMessageCount(chatId: string): Promise<number> {
    const db = await this.getDb();
    return db.collection(this.messagesCollection).countDocuments({ chatId });
  }

  /**
   * Search chats by title
   */
  async searchChats(userId: string, searchTerm: string): Promise<MongoChat[]> {
    const db = await this.getDb();

    const chats = await db
      .collection(this.chatsCollection)
      .find({
        userId,
        title: { $regex: searchTerm, $options: "i" },
      })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();

    return chats as MongoChat[];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Singleton service instance
export const mongoDBService = new MongoDBService();
