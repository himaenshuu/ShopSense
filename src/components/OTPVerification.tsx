import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Shield, Mail } from "lucide-react";
import { toast } from "sonner";

interface OTPVerificationProps {
  email: string;
  userId: string;
  onVerify: (userId: string, otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
}

export function OTPVerification({
  email,
  userId,
  onVerify,
  onResend,
  onBack,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length < 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      await onVerify(userId, otp);
      toast.success("Email verified successfully!");
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend();
      toast.success("Verification code sent! Check your email.");
      setOtp(""); // Clear OTP field
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-200">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#10A37F] to-[#0D8C6C] rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-[#202123] dark:text-[#ececf1] mb-2">
            Verify Your Email
          </h1>
          <p className="text-[#6e6e80] dark:text-[#9b9ba5] text-sm">
            We&apos;ve sent a verification code to
          </p>
          <p className="text-[#10A37F] font-medium mt-1">{email}</p>
        </div>

        {/* OTP Form */}
        <form onSubmit={handleVerify} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="otp"
              className="text-[#202123] dark:text-[#ececf1] font-medium"
            >
              Verification Code
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6e6e80] dark:text-[#9b9ba5]" />
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                required
                className="pl-11 h-12 rounded-lg border-gray-300 dark:border-gray-600 focus:border-[#10A37F] focus:ring-[#10A37F] bg-white dark:bg-[#40414f] text-[#202123] dark:text-[#ececf1] text-center text-lg tracking-widest"
              />
            </div>
            <p className="text-xs text-[#6e6e80] dark:text-[#9b9ba5] mt-1">
              Check your email inbox and spam folder
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading || otp.length < 6}
            className="w-full bg-[#10A37F] hover:bg-[#0D8C6C] text-white rounded-lg h-12 shadow-sm transition-all duration-200 font-medium"
          >
            {isLoading ? "Verifying..." : "Verify Email"}
          </Button>
        </form>

        {/* Resend Link */}
        <div className="text-center mt-6 space-y-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-[#10A37F] hover:text-[#0D8C6C] text-sm font-medium transition-colors duration-200 disabled:opacity-50"
          >
            {isResending ? "Sending..." : "Didn't receive the code? Resend"}
          </button>

          <div>
            <button
              type="button"
              onClick={onBack}
              className="text-[#6e6e80] dark:text-[#9b9ba5] hover:text-[#202123] dark:hover:text-[#ececf1] text-sm font-medium transition-colors duration-200"
            >
              ← Back to sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
