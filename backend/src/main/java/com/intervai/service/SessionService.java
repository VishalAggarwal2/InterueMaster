package com.intervai.service;

import com.intervai.dto.request.SessionRequest;
import com.intervai.dto.response.SessionResponse;
import com.intervai.entity.Session;
import com.intervai.entity.User;
import com.intervai.exception.BadRequestException;
import com.intervai.exception.RateLimitExceededException;
import com.intervai.exception.ResourceNotFoundException;
import com.intervai.repository.SessionRepository;
import com.intervai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final RedisService redisService;

    @Value("${app.free-tier.daily-session-limit}")
    private int dailySessionLimit;

    @Transactional
    public SessionResponse createSession(String email, SessionRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // Check free tier daily limit
        if ("FREE".equals(user.getPlan())) {
            int dailyCount = redisService.getDailySessionCount(user.getId());
            if (dailyCount >= dailySessionLimit) {
                throw new RateLimitExceededException(
                        String.format("Free tier limit reached: %d sessions per day. Upgrade to Pro for unlimited sessions.", dailySessionLimit));
            }
        }

        String title = request.getTitle();
        if (title == null || title.isBlank()) {
            title = buildSessionTitle(request);
        }

        Session session = Session.builder()
                .user(user)
                .title(title)
                .role(request.getRole())
                .company(request.getCompany())
                .difficulty(request.getDifficulty() != null ? request.getDifficulty() : "MEDIUM")
                .interviewType(request.getInterviewType() != null ? request.getInterviewType() : "TECHNICAL")
                .mode(request.getMode() != null ? request.getMode() : "TEXT")
                .status("ACTIVE")
                .isTimed(request.getIsTimed() != null ? request.getIsTimed() : false)
                .timeLimitSeconds(request.getTimeLimitSeconds())
                .jdText(request.getJdText())
                .notes(request.getNotes())
                .build();

        session = sessionRepository.save(session);

        // Increment daily session count in Redis
        redisService.incrementDailySessionCount(user.getId());

        // Update user total sessions
        userRepository.incrementTotalSessions(user.getId());

        log.info("Session created: {} for user: {}", session.getId(), email);
        return mapToResponse(session);
    }

    @Transactional(readOnly = true)
    public Page<SessionResponse> getUserSessions(String email, int page, int size) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Pageable pageable = PageRequest.of(page, size);
        return sessionRepository.findByUserOrderByCreatedAtDesc(user, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public SessionResponse getSession(String email, UUID sessionId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Session session = sessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        return mapToResponse(session);
    }

    @Transactional
    public SessionResponse completeSession(String email, UUID sessionId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Session session = sessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        if ("COMPLETED".equals(session.getStatus())) {
            throw new BadRequestException("Session is already completed");
        }

        session.setStatus("COMPLETED");
        session.setCompletedAt(OffsetDateTime.now());

        if (session.getStartedAt() != null) {
            long seconds = java.time.temporal.ChronoUnit.SECONDS.between(
                    session.getStartedAt(), session.getCompletedAt());
            session.setDurationSeconds((int) seconds);
        }

        session = sessionRepository.save(session);
        log.info("Session completed: {} for user: {}", sessionId, email);
        return mapToResponse(session);
    }

    @Transactional
    public void deleteSession(String email, UUID sessionId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Session session = sessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        sessionRepository.delete(session);
        log.info("Session deleted: {} for user: {}", sessionId, email);
    }

    @Transactional
    public void updateSessionScore(UUID sessionId, java.math.BigDecimal score, int answeredQuestions) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));
        session.setOverallScore(score);
        session.setAnsweredQuestions(answeredQuestions);
        sessionRepository.save(session);
    }

    public Session getSessionById(UUID sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));
    }

    private String buildSessionTitle(SessionRequest request) {
        StringBuilder title = new StringBuilder(request.getRole());
        if (request.getCompany() != null && !request.getCompany().isBlank()) {
            title.append(" @ ").append(request.getCompany());
        }
        if (request.getInterviewType() != null) {
            title.append(" - ").append(request.getInterviewType());
        }
        return title.toString();
    }

    public SessionResponse mapToResponse(Session session) {
        return SessionResponse.builder()
                .id(session.getId())
                .title(session.getTitle())
                .role(session.getRole())
                .company(session.getCompany())
                .difficulty(session.getDifficulty())
                .interviewType(session.getInterviewType())
                .mode(session.getMode())
                .status(session.getStatus())
                .totalQuestions(session.getTotalQuestions())
                .answeredQuestions(session.getAnsweredQuestions())
                .overallScore(session.getOverallScore())
                .durationSeconds(session.getDurationSeconds())
                .isTimed(session.getIsTimed())
                .timeLimitSeconds(session.getTimeLimitSeconds())
                .jdText(session.getJdText())
                .notes(session.getNotes())
                .startedAt(session.getStartedAt())
                .completedAt(session.getCompletedAt())
                .createdAt(session.getCreatedAt())
                .build();
    }
}
