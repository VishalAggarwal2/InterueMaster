# Mock Interviewer with Memory — PRD

**Product Name:** IntervAI  
**Version:** 1.0  
**Author:** Vishal Aggarwal  
**Date:** 2026-05-09  

---

## 1. Problem Statement

Job seekers practice interviews in isolation — generic questions, no feedback, no memory of what went wrong. Existing tools (Pramp, Interviewing.io, LeetCode) are:

- **Stateless** — forget you after every session
- **Generic** — same questions for everyone
- **Passive** — you read, you don't practice speaking

Most people fail the same interviews repeatedly because nothing remembers their weak spots and forces them to fix them.

---

## 2. Solution

An AI-powered mock interview platform that:

- Conducts role and company-specific interviews
- Scores every answer with structured feedback
- **Remembers your weak areas** across sessions
- Drills harder on gaps in the next session
- Tracks improvement over time with visual dashboards

> **One-line pitch:** *"It remembers what trips you up and won't let you ignore it."*

---

## 3. Target Users


| User                              | Pain Point                             |
| --------------------------------- | -------------------------------------- |
| Final year CS students            | No structured interview prep           |
| Early career developers (0-3 yrs) | Don't know what good answers look like |
| Career switchers                  | Preparing for a new domain             |
| Active job seekers                | Need consistent daily practice         |


---

## 4. Tech Stack

### Frontend

- **Next.js 14** (App Router)
- **Tailwind CSS** — styling
- **Framer Motion** — animations
- **Recharts** — progress graphs
- **shadcn/ui** — component library

### Backend

-  **Java Spring Boot**
- **REST APIs** for sessions, answers, scores
- **WebSockets** (Socket.io) for real-time interview flow

### Database

- **Supabase (PostgreSQL)** — users, sessions, answers, scores
- **Upstash Redis** — streaks, session caching, rate limiting

### AI

- **Claude API (Anthropic)** — question generation, answer scoring, feedback

### Voice

- **Web Speech API** — free browser speech-to-text
- **ElevenLabs API** — AI speaks questions back (realistic voice)

### Auth

- **Clerk** — Google + GitHub login, JWT sessions

### Cloud Storage (Recordings)

- **AWS S3** — store session audio recordings
- **AWS CloudFront** — CDN for fast global audio playback
- **AWS Lambda** — trigger transcription on upload (optional)
- **S3 Presigned URLs** — secure, user-scoped access to recordings

### Resume Parsing

- **PDF.js** — extract text from uploaded resume
- Feed extracted text to Claude for personalized questions

### Analytics

- **PostHog** — user behavior, session recording
- **Sentry** — error tracking

### Payments

- **Stripe** — subscription billing for pro tier

### Deployment

- **Vercel** — frontend + API routes
- **Railway** — backend services
- **Supabase** — managed database

---

## 5. Data Models

### User

```
User {
  id            UUID
  email         String
  name          String
  role          String        // target role: SDE, PM, Data, Design
  resumeText    String        // parsed resume content
  weakTopics    String[]      // aggregated weak tags across all sessions
  streak        Int           // current daily streak
  createdAt     DateTime
}
```

### Session

```
Session {
  id            UUID
  userId        UUID
  role          String        // SDE, PM, Data, Design
  company       String?       // Google, Amazon, Startup, etc.
  mode          String        // practice | timed | voice
  totalScore    Float         // avg score across all answers
  duration      Int           // minutes
  createdAt     DateTime
}
```

### Question

```
Question {
  id            UUID
  sessionId     UUID
  text          String        // the question asked
  category      String        // behavioral | technical | system-design | hr
  difficulty    String        // easy | medium | hard
  topic         String        // concurrency | leadership | api-design | etc.
}
```

### Answer

```
Answer {
  id            UUID
  questionId    UUID
  userId        UUID
  text          String        // user's answer
  audioUrl      String?       // voice answer recording
  score         Float         // 0-10
  feedback      String        // AI feedback text
  starScore     Json          // { situation, task, action, result } scores
  isWeak        Boolean       // score < 6 = weak
  topics        String[]      // topic tags for memory system
  createdAt     DateTime
}
```

### ReportCard

