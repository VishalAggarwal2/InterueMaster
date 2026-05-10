"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, Trophy, CheckCircle2, XCircle, ChevronDown, ChevronUp, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ScoreBreakdown from "@/components/interview/ScoreBreakdown";
import { reportCardApi } from "@/lib/api";
import { ReportCard } from "@/types";
import { formatDate, getColorByScore, scoreToGrade } from "@/lib/utils";
import toast from "react-hot-toast";

export default function PublicReportPage() {
  const params = useParams();
  const token = params.token as string;

  const [report, setReport] = useState<ReportCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const response = await reportCardApi.getPublic(token);
        setReport(response.data.data || response.data);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-full max-w-2xl px-4 space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <Trophy size={40} className="text-zinc-700 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-zinc-300">Report Not Found</h1>
          <p className="text-zinc-500 mt-1">
            This report may have expired or doesn't exist.
          </p>
        </div>
        <Link href="/">
          <Button variant="gradient">Go Home</Button>
        </Link>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <Brain size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold gradient-text">IntervAI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 text-zinc-500 hover:text-zinc-300"
            >
              <Share2 size={13} />
              Share
            </Button>
            <Link href="/signup">
              <Button variant="gradient" size="sm">
                Try IntervAI Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="py-8 px-4">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Report header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-6"
          >
            <div className="text-sm text-zinc-500 mb-1">
              Interview Performance Report
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">
              {report.user.name}
            </h1>
            <p className="text-zinc-500">
              {report.user.role}
              {report.user.company && ` @ ${report.user.company}`}
            </p>
            <p className="text-xs text-zinc-700 mt-1">
              {formatDate(report.generatedAt)}
            </p>
          </motion.div>

          {/* Score */}
          <Card className="border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">
                    Overall Score
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span
                      className="text-5xl font-bold"
                      style={{ color: getColorByScore(report.overallScore) }}
                    >
                      {report.overallScore}
                    </span>
                    <span className="text-zinc-600">/100</span>
                    <span
                      className="text-2xl font-bold ml-1"
                      style={{ color: getColorByScore(report.overallScore) }}
                    >
                      {scoreToGrade(report.overallScore)}
                    </span>
                  </div>
                </div>
                <Trophy
                  size={40}
                  style={{ color: getColorByScore(report.overallScore) }}
                />
              </div>

              {report.starScore && (
                <ScoreBreakdown starScore={report.starScore} animated={false} />
              )}
            </CardContent>
          </Card>

          {/* Category scores */}
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
                        <span className="text-green-500">•</span>
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
                        <span className="text-yellow-500">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Q&A */}
          {report.questions?.length > 0 && (
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-300">
                  Questions & Answers
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
                        className="w-full flex items-center gap-3 p-3.5 hover:bg-zinc-800/50 text-left"
                      >
                        <span className="text-xs text-zinc-600 shrink-0">{i + 1}.</span>
                        <p className="flex-1 text-sm text-zinc-300 line-clamp-1">
                          {question.text}
                        </p>
                        <span
                          className="text-sm font-bold shrink-0"
                          style={{ color: getColorByScore(answer.score) }}
                        >
                          {answer.score}
                        </span>
                        {isExpanded ? <ChevronUp size={13} className="text-zinc-600" /> : <ChevronDown size={13} className="text-zinc-600" />}
                      </button>
                      {isExpanded && (
                        <div className="border-t border-zinc-800 p-4 space-y-2">
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {answer.text}
                          </p>
                          <p className="text-xs text-zinc-500 leading-relaxed border-l-2 border-zinc-700 pl-3">
                            {answer.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* CTA */}
          <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 p-6 text-center">
            <h3 className="font-semibold text-zinc-100 mb-1">
              Improve your interview skills
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              Join IntervAI and practice with AI-powered mock interviews
            </p>
            <Link href="/signup">
              <Button variant="gradient">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
