"use client";

/**
 * Main Page Component
 *
 * This is the entry point of the application that handles routing between:
 * - Landing Page (for unauthenticated users)
 * - Chat Interface (for authenticated users and guests)
 *
 * Uses client-side rendering since it relies on authentication state
 * and needs to render different components based on user status.
 */

import { useAuth } from "@/contexts/AuthContext";
import { LandingPage } from "@/components/LandingPage";
import { ChatInterface } from "@/components/ChatInterface";

export default function Home() {
  const { user, isGuest, isLoading } = useAuth();

  // Show loading spinner while checking authentication status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          {/* Custom loading spinner with brand color */}
          <div className="w-12 h-12 border-4 border-[#10A37F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if user is not authenticated and not in guest mode
  if (!user && !isGuest) {
    return <LandingPage />;
  }

  // Show chat interface for authenticated users or guests
  return <ChatInterface />;
}
