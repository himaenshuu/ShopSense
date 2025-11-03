import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

interface GuestBannerProps {
  onSignIn: () => void;
}

export function GuestBanner({ onSignIn }: GuestBannerProps) {
  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              You&apos;re in <span>Guest Mode</span>. Chats will not be saved.
            </p>
          </div>
          <Button
            onClick={onSignIn}
            size="sm"
            className="bg-[#10A37F] hover:bg-[#0D8C6C] text-white rounded-lg"
          >
            Sign In to Save History
          </Button>
        </div>
      </div>
    </div>
  );
}
