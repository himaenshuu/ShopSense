import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";

// Configure Inter font with Latin subset
const inter = Inter({ subsets: ["latin"] });

// Viewport configuration (Next.js 15+)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// Metadata for SEO and social sharing
export const metadata: Metadata = {
  title: "ChatAI - Your Intelligent AI Assistant",
  description:
    "Chat interface with AI-powered responses, built with Next.js, Appwrite, and MongoDB",
  keywords: ["AI", "Chat", "Assistant", "Next.js", "Appwrite"],
  authors: [{ name: "Your Name" }],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

/**
 * Root Layout Component
 *
 * This is the main layout wrapper for the entire application.
 * It provides:
 * - Font configuration (Inter)
 * - Theme provider for dark/light mode
 * - Authentication context for user state management
 * - Toast notifications
 *
 * Note: This component runs on the server by default in Next.js App Router
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* ThemeProvider enables dark/light mode switching */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* AuthProvider manages user authentication state globally */}
          <AuthProvider>
            {/* Main content area */}
            {children}

            {/* Toast notifications positioned at top-right */}
            <Toaster position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
