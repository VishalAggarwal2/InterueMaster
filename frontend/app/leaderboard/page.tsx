"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Flame, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AuthGuard from "@/components/layout/AuthGuard";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { leaderboardApi } from "@/lib/api";
import { LeaderboardEntry } from "@/types";
import { getInitials, getColorByScore } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy size={18} className="text-yellow-400" />;
  if (rank === 2) return <Medal size={18} className="text-zinc-400" />;
  if (rank === 3) return <Medal size={18} className="text-amber-600" />;
  return (
    <span className="text-sm font-mono text-zinc-500 w-[18px] text-center">
      {rank}
    </span>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await leaderboardApi.get({ filter, size: 50 });
        const data = response.data.data || response.data;
        setEntries(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Failed to load leaderboard");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [filter]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <Sidebar />

        <main className="lg:pl-60 pt-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                  <Trophy size={22} className="text-yellow-400" />
                  Leaderboard
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Top performers this {filter === "week" ? "week" : "month"}
                </p>
              </div>

              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32 border-zinc-700 text-sm">
                  <Filter size={13} className="mr-1.5 text-zinc-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-16">
                <Trophy size={40} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No entries yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Top 3 podium */}
                {top3.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 items-end">
                    {/* 2nd */}
                    {top3[1] && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-center"
                      >
                        <Avatar className="h-12 w-12 mx-auto mb-2">
                          <AvatarImage src={top3[1].avatar} />
                          <AvatarFallback className="text-sm">
                            {getInitials(top3[1].name)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs font-medium text-zinc-300 truncate">
                          {top3[1].name}
                        </p>
                        <div className="mt-1 bg-zinc-700/50 rounded-t-lg pt-3 pb-2 flex flex-col items-center gap-1">
                          <Medal size={16} className="text-zinc-400" />
                          <span className="text-lg font-bold text-zinc-300">
                            {top3[1].averageScore}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* 1st */}
                    {top3[0] && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                      >
                        <Avatar className="h-14 w-14 mx-auto mb-2 ring-2 ring-yellow-400/50">
                          <AvatarImage src={top3[0].avatar} />
                          <AvatarFallback className="text-sm">
                            {getInitials(top3[0].name)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs font-medium text-zinc-200 truncate">
                          {top3[0].name}
                        </p>
                        <div className="mt-1 bg-yellow-500/10 border-t border-yellow-500/30 rounded-t-lg pt-4 pb-2 flex flex-col items-center gap-1">
                          <Trophy size={18} className="text-yellow-400" />
                          <span className="text-xl font-bold text-yellow-400">
                            {top3[0].averageScore}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* 3rd */}
                    {top3[2] && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center"
                      >
                        <Avatar className="h-10 w-10 mx-auto mb-2">
                          <AvatarImage src={top3[2].avatar} />
                          <AvatarFallback className="text-sm">
                            {getInitials(top3[2].name)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs font-medium text-zinc-400 truncate">
                          {top3[2].name}
                        </p>
                        <div className="mt-1 bg-amber-700/20 rounded-t-lg pt-2 pb-2 flex flex-col items-center gap-1">
                          <Medal size={14} className="text-amber-600" />
                          <span className="text-base font-bold text-amber-500">
                            {top3[2].averageScore}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Full list */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-0 divide-y divide-zinc-800">
                    {entries.map((entry, i) => {
                      const isCurrentUser = entry.userId === user?.id;

                      return (
                        <motion.div
                          key={entry.userId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className={cn(
                            "flex items-center gap-4 px-4 py-3",
                            isCurrentUser && "bg-indigo-500/5"
                          )}
                        >
                          {/* Rank */}
                          <div className="w-6 flex items-center justify-center shrink-0">
                            <RankIcon rank={entry.rank} />
                          </div>

                          {/* Avatar */}
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={entry.avatar} />
                            <AvatarFallback className="text-xs">
                              {getInitials(entry.name)}
                            </AvatarFallback>
                          </Avatar>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className={cn(
                                  "text-sm font-medium truncate",
                                  isCurrentUser ? "text-indigo-300" : "text-zinc-200"
                                )}
                              >
                                {entry.name}
                                {isCurrentUser && (
                                  <span className="text-xs text-indigo-500 ml-1">
                                    (you)
                                  </span>
                                )}
                              </p>
                              {entry.badge && (
                                <Badge variant="indigo" className="text-[10px] py-0 shrink-0">
                                  {entry.badge}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-zinc-600">
                                {entry.totalSessions} sessions
                              </span>
                              {entry.streak > 0 && (
                                <span className="text-xs text-orange-500 flex items-center gap-0.5">
                                  <Flame size={10} />
                                  {entry.streak}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Score */}
                          <span
                            className="text-sm font-bold tabular-nums shrink-0"
                            style={{ color: getColorByScore(entry.averageScore) }}
                          >
                            {entry.averageScore}
                          </span>
                        </motion.div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