```
ReportCard {
  id            UUID
  userId        UUID
  sessionId     UUID
  shareToken    String        // unique public link token
  scores        Json          // { behavioral, technical, communication, overall }
  weakAreas     String[]
  createdAt     DateTime
}
```

### Recording

```
Recording {
  id            UUID
  sessionId     UUID
  userId        UUID
  s3Key         String        // S3 object key (path in bucket)
  s3Url         String        // CloudFront CDN URL
  durationSecs  Int           // total recording length
  transcript    String        // full session transcript
  highlights    Json[]        // [{ timestamp, note, type: 'strength'|'weakness' }]
  expiresAt     DateTime?     // null = keep forever (Pro), 90 days for free
  createdAt     DateTime
}
```

### DailyActivity

```
DailyActivity {
  id            UUID
  userId        UUID
  date          Date          // YYYY-MM-DD
  sessionCount  Int
  avgScore      Float
  topicscovered String[]
  createdAt     DateTime
}
```

---

## 6. Feature List

### Phase 1 — Core MVP (Week 1-2)

#### F1: Role Selection

- User selects target role: SDE | PM | Data Analyst | Designer | DevOps
- User selects experience level: Fresher | 1-3 yrs | 3-5 yrs | 5+ yrs
- Optional: select target company for company-specific questions

#### F2: AI Interview Session

- AI generates 8-10 questions based on role + level + company
- Questions span: behavioral, technical, situational, HR
- User answers via text (voice in Phase 2)
- AI evaluates each answer in real-time

#### F3: Answer Scoring (STAR Framework)

- AI scores every answer 0-10
- Breaks down score by:
  - **Situation** — did you set context?
  - **Task** — did you explain your responsibility?
  - **Action** — did you describe what YOU did?
  - **Result** — did you quantify the outcome?
- Written feedback: what was good, what was missing

#### F4: Weak Area Memory System

- Answers scoring < 6 are flagged as weak
- Topics extracted from weak answers (e.g. "system design", "conflict resolution")
- Stored in `user.weakTopics[]`
- Next session prompt includes weak topics → AI focuses on them first

#### F5: Session History

- List of all past sessions
- Each session shows: role, date, overall score, number of weak answers
- Click to review full session with all Q&A + feedback

#### F6: Progress Dashboard

- Line graph: overall score over time
- Radar chart: scores by category (behavioral, technical, communication)
- Streak counter
- Weak topics list with frequency

---

### Phase 2 — Differentiators (Week 3-4)

#### F7: Voice Mode

- User speaks answers using Web Speech API (browser microphone)
- Transcribed to text → sent to AI for scoring
- AI speaks questions back using ElevenLabs
- Simulates a real interview experience

#### F8: Company Mode

- "Interview me like Google L4 SDE"
- "Interview me like Amazon (Leadership Principles focus)"
- "Interview me like an early-stage startup CTO"
- Custom question sets tailored to company culture and interview style

#### F9: Resume-Based Questions

- User uploads resume (PDF)
- PDF.js extracts text
- Claude generates questions directly from resume content
- Example: "Tell me about the GraphQL migration you did at Bajaj Finserv Health"
- Truly personalized — not generic

#### F10: Shareable Report Card

- After each session, generate a report card
- Unique public link (e.g. `/report/abc123`)
- Shows: overall score, category breakdown, top strengths, areas to improve
- Share with mentors, friends, or attach to job applications

---

### Phase 3 — Growth & Retention (Week 5-6)

#### F11: Daily Streak System

- Practice every day → maintain streak
- Streak shown on dashboard and profile
- Streak reset = motivation to come back
- Email/push reminder if streak at risk

#### F12: Peer Mock Mode

- Match two users for a live mock interview
- One interviews, one answers — then swap
- AI acts as judge: scores both, gives comparative feedback
- Community feature → retention + organic growth

#### F13: Interview Debrief Mode

- After a real interview, user logs: company, role, questions asked, their answers
- AI analyzes and estimates how they performed
- Tells them: "Based on your answer to Q3, you likely lost points here — here's why"
- Unique — no one else does post-interview analysis

#### F14: Leaderboard

- Global leaderboard by role
- Weekly top scorers
- Filter by: role, company mode, experience level
- Drives competition and shareability

---

### Phase 4 — Power Features (Week 7-8)

#### F15: Timed Pressure Mode

