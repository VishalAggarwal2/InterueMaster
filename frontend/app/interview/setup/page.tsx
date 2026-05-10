"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Briefcase,
  Building2,
  BarChart2,
  Timer,
  ChevronRight,
  Mic,
  BookOpen,
  Zap,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import AuthGuard from "@/components/layout/AuthGuard";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { sessionApi } from "@/lib/api";
import { InterviewCategory, InterviewLevel, InterviewMode, SessionSetup } from "@/types";
import { parseApiError } from "@/lib/utils";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const CATEGORIES: Array<{ value: InterviewCategory; label: string; icon: string; desc: string }> = [
  { value: "behavioral", label: "Behavioral", icon: "👥", desc: "STAR method, leadership, teamwork" },
  { value: "technical", label: "Technical", icon: "💻", desc: "Coding, system design, CS concepts" },
  { value: "system-design", label: "System Design", icon: "🏗️", desc: "Architecture, scalability" },
  { value: "mixed", label: "Mixed", icon: "🎯", desc: "Combination of all types" },
];

const LEVELS: Array<{ value: InterviewLevel; label: string; years: string }> = [
  { value: "junior", label: "Junior", years: "0–2 years" },
  { value: "mid", label: "Mid-level", years: "2–5 years" },
  { value: "senior", label: "Senior", years: "5–8 years" },
  { value: "staff", label: "Staff/Principal", years: "8+ years" },
];

const MODES: Array<{ value: InterviewMode; label: string; icon: typeof Mic; desc: string }> = [
  { value: "practice", label: "Practice", icon: BookOpen, desc: "No time limit, hints available" },
  { value: "timed", label: "Timed", icon: Timer, desc: "2 min per question, pressure mode" },
  { value: "mock", label: "Mock Interview", icon: Zap, desc: "Real interview simulation" },
];

const POPULAR_COMPANIES = [
  "Google", "Meta", "Amazon", "Apple", "Microsoft", "Netflix",
  "Uber", "Airbnb", "Stripe", "Salesforce",
];

export default function SetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [setup, setSetup] = useState<Partial<SessionSetup>>({
    role: "",
    company: "",
    level: "mid",
    category: "behavioral",
    mode: "practice",
    numQuestions: 8,
    useResume: false,
    jobDescription: "",
  });

  const handleCreate = async () => {
    if (!setup.role?.trim()) {
      toast.error("Please enter a role");
      return;
    }

    setIsLoading(true);
    try {
      const response = await sessionApi.create(setup as Record<string, unknown>);
      const session = response.data.data || response.data;
      router.push(`/interview/session/${session.id}`);
    } catch (error) {
      toast.error(parseApiError(error));
      setIsLoading(false);
    }
  };

  const update = (key: keyof SessionSetup, value: unknown) => {
    setSetup((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <Sidebar />

        <main className="lg:pl-60 pt-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-100">
                  Set Up Your Interview
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Customize your practice session
                </p>
              </div>

              <div className="space-y-6">
                {/* Role & Company */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      <Briefcase size={15} className="text-indigo-400" />
                      Role & Company
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Target Role *</Label>
                        <Input
                          placeholder="e.g. Software Engineer"
                          value={setup.role || ""}
                          onChange={(e) => update("role", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Company (optional)</Label>
                        <Input
                          placeholder="e.g. Google"
                          value={setup.company || ""}
                          onChange={(e) => update("company", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Popular companies */}
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_COMPANIES.map((c) => (
                        <button
                          key={c}
                          onClick={() => update("company", c)}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs border transition-colors",
                            setup.company === c
                              ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                              : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Category */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      <BarChart2 size={15} className="text-indigo-400" />
                      Interview Category
                    </h2>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => update("category", cat.value)}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all",
                            setup.category === cat.value
                              ? "border-indigo-500 bg-indigo-500/10"
                              : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/30"
                          )}
                        >
                          <span className="text-xl">{cat.icon}</span>
                          <p className="text-sm font-medium text-zinc-200 mt-1">
                            {cat.label}
                          </p>
                          <p className="text-xs text-zinc-600">{cat.desc}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Level */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-zinc-300">
                      Experience Level
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {LEVELS.map((lvl) => (
                        <button
                          key={lvl.value}
                          onClick={() => update("level", lvl.value)}
                          className={cn(
                            "p-3 rounded-lg border text-center transition-all",
                            setup.level === lvl.value
                              ? "border-indigo-500 bg-indigo-500/10"
                              : "border-zinc-800 hover:border-zinc-700"
                          )}
                        >
                          <p className="text-sm font-medium text-zinc-200">
                            {lvl.label}
                          </p>
                          <p className="text-xs text-zinc-600">{lvl.years}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Mode */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-zinc-300">
                      Practice Mode
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {MODES.map(({ value, label, icon: Icon, desc }) => (
                        <button
                          key={value}
                          onClick={() => update("mode", value)}
                          className={cn(
                            "p-3 rounded-lg border text-left flex gap-3 items-start transition-all",
                            setup.mode === value
                              ? "border-indigo-500 bg-indigo-500/10"
                              : "border-zinc-800 hover:border-zinc-700"
                          )}
                        >
                          <Icon
                            size={16}
                            className={
                              setup.mode === value
                                ? "text-indigo-400 mt-0.5"
                                : "text-zinc-600 mt-0.5"
                            }
                          />
                          <div>
                            <p className="text-sm font-medium text-zinc-200">
                              {label}
                            </p>
                            <p className="text-xs text-zinc-600">{desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Questions count */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-zinc-300">
                      Number of Questions
                    </h2>
                    <div className="flex items-center gap-4">
                      <Slider
                        min={3}
                        max={15}
                        step={1}
                        value={[setup.numQuestions || 8]}
                        onValueChange={(v) => update("numQuestions", v[0])}
                        className="flex-1"
                      />
                      <span className="text-sm font-bold text-indigo-400 w-8 text-center">
                        {setup.numQuestions}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600">
                      Estimated time: ~{(setup.numQuestions || 8) * 5} minutes
                    </p>
                  </CardContent>
                </Card>

                {/* Advanced */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-zinc-300">
                      Advanced Options
                    </h2>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Use my resume for personalization</Label>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          AI tailors questions to your background
                        </p>
                      </div>
                      <Switch
                        checked={setup.useResume || false}
                        onCheckedChange={(v) => update("useResume", v)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Job Description (optional)</Label>
                      <Textarea
                        placeholder="Paste the job description to get highly targeted questions..."
                        value={setup.jobDescription || ""}
                        onChange={(e) => update("jobDescription", e.target.value)}
                        rows={4}
                        className="text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Start button */}
                <Button
                  onClick={handleCreate}
                  disabled={!setup.role?.trim() || isLoading}
                  loading={isLoading}
                  variant="gradient"
                  size="xl"
                  className="w-full gap-2"
                >
                  Start Interview
                  <ChevronRight size={18} />
                </Button>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
