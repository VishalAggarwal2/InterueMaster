"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Users, Calendar, Trophy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AuthGuard from "@/components/layout/AuthGuard";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import ScoreBreakdown from "@/components/interview/ScoreBreakdown";
import { dailyQuestionApi } from "@/lib/api";
import { DailyQuestion, DailyResult } from "@/types";
import { formatDate, getDifficultyColor, parseApiError } from "@/lib/utils";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function DailyPage() {
  const [question, setQuestion] = useState<DailyQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<DailyResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await dailyQuestionApi.get();
        const data = response.data.data || response.data;
        setQuestion(data.question || data);
        if (data.submitted) {
          setIsSubmitted(true);
          setResult(data.result);
        }
      } catch {
        toast.error("Failed to load today's question");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async () => {
    if (!question || !answer.trim()) return;
    if (answer.length < 50) {
      toast.error("Please write a more detailed answer");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await dailyQuestionApi.submitAnswer({
        questionId: question.id,
        answer,
      });
      const data = response.data.data || response.data;
      setResult(data);
      setIsSubmitted(true);
      toast.success("Answer submitted!");
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-zinc-950">
          <Navbar />
          <Sidebar />
          <main className="lg:pl-60 pt-16">
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
              <Skeleton className="h-12 w-64 rounded-lg" />
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <Sidebar />

        <main className="lg:pl-60 pt-16">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                  <BookOpen size={22} className="text-indigo-400" />
                  Daily Question
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  {question ? formatDate(question.date) : "Today"}
                </p>
              </div>

              {question && (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Users size={14} />
                  {question.participantCount} practiced today
                </div>
              )}
            </div>

            {/* Question card */}
            {question && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-zinc-800 bg-zinc-900/50 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="indigo" className="text-xs capitalize">
                        {question.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs capitalize border-zinc-700",
                          getDifficultyColor(question.difficulty)
                        )}
                      >
                        {question.difficulty}
                      </Badge>
                      {question.topic && (
                        <span className="text-xs text-zinc-600">{question.topic}</span>
                      )}
                    </div>

                    <p className="text-lg font-medium text-zinc-100 leading-relaxed">
                      {question.question}
                    </p>

                    {question.hint && (
                      <div className="mt-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                        <p className="text-xs text-yellow-300/80">
                          💡 Hint: {question.hint}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Answer section */}
            {!isSubmitted ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <Textarea
                  placeholder="Share your answer using the STAR method (Situation, Task, Action, Result)..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={8}
                  disabled={isSubmitting}
                  className="text-sm"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600">
                    {answer.length} characters
                    {answer.length < 50 && answer.length > 0 && (
                      <span className="text-zinc-700 ml-1">
                        (min 50 needed)
                      </span>
                    )}
                  </span>
                  <Button
                    onClick={handleSubmit}
                    disabled={answer.length < 50 || isSubmitting}
                    loading={isSubmitting}
                    variant="gradient"
                    className="gap-2"
                  >
                    <Send size={15} />
                    Submit Answer
                  </Button>
                </div>
              </motion.div>
            ) : (
              result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Score + rank */}
                  <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs text-zinc-500">Your Score</p>
                          <p
                            className="text-4xl font-bold mt-0.5"
                            style={{
                              color:
                                result.score >= 80
                                  ? "#22c55e"
                                  : result.score >= 60
                                  ? "#eab308"
                                  : "#ef4444",
                            }}
                          >
                            {result.score}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Trophy size={16} className="text-yellow-400" />
                            <span className="text-lg font-bold text-zinc-200">
                              #{result.rank}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500">
                            Top {result.percentile}%
                          </p>
                        </div>
                      </div>

                      <ScoreBreakdown starScore={result.starScore} animated />
                    </CardContent>
                  </Card>

                  {/* Model answer */}
                  {result.modelAnswer && (
                    <Card className="border-zinc-800 bg-zinc-900/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-zinc-300">
                          Model Answer
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          {result.modelAnswer}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <p className="text-center text-sm text-zinc-600">
                    Come back tomorrow for a new question!
                  </p>
                </motion.div>
              )
            )}

            {isSubmitted && !result && (
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardContent className="p-6 text-center">
                  <Badge variant="success" className="mb-2">
                    Already submitted
                  </Badge>
                  <p className="text-sm text-zinc-500">
                    You've already answered today's question. Check back tomorrow!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
