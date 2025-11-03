import React from "react";
import { UIFlowDiagram } from "./UIFlowDiagram";
import { TechStackDocumentation } from "./TechStackDocumentation";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ArrowLeft, BookOpen, GitBranch, Code2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface DocumentationPageProps {
  onBack: () => void;
}

export function DocumentationPage({ onBack }: DocumentationPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary transition-colors duration-200">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-foreground hover:bg-accent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to App
              </Button>
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[#10A37F]" />
                <h1 className="text-card-foreground">Documentation</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="flow" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="flow" className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              UI Flow
            </TabsTrigger>
            <TabsTrigger value="tech" className="flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              Tech Stack
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flow" className="space-y-8">
            <UIFlowDiagram />

            {/* Additional Flow Notes */}
            <div className="bg-card rounded-xl shadow-lg border border-border p-8 transition-colors duration-200">
              <h3 className="text-card-foreground mb-4">
                User Experience Flow
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="text-card-foreground mb-2">1. Landing Page</h4>
                  <p>
                    Users are presented with three clear options: Sign In, Sign
                    Up, or Continue as Guest. The interface is clean and
                    minimalistic with clear call-to-action buttons.
                  </p>
                </div>
                <div>
                  <h4 className="text-card-foreground mb-2">
                    2. Authentication
                  </h4>
                  <p>
                    Signed-in users gain access to persistent chat history
                    stored in the database. Guest users can chat immediately but
                    receive a warning that their conversations won&apos;t be
                    saved.
                  </p>
                </div>
                <div>
                  <h4 className="text-card-foreground mb-2">
                    3. Chat Interface
                  </h4>
                  <p>
                    The main interface features a left sidebar with chat history
                    (for signed-in users) and a main chat area with alternating
                    user/AI message bubbles. The input field is fixed at the
                    bottom with a send button.
                  </p>
                </div>
                <div>
                  <h4 className="text-card-foreground mb-2">
                    4. Sign Out Flow
                  </h4>
                  <p>
                    Users can sign out from the sidebar&apos;s profile section.
                    A confirmation modal prevents accidental sign-outs, then
                    redirects to the landing page.
                  </p>
                </div>
                <div>
                  <h4 className="text-card-foreground mb-2">5. Dark Mode</h4>
                  <p>
                    Toggle between light and dark themes using the theme
                    switcher. Your preference is saved to localStorage and
                    persists across sessions.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tech">
            <TechStackDocumentation />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
