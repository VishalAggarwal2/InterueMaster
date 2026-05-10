/**
 * api.ts — single source of truth for ALL backend calls.
 *
 * Backend base: /api  (set via NEXT_PUBLIC_API_URL)
 *
 * Route map (verified against Spring Boot controllers):
 *   POST   /auth/signup
 *   POST   /auth/login
 *   POST   /auth/logout
 *   GET    /auth/me
 *
 *   GET    /sessions
 *   POST   /sessions
 *   GET    /sessions/{id}
 *   PATCH  /sessions/{id}/complete
 *   DELETE /sessions/{id}
 *   GET    /sessions/{id}/questions
 *   POST   /sessions/{id}/questions/generate
 *
 *   POST   /answers
 *   GET    /answers/sessions/{id}
 *
 *   GET    /users/me/stats
 *   GET    /users/me/profile
 *   PATCH  /users/me/profile
 *   GET    /users/me/weak-topics
 *   GET    /users/me/heatmap
 *   GET    /users/me/topic-heatmap
 *   POST   /users/me/resume
 *   DELETE /users/me
 *
 *   POST   /report-cards
 *   GET    /report-cards/sessions/{id}
 *   GET    /report-cards/share/{token}
 *   POST   /report-cards/{id}/share
 *
 *   GET    /daily-question
 *   POST   /daily-question/answer
 *   GET    /daily-question/history
 *
 *   GET    /leaderboard
 *   GET    /leaderboard/my-rank
 *
 *   POST   /negotiation/start
 *   GET    /negotiation/sessions
 *   GET    /negotiation/{id}/messages
 *   POST   /negotiation/{id}/message
 *   POST   /negotiation/{id}/end
 *
 *   POST   /recordings/upload-url
 *   POST   /recordings/{id}/confirm
 *   GET    /recordings/{id}/download-url
 *   GET    /recordings/sessions/{id}
 *
 *   POST   /questions/predict
 */

import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import toast from "react-hot-toast";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

/* ─── Token helpers ─────────────────────────────────────────────────────────── */
export const getAccessToken = (): string | null =>
  typeof window === "undefined" ? null : localStorage.getItem("access_token");

export const setTokens = (access: string, refresh?: string): void => {
  localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
};

export const clearTokens = (): void => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};

/* ─── Request interceptor ───────────────────────────────────────────────────── */
api.interceptors.request.use(
  (cfg: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
  },
  (err) => Promise.reject(err)
);

/* ─── Response interceptor ──────────────────────────────────────────────────── */
api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error) => {
    const status: number = error.response?.status ?? 0;
    const msg: string =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";

    if (status === 401) {
      clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
    } else if (status === 429) {
      toast.error("Too many requests. Please slow down.");
    } else if (status >= 500) {
      toast.error("Server error. Please try again.");
    }

    return Promise.reject({ message: msg, statusCode: status });
  }
);

/* ══════════════════════════════════════════════════════════════════════════════
   AUTH
   ══════════════════════════════════════════════════════════════════════════════ */
export const authApi = {
  signup: (fullName: string, email: string, password: string) =>
    api.post("/auth/signup", { fullName, email, password }),

  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  logout: () => api.post("/auth/logout"),

  me: () => api.get("/auth/me"),
};

/* ══════════════════════════════════════════════════════════════════════════════
   SESSIONS
   ══════════════════════════════════════════════════════════════════════════════ */
export const sessionApi = {
  create: (body: Record<string, unknown>) =>
    api.post("/sessions", body),

  list: (page = 0, size = 20) =>
    api.get("/sessions", { params: { page, size } }),

  get: (id: string) => api.get(`/sessions/${id}`),

  complete: (id: string) => api.patch(`/sessions/${id}/complete`),

  abandon: (id: string) => api.delete(`/sessions/${id}`),
};

/* ══════════════════════════════════════════════════════════════════════════════
   QUESTIONS
   ══════════════════════════════════════════════════════════════════════════════ */
export const questionApi = {
  generate: (sessionId: string) =>
    api.post(`/sessions/${sessionId}/questions/generate`),

  list: (sessionId: string) =>
    api.get(`/sessions/${sessionId}/questions`),

  predict: (body: Record<string, unknown>) =>
    api.post("/questions/predict", body),
};

/* ══════════════════════════════════════════════════════════════════════════════
   ANSWERS
   ══════════════════════════════════════════════════════════════════════════════ */
export const answerApi = {
  submit: (body: Record<string, unknown>) => api.post("/answers", body),

  listBySession: (sessionId: string) =>
    api.get(`/answers/sessions/${sessionId}`),
};

/* ══════════════════════════════════════════════════════════════════════════════
   USERS / ME
   ══════════════════════════════════════════════════════════════════════════════ */
