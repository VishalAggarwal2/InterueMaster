"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Search, Sparkles, Tag, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AuthGuard from "@/components/layout/AuthGuard";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { questionApi } from "@/lib/api";
import { PredictedQuestion } from "@/types";
import { getDifficultyColor, parseApiError } from "@/lib/utils";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function PredictPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [questions, setQuestions] = useState<PredictedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handlePredict = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please paste a job description");
      return;
    }

    setIsLoading(true);
    try {
      const response = await questionApi.predict({
        jobDescription,
        role: role || undefined,
        company: company || undefined,
        numQuestions: 10,
      });
      const data = response.data.data || response.data;
      setQuestions(Array.isArray(data) ? data : []);
      toast.success(`Generated ${Array.isArray(data) ? data.length : 0} predicted questions`);
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const likelihoodColor = (pct: number) => {
    if (pct >= 80) return "text-green-400";
    if (pct >= 60) return "text-yellow-400";
    return "text-zinc-400";
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <Sidebar />

        <main className="lg:pl-60 pt-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                <TrendingUp size={22} className="text-indigo-400" />
                Predict Interview Questions
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Paste a job description to get AI-predicted questions
              </p>
            </div>

            <div className="space-y-6">
              {/* Input form */}
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardContent className="p-5 space-y-4">
                  {/* Optional fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Role (optional)</Label>
                      <Input
                        placeholder="Software Engineer"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Company (optional)</Label>
                      <Input
                        placeholder="Google"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* JD textarea */}
                  <div className="space-y-1.5">
                    <Label>Job Description *</Label>
                    <Textarea
                      placeholder="Paste the full job description here. The more detailed, the better predictions..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={8}
                      className="text-sm"
                    />
                    <p className="text-xs text-zinc-600">
                      {jobDescription.length} characters
                    </p>
                  </div>

                  <Button
                    onClick={handlePredict}
                    disabled={!jobDescription.trim() || isLoading}
                    loading={isLoading}
                    variant="gradient"
                    className="w-full gap-2"
                  >
                    <Sparkles size={16} />
                    {isLoading ? "Predicting..." : "Predict Questions"}
                  </Button>
                </CardContent>
              </Card>

              {/* Loading skeletons */}
              {isLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              )}

              {/* Results */}
              <AnimatePresence>
                {!isLoading && questions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-zinc-300">
                        {questions.length} Predicted Questions
                      </h2>
                      <Badge variant="indigo" className="text-xs">
                        <Sparkles size={10} className="mr-1" />
                        AI Generated
                      </Badge>
                    </div>

                    {questions.map((q, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <Card className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {/* Number */}
                              <span className="text-xs font-mono text-zinc-700 mt-0.5 shrink-0">
                                {String(i + 1).padStart(2, "0")}
                              </span>

                              <div className="flex-1 min-w-0 space-y-2">
                                {/* Question */}
                                <p className="text-sm font-medium text-zinc-100 leading-relaxed">
                                  {q.question}
                                </p>

                                {/* Meta */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] border-zinc-700 text-zinc-500 gap-1"
                                  >
                                    <Tag size={9} />
                                    {q.category}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] border-zinc-700",
                                      getDifficultyColor(q.difficulty)
                                    )}
                                  >
                                    <BarChart size={9} className="mr-0.5" />
                                    {q.difficulty}
                                  </Badge>
                                  {q.topic && (
                                    <span className="text-[10px] text-zinc-600">
                                      {q.topic}
                                    </span>
                                  )}
                                </div>

                                {/* Hint */}
                                {q.hint && (
                                  <p className="text-xs text-zinc-600 italic">
                                    Hint: {q.hint}
                                  </p>
                                )}
                              </div>

                              {/* Likelihood */}
                              <div className="text-right shrink-0">
                                <p
                                  className={cn(
                                    "text-sm font-bold",
                                    likelihoodColor(q.likelihood)
                                  )}
                                >
                                  {q.likelihood}%
                                </p>
                                <p className="text-[10px] text-zinc-700">likely</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
