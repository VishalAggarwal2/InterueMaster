"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, DollarSign, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NegotiationMessage } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface NegotiationChatProps {
  messages: NegotiationMessage[];
  onSendMessage: (content: string, offer?: number) => void;
  isLoading?: boolean;
  isComplete?: boolean;
  currency?: string;
}

export default function NegotiationChat({
  messages,
  onSendMessage,
  isLoading = false,
  isComplete = false,
  currency = "USD",
}: NegotiationChatProps) {
  const [input, setInput] = useState("");
  const [counterOffer, setCounterOffer] = useState("");
  const [showOffer, setShowOffer] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const offer = showOffer && counterOffer ? parseInt(counterOffer) : undefined;
    onSendMessage(input.trim(), offer);
    setInput("");
    setCounterOffer("");
    setShowOffer(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.role === "candidate";

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-3",
                  isUser ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    isUser
                      ? "bg-indigo-500/20"
                      : "bg-zinc-700"
                  )}
                >
                  {isUser ? (
                    <User size={14} className="text-indigo-400" />
                  ) : (
                    <Bot size={14} className="text-zinc-400" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    "max-w-[75%] space-y-1",
                    isUser ? "items-end" : "items-start",
                    "flex flex-col"
                  )}
                >
                  {/* Offer badge */}
                  {msg.offer && (
                    <div
                      className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                        isUser
                          ? "bg-indigo-500/20 text-indigo-300 self-end"
                          : "bg-zinc-700 text-zinc-300"
                      )}
                    >
                      <DollarSign size={10} />
                      {formatCurrency(msg.offer, currency)}
                    </div>
                  )}

                  <div
                    className={cn(
                      "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                      isUser
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : "bg-zinc-800 text-zinc-200 rounded-tl-sm"
                    )}
                  >
                    {msg.content}
                  </div>

                  <span className="text-[10px] text-zinc-600">
                    {format(parseISO(msg.timestamp), "h:mm a")}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-zinc-400" />
            </div>
            <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-zinc-500"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {!isComplete && (
        <div className="border-t border-zinc-800 p-4 space-y-3">
          {/* Counter offer toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOffer(!showOffer)}
              className={cn(
                "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors",
                showOffer
                  ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
                  : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
              )}
            >
              <DollarSign size={11} />
              {showOffer ? "Cancel offer" : "Add counter offer"}
            </button>

            {showOffer && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1"
              >
                <Input
                  type="number"
                  placeholder="Enter amount..."
                  value={counterOffer}
                  onChange={(e) => setCounterOffer(e.target.value)}
                  className="h-7 text-xs"
                />
              </motion.div>
            )}
          </div>

          {/* Message input */}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              rows={2}
              className="flex-1 resize-none text-sm"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              variant="gradient"
              size="icon"
              className="shrink-0 self-end"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="border-t border-zinc-800 p-4 text-center text-sm text-zinc-500">
          Negotiation session completed
        </div>
      )}
    </div>
  );
}
