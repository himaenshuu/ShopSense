import React, { useState, useEffect, useRef } from "react";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { Sidebar } from "./Sidebar";
import { GuestBanner } from "./GuestBanner";
import { SignOutModal } from "./SignOutModal";
import { ShareChatDialog } from "./ShareChatDialog";
import { DocumentationPage } from "./DocumentationPage";
import { EmailProductDialog } from "./EmailProductDialog";
import { useAuth } from "../contexts/AuthContext";
import { appwrite, Chat, Message } from "../lib/appwrite";
import { toast } from "sonner";
import { MessageSquare, BookOpen, Menu } from "lucide-react";
import { Button } from "./ui/button";

export function ChatInterface() {
  const { user, isGuest, signOut } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [chatToShare, setChatToShare] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string>("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailProductName, setEmailProductName] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (user && !isGuest) {
      loadChats();
    }
  }, [user, isGuest]);

  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    } else {
      if (isGuest) {
        const guestMessages = JSON.parse(
          localStorage.getItem("guest_messages") || "[]"
        );
        setMessages(guestMessages);
      }
    }
  }, [currentChatId, isGuest]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      handleStopSpeaking();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function loadChats() {
    if (!user) return;
    try {
      const userChats = await appwrite.getChats(user.$id);
      setChats(
        userChats.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      );
    } catch (error) {
      console.error("Error loading chats:", error);
    }
  }

  async function loadMessages(chatId: string) {
    try {
      const chatMessages = await appwrite.getMessages(chatId);
      setMessages(
        chatMessages.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      );
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }

  async function handleNewChat() {
    setCurrentChatId(null);
    setMessages([]);
  }

  async function handleSendMessage(content: string) {
    setIsLoading(true);
    setIsGenerating(true);
    setLastUserMessage(content);

    abortControllerRef.current = new AbortController();

    try {
      let chatId = currentChatId;

      if (!chatId && user && !isGuest) {
        const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
        const newChat = await appwrite.createChat(user.$id, title);
        chatId = newChat.$id;
        setCurrentChatId(chatId);
        await loadChats();
      }

      const userMessage: Message =
        isGuest || !chatId
          ? {
              $id: "msg_" + Date.now(),
              chatId: chatId || "guest",
              role: "user",
              content,
              createdAt: new Date().toISOString(),
            }
          : await appwrite.createMessage(chatId, "user", content);

      setMessages((prev) => [...prev, userMessage]);

      if (isGuest) {
        const guestMessages = [...messages, userMessage];
        localStorage.setItem("guest_messages", JSON.stringify(guestMessages));
      }

      const tempMessageId = "msg_temp_" + Date.now();
      const streamingMessage: Message = {
        $id: tempMessageId,
        chatId: chatId || "guest",
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, streamingMessage]);

      // Build conversation history (last 10 messages for context)
      const conversationHistory = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          conversationHistory,
        }),
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        setMessages((prev) => prev.filter((msg) => msg.$id !== tempMessageId));

        const emailData = await response.json();

        if (emailData.type === "email_request") {
          if (emailData.needsContext) {
            const systemMessage: Message = {
              $id: "msg_" + Date.now(),
              chatId: chatId || "guest",
              role: "assistant",
              content:
                "📧 I'd be happy to email you product details! However, I need to know which product you're interested in. Could you please specify the product name? For example: 'Email me details about Boat Type C Cable'",
              createdAt: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, systemMessage]);

            if (isGuest) {
              localStorage.setItem(
                "guest_messages",
                JSON.stringify([...messages, userMessage, systemMessage])
              );
            } else if (chatId) {
              await appwrite.createMessage(
                chatId,
                "assistant",
                systemMessage.content
              );
            }

            setIsLoading(false);
            setIsGenerating(false);
            return;
          }

          // Show email dialog
          setEmailProductName(emailData.productName);
          setEmailDialogOpen(true);
          const systemMessage: Message = {
            $id: "msg_" + Date.now(),
            chatId: chatId || "guest",
            role: "assistant",
            content: isGuest
              ? "📧 I'd love to email you the product details! However, you need to sign in first so I know where to send it. Please sign in to continue."
              : `📧 Great! I'll generate an email with detailed product information about "${emailData.productName}". Please review and confirm before sending.`,
            createdAt: new Date().toISOString(),
          };

          setMessages((prev) => [...prev, systemMessage]);

          if (isGuest) {
            localStorage.setItem(
              "guest_messages",
              JSON.stringify([...messages, userMessage, systemMessage])
            );
          } else if (chatId) {
            await appwrite.createMessage(
              chatId,
              "assistant",
              systemMessage.content
            );
          }

          setIsLoading(false);
          setIsGenerating(false);
          return;
        }
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let isFirstChunk = true;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;

          // Safety check: if first chunk looks like JSON email request, handle it
          if (
            isFirstChunk &&
            accumulatedContent.startsWith('{"type":"email_request"')
          ) {
            console.log(
              "[DEBUG] Detected JSON in stream, parsing as email request"
            );
            try {
              const emailData = JSON.parse(accumulatedContent);
              if (emailData.type === "email_request") {
                setMessages((prev) =>
                  prev.filter((msg) => msg.$id !== tempMessageId)
                );

                setEmailProductName(emailData.productName);
                setEmailDialogOpen(true);

                const systemMessage: Message = {
                  $id: "msg_" + Date.now(),
                  chatId: chatId || "guest",
                  role: "assistant",
                  content: isGuest
                    ? "📧 I'd love to email you the product details! However, you need to sign in first so I know where to send it. Please sign in to continue."
                    : `📧 Great! I'll generate an email with detailed product information about "${emailData.productName}". Please review and confirm before sending.`,
                  createdAt: new Date().toISOString(),
                };

                setMessages((prev) => [...prev, systemMessage]);

                if (isGuest) {
                  localStorage.setItem(
                    "guest_messages",
                    JSON.stringify([...messages, userMessage, systemMessage])
                  );
                } else if (chatId) {
                  await appwrite.createMessage(
                    chatId,
                    "assistant",
                    systemMessage.content
                  );
                }

                setIsLoading(false);
                setIsGenerating(false);
                return;
              }
            } catch (e) {
              // Not complete JSON yet, continue reading
            }
          }

          isFirstChunk = false;

          // Update the streaming message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.$id === tempMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          );
        }
      }

      if (isGuest || !chatId) {
        const guestMessages = [
          ...messages,
          userMessage,
          { ...streamingMessage, content: accumulatedContent },
        ];
        localStorage.setItem("guest_messages", JSON.stringify(guestMessages));
      } else {
        const savedMessage = await appwrite.createMessage(
          chatId,
          "assistant",
          accumulatedContent
        );
        setMessages((prev) =>
          prev.map((msg) => (msg.$id === tempMessageId ? savedMessage : msg))
        );
      }

      setIsLoading(false);
      setIsGenerating(false);
    } catch (error: unknown) {
      const err = error as Error;
      if (err.name === "AbortError") {
        toast.info("Generation stopped");
      } else {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
      }
      setIsLoading(false);
      setIsGenerating(false);
    }
  }

  function handleStopGeneration() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setIsGenerating(false);
      toast.info("Stopped generating");
    }
  }

  async function handleRetry() {
    if (lastUserMessage) {
      // Remove the last assistant message if it exists
      setMessages((prev) => {
        const filtered = prev.filter(
          (msg, index) =>
            !(index === prev.length - 1 && msg.role === "assistant")
        );
        return filtered;
      });

      // Retry with the last user message
      await handleSendMessage(lastUserMessage);
    }
  }

  async function handleDeleteChat(chatId: string) {
    try {
      await appwrite.deleteChat(chatId);
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
      await loadChats();
      toast.success("Chat deleted successfully");
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    }
  }

  async function handleRenameChat(chatId: string, newTitle: string) {
    try {
      await appwrite.updateChat(chatId, newTitle);
      await loadChats();
      toast.success("Chat renamed successfully");
    } catch (error) {
      console.error("Error renaming chat:", error);
      toast.error("Failed to rename chat");
    }
  }

  async function handleShareChat(chatId: string) {
    try {
      const chat = await appwrite.getChat(chatId);
      setChatToShare(chat);
      setShareDialogOpen(true);
    } catch (error) {
      console.error("Error loading chat for sharing:", error);
      toast.error("Failed to load chat");
    }
  }

  function handleSignOut() {
    setShowSignOutModal(true);
  }

  async function confirmSignOut() {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
    setShowSignOutModal(false);
  }

  function handleSignInFromGuest() {
    // This would typically trigger a navigation back to the landing page
    // For now, we'll just sign out which will return them to the landing
    signOut();
  }

  function handleVoiceInput(transcript: string) {
    // Voice input captured, can be sent automatically or wait for user confirmation
    console.log("Voice transcript:", transcript);
  }

  function handleStopSpeaking() {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = "";
        audioRef.current.load();
      } catch (error) {
        console.error("Error stopping audio:", error);
      }
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      try {
        URL.revokeObjectURL(audioUrlRef.current);
      } catch (error) {
        console.error("Error revoking URL:", error);
      }
      audioUrlRef.current = null;
    }
    setIsSpeaking(false);
  }

  async function handleTextToSpeech(text: string) {
    try {
      // Stop any ongoing speech first
      handleStopSpeaking();

      setIsSpeaking(true);

      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voice: "Zephyr",
          tone: "warm, welcoming",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const { audio } = await response.json();

      if (!audio) {
        throw new Error("No audio data received");
      }

      // Decode base64 audio data
      const binaryString = atob(audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create WAV header for PCM data (24kHz, 16-bit, mono)
      const sampleRate = 24000;
      const numChannels = 1;
      const bitsPerSample = 16;
      const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
      const blockAlign = numChannels * (bitsPerSample / 8);
      const dataSize = bytes.length;

      const wavHeader = new Uint8Array(44);
      const view = new DataView(wavHeader.buffer);

      // "RIFF" chunk descriptor
      view.setUint32(0, 0x52494646, false); // "RIFF"
      view.setUint32(4, 36 + dataSize, true); // File size - 8
      view.setUint32(8, 0x57415645, false); // "WAVE"

      // "fmt" sub-chunk
      view.setUint32(12, 0x666d7420, false); // "fmt "
      view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
      view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
      view.setUint16(22, numChannels, true); // NumChannels
      view.setUint32(24, sampleRate, true); // SampleRate
      view.setUint32(28, byteRate, true); // ByteRate
      view.setUint16(32, blockAlign, true); // BlockAlign
      view.setUint16(34, bitsPerSample, true); // BitsPerSample

      // "data" sub-chunk
      view.setUint32(36, 0x64617461, false); // "data"
      view.setUint32(40, dataSize, true); // Subchunk2Size

      // Combine header and audio data
      const wavFile = new Uint8Array(wavHeader.length + bytes.length);
      wavFile.set(wavHeader, 0);
      wavFile.set(bytes, wavHeader.length);

      // Create blob with proper WAV format
      const audioBlob = new Blob([wavFile], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audioElement = new Audio(audioUrl);
      audioRef.current = audioElement;

      audioElement.onended = () => {
        setIsSpeaking(false);
        if (audioUrlRef.current) {
          try {
            URL.revokeObjectURL(audioUrlRef.current);
          } catch (error) {
            console.error("Error revoking URL on end:", error);
          }
          audioUrlRef.current = null;
        }
        audioRef.current = null;
      };

      audioElement.onerror = (e) => {
        console.error("Audio playback error:", e);
        setIsSpeaking(false);
        toast.error("Failed to play audio");
        if (audioUrlRef.current) {
          try {
            URL.revokeObjectURL(audioUrlRef.current);
          } catch (error) {
            console.error("Error revoking URL on error:", error);
          }
          audioUrlRef.current = null;
        }
        audioRef.current = null;
      };

      try {
        await audioElement.play();
      } catch (playError) {
        console.error("Error playing audio:", playError);
        setIsSpeaking(false);
        if (audioUrlRef.current) {
          try {
            URL.revokeObjectURL(audioUrlRef.current);
          } catch (error) {
            console.error("Error revoking URL after play error:", error);
          }
          audioUrlRef.current = null;
        }
        audioRef.current = null;
        throw playError;
      }
    } catch (error) {
      console.error("Error in text-to-speech:", error);
      toast.error("Failed to generate speech");
      setIsSpeaking(false);
      if (audioUrlRef.current) {
        try {
          URL.revokeObjectURL(audioUrlRef.current);
        } catch (cleanupError) {
          console.error("Error revoking URL in catch:", cleanupError);
        }
        audioUrlRef.current = null;
      }
    }
  }

  async function handleWelcomeMessage() {
    const welcomeText =
      "Hello! I'm excited to help you discover amazing products and find exactly what you're looking for. Whether you need product recommendations, want to compare items, check customer reviews, or get detailed specifications, I'm here to make your shopping experience effortless and enjoyable. Just tell me what you're interested in, and let's get started!";
    await handleTextToSpeech(welcomeText);
  }

  if (showDocs) {
    return <DocumentationPage onBack={() => setShowDocs(false)} />;
  }

  return (
    <div className="flex h-screen bg-[#F7F7F8] dark:bg-[#343541] transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={setCurrentChatId}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onShareChat={handleShareChat}
        onSignOut={handleSignOut}
        userEmail={user?.email || "guest@example.com"}
        isGuest={isGuest}
        isOpen={sidebarOpen}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header with App Name and Toggle */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2d2d2d] transition-colors duration-200">
          <Button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            variant="ghost"
            size="icon"
            className="hover:bg-gray-100 dark:hover:bg-gray-700"
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-[#202123] dark:text-[#ececf1]">
            ShopSense
          </h1>
        </header>

        {/* Guest Banner */}
        {isGuest && <GuestBanner onSignIn={handleSignInFromGuest} />}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-[#F7F7F8] dark:bg-[#343541] relative transition-colors duration-200">
          {/* Documentation Button */}
          <Button
            onClick={() => setShowDocs(true)}
            variant="outline"
            className="fixed bottom-20 right-6 z-20 bg-white dark:bg-[#2d2d2d] hover:bg-gray-50 dark:hover:bg-[#40414f] shadow-lg border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 hidden lg:flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            View Docs
          </Button>

          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center px-4 max-w-2xl">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#10A37F] to-[#0D8C6C] rounded-3xl mb-6 shadow-xl">
                  <MessageSquare className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-semibold text-[#202123] dark:text-[#ececf1] mb-4">
                  How can I help you today?
                </h2>
                <p className="text-[#6e6e80] dark:text-[#9b9ba5] mb-8">
                  Start a conversation or try one of the examples below
                </p>

                {/* Example Prompts - ShopSense Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  <button
                    onClick={() =>
                      handleSendMessage(
                        "Show me the top five best smartphones with excellent ratings"
                      )
                    }
                    disabled={isLoading}
                    className="p-4 bg-white dark:bg-[#444654] rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#505162] transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <p className="text-sm font-medium text-[#202123] dark:text-[#ececf1] mb-1">
                      Budget Smartphones
                    </p>
                    <p className="text-xs text-[#6e6e80] dark:text-[#9b9ba5]">
                      Best value for money →
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      handleSendMessage(
                        "What do customers love and dislike about this product? Show me the sentiment analysis"
                      )
                    }
                    disabled={isLoading}
                    className="p-4 bg-white dark:bg-[#444654] rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#505162] transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <p className="text-sm font-medium text-[#202123] dark:text-[#ececf1] mb-1">
                      Product Sentiment
                    </p>
                    <p className="text-xs text-[#6e6e80] dark:text-[#9b9ba5]">
                      Customer opinions & reviews →
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      handleSendMessage(
                        "Compare popular wireless earbuds under 5000 rupees"
                      )
                    }
                    disabled={isLoading}
                    className="p-4 bg-white dark:bg-[#444654] rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#505162] transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <p className="text-sm font-medium text-[#202123] dark:text-[#ececf1] mb-1">
                      Product Comparison
                    </p>
                    <p className="text-xs text-[#6e6e80] dark:text-[#9b9ba5]">
                      Side by side features →
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      handleSendMessage(
                        "Email me detailed information about this product with price and specifications"
                      )
                    }
                    disabled={isLoading}
                    className="p-4 bg-white dark:bg-[#444654] rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#505162] transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <p className="text-sm font-medium text-[#202123] dark:text-[#ececf1] mb-1">
                      Email Product Details
                    </p>
                    <p className="text-xs text-[#6e6e80] dark:text-[#9b9ba5]">
                      Get info delivered →
                    </p>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {messages.map((message, index) => (
                <ChatBubble
                  key={message.$id}
                  role={message.role}
                  content={message.content}
                  isStreaming={
                    isLoading &&
                    index === messages.length - 1 &&
                    message.role === "assistant"
                  }
                  onSpeak={
                    message.role === "assistant"
                      ? handleTextToSpeech
                      : undefined
                  }
                  isSpeaking={isSpeaking}
                  onStopSpeaking={handleStopSpeaking}
                />
              ))}
              <div ref={messagesEndRef} />

              {/* Retry button - shown after assistant message */}
              {!isGenerating &&
                messages.length > 0 &&
                messages[messages.length - 1]?.role === "assistant" && (
                  <div className="flex justify-center py-4">
                    <Button
                      onClick={handleRetry}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      className="bg-white dark:bg-[#40414f] hover:bg-gray-100 dark:hover:bg-[#505162] border-gray-300 dark:border-gray-600 text-[#202123] dark:text-[#ececf1] rounded-lg"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Regenerate
                    </Button>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <ChatInput
          onSend={handleSendMessage}
          onStop={handleStopGeneration}
          disabled={isLoading}
          isGenerating={isGenerating}
          onVoiceInput={handleVoiceInput}
          isSpeaking={isSpeaking}
          onPlayWelcome={handleWelcomeMessage}
          onStopSpeaking={handleStopSpeaking}
        />
      </div>

      {/* Sign Out Modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={confirmSignOut}
      />

      {/* Share Chat Dialog */}
      {chatToShare && (
        <ShareChatDialog
          isOpen={shareDialogOpen}
          onClose={() => {
            setShareDialogOpen(false);
            setChatToShare(null);
          }}
          chatId={chatToShare.$id}
          chatTitle={chatToShare.title}
        />
      )}

      {/* Email Product Dialog */}
      <EmailProductDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        productName={emailProductName}
        userEmail={user?.email || null}
        userName={user?.name || null}
        isGuest={isGuest}
      />
    </div>
  );
}
