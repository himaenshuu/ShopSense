import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  MessageSquare,
  Mail,
  Lock,
  User as UserIcon,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { DocumentationPage } from "./DocumentationPage";
import { ThemeToggle } from "./ThemeToggle";

export function LandingPage() {
  const { signIn, signUp, continueAsGuest, loginWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, name);
        toast.success("Account created successfully!");
      } else {
        await signIn(email, password);
        toast.success("Signed in successfully!");
      }
    } catch {
      toast.error(isSignUp ? "Failed to create account" : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    continueAsGuest();
    toast.info("You're now in Guest Mode. Chats will not be saved.");
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      // User will be redirected to Google OAuth, then back to the app
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Failed to sign in with Google");
    }
  };

  if (showDocs) {
    return <DocumentationPage onBack={() => setShowDocs(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#F7F7F8] dark:bg-[#1a1a1a] flex items-center justify-center p-4 relative transition-colors duration-200">
      {/* Top Right Controls */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-10">
        <ThemeToggle className="bg-white dark:bg-[#2d2d2d] hover:bg-gray-50 dark:hover:bg-[#3a3a3a] border border-gray-200 dark:border-gray-700 shadow-sm" />
        <Button
          onClick={() => setShowDocs(true)}
          variant="outline"
          className="bg-white dark:bg-[#2d2d2d] hover:bg-gray-50 dark:hover:bg-[#3a3a3a] shadow-sm border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 hidden sm:flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          <span>Documentation</span>
        </Button>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-200">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#10A37F] to-[#0D8C6C] rounded-2xl mb-4 shadow-lg">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-[#202123] dark:text-[#ececf1] mb-2">
              Welcome to ChatAI
            </h1>
            <p className="text-[#6e6e80] dark:text-[#9b9ba5]">
              Log in with your OpenAI account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-[#202123] dark:text-[#ececf1] font-medium"
                >
                  Full Name
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6e6e80] dark:text-[#9b9ba5]" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-11 h-12 rounded-lg border-gray-300 dark:border-gray-600 focus:border-[#10A37F] focus:ring-[#10A37F] bg-white dark:bg-[#40414f] text-[#202123] dark:text-[#ececf1]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[#202123] dark:text-[#ececf1] font-medium"
              >
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6e6e80] dark:text-[#9b9ba5]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-11 h-12 rounded-lg border-gray-300 dark:border-gray-600 focus:border-[#10A37F] focus:ring-[#10A37F] bg-white dark:bg-[#40414f] text-[#202123] dark:text-[#ececf1]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-[#202123] dark:text-[#ececf1] font-medium"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6e6e80] dark:text-[#9b9ba5]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-11 h-12 rounded-lg border-gray-300 dark:border-gray-600 focus:border-[#10A37F] focus:ring-[#10A37F] bg-white dark:bg-[#40414f] text-[#202123] dark:text-[#ececf1]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#10A37F] hover:bg-[#0D8C6C] text-white rounded-lg h-12 shadow-sm transition-all duration-200 font-medium"
            >
              {isLoading
                ? "Loading..."
                : isSignUp
                ? "Create Account"
                : "Continue"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-[#2d2d2d] text-[#6e6e80] dark:text-[#9b9ba5] font-medium">
                OR
              </span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-lg h-12 border-gray-300 dark:border-gray-600 text-[#202123] dark:text-[#ececf1] hover:bg-gray-50 dark:hover:bg-[#40414f] transition-all duration-200 font-medium"
            onClick={handleGoogleSignIn}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
          </div>

          {/* Guest Mode */}
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-lg h-12 border-gray-300 dark:border-gray-600 text-[#202123] dark:text-[#ececf1] hover:bg-gray-50 dark:hover:bg-[#40414f] transition-all duration-200 font-medium"
            onClick={handleGuestMode}
          >
            Continue as Guest
          </Button>

          {/* Toggle Sign In/Sign Up */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#10A37F] hover:text-[#0D8C6C] text-sm font-medium transition-colors duration-200"
            >
              {isSignUp
                ? "Already have an account? Log in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
