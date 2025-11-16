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
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Metadata for SEO and social sharing
export const metadata: Metadata = {
  metadataBase: new URL("https://shopsense.example.com"),
  title:
    "ShopSense - AI-Powered Shopping Assistant | Smart Product Reviews & Recommendations",
  description:
    "Discover products smarter with ShopSense. Get AI-powered product recommendations, sentiment analysis, price comparisons, and detailed reviews. Your intelligent shopping companion.",
  keywords: [
    "AI shopping assistant",
    "product recommendations",
    "price comparison",
    "product reviews",
    "sentiment analysis",
    "smart shopping",
    "e-commerce AI",
    "product finder",
  ],
  authors: [{ name: "Himanshu Raj" }],
  creator: "ShopSense Team",
  publisher: "ShopSense",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://shopsense.example.com",
    siteName: "ShopSense",
    title: "ShopSense - AI Shopping Assistant",
    description:
      "Smart product discovery with AI recommendations, reviews, and price comparisons",
    images: [
      {
        url: "https://shopsense.example.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "ShopSense - AI Shopping Assistant",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShopSense - AI Shopping Assistant",
    description: "Smart product discovery with AI recommendations",
    images: ["https://shopsense.example.com/twitter-image.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/logo.png",
    },
  },
  alternates: {
    canonical: "https://shopsense.example.com",
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
