package com.intervai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intervai.dto.request.AnswerRequest;
import com.intervai.dto.response.AnswerResponse;
import com.intervai.entity.*;
import com.intervai.exception.BadRequestException;
import com.intervai.exception.ResourceNotFoundException;
import com.intervai.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnswerService {

    private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final ClaudeService claudeService;
    private final UserService userService;
    private final DailyActivityService dailyActivityService;
    private final ObjectMapper objectMapper;

    @Transactional
    public AnswerResponse submitAnswer(String email, AnswerRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", request.getQuestionId()));

        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", request.getSessionId()));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Session does not belong to the user");
        }

        // Check if already answered
        Optional<Answer> existingAnswer = answerRepository.findByQuestionId(question.getId());
        if (existingAnswer.isPresent()) {
            return mapToResponse(existingAnswer.get());
        }

        String answerText = request.getAnswerText();
        if ((answerText == null || answerText.isBlank()) && (request.getAudioUrl() == null)) {
            throw new BadRequestException("Answer text or audio URL is required");
        }

        // Build answer entity
        Answer answer = Answer.builder()
                .question(question)
                .session(session)
                .user(user)
                .answerText(answerText)
                .audioUrl(request.getAudioUrl())
                .timeTakenSeconds(request.getTimeTakenSeconds())
                .isVoiceAnswer(request.getIsVoiceAnswer() != null ? request.getIsVoiceAnswer() : false)
                .build();

        // Score the answer with Claude if text is available
        if (answerText != null && !answerText.isBlank()) {
            try {
                String scoringResponse = claudeService.scoreAnswer(
                        question.getQuestionText(),
                        answerText,
                        session.getRole(),
                        question.getTopic());

                Map<String, Object> scoreData = objectMapper.readValue(
                        scoringResponse, new TypeReference<Map<String, Object>>() {});

                answer.setScore(toInt(scoreData.get("score")));
                answer.setStarSituation(toInt(scoreData.get("starSituation")));
                answer.setStarTask(toInt(scoreData.get("starTask")));
                answer.setStarAction(toInt(scoreData.get("starAction")));
                answer.setStarResult(toInt(scoreData.get("starResult")));
                answer.setAiFeedback((String) scoreData.get("aiFeedback"));

                Object strengthsObj = scoreData.get("strengths");
                if (strengthsObj instanceof List) {
                    answer.setStrengths((List<String>) strengthsObj);
                }

                Object improvementsObj = scoreData.get("improvements");
                if (improvementsObj instanceof List) {
                    answer.setImprovements((List<String>) improvementsObj);
                }

            } catch (Exception e) {
                log.error("Error scoring answer: {}", e.getMessage(), e);
                // Proceed without score - can be scored later
            }
        }

        answer = answerRepository.save(answer);

        // Mark question as answered
        question.setIsAnswered(true);
        questionRepository.save(question);

        // Update session answered count
        long answeredCount = answerRepository.countBySession(session);
        session.setAnsweredQuestions((int) answeredCount);
        sessionRepository.save(session);

        // Update user stats
        userRepository.incrementQuestionsAnswered(user.getId(), 1);

        // Update daily activity
        dailyActivityService.recordActivity(user, session, answer);

        // If score is low, add topic to weak topics
        if (answer.getScore() != null && answer.getScore() < 6 && question.getTopic() != null) {
            userService.updateWeakTopics(user.getId(), List.of(question.getTopic()));
        }

        // Recalculate user average score
        userService.recalculateAverageScore(user.getId());

        log.info("Answer submitted for question: {} by user: {}", question.getId(), email);
        return mapToResponse(answer);
    }

    @Transactional(readOnly = true)
    public List<AnswerResponse> getSessionAnswers(String email, UUID sessionId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Session does not belong to the user");
        }

        return answerRepository.findBySessionOrderByCreatedAtAsc(session)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AnswerResponse> getUserAnswers(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return answerRepository.findByUser(user)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public Double calculateSessionAverageScore(Session session) {
        return answerRepository.findAverageScoreBySession(session);
    }

    private AnswerResponse mapToResponse(Answer answer) {
        return AnswerResponse.builder()
                .id(answer.getId())
                .questionId(answer.getQuestion().getId())
                .sessionId(answer.getSession().getId())
                .answerText(answer.getAnswerText())
                .audioUrl(answer.getAudioUrl())
                .score(answer.getScore())
                .starSituation(answer.getStarSituation())
                .starTask(answer.getStarTask())
                .starAction(answer.getStarAction())
                .starResult(answer.getStarResult())
                .aiFeedback(answer.getAiFeedback())
                .strengths(answer.getStrengths())
                .improvements(answer.getImprovements())
                .timeTakenSeconds(answer.getTimeTakenSeconds())
                .isVoiceAnswer(answer.getIsVoiceAnswer())
                .createdAt(answer.getCreatedAt())
                .build();
    }

    private Integer toInt(Object value) {
        if (value == null) return null;
        if (value instanceof Integer) return (Integer) value;
        if (value instanceof Number) return ((Number) value).intValue();
        if (value instanceof String) {
            try { return Integer.parseInt((String) value); } catch (NumberFormatException e) { return null; }
        }
        return null;
    }
}
