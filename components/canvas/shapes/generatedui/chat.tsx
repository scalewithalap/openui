"use client";
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatWindow } from "@/hooks/use-canvas";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/redux/slice/chat";
import {
  Loader2,
  RefreshCw,
  Send,
  Trash2,
  X,
  Folder,
  Paperclip,
} from "lucide-react";

type Props = { generatedUIId: string; isOpen: boolean; onClose: () => void };

export default function ChatWindow({ generatedUIId, isOpen, onClose }: Props) {
  const {
    inputValue,
    setInputValue,
    scrollAreaRef,
    inputRef,
    handleSendMessage,
    handleKeyPress,
    handleClearChat,
    chatState,
  } = useChatWindow(generatedUIId, isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-[360px] z-60 h-full border-l border-sidebar-border bg-sidebar flex flex-col transition-all duration-300 select-none"
      style={{
        boxShadow: "-4px 0 16px rgba(0,0,0,0.02)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-sidebar-border/60">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-foreground/80 animate-pulse" />
          <h2 className="font-heading font-bold text-foreground text-base tracking-tight">
            Design Chat
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {chatState?.messages && chatState.messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-full cursor-pointer"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-5 overflow-y-auto">
        <div className="space-y-6">
          {!chatState?.messages || chatState.messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-16 space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto opacity-30 text-primary animate-spin-slow" />
              <p className="text-sm font-medium">Ask me to redesign this UI!</p>
              <p className="text-xs leading-relaxed opacity-80 px-4">
                I can modify layout alignments, customize colors, inject styles,
                and introduce features in real time.
              </p>
            </div>
          ) : (
            chatState.messages.map((message: ChatMessage) => {
              const isUser = message.role === "user";
              return (
                <div key={message.id} className="space-y-1.5">
                  {/* Sender Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      {isUser ? "You" : "Claude"}
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground/60">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Message Bubble Card */}
                  <div className="p-3 bg-card border border-sidebar-border/40 rounded-xl shadow-xs text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                    {message.content}

                    {/* Model Details & Action tag */}
                    {!isUser && message.isStreaming && (
                      <div className="flex items-center gap-1.5 mt-2 text-primary font-medium">
                        <Loader2 size={10} className="animate-spin" />
                        <span className="text-[10px]">Thinking...</span>
                      </div>
                    )}
                  </div>

                  {/* Render Mock Context Tags for User Prompt */}
                  {isUser && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium bg-sidebar-accent border border-sidebar-border/50 text-muted-foreground rounded-md shadow-2xs hover:text-foreground transition cursor-default">
                        <Folder className="size-3 text-muted-foreground/80" />
                        <span>OpenUI design system</span>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium bg-sidebar-accent border border-sidebar-border/50 text-muted-foreground rounded-md shadow-2xs hover:text-foreground transition cursor-default">
                        <Folder className="size-3 text-muted-foreground/80" />
                        <span>openui-web</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Input Form container */}
      <div className="p-5 border-t border-sidebar-border/60 bg-sidebar-accent/10">
        <div className="border border-sidebar-border/80 bg-card rounded-2xl p-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition duration-200">
          <textarea
            ref={inputRef as any}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Describe what you want to design..."
            disabled={chatState?.isStreaming}
            rows={3}
            className="w-full resize-none bg-transparent border-none outline-none text-xs text-foreground placeholder-muted-foreground/60 leading-relaxed"
          />

          {/* Action Row */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-sidebar-border/30">
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground bg-sidebar-accent/40 border border-sidebar-border/40 hover:bg-sidebar-accent rounded-lg cursor-pointer flex items-center gap-1"
                title="Attach files"
              >
                <Paperclip className="size-3" />
                Import
              </Button>
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || chatState?.isStreaming}
              size="sm"
              className="h-7 px-3 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs rounded-lg flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:scale-100"
            >
              {chatState?.isStreaming ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send size={10} className="ml-0.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