- 90-second countdown timer per answer — visible on screen
- Timer turns red at 30 seconds remaining
- Auto-submits answer when time runs out
- Score includes a time penalty for very short answers
- Trains candidates for real interview time pressure
- Optional: strict mode (no pause, no rewind)

#### F16: Question Prediction Engine

- User pastes any job description
- Claude analyzes JD language, required skills, and company signals
- Predicts top 10 most likely interview questions for that exact role
- Groups by category: behavioral, technical, system design, HR
- One-click: start a session using predicted questions
- Viral feature — shareable prediction report per JD

#### F17: Offer Negotiation Simulator

- User inputs: offer amount, role, company, competing offers (if any)
- AI plays HR manager in a live negotiation roleplay
- User negotiates: salary, equity, joining bonus, remote policy
- AI pushes back realistically: budget constraints, band limits, urgency
- After session: AI reveals how much was left on the table
- Coaching report: what you said well, what cost you money
- Modes: Aggressive | Collaborative | First-time negotiator

#### F18: Follow-up Drill

- After every answer, AI asks 2 mandatory follow-up questions
  - *"What would you do differently?"*
  - *"What was the exact impact in numbers?"*
  - *"How did your teammates respond?"*
- Forces depth — real interviews don't stop at the first answer
- Follow-up score tracked separately from initial answer score
- Trains candidates to defend and expand their answers under pressure

#### F19: Daily Question of the Day

- One curated question sent every morning via email / push notification
- Role-specific — based on user's target role
- Takes 5 minutes to answer in the app
- Streak tracked separately from full sessions
- Weekly summary email: your 7 answers + scores + improvement tips
- Low-effort habit builder — keeps users engaged between full sessions

#### F20: Interview Session Recording (AWS Cloud)

- Full voice sessions recorded end-to-end (audio + transcript)
- Uploaded to **AWS S3** immediately after session ends
- Recording stored with metadata: session ID, user ID, timestamp, role
- User can replay any past session from the history page
- Waveform visualizer shows audio playback with transcript synced
- AI highlights moments: *"You hesitated here"*, *"Strong answer at 1:23"*
- Recordings auto-deleted after 90 days (free) or kept forever (Pro)
- Download option for Pro users
- AWS Architecture:
  - **S3** — raw audio file storage
  - **CloudFront** — CDN for fast global playback
  - **S3 Presigned URLs** — secure, time-limited access per user
  - **Lambda** (optional) — trigger transcription on upload via Whisper API

#### F21: Performance Heatmap

- GitHub-style contribution heatmap on dashboard
- Each cell = one day, color intensity = average score that day
- Green = strong day (avg > 7), Yellow = average (5-7), Red = weak (< 5), Grey = no practice
- Click any cell → see all sessions from that day
- Second heatmap: Topic Coverage Map
  - Grid of all interview topics (system design, leadership, conflict, etc.)
  - Color = how well you perform on each topic
  - Instantly shows blind spots at a glance
- Shareable: embed on LinkedIn profile or portfolio

---

## 7. AI Prompt Architecture

### Question Generation Prompt

```
You are a senior interviewer at {company} hiring for a {role} ({level}).
The candidate's weak areas from past sessions are: {weakTopics}.

Generate 8 interview questions:
- 3 behavioral questions (focus on weak areas if any)
- 3 technical questions appropriate for {level}
- 1 situational / case question
- 1 culture fit / motivation question

Return as JSON array: [{ id, text, category, difficulty, topic }]
```

### Answer Scoring Prompt

```
You are an expert interview coach. Evaluate this interview answer.

Role: {role}
Question: {question}
Answer: {answer}

Score the answer out of 10 using the STAR framework:
- Situation (0-2.5): Did they set clear context?
- Task (0-2.5): Did they explain their responsibility?
- Action (0-2.5): Did they describe specific actions they took?
- Result (0-2.5): Did they quantify or clearly state the outcome?

Return JSON:
{
  "totalScore": number,
  "starScore": { "situation": n, "task": n, "action": n, "result": n },
  "feedback": "2-3 sentences of specific, actionable feedback",
  "strengths": ["..."],
  "improvements": ["..."],
  "isWeak": boolean,
  "topics": ["topic tags"]
}
```

### Memory Injection Prompt

