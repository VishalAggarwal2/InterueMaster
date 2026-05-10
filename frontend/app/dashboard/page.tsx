"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BarChart2,
  Flame,
  Clock,
  Target,
  CalendarDays,
  ArrowRight,
  Mic,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AuthGuard from "@/components/layout/AuthGuard";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import StatsCard from "@/components/dashboard/StatsCard";
import ScoreChart from "@/components/dashboard/ScoreChart";
import RadarChart from "@/components/dashboard/RadarChart";
import WeakTopics from "@/components/dashboard/WeakTopics";
import StreakCard from "@/components/dashboard/StreakCard";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";
import TopicHeatmap from "@/components/dashboard/TopicHeatmap";
import { dashboardApi, sessionApi, userApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import {
  DashboardStats,
  ScoreHistory,
  HeatmapData,
  TopicHeatmapData,
  WeakTopic,
  RadarData,
  Session,
} from "@/types";
import { formatDate, formatDuration, getColorByScore } from "@/lib/utils";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapData[]>([]);
  const [topicHeatmap, setTopicHeatmap] = useState<TopicHeatmapData[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [radarData, setRadarData] = useState<RadarData[]>([]);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, heatmapRes, topicRes, sessionsRes] =
          await Promise.allSettled([
            userApi.getStats(),
            userApi.getHeatmap(),
            userApi.getTopicHeatmap(),
            sessionApi.list(0, 5),
          ]);

        // ─── Stats ────────────────────────────────────────────────────────────
        const statsData =
          statsRes.status === "fulfilled"
            ? statsRes.value.data?.data || statsRes.value.data
            : null;

        if (statsData) {
          // Map backend shape -> DashboardStats shape
          const totalSessions = statsData.totalSessions ?? 0;
          const avg = Number(statsData.averageScore ?? 0);
          // Backend stores 0-10; UI shows 0-100
          const averageScore = avg <= 10 ? Math.round(avg * 10) : Math.round(avg);

          setStats({
            totalSessions,
            averageScore,
            streak: statsData.dailyStreak ?? 0,
            sessionsThisWeek: 0,
            bestScore: averageScore,
            totalTimeSpent: 0,
            topStrength: "",
            topWeakness: (statsData.weakTopics?.[0] as string) || "",
          });

          // weak topics
          const wt = (statsData.weakTopics || []) as string[];
          setWeakTopics(
            wt.map((topic) => ({
              topic,
              avgScore: 0,
              frequency: 1,
              lastPracticed: new Date().toISOString(),
              trend: "stable" as const,
            }))
          );

          // radar from topicBreakdown
          const tb = statsData.topicBreakdown || [];
          setRadarData(
            tb.map((t: { topic: string; averageScore: number }) => ({
              category: t.topic,
              score: Math.round((t.averageScore || 0) * 10),
              fullMark: 100,
            }))
          );

          // simple score-history derived from latest sessions
          // (real history endpoint can be added later)
          setScoreHistory([]);
        }

        // ─── Heatmap ─────────────────────────────────────────────────────────
        if (heatmapRes.status === "fulfilled") {
          const h = heatmapRes.value.data?.data || heatmapRes.value.data;
          const days = Array.isArray(h) ? h : h?.days || [];
          setHeatmap(
            days.map((d: {
              date: string;
              sessionsCount?: number;
              count?: number;
              averageScore?: number;
            }) => ({
              date: d.date,
              count: d.sessionsCount ?? d.count ?? 0,
              score: Math.round((d.averageScore || 0) * 10),
            }))
          );
        }

        // ─── Topic heatmap ───────────────────────────────────────────────────
        if (topicRes.status === "fulfilled") {
          const t = topicRes.value.data?.data || topicRes.value.data;
          const list = Array.isArray(t) ? t : [];
          setTopicHeatmap(
            list.map((x: {
              topic: string;
              questionCount?: number;
              averageScore?: number;
            }) => ({
              topic: x.topic,
              count: x.questionCount ?? 0,
              avgScore: Math.round((x.averageScore || 0) * 10),
              lastPracticed: new Date().toISOString(),
            }))
          );
        }

        // ─── Sessions list (paginated) ───────────────────────────────────────
        if (sessionsRes.status === "fulfilled") {
          const raw = sessionsRes.value.data?.data || sessionsRes.value.data;
          const list = raw?.content || (Array.isArray(raw) ? raw : []);
          setRecentSessions(list);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <Sidebar />

        <main className="lg:pl-60 pt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100">
                  Welcome back, {(user?.name || user?.fullName || "").split(" ")[0] || "there"} 👋
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  {stats?.sessionsThisWeek
                    ? `You've done ${stats.sessionsThisWeek} sessions this week`
                    : "Start practicing to see your progress"}
                </p>
              </div>

              <Link href="/interview/setup">
                <Button variant="gradient" className="gap-2">
                  <Mic size={16} />
                  New Session
                </Button>
              </Link>
            </div>

            {/* Stats Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatsCard
                  title="Total Sessions"
                  value={stats?.totalSessions || 0}
                  icon={BarChart2}
                  color="indigo"
                  index={0}
                />
                <StatsCard
                  title="Average Score"
                  value={`${stats?.averageScore || 0}%`}
                  icon={Target}
                  color={
                    (stats?.averageScore || 0) >= 80
                      ? "green"
                      : (stats?.averageScore || 0) >= 60
                      ? "yellow"
                      : "red"
                  }
                  index={1}
                />
                <StatsCard
                  title="Current Streak"
                  value={`${user?.streak || 0} days`}
                  icon={Flame}
                  color="orange"
                  index={2}
                />
                <StatsCard
                  title="This Week"
                  value={stats?.sessionsThisWeek || 0}
                  subtitle="sessions completed"
                  icon={CalendarDays}
                  color="purple"
                  index={3}
                />
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Score History */}
              <Card className="lg:col-span-2 border-zinc-800 bg-zinc-900/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-zinc-200">
                      Score Progression
                    </CardTitle>
                    <Link href="/history">
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-zinc-500 hover:text-zinc-300 gap-1">
                        View all <ArrowRight size={11} />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-48 rounded-lg" />
                  ) : scoreHistory.length > 0 ? (
                    <ScoreChart data={scoreHistory} />
                  ) : (
                    <div className="h-48 flex items-center justify-center text-center">
                      <div>
                        <TrendingUp size={32} className="text-zinc-700 mx-auto mb-2" />
                        <p className="text-sm text-zinc-600">
                          Complete sessions to see your score progression
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Radar Chart */}
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-zinc-200">
                    Skill Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-48 rounded-lg" />
                  ) : radarData.length > 0 ? (
                    <RadarChart data={radarData} />
                  ) : (
                    <div className="h-48 flex items-center justify-center">
                      <p className="text-sm text-zinc-600 text-center">
                        Complete sessions to see skill breakdown
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Middle Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Streak Card */}
              <StreakCard
                streak={user?.streak || 0}
                longestStreak={user?.streak || 0}
              />

              {/* Weak Topics */}
              <Card className="lg:col-span-2 border-zinc-800 bg-zinc-900/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-zinc-200">
                    Areas to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <WeakTopics topics={weakTopics} />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Topic Heatmap */}
            <Card className="border-zinc-800 bg-zinc-900/50 mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-zinc-200">
                  Topic Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-32 rounded-lg" />
                ) : topicHeatmap.length > 0 ? (
                  <TopicHeatmap data={topicHeatmap} />
                ) : (
                  <p className="text-sm text-zinc-600 py-4 text-center">
                    Practice more sessions to see topic coverage
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Activity Heatmap */}
            <Card className="border-zinc-800 bg-zinc-900/50 mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-zinc-200">
                  Practice Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {isLoading ? (
                  <Skeleton className="h-28 rounded-lg" />
                ) : (
                  <ActivityHeatmap data={heatmap} />
                )}
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-zinc-200">
                    Recent Sessions
                  </CardTitle>
                  <Link href="/history">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-zinc-500 hover:text-zinc-300 gap-1">
                      View all <ArrowRight size={11} />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-lg" />
                    ))}
                  </div>
                ) : recentSessions.length > 0 ? (
                  <div className="space-y-2">
                    {recentSessions.map((session) => (
                      <Link
                        key={session.id}
                        href={`/history/${session.id}`}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                      >
                        <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                          <BarChart2 size={16} className="text-zinc-500 group-hover:text-zinc-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-200 truncate">
                            {session.role}
                            {session.company && ` @ ${session.company}`}
                          </p>
                          <p className="text-xs text-zinc-600">
                            {formatDate(session.createdAt)} · {session.totalQuestions} questions
                          </p>
                        </div>
                         <div className="text-right shrink-0">
                          {(() => {
                            const rawScore = session.overallScore ?? session.score;
                            const displayScore =
                              rawScore != null
                                ? rawScore <= 10
                                  ? Math.round(rawScore * 10)
                                  : Math.round(rawScore)
                                : null;
                            return displayScore != null ? (
                              <span
                                className="text-sm font-bold"
                                style={{ color: getColorByScore(displayScore) }}
                              >
                                {displayScore}
                              </span>
                            ) : (
                              <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-600">
                                {String(session.status).toLowerCase()}
                              </Badge>
                            );
                          })()}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy size={32} className="text-zinc-700 mx-auto mb-2" />
                    <p className="text-sm text-zinc-600 mb-3">
                      No sessions yet. Start practicing!
                    </p>
                    <Link href="/interview/setup">
                      <Button variant="gradient" size="sm" className="gap-1.5">
                        <Mic size={14} />
                        Start First Session
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
