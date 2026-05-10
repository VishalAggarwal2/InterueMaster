"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DollarSign, X, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AuthGuard from "@/components/layout/AuthGuard";
import NegotiationChat from "@/components/negotiation/NegotiationChat";
import OutcomeReport from "@/components/negotiation/OutcomeReport";
import { negotiationApi } from "@/lib/api";
import { NegotiationSession, NegotiationOutcomeReport } from "@/types";
import { formatCurrency, parseApiError } from "@/lib/utils";
import toast from "react-hot-toast";

export default function NegotiationSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<NegotiationSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [outcome, setOutcome] = useState<NegotiationOutcomeReport | null>(null);
  const [showOutcome, setShowOutcome] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await negotiationApi.getMessages(sessionId);
        const data = response.data.data || response.data;
        setSession(data);

        if (data.status === "completed" && data.outcome) {
          setShowOutcome(true);
        }
      } catch {
        toast.error("Failed to load negotiation session");
        router.push("/negotiate/setup");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [sessionId, router]);

  const handleSendMessage = async (content: string, offer?: number) => {
    if (!session) return;

    setIsSending(true);
    try {
      const response = await negotiationApi.sendMessage(sessionId, content, offer);
      const data = response.data.data || response.data;

      // Update session messages
      setSession((prev) =>
        prev
          ? {
              ...prev,
              messages: data.messages || [...prev.messages, ...data.newMessages],
            }
          : prev
      );

      // Check if negotiation ended
      if (data.outcome || data.status === "completed") {
        setSession((prev) =>
          prev ? { ...prev, status: "completed", outcome: data.outcome } : prev
        );

        if (data.outcomeReport) {
          setOutcome(data.outcomeReport);
          setShowOutcome(true);
        }
      }
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setIsSending(false);
    }
  };

  const handleEnd = async () => {
    if (!confirm("End this negotiation?")) return;
    try {
      const response = await negotiationApi.end(sessionId);
      const data = response.data.data || response.data;
      if (data.outcomeReport) {
        setOutcome(data.outcomeReport);
        setShowOutcome(true);
      }
      setSession((prev) => (prev ? { ...prev, status: "completed" } : prev));
    } catch {
      toast.error("Failed to end negotiation");
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-full max-w-2xl px-4">
            <Skeleton className="h-screen max-h-[600px] rounded-xl" />
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!session) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        {/* Header */}
        <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
          <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-green-400" />
              <span className="text-sm font-medium text-zinc-200">
                {session.setup.role} @ {session.setup.company}
              </span>
              <Badge
                variant={
                  session.status === "completed" ? "success" : "indigo"
                }
                className="text-xs"
              >
                {session.status}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {session.setup.currentSalary && (
                <span className="text-xs text-zinc-500">
                  Offer:{" "}
                  {formatCurrency(
                    session.setup.currentSalary,
                    session.setup.currency
                  )}
                </span>
              )}
              {session.status === "active" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEnd}
                  className="text-zinc-600 hover:text-red-400 h-7 text-xs"
                >
                  End
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/negotiate/setup")}
                className="h-8 w-8 text-zinc-600 hover:text-zinc-400"
              >
                <X size={15} />
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-hidden max-w-3xl w-full mx-auto flex flex-col">
          {showOutcome && outcome ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <h2 className="text-lg font-bold text-zinc-100">Negotiation Complete</h2>
              <OutcomeReport
                report={outcome}
                currency={session.setup.currency}
              />
              <div className="flex gap-3 pt-2">
                <Button
                  variant="gradient"
                  onClick={() => router.push("/negotiate/setup")}
                  className="flex-1"
                >
                  Practice Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="border-zinc-700 text-zinc-400"
                >
                  <BarChart2 size={15} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* AI recruiter intro */}
              {session.messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 border-b border-zinc-800 bg-zinc-900/30"
                >
                  <p className="text-sm text-zinc-400">
                    <span className="text-indigo-400 font-medium">AI Recruiter: </span>
                    Hi! I'm Sarah from {session.setup.company}. We're excited to extend
                    you an offer for the {session.setup.role} position at{" "}
                    {formatCurrency(session.setup.currentSalary, session.setup.currency)}.
                    What are your thoughts?
                  </p>
                </motion.div>
              )}

              <div className="flex-1 overflow-hidden">
                <NegotiationChat
                  messages={session.messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isSending}
                  isComplete={session.status === "completed"}
                  currency={session.setup.currency}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