```
Before generating questions, note:
This user has historically struggled with: {weakTopics}.
Prioritize these areas. Make at least 40% of questions target these weak spots.
Increase difficulty gradually — start at medium, escalate based on answer quality.
```

---

## 8. API Endpoints

### Auth

```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Sessions

```
POST   /api/sessions                    // start new session
GET    /api/sessions                    // list user sessions
GET    /api/sessions/:id                // get session details
PATCH  /api/sessions/:id/complete       // mark session complete
```

### Questions

```
POST   /api/sessions/:id/questions      // generate questions for session
GET    /api/sessions/:id/questions      // get all questions in session
```

### Answers

```
POST   /api/answers                     // submit answer, trigger AI scoring
GET    /api/sessions/:id/answers        // get all answers in session
```

### User Profile

```
GET    /api/users/me/stats              // dashboard stats
GET    /api/users/me/weak-topics        // current weak topics
PATCH  /api/users/me/resume             // upload + parse resume
```

### Report Cards

```
POST   /api/report-cards                // generate report card
GET    /api/report-cards/:token         // public report card (no auth)
```

### Recordings

```
POST   /api/recordings/presign          // get S3 presigned upload URL
POST   /api/recordings                  // save recording metadata after upload
GET    /api/recordings/:sessionId       // get recording for a session
DELETE /api/recordings/:id              // delete recording
```

### Question Prediction

```
POST   /api/predict-questions           // paste JD → get predicted questions
```

### Negotiation Simulator

```
POST   /api/negotiation/start           // start negotiation session
POST   /api/negotiation/:id/message     // send negotiation message
GET    /api/negotiation/:id/report      // get negotiation outcome report
```

### Daily Question

```
GET    /api/daily-question              // get today's question for user's role
POST   /api/daily-question/answer       // submit answer for daily question
GET    /api/daily-question/streak       // get daily question streak
```

### Heatmap

```
GET    /api/users/me/heatmap            // daily activity grid (last 365 days)
GET    /api/users/me/topic-heatmap      // topic coverage + performance grid
```

---

## 9. User Flow

```
1. Sign up / Log in (Clerk)
         ↓
2. Select Role + Level + Company (optional)
         ↓
3. Upload Resume (optional — for personalized questions)
         ↓
4. Interview starts
   → AI asks question
   → User answers (text or voice)
   → AI scores + gives feedback
   → Repeat for 8-10 questions
         ↓
5. Session ends
   → Overall score calculated
   → Weak areas updated in profile
   → Report card generated
         ↓
6. Dashboard updated
   → Progress graphs refresh
   → Weak topics updated
         ↓
7. Next session
   → AI already knows your weak spots
   → Harder questions on those topics
   → Repeat loop
