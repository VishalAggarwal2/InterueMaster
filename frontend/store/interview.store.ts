import { create } from "zustand";
import { Session, Question, Answer, SessionSetup } from "@/types";

interface InterviewState {
  // Current session
  currentSession: Session | null;
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  answers: Answer[];

  // Setup
  sessionSetup: Partial<SessionSetup>;

  // UI state
  isLoadingQuestion: boolean;
  isSubmittingAnswer: boolean;
  isSessionComplete: boolean;
  showFeedback: boolean;
  lastAnswer: Answer | null;

  // Timer state
  timeRemaining: number;
  isTimerRunning: boolean;
  timerExpired: boolean;

  // Recording state
  isRecording: boolean;
  recordingUrl: string | null;

  // Actions
  setSession: (session: Session) => void;
  setCurrentQuestion: (question: Question, index: number) => void;
  addAnswer: (answer: Answer) => void;
  setSessionSetup: (setup: Partial<SessionSetup>) => void;
  setLoadingQuestion: (loading: boolean) => void;
  setSubmittingAnswer: (submitting: boolean) => void;
  setSessionComplete: (complete: boolean) => void;
  setShowFeedback: (show: boolean) => void;
  setLastAnswer: (answer: Answer | null) => void;
  setTimeRemaining: (time: number) => void;
  setTimerRunning: (running: boolean) => void;
  setTimerExpired: (expired: boolean) => void;
  setRecording: (recording: boolean) => void;
  setRecordingUrl: (url: string | null) => void;
  resetSession: () => void;
  nextQuestion: () => void;
}

const initialState = {
  currentSession: null,
  currentQuestion: null,
  currentQuestionIndex: 0,
  answers: [],
  sessionSetup: {},
  isLoadingQuestion: false,
  isSubmittingAnswer: false,
  isSessionComplete: false,
  showFeedback: false,
  lastAnswer: null,
  timeRemaining: 0,
  isTimerRunning: false,
  timerExpired: false,
  isRecording: false,
  recordingUrl: null,
};

export const useInterviewStore = create<InterviewState>((set, get) => ({
  ...initialState,

  setSession: (session: Session) => {
    set({
      currentSession: session,
      currentQuestionIndex: session.currentQuestion || 0,
      answers: session.answers || [],
      timeRemaining: session.mode === "timed" ? (session as Session & { timeLimit?: number }).timeLimit || 120 : 0,
    });
    if (session.questions && session.questions.length > 0) {
      const idx = session.currentQuestion || 0;
      set({ currentQuestion: session.questions[idx] || null });
    }
  },

  setCurrentQuestion: (question: Question, index: number) => {
    set({ currentQuestion: question, currentQuestionIndex: index });
  },

  addAnswer: (answer: Answer) => {
    set((state) => ({
      answers: [...state.answers, answer],
      lastAnswer: answer,
      showFeedback: true,
    }));
  },

  setSessionSetup: (setup: Partial<SessionSetup>) => {
    set((state) => ({ sessionSetup: { ...state.sessionSetup, ...setup } }));
  },

  setLoadingQuestion: (loading: boolean) =>
    set({ isLoadingQuestion: loading }),

  setSubmittingAnswer: (submitting: boolean) =>
    set({ isSubmittingAnswer: submitting }),

  setSessionComplete: (complete: boolean) =>
    set({ isSessionComplete: complete }),

  setShowFeedback: (show: boolean) => set({ showFeedback: show }),

  setLastAnswer: (answer: Answer | null) => set({ lastAnswer: answer }),

  setTimeRemaining: (time: number) => set({ timeRemaining: time }),

  setTimerRunning: (running: boolean) => set({ isTimerRunning: running }),

  setTimerExpired: (expired: boolean) => set({ timerExpired: expired }),

  setRecording: (recording: boolean) => set({ isRecording: recording }),

  setRecordingUrl: (url: string | null) => set({ recordingUrl: url }),

  resetSession: () => set(initialState),

  nextQuestion: () => {
    const { currentSession, currentQuestionIndex } = get();
    if (!currentSession) return;

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= currentSession.totalQuestions) {
      set({ isSessionComplete: true });
      return;
    }

    const nextQuestion = currentSession.questions?.[nextIndex];
    if (!nextQuestion) return;
    set({
      currentQuestion: nextQuestion,
      currentQuestionIndex: nextIndex,
      showFeedback: false,
      lastAnswer: null,
      timerExpired: false,
    });
  },
}));
