"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Mic, MicOff, Type } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { cn } from "@/lib/utils";

interface AnswerInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  maxLength?: number;
  minLength?: number;
  placeholder?: string;
  disabled?: boolean;
}

const MIN_LENGTH = 50;
const MAX_LENGTH = 3000;

export default function AnswerInput({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  maxLength = MAX_LENGTH,
  minLength = MIN_LENGTH,
  placeholder = "Type your answer here... Use the STAR method: Situation, Task, Action, Result",
  disabled = false,
}: AnswerInputProps) {
  const [voiceMode, setVoiceMode] = useState(false);

  const { isListening, isSupported, startListening, stopListening } =
    useVoiceInput({
      onTranscript: (text) => {
        onChange(text);
      },
    });

  const charCount = value.length;
  const isValid = charCount >= minLength;
  const isNearLimit = charCount > maxLength * 0.9;

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && isValid && !isSubmitting) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {/* Voice indicator */}
      {isListening && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-indigo-400"
        >
          <span className="flex gap-0.5">
            {[1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                className="inline-block w-1 h-3 bg-indigo-500 rounded-full"
                animate={{ scaleY: [1, 1.5, 1] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </span>
          Listening... speak your answer
        </motion.div>
      )}

      {/* Main textarea */}
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          rows={6}
          maxLength={maxLength}
          className={cn(
            "pr-4 pb-10 text-base leading-relaxed resize-none",
            "bg-zinc-900 border-zinc-700 focus-visible:ring-indigo-500",
            "transition-all duration-200",
            isListening && "border-indigo-500/50 ring-1 ring-indigo-500/30"
          )}
        />

        {/* Bottom bar inside textarea */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span
            className={cn(
              "text-xs font-mono transition-colors",
              charCount < minLength
                ? "text-zinc-600"
                : isNearLimit
                ? "text-yellow-400"
                : "text-zinc-500"
            )}
          >
            {charCount}/{maxLength}
            {charCount < minLength && (
              <span className="ml-1 text-zinc-600">
                (min {minLength - charCount} more chars)
              </span>
            )}
          </span>

          <span className="text-xs text-zinc-700">Ctrl+Enter to submit</span>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2">
        {/* Voice toggle */}
        {isSupported && (
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="sm"
            onClick={handleVoiceToggle}
            disabled={disabled || isSubmitting}
            className={cn(
              "gap-1.5 border-zinc-700 text-zinc-400 hover:text-zinc-100",
              isListening &&
                "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
            )}
          >
            {isListening ? (
              <>
                <MicOff size={14} />
                Stop
              </>
            ) : (
              <>
                <Mic size={14} />
                Voice
              </>
            )}
          </Button>
        )}

        <div className="flex-1" />

        {/* Submit */}
        <Button
          onClick={onSubmit}
          disabled={!isValid || isSubmitting || disabled}
          loading={isSubmitting}
          variant="gradient"
          className="gap-2"
        >
          <Send size={15} />
          Submit Answer
        </Button>
      </div>

      {/* Min length warning */}
      {charCount > 0 && charCount < minLength && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-zinc-600"
        >
          Please provide a more detailed answer ({minLength} characters minimum)
        </motion.p>
      )}
    </motion.div>
  );
}
