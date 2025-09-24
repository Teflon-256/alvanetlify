import { storage } from "./storage";
import { type User } from "@shared/schema";

export async function handleReplitAuth(userInfo: { id: string; email: string }): Promise<User> {
  try {
    const user = await storage.upsertUser({
      id: userInfo.id,
      email: userInfo.email,
      referralCode: '', // Will be generated in storage if not provided
    });
    return user;
  } catch (error) {
    console.error("Error handling Replit auth:", error);
    throw new Error("Failed to authenticate user");
  }
}
