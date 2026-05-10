# IntervAI — AI Mock Interview Platform

> *"It remembers what trips you up — and won't let you ignore it."*

An end-to-end AI-powered mock interview platform that conducts role-specific interviews, scores every answer using the STAR framework, remembers your weak areas across sessions, and tracks improvement over time.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Features](#features)
5. [Data Models](#data-models)
6. [API Reference](#api-reference)
7. [Local Development — Docker](#local-development--docker)
8. [Local Development — Manual](#local-development--manual)
9. [Environment Variables](#environment-variables)
10. [Frontend Pages](#frontend-pages)
11. [AI Prompt Architecture](#ai-prompt-architecture)
12. [WebSocket Protocol](#websocket-protocol)
13. [Deployment](#deployment)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│                 Next.js 14 (App Router)                         │
│          Tailwind CSS · Framer Motion · Recharts                │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP / WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Spring Boot 3.2 (Java 17)                      │
│   REST API · WebSocket · JWT Auth · Rate Limiting (Redis)       │
└──────┬────────────────┬────────────────┬────────────────────────┘
       │                │                │
       ▼                ▼                ▼
  PostgreSQL 16     Redis 7          LocalStack (S3)
  (primary DB)    (cache/streak)   (recording storage)
       │
       ▼
  Flyway migrations
  (schema versioned)
       │
       ▼
  Anthropic Claude API
  (question gen · scoring · negotiation)
```

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Java 17, Spring Boot 3.2 |
| Security | Spring Security + JWT (jjwt 0.12) |
| Database | PostgreSQL 16 + Spring Data JPA + Hibernate |
| Migrations | Flyway |
| Cache / Streak | Redis 7 (Spring Data Redis + Lettuce) |
| Object Storage | AWS S3 SDK v2 (LocalStack in local dev) |
| WebSocket | Spring WebSocket |
| Email | Spring Mail → MailHog (dev) |
| AI | Anthropic Claude API (HTTP via RestTemplate) |
| Build | Maven |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts |
| State | Zustand |
| Forms | React Hook Form + Zod |
| HTTP | Axios (with JWT interceptors) |
| Voice | Web Speech API (STT) + ElevenLabs (TTS) |
| Audio | WaveSurfer.js |
| PDF | pdfjs-dist |
| Notifications | react-hot-toast |

### Infrastructure (local)
| Service | Image | Port |
|---|---|---|
| PostgreSQL | postgres:16-alpine | 5432 |
| Redis | redis:7-alpine | 6379 |
| LocalStack (S3) | localstack/localstack:3.4 | 4566 |
| MailHog (SMTP) | mailhog/mailhog | 1025 / 8025 |
| Backend | Custom (JRE 17) | 8080 |
| Frontend | Custom (Node 20) | 3000 |
| pgAdmin (optional) | dpage/pgadmin4 | 5050 |

---

## Project Structure

```
InterviueMaster/
├── docker-compose.yml              # Full local stack
├── .env.example                    # Environment variable template
├── .gitignore
├── README.md
│
├── backend/                        # Spring Boot application
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/intervai/
│       ├── IntervAiApplication.java
│       ├── config/
│       │   ├── AwsConfig.java      # S3Client + S3Presigner beans
│       │   ├── RedisConfig.java    # Lettuce connection factory
│       │   ├── SecurityConfig.java # JWT filter, CORS, public routes
│       │   └── WebSocketConfig.java
│       ├── controller/
│       │   ├── AuthController.java         # /auth/**
│       │   ├── SessionController.java      # /sessions/**
│       │   ├── QuestionController.java     # /sessions/{id}/questions, /questions/predict
│       │   ├── AnswerController.java       # /answers/**
│       │   ├── UserController.java         # /users/me/**
│       │   ├── ReportCardController.java   # /report-cards/**
│       │   ├── RecordingController.java    # /recordings/**
│       │   ├── NegotiationController.java  # /negotiation/**
│       │   ├── DailyQuestionController.java# /daily-question/**
│       │   └── LeaderboardController.java  # /leaderboard/**
│       ├── dto/
│       │   ├── request/            # 7 request DTOs
│       │   └── response/           # 8 response DTOs
│       ├── entity/                 # 10 JPA entities
│       ├── exception/              # GlobalExceptionHandler + custom exceptions
│       ├── repository/             # 10 JpaRepository interfaces
│       ├── security/               # JwtTokenProvider, JwtAuthFilter, UserDetailsService
│       ├── service/
│       │   ├── ClaudeService.java          # Anthropic API client
│       │   ├── RedisService.java           # Streak, rate limiting, caching
│       │   ├── AuthService.java            # JWT signup/login/logout
│       │   ├── SessionService.java         # Session CRUD + daily limit enforcement
│       │   ├── QuestionService.java        # AI question generation
│       │   ├── AnswerService.java          # STAR scoring, weak topic extraction
│       │   ├── ReportCardService.java      # AI summary, share tokens
│       │   ├── RecordingService.java       # S3 presigned URLs
│       │   ├── NegotiationService.java     # Salary negotiation simulator
│       │   ├── DailyQuestionService.java   # QOTD + streak
│       │   ├── DailyActivityService.java   # Heatmap data
│       │   ├── HeatmapService.java         # GitHub-style heatmap
│       │   ├── UserService.java            # Profile, stats, weak topics
│       │   └── EmailService.java           # Async HTML emails
│       └── websocket/
│           └── InterviewWebSocketHandler.java
│
├── frontend/                       # Next.js application
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── app/
│   │   ├── layout.tsx              # Root layout + providers
│   │   ├── globals.css             # Dark theme CSS variables
│   │   ├── page.tsx                # Landing page
│   │   ├── (auth)/login/           # Login form
│   │   ├── (auth)/signup/          # Signup form
│   │   ├── dashboard/              # Analytics dashboard
│   │   ├── interview/
│   │   │   ├── setup/              # Role / company / mode selection
│   │   │   ├── session/[id]/       # Live interview UI
│   │   │   └── complete/[id]/      # Session completion + report
│   │   ├── history/                # Session list + detail
│   │   ├── report/[token]/         # Public shareable report (no auth)
│   │   ├── leaderboard/            # Global leaderboard
│   │   ├── predict/                # JD → question prediction
│   │   ├── negotiate/
│   │   │   ├── setup/              # Negotiation setup
│   │   │   └── session/[id]/       # Live negotiation chat
│   │   ├── daily/                  # Daily question of the day
│   │   ├── recordings/[sessionId]/ # Audio playback + transcript
│   │   └── settings/               # Profile, billing, privacy
│   ├── components/
│   │   ├── ui/                     # 17 shadcn/ui base components
│   │   ├── layout/                 # Navbar, Sidebar, AuthGuard
│   │   ├── interview/              # QuestionCard, AnswerInput, VoiceRecorder, ScoreBreakdown, TimerBar, FeedbackCard
│   │   ├── dashboard/              # ScoreChart, RadarChart, WeakTopics, StreakCard, ActivityHeatmap, TopicHeatmap, StatsCard
│   │   ├── recording/              # AudioPlayer (WaveSurfer)
│   │   └── negotiation/            # NegotiationChat, OutcomeReport
│   ├── hooks/                      # useAuth, useVoiceInput, useRecorder, useTimer, useWebSocket
│   ├── lib/                        # api.ts (axios), auth.ts, utils.ts
│   ├── store/                      # Zustand: auth.store.ts, interview.store.ts
│   └── types/                      # Full TypeScript type definitions
│
└── infra/
    ├── postgres/init.sql           # PostgreSQL extensions setup
    └── localstack/init-aws.sh      # S3 bucket creation for local dev
```

---

## Features

### Phase 1 — Core MVP
| Feature | Description |
|---|---|
| **F1 Role Selection** | SDE, PM, Data Analyst, Designer, DevOps + experience level + target company |
| **F2 AI Interview Session** | 8-10 questions generated by Claude based on role/level/company |
| **F3 STAR Scoring** | Every answer scored 0-10 with Situation/Task/Action/Result breakdown |
| **F4 Weak Area Memory** | Answers < 6 flagged; topics stored in user profile; next session focuses on weak areas |
| **F5 Session History** | All past sessions with scores and full Q&A review |
| **F6 Progress Dashboard** | Line chart, radar chart, streak counter, weak topics list |

### Phase 2 — Differentiators
| Feature | Description |
|---|---|
| **F7 Voice Mode** | Web Speech API for STT; ElevenLabs for AI voice output |
| **F8 Company Mode** | Company-specific questions (Google, Amazon, FAANG, Startup, etc.) |
| **F9 Resume Questions** | Upload PDF → Claude generates personalized questions from your resume |
| **F10 Shareable Report** | Public `/report/:token` page with Open Graph support |

### Phase 3 — Growth
| Feature | Description |
|---|---|
| **F11 Daily Streak** | Practice daily to maintain streak; Redis-backed counter |
| **F13 Interview Debrief** | Log real interview answers → AI estimates where you lost points |
| **F14 Leaderboard** | Global rankings by role, company mode, experience level |

### Phase 4 — Power Features
| Feature | Description |
|---|---|
| **F15 Timed Pressure Mode** | 90-second countdown; auto-submit; red flash at 30s |
| **F16 Question Prediction** | Paste any JD → Claude predicts top 10 likely questions |
| **F17 Negotiation Simulator** | AI plays HR manager in live salary negotiation roleplay |
| **F18 Follow-up Drill** | AI asks 2 mandatory follow-ups after each answer |
| **F19 Daily Question** | One curated role-specific question every morning |
| **F20 Session Recording** | Audio recording → S3 upload; WaveSurfer playback with transcript |
| **F21 Performance Heatmap** | GitHub-style activity heatmap + topic coverage grid |

---

## Data Models

```
User ──────────── Session ──────── Question ──── Answer
  │                  │                              │
  │                  └── ReportCard                 │
  │                  └── Recording                  │
  │                                                 │
  └── DailyActivity                                 │
  └── DailyQuestionAnswer ◄────────────────────────┘
  └── NegotiationSession ── NegotiationMessage
```

Key relationships:
- One user → many sessions
- One session → many questions → one answer each
- One session → one report card
- One session → many recordings
- User has `weak_topics[]` array updated after every session with low-scoring answers

---

## API Reference

All endpoints are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <token>`.

### Auth
```
POST   /auth/signup                 Register new user
POST   /auth/login                  Login → returns JWT
POST   /auth/logout                 Invalidate JWT (Redis blacklist)
GET    /auth/me                     Current user profile
```

### Sessions
```
POST   /sessions                    Create session (triggers question generation)
GET    /sessions                    List user's sessions (paginated)
GET    /sessions/{id}               Get session details
PATCH  /sessions/{id}/complete      Mark session complete + update weak topics
DELETE /sessions/{id}               Delete session
```

### Questions
```
GET    /sessions/{id}/questions     All questions for a session
POST   /questions/predict           JD text → predicted questions (F16)
```

### Answers
```
POST   /answers                     Submit answer → Claude scores it
GET    /sessions/{id}/answers       All answers for a session
GET    /answers/{id}                Single answer detail
```

### User Profile
```
GET    /users/me/stats              Dashboard stats (scores, streak, totals)
GET    /users/me/weak-topics        Current weak topic list
PATCH  /users/me/profile            Update name, target role, etc.
POST   /users/me/resume             Upload + parse resume text
GET    /users/me/heatmap            Daily activity grid (last 365 days)
GET    /users/me/topic-heatmap      Topic coverage + performance grid
```

### Report Cards
```
POST   /report-cards                Generate report card for a session
GET    /report-cards/{id}           Get report card (auth required)
GET    /report-cards/share/{token}  Public report card (no auth)
POST   /report-cards/{id}/share     Generate share token
```

### Recordings
```
POST   /recordings/presign          Get S3 presigned upload URL (15 min)
POST   /recordings                  Save recording metadata after S3 upload
GET    /recordings/session/{id}     Get recording for a session
DELETE /recordings/{id}             Delete recording
```

### Negotiation
```
POST   /negotiation                 Start negotiation session
POST   /negotiation/{id}/message    Send message to AI negotiator
GET    /negotiation/{id}            Get negotiation session + messages
GET    /negotiation/{id}/report     Get negotiation outcome report
```

### Daily Question
```
GET    /daily-question              Today's question for user's role
POST   /daily-question/answer       Submit answer
GET    /daily-question/streak       Daily question streak
GET    /daily-question/history      Past 7 days
```

### Leaderboard
```
GET    /leaderboard                 Global leaderboard (paginated, filterable)
```

---

## Local Development — Docker

This is the fastest way to get everything running.

### Prerequisites
- Docker Desktop 4.x+
- Docker Compose v2.x+

### Step 1: Clone and configure

```bash
cd InterviueMaster
cp .env.example .env
# Edit .env — the ONLY required change is your Anthropic API key:
# ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
```

### Step 2: Start everything

```bash
docker compose up --build
```

This starts (in dependency order):
1. **PostgreSQL** — database, Flyway migrations run automatically on backend start
2. **Redis** — cache and streak tracking
3. **LocalStack** — local AWS S3 emulation (bucket `intervai-recordings` auto-created)
4. **MailHog** — catches all outgoing emails (view at http://localhost:8025)
5. **Backend** — Spring Boot API (waits for healthy DB + Redis + LocalStack)
6. **Frontend** — Next.js app (waits for healthy backend)

### Step 3: Access the application

| Service | URL |
|---|---|
| **App (Frontend)** | http://localhost:3000 |
| **API** | http://localhost:8080/api |
| **API Health** | http://localhost:8080/api/actuator/health |
| **MailHog UI** | http://localhost:8025 |
| **LocalStack** | http://localhost:4566 |
| **pgAdmin** (optional) | http://localhost:5050 |

### pgAdmin (optional DB GUI)

```bash
# Start with the 'tools' profile
docker compose --profile tools up pgadmin

# Login: admin@intervai.local / admin
# Add server: host=postgres, port=5432, user=intervai, pass=intervai_password
```

### Tear down

```bash
# Stop containers (keeps volumes)
docker compose down

# Stop and delete all data
docker compose down -v
```

### Useful commands

```bash
# View backend logs
docker compose logs -f backend

# View frontend logs
docker compose logs -f frontend

# Restart only the backend (after code changes)
docker compose up --build backend

# Open psql in the postgres container
docker compose exec postgres psql -U intervai -d intervai

# Open redis-cli
docker compose exec redis redis-cli

# List S3 buckets in LocalStack
docker compose exec localstack awslocal s3 ls
```

---

## Local Development — Manual

### Prerequisites
- Java 17+
- Maven 3.9+
- Node.js 20+
- PostgreSQL 16+ (running locally)
- Redis 7+ (running locally)

### Backend

```bash
cd backend

# Set environment variables (or create a .env file and source it)
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=intervai
export DB_USERNAME=intervai
export DB_PASSWORD=intervai_password
export REDIS_HOST=localhost
export REDIS_PORT=6379
export JWT_SECRET=mySecretKey123456789012345678901234567890
export ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
export CORS_ALLOWED_ORIGINS=http://localhost:3000

# Run
./mvnw spring-boot:run
```

Flyway will automatically apply the migration at `src/main/resources/db/migration/V1__Initial_Schema.sql`.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=ws://localhost:8080/api/ws
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EOF

# Start dev server
npm run dev
```

Frontend runs at http://localhost:3000

### Build for production

```bash
# Backend
cd backend && ./mvnw package -DskipTests
java -jar target/intervai-backend-1.0.0.jar

# Frontend
cd frontend && npm run build && npm start
```

---

## Environment Variables

### Backend (set as OS env vars or in docker-compose.yml)

| Variable | Default | Required | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | — | **YES** | Claude API key |
| `DB_HOST` | localhost | | PostgreSQL host |
| `DB_PORT` | 5432 | | PostgreSQL port |
| `DB_NAME` | intervai | | Database name |
| `DB_USERNAME` | intervai | | DB username |
| `DB_PASSWORD` | intervai_password | | DB password |
| `REDIS_HOST` | localhost | | Redis host |
| `REDIS_PORT` | 6379 | | Redis port |
| `REDIS_PASSWORD` | (empty) | | Redis password |
| `JWT_SECRET` | — | YES (prod) | 64+ char secret |
| `CORS_ALLOWED_ORIGINS` | http://localhost:3000 | | Comma-separated origins |
| `AWS_REGION` | us-east-1 | | AWS/LocalStack region |
| `AWS_ACCESS_KEY_ID` | test | | AWS key (use `test` for LocalStack) |
| `AWS_SECRET_ACCESS_KEY` | test | | AWS secret (use `test` for LocalStack) |
| `AWS_S3_BUCKET_NAME` | intervai-recordings | | S3 bucket name |
| `AWS_CLOUDFRONT_DOMAIN` | (empty) | | CloudFront domain for CDN URLs |
| `AWS_ENDPOINT_OVERRIDE` | (empty) | | Set to `http://localstack:4566` for local |
| `ELEVENLABS_API_KEY` | (empty) | | ElevenLabs voice (optional) |
| `MAIL_HOST` | smtp.gmail.com | | SMTP host |
| `MAIL_PORT` | 587 | | SMTP port |
| `MAIL_USERNAME` | (empty) | | SMTP username |
| `MAIL_PASSWORD` | (empty) | | SMTP password |
| `STRIPE_SECRET_KEY` | (empty) | | Stripe secret (optional) |
| `STRIPE_WEBHOOK_SECRET` | (empty) | | Stripe webhook secret |

### Frontend (`.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | http://localhost:8080/api | Backend API URL |
| `NEXT_PUBLIC_WS_URL` | ws://localhost:8080/api/ws | WebSocket URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | (empty) | Stripe publishable key |

---

## Frontend Pages

| Route | Auth | Description |
|---|---|---|
| `/` | No | Landing page — hero, features, pricing |
| `/login` | No | Login with email/password |
| `/signup` | No | Create account |
| `/dashboard` | Yes | Score charts, heatmap, weak topics, streak |
| `/interview/setup` | Yes | Select role, company, difficulty, mode |
| `/interview/session/[id]` | Yes | Live interview — questions + answers + STAR scores |
| `/interview/complete/[id]` | Yes | Session summary + report card |
| `/history` | Yes | All past sessions list |
| `/history/[id]` | Yes | Full session review with all Q&A |
| `/report/[token]` | No | Public shareable report card |
| `/leaderboard` | Yes | Global rankings |
| `/predict` | Yes | Paste JD → get predicted questions |
| `/negotiate/setup` | Yes | Negotiation simulator setup |
| `/negotiate/session/[id]` | Yes | Live negotiation chat with AI |
| `/daily` | Yes | Daily question of the day |
| `/recordings/[sessionId]` | Yes | Audio playback with WaveSurfer + transcript |
| `/settings` | Yes | Profile, resume upload, billing |

---

## AI Prompt Architecture

### Question Generation
```
System: You are an expert technical interviewer...
User:   Generate {count} interview questions for a {role} at {company}.
        Difficulty: {difficulty}. Type: {type}.
        Candidate resume: {resumeText}
        Weak areas to focus on: {weakTopics}
        
        Return JSON: [{ questionText, questionType, topic, difficulty, hint }]
```

### Answer Scoring (STAR)
```
System: You are an expert interview coach evaluating answers using STAR...
User:   Role: {role}, Question: {question}, Topic: {topic}
        Answer: {answerText}
        
        Return JSON: {
          score, starSituation, starTask, starAction, starResult,
          aiFeedback, strengths[], improvements[]
        }
```

Answers scoring < 6 are flagged as weak. The question's topic is appended to `user.weak_topics[]`. The next session's question generation prompt includes these weak topics, ensuring the AI focuses 40%+ of questions on the candidate's known gaps.

### Negotiation Simulator
```
System: You are an HR manager at {company} hiring for {role}.
        Initial budget: {budget}. Be realistic, push back on demands.
        User wants: {targetSalary}.
        
        Stay in character. Respond only as the HR manager.
        Reference specific budget constraints and company policies.
```

### JD Question Prediction
```
System: You are an expert recruiter analyzing job descriptions...
User:   Predict the {count} most likely interview questions for:
        Role: {role}, Company: {company}
        JD: {jdText}
        
        Return JSON: [{ questionText, questionType, topic, difficulty, reasoning }]
```

---

## WebSocket Protocol

Connect: `ws://localhost:8080/api/ws/interview?token=<JWT>`

### Client → Server messages

```json
{ "type": "START_INTERVIEW", "sessionId": "uuid" }
{ "type": "ANSWER", "sessionId": "uuid", "questionId": "uuid", "answer": "..." }
{ "type": "REQUEST_HINT", "sessionId": "uuid", "questionId": "uuid" }
{ "type": "PING" }
```

### Server → Client messages

```json
{ "type": "QUESTION", "questionId": "uuid", "questionText": "...", "questionNumber": 1, "totalQuestions": 8 }
{ "type": "SCORE", "questionId": "uuid", "score": 7.5, "feedback": "...", "starBreakdown": {...} }
{ "type": "HINT", "questionId": "uuid", "hint": "..." }
{ "type": "SESSION_COMPLETE", "sessionId": "uuid", "overallScore": 7.2 }
{ "type": "ERROR", "message": "..." }
{ "type": "PONG" }
```

---

## Deployment

### Backend → Railway / Render / Fly.io

```bash
# Build JAR
cd backend && ./mvnw package -DskipTests

# Set all environment variables in your deployment platform dashboard
# The JAR is self-contained — just run:
java -jar target/intervai-backend-1.0.0.jar
```

### Frontend → Vercel

```bash
cd frontend
vercel --prod

# Set in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app/api
# NEXT_PUBLIC_WS_URL=wss://your-backend-domain.railway.app/api/ws
```

### Database → Supabase / Neon / Railway Postgres

1. Create PostgreSQL instance
2. Run the migration: `backend/src/main/resources/db/migration/V1__Initial_Schema.sql`
3. Update `DB_*` environment variables on the backend

### Redis → Upstash / Redis Cloud

1. Create Redis instance
2. Update `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` on the backend

### S3 → AWS

1. Create S3 bucket with private ACL
2. Create CloudFront distribution in front of the bucket
3. Set `AWS_S3_BUCKET_NAME`, `AWS_CLOUDFRONT_DOMAIN`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
4. Remove `AWS_ENDPOINT_OVERRIDE` (or leave blank to use real AWS)

---

## Monetization Tiers

| Feature | Free | Pro ($9/mo) | Team ($29/mo) |
|---|---|---|---|
| Sessions per day | 3 | Unlimited | Unlimited |
| Text mode | ✓ | ✓ | ✓ |
| Voice mode | — | ✓ | ✓ |
| Company mode | — | ✓ | ✓ |
| Resume questions | — | ✓ | ✓ |
| Shareable report | — | ✓ | ✓ |
| Session history | 30 days | Full | Full |
| Recording storage | 90 days | Forever | Forever |
| Peer mock mode | — | — | ✓ |
| Team leaderboard | — | — | ✓ |

---

## Success Metrics

| Metric | Month 1 | Month 3 |
|---|---|---|
| Registered users | 500 | 5,000 |
| Sessions completed | 1,000 | 15,000 |
| D7 retention | 20% | 35% |
| Pro conversions | 2% | 5% |
| Avg score improvement | +1.2 pts | +2.5 pts |
| NPS | 40 | 55 |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

*Built with Java Spring Boot + Next.js 14 · Powered by Anthropic Claude*
# InterueMaster
