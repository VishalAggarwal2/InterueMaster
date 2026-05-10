"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Share2,
  Trophy,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AuthGuard from "@/components/layout/AuthGuard";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import ScoreBreakdown from "@/components/interview/ScoreBreakdown";
import { sessionApi, reportCardApi, answerApi } from "@/lib/api";
import { ReportCard } from "@/types";
import { formatDate, formatDateTime, formatDuration, getColorByScore, scoreToGrade } from "@/lib/utils";
import toast from "react-hot-toast";

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [report, setReport] = useState<ReportCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const response = await reportCardApi.getBySession(sessionId);
        setReport(response.data.data || response.data);
      } catch {
        toast.error("Failed to load session");
        router.push("/history");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [sessionId, router]);

  const handleShare = async () => {
    if (!report) return;
    const url = `${window.location.origin}/report/${report.token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-zinc-950">
          <Navbar />
          <Sidebar />
          <main className="lg:pl-60 pt-16">
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  if (!report) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <Sidebar />

        <main className="lg:pl-60 pt-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
            {/* Back nav */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-zinc-500 hover:text-zinc-300 gap-1.5"
              >
                <ArrowLeft size={15} />
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="border-zinc-700 text-zinc-400 hover:text-zinc-100 gap-1.5"
              >
                <Share2 size={13} />
                Share
              </Button>
            </div>

            {/* Header */}
            <div className="flex items-center gap-4">
              <div
                className="h-14 w-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
                style={{
                  backgroundColor: `${getColorByScore(report.overallScore)}20`,
                  color: getColorByScore(report.overallScore),
                }}
              >
                {scoreToGrade(report.overallScore)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-100">
                  {report.user.role}
                  {report.user.company && (
                    <span className="text-zinc-500"> @ {report.user.company}</span>
                  )}
                </h1>
                <p className="text-sm text-zinc-500">
                  {formatDateTime(report.generatedAt)} · {report.questions.length} questions
                </p>
              </div>
            </div>

            {/* Score summary */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-zinc-500">Overall Score</p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span
                        className="text-4xl font-bold"
                        style={{ color: getColorByScore(report.overallScore) }}
                      >
                        {report.overallScore}
                      </span>
                      <span className="text-zinc-600">/100</span>
                    </div>
                  </div>
                  <Trophy
                    size={32}
                    style={{ color: getColorByScore(report.overallScore) }}
                  />
                </div>

                {report.starScore && (
                  <ScoreBreakdown starScore={report.starScore} animated={false} />
                )}
              </CardContent>
            </Card>

            {/* Category breakdown */}
            {report.categoryBreakdown && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(report.categoryBreakdown).map(([key, val]) => (
                  <Card key={key} className="border-zinc-800 bg-zinc-900/50">
                    <CardContent className="p-3 text-center">
                      <p className="text-[11px] text-zinc-600 capitalize mb-1">
                        {key.replace(/([A-Z])/g, " $1")}
                      </p>
                      <p
                        className="text-lg font-bold"
                        style={{ color: getColorByScore(val) }}
                      >
                        {val}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Strengths & improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {report.strengths?.length > 0 && (
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-semibold text-green-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <CheckCircle2 size={12} />
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
                    <CardTitle className="text-xs font-semibold text-yellow-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <XCircle size={12} />
                      Improvements
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

            {/* Q&A breakdown */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-300">
                  Question Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.questions.map(({ question, answer }, i) => {
                  const isExpanded = expanded.has(question.id);
                  return (
                    <div
                      key={question.id}
                      className="rounded-lg border border-zinc-800 overflow-hidden"
                    >
                      <button
                        onClick={() => toggle(question.id)}
                        className="w-full flex items-center gap-3 p-3.5 hover:bg-zinc-800/50 transition-colors text-left"
                      >
                        <span className="text-xs font-mono text-zinc-600 shrink-0 w-5">
                          {i + 1}
                        </span>
                        <p className="flex-1 text-sm text-zinc-300 line-clamp-1">
                          {question.text}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className="text-[10px] border-zinc-700 text-zinc-600"
                          >
                            {question.category}
                          </Badge>
                          <span
                            className="text-sm font-bold w-8 text-right"
                            style={{ color: getColorByScore(answer.score) }}
                          >
                            {answer.score}
                          </span>
                          {isExpanded ? (
                            <ChevronUp size={14} className="text-zinc-600" />
                          ) : (
                            <ChevronDown size={14} className="text-zinc-600" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-t border-zinc-800 p-4 space-y-3"
                        >
                          <div>
                            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                              Your Answer
                            </p>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              {answer.text}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                              AI Feedback
                            </p>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                              {answer.feedback}
                            </p>
                          </div>

                          <div className="grid grid-cols-4 gap-2 pt-1">
                            {(["situation", "task", "action", "result"] as const).map((key) => (
                              <div key={key} className="text-center p-2 rounded-lg bg-zinc-800/50">
                                <p className="text-[10px] text-zinc-600 capitalize mb-0.5">
                                  {key.slice(0, 3)}
                                </p>
                                <p
                                  className="text-sm font-bold"
                                  style={{
                                    color: getColorByScore(answer.starScore[key]),
                                  }}
                                >
                                  {answer.starScore[key]}
                                </p>
                              </div>
                            ))}
                          </div>

                          {answer.timeSpent > 0 && (
                            <div className="flex items-center gap-1 text-xs text-zinc-600">
                              <Clock size={11} />
                              Time spent: {formatDuration(answer.timeSpent)}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Topics */}
            {report.topicsAssessed?.length > 0 && (
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-300">
                    Topics Assessed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {report.topicsAssessed.map((t) => (
                      <Badge
                        key={t}
                        variant="outline"
                        className="border-zinc-700 text-zinc-400"
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Link href="/interview/setup" className="flex-1">
                <Button variant="gradient" className="w-full">
                  Practice Again
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="outline" className="border-zinc-700 text-zinc-400">
                  <BarChart2 size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
