"use client";

/**
 * Home Page - Chat Interface
 * Main application page after authentication at /home
 */

import { useAuth } from "@/contexts/AuthContext";
import { ChatInterface } from "@/components/ChatInterface";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { user, isGuest, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isLoading && !user && !isGuest) {
      router.push("/signIn");
    }
  }, [user, isGuest, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#10A37F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return null; // Will redirect via useEffect
  }

  return <ChatInterface />;
}
