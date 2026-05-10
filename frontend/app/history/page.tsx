"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { History, Filter, Search, ChevronRight, BarChart2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { sessionApi } from "@/lib/api";
import { Session } from "@/types";
import { formatDate, formatDuration, getColorByScore } from "@/lib/utils";
import toast from "react-hot-toast";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const loadSessions = async (p = 1) => {
    try {
      const response = await sessionApi.list(p, 20);
      const data = response.data.data || response.data;
      const list = Array.isArray(data) ? data : data.data || [];
      const tot = data.total || list.length;
      setSessions((prev) => (p === 1 ? list : [...prev, ...list]));
      setHasMore(list.length === 20);
      setTotal(tot);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions(1);
  }, []);

  const filtered = sessions.filter((s) => {
    const matchSearch =
      !search ||
      s.role.toLowerCase().includes(search.toLowerCase()) ||
      s.company?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      categoryFilter === "all" || s.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <Sidebar />

        <main className="lg:pl-60 pt-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                  <History size={22} className="text-indigo-400" />
                  Session History
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  {total} total sessions
                </p>
              </div>

              <div className="sm:ml-auto flex items-center gap-2">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <Input
                    placeholder="Search role or company..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 w-48 h-9 text-sm"
                  />
                </div>

                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-36 h-9 text-sm border-zinc-700">
                    <Filter size={13} className="mr-1.5 text-zinc-500" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="system-design">System Design</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sessions list */}
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <History size={40} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 mb-4">
                  {search || categoryFilter !== "all"
                    ? "No sessions match your filters"
                    : "No sessions yet"}
                </p>
                <Link href="/interview/setup">
                  <Button variant="gradient" size="sm">
                    Start Your First Session
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((session, i) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link href={`/history/${session.id}`}>
                      <Card className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors group cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Score indicator */}
                            <div
                              className="h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                              style={
                                session.score !== undefined
                                  ? {
                                      backgroundColor: `${getColorByScore(session.score)}20`,
                                      color: getColorByScore(session.score),
                                    }
                                  : { backgroundColor: "#27272a", color: "#71717a" }
                              }
                            >
                              {session.score !== undefined ? session.score : "—"}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-medium text-zinc-200 truncate">
                                  {session.role}
                                  {session.company && (
                                    <span className="text-zinc-500">
                                      {" "}
                                      @ {session.company}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-zinc-700 text-zinc-600 py-0 px-1.5"
                                >
                                  {session.category}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-zinc-700 text-zinc-600 py-0 px-1.5"
                                >
                                  {session.level}
                                </Badge>
                                <span className="text-xs text-zinc-600">
                                  {formatDate(session.createdAt)}
                                </span>
                                <span className="text-xs text-zinc-700">
                                  {session.totalQuestions} questions
                                </span>
                              </div>
                            </div>

                            {/* Status & arrow */}
                            <div className="flex items-center gap-2 shrink-0">
                              {session.status !== "completed" && (
                                <Badge
                                  variant={
                                    session.status === "active"
                                      ? "indigo"
                                      : "outline"
                                  }
                                  className="text-xs capitalize"
                                >
                                  {session.status}
                                </Badge>
                              )}
                              <ChevronRight
                                size={16}
                                className="text-zinc-700 group-hover:text-zinc-400 transition-colors"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}

                {hasMore && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      className="border-zinc-700 text-zinc-400"
                      onClick={() => {
                        const nextPage = page + 1;
                        setPage(nextPage);
                        loadSessions(nextPage);
                      }}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
