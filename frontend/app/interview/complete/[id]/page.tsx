"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Trophy,
  Share2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AuthGuard from "@/components/layout/AuthGuard";
import Navbar from "@/components/layout/Navbar";
import ScoreBreakdown from "@/components/interview/ScoreBreakdown";
import { reportCardApi } from "@/lib/api";
import { ReportCard } from "@/types";
import { getColorByScore, scoreToGrade, formatDuration } from "@/lib/utils";
import toast from "react-hot-toast";

export default function CompletePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [report, setReport] = useState<ReportCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const response = await reportCardApi.getBySession(sessionId);
        setReport(response.data.data || response.data);
      } catch {
        toast.error("Failed to load report");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [sessionId]);

  const handleShare = async () => {
    if (!report) return;
    const url = `${window.location.origin}/report/${report.token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Report link copied to clipboard!");
  };

  const toggleAnswer = (id: string) => {
    setExpandedAnswers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-zinc-950">
          <Navbar />
          <div className="pt-24 max-w-3xl mx-auto px-4 space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!report) return null;

  const scoreColor = getColorByScore(report.overallScore);
  const grade = scoreToGrade(report.overallScore);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950">
        <Navbar />

        <main className="pt-20 pb-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-6">
            {/* Celebration header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 mb-4"
              >
                <Trophy size={36} style={{ color: scoreColor }} />
              </motion.div>

              <h1 className="text-3xl font-bold text-zinc-100">
                Session Complete!
              </h1>
              <p className="text-zinc-500 mt-1">
                {report.user.role}
                {report.user.company ? ` @ ${report.user.company}` : ""}
              </p>
            </motion.div>

            {/* Score card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-zinc-500">Overall Score</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span
                          className="text-5xl font-bold tabular-nums"
                          style={{ color: scoreColor }}
                        >
                          {report.overallScore}
                        </span>
                        <span className="text-zinc-600">/100</span>
                        <span
                          className="text-2xl font-bold ml-2"
                          style={{ color: scoreColor }}
                        >
                          {grade}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                        className="border-zinc-700 text-zinc-400 hover:text-zinc-100 gap-1.5"
                      >
                        <Share2 size={14} />
                        Share
                      </Button>
                    </div>
                  </div>

                  {report.starScore && (
                    <ScoreBreakdown starScore={report.starScore} animated />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Category breakdown */}
            {report.categoryBreakdown && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-zinc-300">
                      Category Scores
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(report.categoryBreakdown).map(([key, val]) => (
                        <div
                          key={key}
                          className="p-3 rounded-lg bg-zinc-800/50 flex items-center justify-between"
                        >
                          <span className="text-xs text-zinc-400 capitalize">
                            {key.replace(/([A-Z])/g, " $1")}
                          </span>
                          <span
                            className="text-sm font-bold"
                            style={{ color: getColorByScore(val) }}
                          >
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {report.strengths?.length > 0 && (
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-green-400 flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {report.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-zinc-400 flex gap-1.5">
                          <span className="text-green-500 shrink-0">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {report.improvements?.length > 0 && (
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-yellow-400 flex items-center gap-1.5">
                      <XCircle size={14} />
                      Areas to Improve
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {report.improvements.map((s, i) => (
                        <li key={i} className="text-xs text-zinc-400 flex gap-1.5">
                          <span className="text-yellow-500 shrink-0">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Q&A Breakdown */}
            {report.questions?.length > 0 && (
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-300">
                    Question Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {report.questions.map(({ question, answer }, i) => {
                    const isExpanded = expandedAnswers.has(question.id);
                    return (
                      <div
                        key={question.id}
                        className="rounded-lg border border-zinc-800 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleAnswer(question.id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800/50 transition-colors text-left"
                        >
                          <span className="text-xs font-mono text-zinc-600 shrink-0">
                            Q{i + 1}
                          </span>
                          <p className="flex-1 text-sm text-zinc-300 line-clamp-1">
                            {question.text}
                          </p>
                          <span
                            className="text-sm font-bold shrink-0"
                            style={{ color: getColorByScore(answer.score) }}
                          >
                            {answer.score}
                          </span>
                          {isExpanded ? (
                            <ChevronUp size={14} className="text-zinc-600 shrink-0" />
                          ) : (
                            <ChevronDown size={14} className="text-zinc-600 shrink-0" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="border-t border-zinc-800 p-3 space-y-3">
                            <div>
                              <p className="text-xs text-zinc-600 mb-1">Your answer:</p>
                              <p className="text-xs text-zinc-400 leading-relaxed">
                                {answer.text}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-600 mb-1">Feedback:</p>
                              <p className="text-xs text-zinc-400 leading-relaxed">
                                {answer.feedback}
                              </p>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {["situation", "task", "action", "result"].map((key) => (
                                <div key={key} className="text-center">
                                  <p className="text-[10px] text-zinc-600 capitalize">{key}</p>
                                  <p
                                    className="text-sm font-bold"
                                    style={{
                                      color: getColorByScore(
                                        answer.starScore[key as keyof typeof answer.starScore]
                                      ),
                                    }}
                                  >
                                    {answer.starScore[key as keyof typeof answer.starScore]}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/interview/setup" className="flex-1">
                <Button
                  variant="gradient"
                  className="w-full gap-2"
                >
                  <RotateCcw size={15} />
                  Practice Again
                </Button>
              </Link>
              <Link href="/dashboard" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full gap-2 border-zinc-700 text-zinc-300"
                >
                  <LayoutDashboard size={15} />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
