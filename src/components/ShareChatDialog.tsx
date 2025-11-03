import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Copy, Check, Mail, MessageCircle, Link2 } from "lucide-react";
import { toast } from "sonner";

interface ShareChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatTitle: string;
}

export function ShareChatDialog({
  isOpen,
  onClose,
  chatId,
  chatTitle,
}: ShareChatDialogProps) {
  const [copied, setCopied] = useState(false);

  // Generate shareable link (in production, this would be a real share URL)
  const shareUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/share/${chatId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Check out this chat: ${chatTitle}`);
    const body = encodeURIComponent(
      `I wanted to share this conversation with you:\n\n${shareUrl}\n\nTitle: ${chatTitle}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Check out this chat: ${chatTitle}\n${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#2d2d2d] border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-[#202123] dark:text-[#ececf1] flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Share Chat
          </DialogTitle>
          <DialogDescription className="text-[#6e6e80] dark:text-[#9b9ba5]">
            Share &quot;{chatTitle}&quot; with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Copy Link Section */}
          <div>
            <label className="text-sm font-medium text-[#202123] dark:text-[#ececf1] mb-2 block">
              Share Link
            </label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 bg-gray-50 dark:bg-[#40414f] border-gray-200 dark:border-gray-600 text-[#202123] dark:text-[#ececf1]"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="shrink-0 border-gray-200 dark:border-gray-600"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Share Options */}
          <div>
            <label className="text-sm font-medium text-[#202123] dark:text-[#ececf1] mb-2 block">
              Share via
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleShareEmail}
                variant="outline"
                className="justify-start border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#40414f]"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                onClick={handleShareWhatsApp}
                variant="outline"
                className="justify-start border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#40414f]"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> Anyone with this link will be able to view
              this conversation. The share feature is currently a demo and would
              require backend implementation for full functionality.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-200 dark:border-gray-600"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
