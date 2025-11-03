/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Configure image domains if you plan to use next/image with external sources
  images: {
    domains: ["cloud.appwrite.io"],
  },

  // Experimental features for better performance
  experimental: {
    // Enable server actions for form handling
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // Environment variables that should be available on the client side
  // (Note: These will be exposed to the browser, so never put secrets here)
  env: {
    NEXT_PUBLIC_APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    NEXT_PUBLIC_APPWRITE_PROJECT_ID:
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    NEXT_PUBLIC_APPWRITE_DATABASE_ID:
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    NEXT_PUBLIC_APPWRITE_CHATS_COLLECTION_ID:
      process.env.NEXT_PUBLIC_APPWRITE_CHATS_COLLECTION_ID,
    NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID:
      process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID,
  },
};

module.exports = nextConfig;
