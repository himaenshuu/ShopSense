import React, { useState } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  User,
  LogOut,
  Edit2,
  Share2,
  Check,
  X,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { ThemeToggle } from "./ThemeToggle";
import { Chat } from "../lib/appwrite";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onShareChat: (chatId: string) => void;
  onSignOut: () => void;
  userEmail: string;
  isGuest: boolean;
  isOpen: boolean;
}

export function Sidebar({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onShareChat,
  onSignOut,
  userEmail,
  isGuest,
  isOpen,
}: SidebarProps) {
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [previousChatIds, setPreviousChatIds] = useState<string[]>([]);
  const [newChatId, setNewChatId] = useState<string | null>(null);

  const handleDeleteChat = (chatId: string) => {
    onDeleteChat(chatId);
    setChatToDelete(null);
  };

  const handleStartRename = (chat: Chat) => {
    setEditingChatId(chat.$id);
    setEditingTitle(chat.title);
  };

  const handleSaveRename = (chatId: string) => {
    if (editingTitle.trim()) {
      onRenameChat(chatId, editingTitle.trim());
    }
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleCancelRename = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  // Truncate chat title to max 20 characters (shorter)
  const truncateTitle = (title: string, maxLength: number = 20) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + "...";
  };

  // Track new chats for animation
  React.useEffect(() => {
    const currentIds = chats.map((chat) => chat.$id);
    const newChats = currentIds.filter((id) => !previousChatIds.includes(id));

    if (newChats.length > 0) {
      // New chat detected - mark it for animation
      setNewChatId(newChats[0]);
      // Clear the new chat marker after animation completes (400ms animation + 50ms buffer)
      const timer = setTimeout(() => setNewChatId(null), 450);
      setPreviousChatIds(currentIds);
      return () => clearTimeout(timer);
    } else if (previousChatIds.length === 0) {
      // Initial load - no animation
      setPreviousChatIds(currentIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#202123] dark:bg-[#202123] transition-colors duration-200">
      {/* New Chat Button */}
      <div className="p-4 border-b border-gray-700">
        <Button
          onClick={() => {
            onNewChat();
          }}
          className="w-full bg-transparent hover:bg-gray-700 text-white border border-gray-600 rounded-lg justify-start gap-3 py-2.5 shadow-sm transition-all duration-200"
          variant="outline"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 px-2 overflow-hidden">
        <div className="py-4 space-y-1.5">
          {isGuest ? (
            <div className="text-center py-12 px-2">
              <p className="text-gray-400 text-sm leading-relaxed">
                Sign in to save and view chat history
              </p>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-12 px-2">
              <p className="text-gray-400 text-sm leading-relaxed">
                No chats yet. Start a new conversation!
              </p>
            </div>
          ) : (
            chats.map((chat) => {
              const isNewChat = chat.$id === newChatId;
              const isExistingChat =
                newChatId !== null && chat.$id !== newChatId;

              return (
                <div
                  key={chat.$id}
                  className={`group relative flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                    currentChatId === chat.$id
                      ? "bg-gray-700 text-white"
                      : "hover:bg-gray-700 text-gray-300 hover:text-white"
                  } ${isNewChat ? "animate-slideDown" : ""} ${
                    isExistingChat
                      ? "animate-slideDownExisting"
                      : "duration-200"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />

                  {editingChatId === chat.$id ? (
                    // Rename mode
                    <div
                      className="flex-1 flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveRename(chat.$id);
                          } else if (e.key === "Escape") {
                            handleCancelRename();
                          }
                        }}
                        className="flex-1 h-8 text-sm bg-gray-600 border-gray-500 text-white focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveRename(chat.$id)}
                        className="p-1.5 hover:bg-green-600 rounded transition-all duration-200"
                        title="Save"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="p-1.5 hover:bg-red-600 rounded transition-all duration-200"
                        title="Cancel"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    // Normal mode
                    <>
                      <span
                        className="flex-1 text-sm cursor-pointer pr-2 overflow-hidden text-ellipsis whitespace-nowrap"
                        onClick={() => {
                          onSelectChat(chat.$id);
                        }}
                        title={chat.title}
                      >
                        {truncateTitle(chat.title)}
                      </span>

                      {/* Actions dropdown - Always visible on hover */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="flex-shrink-0 hover:bg-gray-600 rounded transition-all duration-150 opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                            title="More options"
                            aria-label="Chat options"
                          >
                            <MoreHorizontal className="w-8 h-5 text-white" />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="end"
                          className="bg-gray-800 border-gray-700 text-white z-[100]"
                          sideOffset={5}
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(chat);
                            }}
                            className="cursor-pointer hover:bg-gray-700 focus:bg-gray-700 text-white"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onShareChat(chat.$id);
                            }}
                            className="cursor-pointer hover:bg-gray-700 focus:bg-gray-700 text-white"
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setChatToDelete(chat.$id);
                            }}
                            className="cursor-pointer hover:bg-red-600 focus:bg-red-600 text-red-400 hover:text-white focus:text-white"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* User Profile & Theme Toggle */}
      <div className="p-4 border-t border-gray-700 space-y-3">
        {/* Theme Toggle */}
        <ThemeToggle
          className="w-full bg-transparent hover:bg-gray-700 text-white justify-start border-gray-600 py-2.5"
          variant="outline"
          size="default"
          showLabel
        />

        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-700">
          <div className="w-9 h-9 rounded-full bg-[#10A37F] flex items-center justify-center flex-shrink-0 shadow-sm">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate font-medium">
              {isGuest ? "Guest User" : userEmail}
            </p>
          </div>
          <button
            onClick={onSignOut}
            className="p-2 hover:bg-gray-600 rounded-lg transition-all duration-200"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar - Collapsible */}
      <aside
        className={`${
          isOpen ? "w-[280px]" : "w-0"
        } bg-[#202123] border-r border-gray-700 shadow-xl h-screen transition-all duration-300 ease-in-out overflow-hidden`}
      >
        <SidebarContent />
      </aside>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!chatToDelete}
        onOpenChange={() => setChatToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => chatToDelete && handleDeleteChat(chatToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
