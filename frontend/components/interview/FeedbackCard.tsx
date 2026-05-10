"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Lightbulb, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Answer } from "@/types";
import { getScoreColor, getScoreLabel } from "@/lib/auth";

interface FeedbackCardProps {
  answer: Answer;
  showModelAnswer?: boolean;
}

export default function FeedbackCard({
  answer,
  showModelAnswer = false,
}: FeedbackCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardContent className="p-5 space-y-4">
          {/* Header with overall score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-zinc-200">
                AI Feedback
              </h3>
            </div>
            <Badge
              className={`font-bold ${getScoreColor(answer.score)} bg-transparent border-current/30`}
            >
              {answer.score}/100 · {getScoreLabel(answer.score)}
            </Badge>
          </div>

          {/* Main feedback */}
          <p className="text-sm text-zinc-300 leading-relaxed">
            {answer.feedback}
          </p>

          {/* Strengths */}
          {answer.strengths && answer.strengths.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-400 uppercase tracking-wide">
                <CheckCircle2 size={12} />
                Strengths
              </div>
              <ul className="space-y-1.5">
                {answer.strengths.map((s, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2 text-sm text-zinc-400"
                  >
                    <span className="text-green-500 mt-0.5">•</span>
                    {s}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {answer.improvements && answer.improvements.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-yellow-400 uppercase tracking-wide">
                <XCircle size={12} />
                Areas to Improve
              </div>
              <ul className="space-y-1.5">
                {answer.improvements.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-start gap-2 text-sm text-zinc-400"
                  >
                    <span className="text-yellow-500 mt-0.5">•</span>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Model Answer (collapsible) */}
          {showModelAnswer && answer.modelAnswer && (
            <div className="border-t border-zinc-800 pt-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <BookOpen size={12} />
                {expanded ? "Hide" : "Show"} model answer
              </button>

              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20"
                >
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {answer.modelAnswer}
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