```

---

## 10. Monetization

### Free Tier

- 3 sessions per day
- Text mode only
- Basic feedback
- 30-day history

### Pro Tier ($9/month)

- Unlimited sessions
- Voice mode
- Company-specific mode
- Resume-based questions
- Shareable report cards
- Full history

### Team Tier ($29/month per team)

- Everything in Pro
- Peer mock mode
- Team leaderboard
- Manager dashboard (track team prep progress)

---

## 11. Step-by-Step Build Guide

### Week 1 — Foundation

**Day 1-2: Project Setup**

```bash
npx create-next-app@latest interv-ai --typescript --tailwind --app
cd interv-ai
npm install @clerk/nextjs @supabase/supabase-js @anthropic-ai/sdk
npm install framer-motion recharts lucide-react
npx shadcn-ui@latest init
```

- Set up Clerk auth (Google + GitHub)
- Set up Supabase project + run schema migrations
- Create `.env.local` with all API keys
- Build base layout: navbar, sidebar, footer

**Day 3-4: Core Interview Flow**

- Role selection page
- Session creation API
- Question generation (Claude API)
- Chat-style interview UI (question → answer input → next)

**Day 5-6: Scoring System**

- Answer submission API
- Claude scoring prompt integration
- Display score + STAR breakdown after each answer
- Flag weak answers (score < 6)

**Day 7: Session History**

- Sessions list page
- Session detail page (all Q&A + scores)
- Basic stats: avg score, weak answer count

---

### Week 2 — Memory System + Dashboard

**Day 8-9: Memory System**

- After session ends: extract topics from weak answers
- Update `user.weakTopics[]` in Supabase
- Inject weak topics into next session's question generation prompt
- Test: verify next session focuses on weak areas

**Day 10-11: Progress Dashboard**

- Score over time (line chart — Recharts)
- Category breakdown (radar chart)
- Streak counter (Redis)
- Weak topics list

**Day 12-13: Polish MVP**

- Loading states, error handling
- Mobile responsive
- Empty states (first-time user)
- Toast notifications

**Day 14: Deploy v1**

- Push to GitHub
- Deploy frontend to Vercel
- Deploy backend to Railway
- Set all env vars in production
- Smoke test full user flow

---

### Week 3 — Voice + Company Mode

**Day 15-16: Voice Mode**

```javascript
// Web Speech API setup
const recognition = new window.SpeechRecognition();
recognition.continuous = false;
recognition.lang = 'en-US';
recognition.onresult = (e) => {
  const transcript = e.results[0][0].transcript;
  submitAnswer(transcript);
};
```

- Mic button in interview UI
- Real-time transcript display
- ElevenLabs integration for AI voice output

**Day 17-18: Company Mode**

- Company selector: Google | Amazon | Microsoft | Meta | Startup | etc.
- Company-specific prompt variants
- Leadership Principles mode for Amazon
- System design heavy mode for FAANG

**Day 19-20: Resume Upload**

- PDF upload UI
- PDF.js text extraction
- Store in `user.resumeText`
- Pass to question generation prompt
- Test personalized questions

---

### Week 4 — Report Cards + Sharing

**Day 21-22: Shareable Report Card**

- Generate report card after session
- Unique share token (nanoid)
- Public `/report/:token` page (no auth required)
- Open Graph image for social sharing

**Day 23-24: Stripe Integration**

- Stripe subscription setup (Free + Pro)
- Webhook for subscription events
- Gate voice mode + company mode behind Pro
- Billing portal page

**Day 25-26: Analytics + Monitoring**

- PostHog setup (track session starts, completions, drop-offs)
- Sentry error tracking
- Performance monitoring

**Day 27-28: Launch Prep**

- Product Hunt listing draft
- Landing page with demo video
- SEO meta tags
- Feedback widget (Tally or Typeform)

---

### Week 5-6 — Growth Features

**Day 29-32: Peer Mock Mode**

- WebSocket matchmaking (Socket.io)
- Live interview room: interviewer + interviewee
- AI judge: scores answers in real-time
- Post-session comparative feedback

**Day 33-36: Leaderboard + Streaks**

- Weekly leaderboard by role
- Redis-based streak tracking
- Email reminders (Resend API) for at-risk streaks
- Profile page with public stats

**Day 37-40: Interview Debrief Mode**

- Post-interview logging form
- AI analysis of logged answers
- "Where you likely lost points" breakdown
- Recommended prep for next round

---

### Week 7 — Power Features

**Day 41-42: Timed Pressure Mode**

- Add countdown timer component to interview UI
- 90s per answer, auto-submit on timeout
- Score penalty logic for incomplete answers
- Red flash animation at 30s warning

**Day 43-44: Question Prediction Engine**

- JD paste input page
- Claude prompt: analyze JD → output predicted questions JSON
- Display grouped by category
- One-click "Start session with these questions"
- Shareable prediction report page

**Day 45-46: Follow-up Drill**

- After each answer is scored, trigger 2 AI follow-up questions
- Follow-up answers scored separately
- Aggregate follow-up score into session total
- Show follow-up thread in session history

**Day 47-49: AWS Recording Storage**

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

- Set up S3 bucket with private ACL
- CloudFront distribution in front of S3
- Presigned URL generation API (15-min expiry for upload)
- Frontend: MediaRecorder API captures audio → uploads to presigned URL
- Save recording metadata to Supabase after upload
- Playback page with waveform (WaveSurfer.js) + transcript sync
- Auto-delete Lambda for expired free-tier recordings

---

### Week 8 — Heatmap, Negotiation & Daily Question

**Day 50-51: Performance Heatmap**

- DailyActivity table population (update on session complete)
- Heatmap UI component (custom SVG grid, 52 weeks × 7 days)
- Topic heatmap: radar-style grid with color intensity per topic
- Click-to-drill: click a day → see sessions from that day

**Day 52-54: Offer Negotiation Simulator**

- Negotiation session data model
- Claude prompt: play HR manager, push back realistically
- Chat UI (same as interview but negotiation context)
- Outcome report: final offer vs initial offer vs market rate
- Coaching notes: moments where user gave ground unnecessarily

**Day 55-56: Daily Question of the Day**

- Cron job (Vercel Cron or Railway cron): pick daily question per role
- Email dispatch via Resend API every morning at 8am
- In-app daily question banner on dashboard
- Separate streak counter for daily questions
- Weekly email digest: 7 answers + scores

---

## 12. Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# ElevenLabs
ELEVENLABS_API_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=

# Sentry
SENTRY_DSN=

# AWS (Recordings)
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
AWS_CLOUDFRONT_DOMAIN=

# Resend (Daily Question Emails)
RESEND_API_KEY=
```

