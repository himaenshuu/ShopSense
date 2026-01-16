/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: ["cloud.appwrite.io"],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
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
