-- ============================================================
-- IntervAI Database Schema - V1 Initial Migration
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    profile_picture_url TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    plan VARCHAR(50) NOT NULL DEFAULT 'FREE',
    target_role VARCHAR(255),
    target_companies TEXT[],
    experience_years INTEGER DEFAULT 0,
    resume_url TEXT,
    resume_text TEXT,
    weak_topics TEXT[],
    daily_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    total_sessions INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    average_score NUMERIC(5, 2) DEFAULT 0.00,
    email_notifications_enabled BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan ON users(plan);
CREATE INDEX idx_users_daily_streak ON users(daily_streak DESC);

-- ============================================================
-- SESSIONS TABLE
-- ============================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    role VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    difficulty VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    interview_type VARCHAR(100) NOT NULL DEFAULT 'TECHNICAL',
    mode VARCHAR(50) NOT NULL DEFAULT 'TEXT',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    total_questions INTEGER DEFAULT 0,
    answered_questions INTEGER DEFAULT 0,
    overall_score NUMERIC(5, 2),
    duration_seconds INTEGER,
    is_timed BOOLEAN DEFAULT FALSE,
    time_limit_seconds INTEGER,
    jd_text TEXT,
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_role ON sessions(role);
CREATE INDEX idx_sessions_company ON sessions(company);

-- ============================================================
-- QUESTIONS TABLE
-- ============================================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(100) NOT NULL DEFAULT 'BEHAVIORAL',
    topic VARCHAR(255),
    difficulty VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    order_index INTEGER NOT NULL DEFAULT 0,
    expected_duration_seconds INTEGER,
    hint TEXT,
    sample_answer TEXT,
    is_answered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_questions_session_id ON questions(session_id);
CREATE INDEX idx_questions_order ON questions(session_id, order_index);
CREATE INDEX idx_questions_topic ON questions(topic);
CREATE INDEX idx_questions_type ON questions(question_type);

-- ============================================================
-- ANSWERS TABLE
-- ============================================================
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answer_text TEXT,
    audio_url TEXT,
    score INTEGER CHECK (score >= 0 AND score <= 10),
    star_situation INTEGER CHECK (star_situation >= 0 AND star_situation <= 10),
    star_task INTEGER CHECK (star_task >= 0 AND star_task <= 10),
    star_action INTEGER CHECK (star_action >= 0 AND star_action <= 10),
    star_result INTEGER CHECK (star_result >= 0 AND star_result <= 10),
    ai_feedback TEXT,
    strengths TEXT[],
    improvements TEXT[],
    time_taken_seconds INTEGER,
    is_voice_answer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_session_id ON answers(session_id);
CREATE INDEX idx_answers_user_id ON answers(user_id);
CREATE INDEX idx_answers_score ON answers(score);

-- ============================================================
-- REPORT CARDS TABLE
-- ============================================================
CREATE TABLE report_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    communication_score NUMERIC(5, 2) DEFAULT 0,
    technical_score NUMERIC(5, 2) DEFAULT 0,
    problem_solving_score NUMERIC(5, 2) DEFAULT 0,
    star_framework_score NUMERIC(5, 2) DEFAULT 0,
    confidence_score NUMERIC(5, 2) DEFAULT 0,
    strengths TEXT[],
    improvements TEXT[],
    weak_topics TEXT[],
    top_topics TEXT[],
    ai_summary TEXT,
    hiring_recommendation VARCHAR(100),
    share_token VARCHAR(255) UNIQUE,
    is_shared BOOLEAN DEFAULT FALSE,
    shared_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_report_cards_session_id ON report_cards(session_id);
CREATE INDEX idx_report_cards_user_id ON report_cards(user_id);
CREATE INDEX idx_report_cards_share_token ON report_cards(share_token);

-- ============================================================
-- RECORDINGS TABLE
-- ============================================================
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answer_id UUID REFERENCES answers(id) ON DELETE SET NULL,
    s3_key VARCHAR(500) NOT NULL,
    s3_bucket VARCHAR(255) NOT NULL,
    cloudfront_url TEXT,
    file_size_bytes BIGINT,
    duration_seconds INTEGER,
    mime_type VARCHAR(100) DEFAULT 'video/webm',
    recording_type VARCHAR(50) DEFAULT 'VIDEO',
    status VARCHAR(50) DEFAULT 'UPLOADED',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recordings_session_id ON recordings(session_id);
CREATE INDEX idx_recordings_user_id ON recordings(user_id);
CREATE INDEX idx_recordings_answer_id ON recordings(answer_id);
CREATE INDEX idx_recordings_s3_key ON recordings(s3_key);

-- ============================================================
-- DAILY ACTIVITY TABLE
-- ============================================================
CREATE TABLE daily_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    sessions_count INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    average_score NUMERIC(5, 2) DEFAULT 0,
    topics_covered TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, activity_date)
);

CREATE INDEX idx_daily_activity_user_id ON daily_activity(user_id);
CREATE INDEX idx_daily_activity_date ON daily_activity(activity_date DESC);
CREATE INDEX idx_daily_activity_user_date ON daily_activity(user_id, activity_date DESC);

-- ============================================================
-- NEGOTIATION SESSIONS TABLE
-- ============================================================
CREATE TABLE negotiation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    initial_offer NUMERIC(12, 2),
    target_salary NUMERIC(12, 2),
    final_offer NUMERIC(12, 2),
    outcome VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    ai_persona TEXT,
    context_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_negotiation_sessions_user_id ON negotiation_sessions(user_id);
CREATE INDEX idx_negotiation_sessions_status ON negotiation_sessions(status);

-- ============================================================
-- NEGOTIATION MESSAGES TABLE
-- ============================================================
CREATE TABLE negotiation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negotiation_session_id UUID NOT NULL REFERENCES negotiation_sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'TEXT',
    offer_amount NUMERIC(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_negotiation_messages_session_id ON negotiation_messages(negotiation_session_id);
CREATE INDEX idx_negotiation_messages_created_at ON negotiation_messages(negotiation_session_id, created_at ASC);

-- ============================================================
-- DAILY QUESTION ANSWERS TABLE
-- ============================================================
CREATE TABLE daily_question_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_date DATE NOT NULL,
    question_text TEXT NOT NULL,
    question_topic VARCHAR(255),
    question_difficulty VARCHAR(50) DEFAULT 'MEDIUM',
    answer_text TEXT,
    score INTEGER CHECK (score >= 0 AND score <= 10),
    ai_feedback TEXT,
    is_answered BOOLEAN DEFAULT FALSE,
    answered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, question_date)
);

CREATE INDEX idx_daily_question_answers_user_id ON daily_question_answers(user_id);
CREATE INDEX idx_daily_question_answers_date ON daily_question_answers(question_date DESC);
CREATE INDEX idx_daily_question_answers_user_date ON daily_question_answers(user_id, question_date DESC);

-- ============================================================
-- LEADERBOARD VIEW
-- ============================================================
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT
    u.id,
    u.full_name,
    u.profile_picture_url,
    u.target_role,
    u.daily_streak,
    u.total_sessions,
    u.total_questions_answered,
    u.average_score,
    RANK() OVER (ORDER BY u.average_score DESC, u.total_sessions DESC) AS rank
FROM users u
WHERE u.is_active = TRUE
  AND u.total_sessions > 0;

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_cards_updated_at BEFORE UPDATE ON report_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_activity_updated_at BEFORE UPDATE ON daily_activity
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
