// ─── User & Auth ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  /** Primary display name. Backend returns `fullName`; we keep both for compat. */
  name?: string;
  fullName?: string;
  avatar?: string;
  profilePictureUrl?: string;
  plan?: "free" | "pro" | "team" | "FREE" | "PRO" | "TEAM";
  createdAt?: string;
  updatedAt?: string;
  streak?: number;
  dailyStreak?: number;
  totalSessions?: number;
  totalScore?: number;
  averageScore?: number;
  resumeUrl?: string;
  resumeText?: string;
  targetRole?: string;
  targetCompany?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

// ─── Interview Session ─────────────────────────────────────────────────────────

export type InterviewMode = "practice" | "timed" | "mock";
export type InterviewLevel = "junior" | "mid" | "senior" | "staff";
export type InterviewCategory = "behavioral" | "technical" | "system-design" | "mixed";
export type SessionStatus = "pending" | "active" | "completed" | "abandoned";

export interface Session {
  id: string;
  userId?: string;
  title?: string;
  role: string;
  company?: string;
  level?: InterviewLevel;
  category?: InterviewCategory;
  /** Backend uses interviewType */
  interviewType?: string;
  /** Backend uses difficulty */
  difficulty?: "EASY" | "MEDIUM" | "HARD" | "easy" | "medium" | "hard";
  mode?: InterviewMode | string;
  status: SessionStatus | "ACTIVE" | "COMPLETED" | "ABANDONED";
  totalQuestions: number;
  answeredQuestions?: number;
  currentQuestion?: number;
  score?: number;
  /** Backend field */
  overallScore?: number | null;
  starScore?: STARScore;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  durationSeconds?: number | null;
  isTimed?: boolean;
  timeLimitSeconds?: number | null;
  questions?: Question[];
  answers?: Answer[];
  reportToken?: string;
  recordingUrl?: string;
}

export interface SessionSetup {
  role: string;
  company?: string;
  level: InterviewLevel;
  category: InterviewCategory;
  mode: InterviewMode;
  numQuestions?: number;
  timeLimit?: number;
  useResume?: boolean;
  jobDescription?: string;
}

// ─── Questions & Answers ───────────────────────────────────────────────────────

export interface Question {
  id: string;
  sessionId: string;
  text: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  order: number;
  hint?: string;
  followUp?: string;
  topic?: string;
}

export interface STARScore {
  situation: number;
  task: number;
  action: number;
  result: number;
  total: number;
}

export interface Answer {
  id: string;
  sessionId: string;
  questionId: string;
  text: string;
  audioUrl?: string;
  transcription?: string;
  score: number;
  starScore: STARScore;
  feedback: string;
  strengths: string[];
  improvements: string[];
  modelAnswer?: string;
  timeSpent: number;
  createdAt: string;
}

// ─── Report Card ──────────────────────────────────────────────────────────────

export interface ReportCard {
  sessionId: string;
  token: string;
  user: {
    name: string;
    role: string;
    company?: string;
  };
  overallScore: number;
  starScore: STARScore;
  categoryBreakdown: {
    behavioral: number;
    technical: number;
    communication: number;
    problemSolving: number;
  };
  strengths: string[];
  improvements: string[];
  topicsAssessed: string[];
  questions: Array<{
    question: Question;
    answer: Answer;
  }>;
  generatedAt: string;
  shareUrl: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DailyActivity {
  date: string;
  count: number;
  score: number;
}

export interface HeatmapData {
  date: string;
  count: number;
  score: number;
}

export interface TopicHeatmapData {
  topic: string;
  count: number;
  avgScore: number;
  lastPracticed: string;
}

export interface WeakTopic {
  topic: string;
  avgScore: number;
  frequency: number;
  lastPracticed: string;
  trend: "improving" | "declining" | "stable";
}

export interface DashboardStats {
  totalSessions: number;
  averageScore: number;
  streak: number;
  sessionsThisWeek: number;
  bestScore: number;
  totalTimeSpent: number;
  topStrength: string;
  topWeakness: string;
}

export interface ScoreHistory {
  sessionId: string;
  date: string;
  score: number;
  role: string;
  company?: string;
}

export interface RadarData {
  category: string;
  score: number;
  fullMark: number;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  averageScore: number;
  totalSessions: number;
  streak: number;
  topRole?: string;
  badge?: string;
}

// ─── Negotiation ──────────────────────────────────────────────────────────────

export type NegotiationRole = "candidate" | "recruiter";
export type NegotiationOutcome = "accepted" | "rejected" | "countered" | "pending";

export interface NegotiationSetup {
  role: string;
  company: string;
  currentSalary: number;
  targetSalary: number;
  currency: string;
  benefits: string[];
  experience: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface NegotiationSession {
  id: string;
  userId: string;
  setup: NegotiationSetup;
  status: "active" | "completed";
  messages: NegotiationMessage[];
  outcome?: NegotiationOutcome;
  finalOffer?: number;
  score?: number;
  feedback?: string;
  createdAt: string;
  completedAt?: string;
}

export interface NegotiationMessage {
  id: string;
  sessionId: string;
  role: NegotiationRole;
  content: string;
  offer?: number;
  timestamp: string;
}

export interface NegotiationOutcomeReport {
  sessionId: string;
  outcome: NegotiationOutcome;
  initialOffer: number;
  finalOffer: number;
  targetSalary: number;
  improvementPercent: number;
  score: number;
  tactics: string[];
  feedback: string;
  strengths: string[];
  improvements: string[];
}

// ─── Recordings ───────────────────────────────────────────────────────────────

export interface Recording {
  id: string;
  sessionId: string;
  userId: string;
  audioUrl: string;
  duration: number;
  fileSize: number;
  transcript: TranscriptSegment[];
  createdAt: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker: "user" | "ai";
  questionId?: string;
}

// ─── Daily Question ───────────────────────────────────────────────────────────

export interface DailyQuestion {
  id: string;
  date: string;
  question: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  hint?: string;
  modelAnswer?: string;
  participantCount: number;
  avgScore?: number;
}

export interface DailySubmission {
  questionId: string;
  answer: string;
  audioUrl?: string;
}

export interface DailyResult {
  score: number;
  starScore: STARScore;
  feedback: string;
  rank: number;
  percentile: number;
  modelAnswer: string;
}

// ─── Question Prediction ──────────────────────────────────────────────────────

export interface PredictRequest {
  jobDescription: string;
  role?: string;
  company?: string;
  numQuestions?: number;
}

export interface PredictedQuestion {
  question: string;
  category: string;
  topic: string;
  likelihood: number;
  difficulty: "easy" | "medium" | "hard";
  hint?: string;
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

export type WSMessageType =
  | "question"
  | "answer_received"
  | "score_update"
  | "feedback"
  | "session_complete"
  | "error"
  | "ping"
  | "pong"
  | "negotiation_response";

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp: string;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface UserSettings {
  notifications: {
    dailyReminder: boolean;
    weeklyReport: boolean;
    streakAlert: boolean;
  };
  interview: {
    defaultMode: InterviewMode;
    defaultLevel: InterviewLevel;
    autoRecord: boolean;
    showHints: boolean;
  };
  privacy: {
    publicProfile: boolean;
    showOnLeaderboard: boolean;
    shareProgress: boolean;
  };
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  limits: {
    sessionsPerMonth: number;
    recordingStorage: number;
    negotiationSessions: number;
  };
}

export interface Subscription {
  id: string;
  planId: string;
  status: "active" | "canceled" | "past_due";
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}
