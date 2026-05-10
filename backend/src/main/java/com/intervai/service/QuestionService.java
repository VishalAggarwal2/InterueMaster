package com.intervai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intervai.dto.response.QuestionResponse;
import com.intervai.entity.Question;
import com.intervai.entity.Session;
import com.intervai.entity.User;
import com.intervai.exception.ResourceNotFoundException;
import com.intervai.repository.QuestionRepository;
import com.intervai.repository.SessionRepository;
import com.intervai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final ClaudeService claudeService;
    private final ObjectMapper objectMapper;

    @Transactional
    public List<QuestionResponse> generateQuestionsForSession(String email, UUID sessionId, int count) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Session session = sessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        // Check if questions already exist
        List<Question> existingQuestions = questionRepository.findBySessionOrderByOrderIndexAsc(session);
        if (!existingQuestions.isEmpty()) {
            return existingQuestions.stream().map(this::mapToResponse).collect(Collectors.toList());
        }

        int questionCount = Math.max(1, Math.min(count, 15));

        try {
            String claudeResponse = claudeService.generateInterviewQuestions(
                    session.getRole(),
                    session.getCompany(),
                    session.getDifficulty(),
                    session.getInterviewType(),
                    questionCount,
                    session.getJdText(),
                    user.getResumeText(),
                    user.getWeakTopics());

            List<Map<String, Object>> questionMaps = objectMapper.readValue(
                    claudeResponse, new TypeReference<List<Map<String, Object>>>() {});

            List<Question> questions = new ArrayList<>();
            for (int i = 0; i < questionMaps.size(); i++) {
                Map<String, Object> qMap = questionMaps.get(i);
                Question question = Question.builder()
                        .session(session)
                        .questionText((String) qMap.getOrDefault("questionText", ""))
                        .questionType((String) qMap.getOrDefault("questionType", "BEHAVIORAL"))
                        .topic((String) qMap.get("topic"))
                        .difficulty((String) qMap.getOrDefault("difficulty", session.getDifficulty()))
                        .orderIndex(i)
                        .expectedDurationSeconds((Integer) qMap.getOrDefault("expectedDurationSeconds", 120))
                        .hint((String) qMap.get("hint"))
                        .isAnswered(false)
                        .build();
                questions.add(question);
            }

            questions = questionRepository.saveAll(questions);

            // Update session total questions count
            session.setTotalQuestions(questions.size());
            sessionRepository.save(session);

            log.info("Generated {} questions for session: {}", questions.size(), sessionId);
            return questions.stream().map(this::mapToResponse).collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error generating questions for session {}: {}", sessionId, e.getMessage(), e);
            // Fallback: generate basic questions
            return generateFallbackQuestions(session, questionCount);
        }
    }

    @Transactional(readOnly = true)
    public List<QuestionResponse> getSessionQuestions(String email, UUID sessionId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Session session = sessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        return questionRepository.findBySessionOrderByOrderIndexAsc(session)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<Map<String, Object>> predictQuestionsFromJD(String jdText, String role, String company, int count) {
        try {
            String response = claudeService.predictQuestionsFromJD(jdText, role, company, count);
            return objectMapper.readValue(response, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            log.error("Error predicting questions from JD: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to predict questions: " + e.getMessage());
        }
    }

    private List<QuestionResponse> generateFallbackQuestions(Session session, int count) {
        List<String> fallbackQuestions = Arrays.asList(
                "Tell me about yourself and your experience.",
                "What are your greatest strengths and weaknesses?",
                "Describe a challenging project you worked on.",
                "Where do you see yourself in 5 years?",
                "Why are you interested in this role?",
                "How do you handle tight deadlines?",
                "Describe a time you resolved a conflict at work.",
                "What is your approach to problem-solving?",
                "Tell me about a time you showed leadership.",
                "Why do you want to leave your current job?"
        );

        List<Question> questions = new ArrayList<>();
        for (int i = 0; i < Math.min(count, fallbackQuestions.size()); i++) {
            Question q = Question.builder()
                    .session(session)
                    .questionText(fallbackQuestions.get(i))
                    .questionType("BEHAVIORAL")
                    .topic("General")
                    .difficulty(session.getDifficulty())
                    .orderIndex(i)
                    .expectedDurationSeconds(120)
                    .isAnswered(false)
                    .build();
            questions.add(q);
        }

        questions = questionRepository.saveAll(questions);
        session.setTotalQuestions(questions.size());
        sessionRepository.save(session);

        return questions.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public QuestionResponse mapToResponse(Question question) {
        return QuestionResponse.builder()
                .id(question.getId())
                .sessionId(question.getSession().getId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .topic(question.getTopic())
                .difficulty(question.getDifficulty())
                .orderIndex(question.getOrderIndex())
                .expectedDurationSeconds(question.getExpectedDurationSeconds())
                .hint(question.getHint())
                .isAnswered(question.getIsAnswered())
                .build();
    }
}
