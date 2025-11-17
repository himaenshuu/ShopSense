"use client";

/**
 * Root Page Component
 *
 * Redirects users to the appropriate page:
 * - /signin for unauthenticated users
 * - /home for authenticated users and guests
 */

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootPage() {
  const { user, isGuest, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user || isGuest) {
        router.push("/home");
      } else {
        router.push("/signIn");
      }
    }
  }, [user, isGuest, isLoading, router]);

  // Show loading spinner while checking authentication status
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
