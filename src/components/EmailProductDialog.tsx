/**
 * Email Product Dialog Component
 * Shows generated email preview and sends it after user confirmation
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Send, Loader2, Star, X } from "lucide-react";

interface EmailProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  userEmail: string | null;
  userName: string | null;
  isGuest: boolean;
}

interface EmailPreview {
  subject: string;
  htmlContent: string;
  textContent: string;
  overallRating: number;
  ratingExplanation: string;
}

export function EmailProductDialog({
  open,
  onOpenChange,
  productName,
  userEmail,
  userName,
  isGuest,
}: EmailProductDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailPreview, setEmailPreview] = useState<EmailPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate email when dialog opens
  React.useEffect(() => {
    if (open && !emailPreview && !isGenerating) {
      generateEmail();
    }
  }, [open]);

  const generateEmail = async () => {
    if (isGuest) {
      setError("guest_mode");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Fetch product data and generate email
      const response = await fetch("/api/generate-product-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productData: {
            productName,
            // This will be populated by the API by fetching from database
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate email");
      }

      const data = await response.json();
      setEmailPreview(data.emailContent);
    } catch (err) {
      console.error("Error generating email:", err);
      setError("generation_failed");
      toast.error("Failed to generate email. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = async () => {
    if (!emailPreview || !userEmail || !userName) return;

    setIsSending(true);

    try {
      const response = await fetch("/api/send-product-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: userEmail,
          recipientName: userName,
          emailContent: emailPreview,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a configuration error
        if (data.error?.includes("not configured")) {
          toast.error("⚙️ Email service not configured", {
            description:
              "Please configure SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in your .env file, then restart the server.",
            duration: 8000,
          });
        } else {
          toast.error("Failed to send email", {
            description: data.error || "Please try again later.",
          });
        }
        return;
      }

      toast.success(`Email sent successfully to ${userEmail}! 📧`);
      onOpenChange(false);

      // Reset state
      setEmailPreview(null);
    } catch (err) {
      console.error("Error sending email:", err);
      toast.error("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <Star
            className="w-4 h-4 fill-yellow-400 text-yellow-400"
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />
        )}
        {Array.from({ length: 5 - Math.ceil(rating) }).map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Product Details
          </DialogTitle>
          <DialogDescription>
            {isGuest
              ? "Please sign in to send product details via email"
              : `Preview and send product details to ${userEmail}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Guest Mode Warning */}
          {isGuest && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg
                    className="w-5 h-5 text-amber-600 dark:text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Sign In Required
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    You need to sign in with your account to send product
                    details via email. This ensures we have your email address
                    to send the information to.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isGenerating && !isGuest && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Generating email with AI...
              </p>
            </div>
          )}

          {/* Error State */}
          {error === "generation_failed" && (
            <div className="text-center py-8">
              <X className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Failed to generate email. Please try again.
              </p>
              <Button onClick={generateEmail} variant="outline">
                Retry
              </Button>
            </div>
          )}

          {/* Email Preview */}
          {emailPreview && !isGuest && (
            <div className="space-y-4">
              {/* Subject */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Subject
                </label>
                <div className="mt-1 p-3 bg-muted rounded-lg">
                  <p className="font-medium">{emailPreview.subject}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Overall Rating
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(emailPreview.overallRating)}
                      <span className="text-lg font-bold">
                        {emailPreview.overallRating.toFixed(1)}/5.0
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  AI Calculated
                </Badge>
              </div>

              {/* Rating Explanation */}
              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-sm text-muted-foreground">
                  {emailPreview.ratingExplanation}
                </p>
              </div>

              {/* HTML Preview */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email Preview
                </label>
                <div
                  className="mt-2 p-4 bg-white dark:bg-gray-900 rounded-lg border max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: emailPreview.htmlContent }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!isGuest && emailPreview && (
            <Button onClick={sendEmail} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
