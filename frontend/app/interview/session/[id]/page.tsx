"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AuthGuard from "@/components/layout/AuthGuard";
import QuestionCard from "@/components/interview/QuestionCard";
import AnswerInput from "@/components/interview/AnswerInput";
import ScoreBreakdown from "@/components/interview/ScoreBreakdown";
import SessionProgress from "@/components/interview/SessionProgress";
import FeedbackCard from "@/components/interview/FeedbackCard";
import TimerBar from "@/components/interview/TimerBar";
import { sessionApi, answerApi } from "@/lib/api";
import { useInterviewStore } from "@/store/interview.store";
import { useTimer } from "@/hooks/useTimer";
import { Session, Answer, Question } from "@/types";
import { parseApiError, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const {
    currentSession,
    currentQuestion,
    currentQuestionIndex,
    answers,
    isSubmittingAnswer,
    showFeedback,
    lastAnswer,
    setSession,
    addAnswer,
    setSubmittingAnswer,
    setShowFeedback,
    nextQuestion,
    setSessionComplete,
    resetSession,
  } = useInterviewStore();

  const [answerText, setAnswerText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const isTimed = currentSession?.mode === "timed";
  const timeLimit = (currentSession as (Session & { timeLimit?: number }) | null)?.timeLimit || 120;

  const {
    timeRemaining,
    isWarning,
    isExpired,
    formattedTime,
    progress: timerProgress,
    start: startTimer,
    reset: resetTimer,
  } = useTimer({
    initialTime: isTimed ? timeLimit : 0,
    onExpire: () => {
      if (isTimed && answerText.length >= 10) {
        handleSubmitAnswer();
      }
    },
    onWarning: () => {
      if (isTimed) {
        toast("30 seconds remaining!", { icon: "⏰" });
      }
    },
    warningThreshold: 30,
    autoStart: false,
  });

  // Load session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await sessionApi.get(sessionId);
        const session: Session = response.data.data || response.data;
        setSession(session);

        if (session.status === "completed") {
          router.replace(`/interview/complete/${sessionId}`);
          return;
        }
      } catch (error) {
        toast.error(parseApiError(error));
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    return () => resetSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Start timer when question appears
  useEffect(() => {
    if (isTimed && currentQuestion) {
      resetTimer(timeLimit);
      startTimer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id, isTimed]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!currentQuestion || !answerText.trim() || isSubmittingAnswer) return;

    setSubmittingAnswer(true);
    try {
      const response = await answerApi.submit({
        sessionId,
        questionId: currentQuestion.id,
        answerText,
        timeTakenSeconds: isTimed ? timeLimit - timeRemaining : 0,
      });
      const answer: Answer = response.data.data || response.data;
      addAnswer(answer);
      setAnswerText("");

      // Check if session complete
      if (currentQuestionIndex + 1 >= (currentSession?.totalQuestions || 0)) {
        // Auto-complete after a delay
        setTimeout(async () => {
          try {
            await sessionApi.complete(sessionId);
          } catch {}
          router.push(`/interview/complete/${sessionId}`);
        }, 3000);
      }
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setSubmittingAnswer(false);
    }
  }, [
    currentQuestion,
    answerText,
    isSubmittingAnswer,
    sessionId,
    isTimed,
    timeLimit,
    timeRemaining,
    addAnswer,
    currentQuestionIndex,
    currentSession?.totalQuestions,
    setSubmittingAnswer,
    router,
  ]);

  const handleNext = () => {
    setShowFeedback(false);
    nextQuestion();
  };

  const handleAbandon = async () => {
    if (confirm("Are you sure you want to end this session?")) {
      try {
        await sessionApi.abandon(sessionId);
        router.push("/dashboard");
      } catch {
        router.push("/dashboard");
      }
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-full max-w-2xl px-4 space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950">
        {/* Session Header */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
          <div className="mx-auto max-w-4xl px-4 h-14 flex items-center justify-between gap-4">
            {/* Session info */}
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant="indigo" className="shrink-0 text-xs">
                {currentSession?.category}
              </Badge>
              <span className="text-sm text-zinc-400 truncate">
                {currentSession?.role}
                {currentSession?.company && ` @ ${currentSession.company}`}
              </span>
            </div>

            {/* Progress & abandon */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-zinc-500 hidden sm:block">
                Q{currentQuestionIndex + 1}/{currentSession?.totalQuestions}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAbandon}
                className="h-8 w-8 text-zinc-600 hover:text-red-400"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        </header>

        <main className="pt-14 min-h-screen">
          <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
            {/* Progress */}
            {currentSession && (
              <SessionProgress
                current={currentQuestionIndex + 1}
                total={currentSession.totalQuestions}
                scores={answers.map((a) => a.score)}
              />
            )}

            {/* Timer (timed mode) */}
            {isTimed && currentQuestion && !showFeedback && (
              <TimerBar
                timeRemaining={timeRemaining}
                totalTime={timeLimit}
                isWarning={isWarning}
                isExpired={isExpired}
              />
            )}

            {/* Previous Q&A thread */}
            {answers.length > 0 && (
              <div className="space-y-2">
                {answers.slice(0, -1).map((answer, i) => {
                  const question = currentSession?.questions?.[i];
                  return (
                    <motion.div
                      key={answer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Card className="border-zinc-800 bg-zinc-900/30">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-2 mb-2">
                            <MessageSquare size={13} className="text-zinc-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-zinc-500 leading-relaxed">
                              {question?.text}
                            </p>
                          </div>
                          <div className="pl-5">
                            <p className="text-xs text-zinc-400 line-clamp-2">
                              {answer.text}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="text-xs font-semibold"
                                style={{
                                  color:
                                    answer.score >= 80
                                      ? "#22c55e"
                                      : answer.score >= 60
                                      ? "#eab308"
                                      : "#ef4444",
                                }}
                              >
                                {answer.score}/100
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Current Question */}
            {currentQuestion && !showFeedback && (
              <div className="space-y-4">
                <QuestionCard
                  question={currentQuestion}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={currentSession?.totalQuestions || 0}
                />

                <AnswerInput
                  value={answerText}
                  onChange={setAnswerText}
                  onSubmit={handleSubmitAnswer}
                  isSubmitting={isSubmittingAnswer}
                  disabled={isExpired && answerText.length < 10}
                />
              </div>
            )}

            {/* Feedback & Score (after submission) */}
            <AnimatePresence>
              {showFeedback && lastAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Current question (collapsed) */}
                  {currentQuestion && (
                    <Card className="border-zinc-800 bg-zinc-900/30">
                      <CardContent className="p-4">
                        <p className="text-sm text-zinc-400">{currentQuestion.text}</p>
                        <p className="text-xs text-zinc-600 mt-2 line-clamp-2">
                          Your answer: {lastAnswer.text}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* STAR Score */}
                  <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardContent className="p-5">
                      <ScoreBreakdown starScore={lastAnswer.starScore} animated />
                    </CardContent>
                  </Card>

                  {/* AI Feedback */}
                  <FeedbackCard answer={lastAnswer} showModelAnswer />

                  {/* Next button */}
                  <div className="flex justify-end">
                    {currentQuestionIndex + 1 < (currentSession?.totalQuestions || 0) ? (
                      <Button
                        onClick={handleNext}
                        variant="gradient"
                        className="gap-2"
                      >
                        Next Question
                        <ChevronRight size={16} />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => router.push(`/interview/complete/${sessionId}`)}
                        variant="gradient"
                        className="gap-2"
                      >
                        View Results
                        <ChevronRight size={16} />
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
