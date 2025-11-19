import React, { useState, KeyboardEvent, useEffect, useRef } from "react";
import { Send, Square, Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "./ui/button";

// SpeechRecognition type definitions
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface ISpeechRecognitionEvent {
  results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionResultList {
  [index: number]: ISpeechRecognitionResult;
  length: number;
}

interface ISpeechRecognitionResult {
  [index: number]: ISpeechRecognitionAlternative;
  isFinal: boolean;
}

interface ISpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor;
    webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  }
}

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  onVoiceInput?: (transcript: string) => void;
  isSpeaking?: boolean;
  onPlayWelcome?: () => void;
  onStopSpeaking?: () => void;
}

export function ChatInput({
  onSend,
  onStop,
  disabled = false,
  isGenerating = false,
  onVoiceInput,
  isSpeaking = false,
  onPlayWelcome,
  onStopSpeaking,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      // Stop any ongoing speech before sending
      if (isSpeaking && onStopSpeaking) {
        onStopSpeaking();
      }
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleStop = () => {
    if (onStop) {
      onStop();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isGenerating) {
        handleStop();
      } else {
        handleSend();
      }
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-IN";

        recognition.onresult = (event: ISpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setMessage(transcript);
          if (onVoiceInput) {
            onVoiceInput(transcript);
          }
        };

        recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
          // Suppress 'no-speech' errors (user didn't speak in time)
          if (event.error !== "no-speech") {
            console.error("Speech recognition error:", event.error);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onVoiceInput]);

  const toggleVoiceInput = async () => {
    if (!recognitionRef.current) {
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome or Edge."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Stop any ongoing speech before activating voice input
      if (isSpeaking && onStopSpeaking) {
        onStopSpeaking();
      }

      // Play welcome message only once per session
      if (!hasPlayedWelcome && onPlayWelcome) {
        setHasPlayedWelcome(true);
        await onPlayWelcome();
      }

      // Ensure recognition is not already running before starting
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("already started")
        ) {
          // Recognition already running, just update state
          setIsListening(true);
        } else {
          console.error("Speech recognition error:", error);
        }
      }
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#343541] shadow-sm transition-colors duration-200">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => {
              // Stop audio immediately when user starts typing
              if (isSpeaking && onStopSpeaking && e.target.value !== message) {
                onStopSpeaking();
              }
              setMessage(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message Bert5..."
            disabled={disabled || isListening}
            rows={1}
            className="w-full px-4 py-3 pr-24 bg-white dark:bg-[#40414f] text-[#202123] dark:text-[#ececf1] border border-gray-200 dark:border-gray-600 rounded-3xl resize-none focus:outline-none focus:border-[#10A37F] focus:ring-2 focus:ring-[#10A37F]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm placeholder:text-[#6e6e80] dark:placeholder:text-[#9b9ba5]"
            style={{
              minHeight: "52px",
              maxHeight: "200px",
            }}
          />
          {/* Voice Input Button */}
          <Button
            onClick={toggleVoiceInput}
            disabled={disabled || isGenerating}
            className={`absolute right-14 bottom-3 ${
              isListening
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gray-500 hover:bg-gray-600"
            } text-white rounded-full h-9 w-9 p-0 shadow-sm transition-all duration-200 flex items-center justify-center disabled:opacity-30`}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
          {/* Send/Stop Button */}
          {isGenerating ? (
            <Button
              onClick={handleStop}
              className="absolute right-2 bottom-3 bg-red-500 hover:bg-red-600 text-white rounded-full h-9 w-9 p-0 shadow-sm transition-all duration-200 flex items-center justify-center"
              title="Stop generating"
            >
              <Square className="w-4 h-4 fill-current" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!message.trim() || disabled}
              className="absolute right-2 bottom-3 bg-[#10A37F] hover:bg-[#0D8C6C] text-white rounded-full h-9 w-9 p-0 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all duration-200 flex items-center justify-center"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
          {/* Speaking Indicator - Clickable to stop */}
          {isSpeaking && (
            <button
              onClick={onStopSpeaking}
              className="absolute left-4 bottom-3 flex items-center gap-2 text-[#10A37F] dark:text-[#10A37F] hover:text-[#0D8C6C] dark:hover:text-[#0D8C6C] transition-colors cursor-pointer bg-transparent border-none"
              title="Click to stop speaking"
            >
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">
                Speaking... (click to stop)
              </span>
            </button>
          )}
        </div>
        <p className="text-xs text-center text-[#6e6e80] dark:text-[#9b9ba5] mt-3">
          Bert5 can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
