"use client";

/**
 * Authentication Context for Next.js
 *
 * Provides global authentication state management using:
 * - Appwrite Auth for user authentication
 * - LocalStorage for guest mode persistence
 * - React Context API for state distribution
 *
 * Features:
 * ✅ Email/password sign up and sign in
 * ✅ Guest mode (no account required)
 * ✅ Session persistence
 * ✅ Auto-login on page load
 */


import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { appwrite, User } from "@/lib/appwrite";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  loginWithGoogle: () => Promise<void>;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * On mount, check if user has an active session
   * This runs once when the app loads
   */
  useEffect(() => {
    checkUser();
  }, []);

  /**
   * Check for existing user session
   * Checks both Appwrite session and localStorage guest mode
   */
  async function checkUser() {
    try {
      // Try to get current authenticated user from Appwrite
      const currentUser = await appwrite.getCurrentUser();
      setUser(currentUser);

      // If no authenticated user, check for guest mode
      if (!currentUser) {
        const guestMode = localStorage.getItem("guest_mode");
        if (guestMode === "true") {
          setIsGuest(true);
        }
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Sign up new user with email/password
   * Automatically logs in the user after successful registration
   */
  async function signUp(email: string, password: string, name: string) {
    try {
      const newUser = await appwrite.createAccount(email, password, name);
      setUser(newUser);
      setIsGuest(false);

      // Clear any guest data
      localStorage.removeItem("guest_mode");
      localStorage.removeItem("guest_messages");
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  }

  /**
   * Sign in existing user with email/password
   */
  async function signIn(email: string, password: string) {
    try {
      const loggedInUser = await appwrite.login(email, password);
      setUser(loggedInUser);
      setIsGuest(false);

      // Clear any guest data
      localStorage.removeItem("guest_mode");
      localStorage.removeItem("guest_messages");
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }

  /**
   * Sign out current user
   * Clears both Appwrite session and local state
   */
  async function signOut() {
    try {
      // Only call Appwrite logout if user is authenticated (not guest)
      if (user && !isGuest) {
        await appwrite.logout();
      }

      setUser(null);
      setIsGuest(false);

      // Clear all local data
      localStorage.removeItem("guest_mode");
      localStorage.removeItem("guest_messages");
    } catch (error) {
      console.error("Sign out error:", error);
      // Even if Appwrite logout fails, clear local state
      setUser(null);
      setIsGuest(false);
      localStorage.removeItem("guest_mode");
      localStorage.removeItem("guest_messages");
      throw error;
    }
  }

  /**
   * Enable guest mode
   * Allows users to use the app without creating an account
   * Guest chats are stored in localStorage (not persistent across devices)
   */
  function continueAsGuest() {
    setIsGuest(true);
    localStorage.setItem("guest_mode", "true");
  }

  /**
   * Login with Google OAuth
   * Redirects user to Google sign-in page
   */
  async function loginWithGoogle() {
    try {
      const successUrl =
        typeof window !== "undefined" ? window.location.origin : "";
      const failureUrl =
        typeof window !== "undefined" ? window.location.origin : "";
      await appwrite.loginWithGoogle(successUrl, failureUrl);
    } catch (error) {
      console.error("Google OAuth error:", error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        isLoading,
        signUp,
        signIn,
        signOut,
        continueAsGuest,
        loginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * useAuth Hook
 *
 * Access authentication state and methods from any component
 *
 * Usage:
 * ```typescript
 * const { user, isGuest, signIn, signOut } = useAuth();
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
