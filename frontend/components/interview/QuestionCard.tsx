"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Tag, BarChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Question } from "@/types";
import { getDifficultyColor } from "@/lib/utils";
import { useState } from "react";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  const [showHint, setShowHint] = useState(false);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-hidden">
          {/* Gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

          <CardContent className="p-6">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-500">
                  Q{questionNumber}/{totalQuestions}
                </span>
                <Badge variant="indigo" className="capitalize text-xs">
                  <Tag size={10} className="mr-1" />
                  {question.category}
                </Badge>
                {question.difficulty && (
                  <Badge
                    variant="outline"
                    className={`capitalize text-xs border-zinc-700 ${getDifficultyColor(
                      question.difficulty
                    )}`}
                  >
                    <BarChart size={10} className="mr-1" />
                    {question.difficulty}
                  </Badge>
                )}
              </div>

              {question.hint && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHint(!showHint)}
                  className="text-zinc-500 hover:text-yellow-400 h-7 px-2 text-xs"
                >
                  <Lightbulb size={13} className="mr-1" />
                  {showHint ? "Hide hint" : "Show hint"}
                </Button>
              )}
            </div>

            {/* Question text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl font-medium text-zinc-100 leading-relaxed"
            >
              {question.text}
            </motion.p>

            {/* Topic tag */}
            {question.topic && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-3"
              >
                <span className="text-xs text-zinc-600">
                  Topic: <span className="text-zinc-400">{question.topic}</span>
                </span>
              </motion.div>
            )}

            {/* Hint */}
            <AnimatePresence>
              {showHint && question.hint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="flex gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <Lightbulb
                      size={16}
                      className="text-yellow-400 shrink-0 mt-0.5"
                    />
                    <p className="text-sm text-yellow-200/80 leading-relaxed">
                      {question.hint}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