export const userApi = {
  getStats: () => api.get("/users/me/stats"),

  getProfile: () => api.get("/users/me/profile"),

  updateProfile: (body: Record<string, unknown>) =>
    api.patch("/users/me/profile", body),

  getWeakTopics: () => api.get("/users/me/weak-topics"),

  getHeatmap: (days = 365) =>
    api.get("/users/me/heatmap", { params: { days } }),

  getTopicHeatmap: () => api.get("/users/me/topic-heatmap"),

  uploadResume: (form: FormData) =>
    api.post("/users/me/resume", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /** Alias of updateProfile for backwards-compatible settings UI */
  getSettings: () => api.get("/users/me/profile"),
  updateSettings: (body: Record<string, unknown>) =>
    api.patch("/users/me/profile", body),

  deleteAccount: () => api.delete("/users/me"),
};

/* ══════════════════════════════════════════════════════════════════════════════
   DASHBOARD  (proxy to /users/me/* — no separate /dashboard route on backend)
   ══════════════════════════════════════════════════════════════════════════════ */
export const dashboardApi = {
  getStats: () => userApi.getStats(),
  getScoreHistory: () => userApi.getStats(),
  getHeatmap: () => userApi.getHeatmap(),
  getTopicHeatmap: () => userApi.getTopicHeatmap(),
  getWeakTopics: () => userApi.getWeakTopics(),
  getRadarData: () => userApi.getStats(),
};

/* ══════════════════════════════════════════════════════════════════════════════
   REPORT CARDS
   ══════════════════════════════════════════════════════════════════════════════ */
export const reportCardApi = {
  generate: (sessionId: string) =>
    api.post("/report-cards", { sessionId }),

  getBySession: (sessionId: string) =>
    api.get(`/report-cards/sessions/${sessionId}`),

  getPublic: (shareToken: string) =>
    api.get(`/report-cards/share/${shareToken}`),

  createShareLink: (reportCardId: string) =>
    api.post(`/report-cards/${reportCardId}/share`),
};

/* ══════════════════════════════════════════════════════════════════════════════
   DAILY QUESTION
   ══════════════════════════════════════════════════════════════════════════════ */
export const dailyQuestionApi = {
  get: () => api.get("/daily-question"),

  submitAnswer: (body: Record<string, unknown>) =>
    api.post("/daily-question/answer", body),

  getHistory: () => api.get("/daily-question/history"),
};

/* ══════════════════════════════════════════════════════════════════════════════
   LEADERBOARD
   ══════════════════════════════════════════════════════════════════════════════ */
export const leaderboardApi = {
  get: (params?: Record<string, unknown>) =>
    api.get("/leaderboard", { params }),

  getMyRank: () => api.get("/leaderboard/my-rank"),
};

/* ══════════════════════════════════════════════════════════════════════════════
   NEGOTIATION
   ══════════════════════════════════════════════════════════════════════════════ */
export const negotiationApi = {
  create: (body: Record<string, unknown>) =>
    api.post("/negotiation/start", body),

  list: () => api.get("/negotiation/sessions"),

  getMessages: (sessionId: string) =>
    api.get(`/negotiation/${sessionId}/messages`),

  sendMessage: (sessionId: string, content: string, offer?: number) =>
    api.post(`/negotiation/${sessionId}/message`, { content, offer }),

  end: (sessionId: string) =>
    api.post(`/negotiation/${sessionId}/end`, {}),
};

/* ══════════════════════════════════════════════════════════════════════════════
   RECORDINGS
   ══════════════════════════════════════════════════════════════════════════════ */
export const recordingApi = {
  getUploadUrl: (body: Record<string, unknown>) =>
    api.post("/recordings/upload-url", body),

  confirm: (recordingId: string, body: Record<string, unknown>) =>
    api.post(`/recordings/${recordingId}/confirm`, body),

  getDownloadUrl: (recordingId: string) =>
    api.get(`/recordings/${recordingId}/download-url`),

  getBySession: (sessionId: string) =>
    api.get(`/recordings/sessions/${sessionId}`),

  /** Backwards-compat aliases used by useRecorder hook */
  getPresignedUrl: (sessionId: string, fileName: string) =>
    api.post("/recordings/upload-url", { sessionId, fileName }),

  upload: (sessionId: string, formData: FormData) =>
    api.post("/recordings/upload-url", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      params: { sessionId },
    }),
};

/* ══════════════════════════════════════════════════════════════════════════════
   BILLING  (stub — Stripe not wired in local dev)
   ══════════════════════════════════════════════════════════════════════════════ */
type StubResponse = {
  data: { success: boolean; data: { url?: string; [k: string]: unknown } };
};
const stubOk = (): Promise<StubResponse> =>
  Promise.resolve({ data: { success: true, data: { url: "" } } });
export const billingApi = {
  getPlans: stubOk,
  getSubscription: stubOk,
  createCheckout: (_planId: string) => stubOk(),
  cancelSubscription: stubOk,
  createPortalSession: stubOk,
};

export default api;