---

## 13. Folder Structure

```
interv-ai/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── dashboard/
│   ├── interview/
│   │   ├── setup/
│   │   ├── session/[id]/
│   │   └── complete/[id]/
│   ├── history/
│   ├── report/[token]/
│   ├── leaderboard/
│   ├── predict/
│   ├── negotiate/
│   │   ├── setup/
│   │   └── session/[id]/
│   ├── daily/
│   ├── recordings/[sessionId]/
│   ├── settings/
│   └── api/
│       ├── sessions/
│       ├── answers/
│       ├── questions/
│       ├── users/
│       ├── report-cards/
│       ├── recordings/
│       ├── predict-questions/
│       ├── negotiation/
│       ├── daily-question/
│       └── heatmap/
├── components/
│   ├── interview/
│   │   ├── QuestionCard.tsx
│   │   ├── AnswerInput.tsx
│   │   ├── VoiceRecorder.tsx
│   │   ├── ScoreBreakdown.tsx
│   │   └── SessionProgress.tsx
│   ├── dashboard/
│   │   ├── ScoreChart.tsx
│   │   ├── RadarChart.tsx
│   │   ├── WeakTopics.tsx
│   │   ├── StreakCard.tsx
│   │   ├── ActivityHeatmap.tsx
│   │   └── TopicHeatmap.tsx
│   ├── recording/
│   │   ├── AudioRecorder.tsx
│   │   ├── WaveformPlayer.tsx
│   │   └── TranscriptSync.tsx
│   ├── negotiation/
│   │   ├── NegotiationChat.tsx
│   │   └── OutcomeReport.tsx
│   └── ui/
├── lib/
│   ├── claude.ts           // AI prompt functions
│   ├── supabase.ts         // DB client
│   ├── redis.ts            // Redis client
│   ├── elevenlabs.ts       // Voice output
│   ├── pdf-parser.ts       // Resume parsing
│   ├── s3.ts               // AWS S3 presign + upload
│   ├── cloudfront.ts       // CDN URL builder
│   └── resend.ts           // Daily question emails
├── hooks/
│   ├── useVoiceInput.ts
│   ├── useSession.ts
│   ├── useStreak.ts
│   ├── useRecorder.ts      // MediaRecorder + S3 upload
│   └── useHeatmap.ts       // Daily activity data
└── types/
    └── index.ts
```

---

## 14. Success Metrics


| Metric                          | Target (Month 1) | Target (Month 3) |
| ------------------------------- | ---------------- | ---------------- |
| Registered users                | 500              | 5,000            |
| Sessions completed              | 1,000            | 15,000           |
| D7 retention                    | 20%              | 35%              |
| Pro conversions                 | 2%               | 5%               |
| Avg session score (improvement) | +1.2 pts         | +2.5 pts         |
| NPS                             | 40               | 55               |


---

## 15. Risks & Mitigations


| Risk                        | Mitigation                                                         |
| --------------------------- | ------------------------------------------------------------------ |
| AI scoring inconsistency    | Fine-tune prompt, add few-shot examples, let users flag bad scores |
| Voice accuracy issues       | Fallback to text mode, show live transcript                        |
| High API costs at scale     | Cache common questions, rate limit free tier, use Groq for speed   |
| Low retention               | Streaks, email reminders, peer mode for social accountability      |
| Generic questions feel fake | Resume upload, company mode, difficulty escalation                 |


---

*Build it. Ship it. It remembers what trips you up — and won't let you ignore it.*