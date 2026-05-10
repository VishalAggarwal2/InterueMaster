package com.intervai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intervai.dto.request.AnswerRequest;
import com.intervai.entity.DailyQuestionAnswer;
import com.intervai.entity.User;
import com.intervai.exception.BadRequestException;
import com.intervai.exception.ResourceNotFoundException;
import com.intervai.repository.DailyQuestionAnswerRepository;
import com.intervai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DailyQuestionService {

    private final DailyQuestionAnswerRepository dailyQuestionAnswerRepository;
    private final UserRepository userRepository;
    private final ClaudeService claudeService;
    private final RedisService redisService;
    private final ObjectMapper objectMapper;

    private static final List<String> QUESTION_TOPICS = Arrays.asList(
            "Leadership", "Problem Solving", "Teamwork", "Communication",
            "Technical Skills", "System Design", "Algorithms", "Behavioral",
            "Conflict Resolution", "Innovation", "Time Management", "Adaptability");

    @Transactional
    public Map<String, Object> getDailyQuestion(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        LocalDate today = LocalDate.now();
        Optional<DailyQuestionAnswer> existing = dailyQuestionAnswerRepository.findByUserAndQuestionDate(user, today);

        if (existing.isPresent()) {
            return mapToResponse(existing.get());
        }

        // Generate or get cached daily question
        String todayStr = today.toString();
        Optional<String> cachedQuestion = redisService.getCachedDailyQuestion(todayStr);

        Map<String, Object> questionData;
        if (cachedQuestion.isPresent()) {
            try {
                questionData = objectMapper.readValue(cachedQuestion.get(), new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                questionData = generateNewDailyQuestion();
            }
        } else {
            questionData = generateNewDailyQuestion();
            try {
                String json = objectMapper.writeValueAsString(questionData);
                redisService.cacheDailyQuestion(todayStr, json);
            } catch (Exception e) {
                log.error("Error caching daily question: {}", e.getMessage());
            }
        }

        DailyQuestionAnswer dqa = DailyQuestionAnswer.builder()
                .user(user)
                .questionDate(today)
                .questionText((String) questionData.getOrDefault("questionText", "Describe a challenge you overcame."))
                .questionTopic((String) questionData.getOrDefault("topic", "Behavioral"))
                .questionDifficulty((String) questionData.getOrDefault("difficulty", "MEDIUM"))
                .isAnswered(false)
                .build();

        dqa = dailyQuestionAnswerRepository.save(dqa);
        return mapToResponse(dqa);
    }

    @Transactional
    public Map<String, Object> submitDailyAnswer(String email, String answerText) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        LocalDate today = LocalDate.now();
        DailyQuestionAnswer dqa = dailyQuestionAnswerRepository.findByUserAndQuestionDate(user, today)
                .orElseThrow(() -> new ResourceNotFoundException("DailyQuestionAnswer", "date", today));

        if (dqa.getIsAnswered()) {
            throw new BadRequestException("Daily question already answered for today");
        }

        if (answerText == null || answerText.isBlank()) {
            throw new BadRequestException("Answer text is required");
        }

        dqa.setAnswerText(answerText);
        dqa.setIsAnswered(true);
        dqa.setAnsweredAt(OffsetDateTime.now());

        // Score with Claude
        try {
            String scoringResponse = claudeService.scoreAnswer(
                    dqa.getQuestionText(), answerText, "General", dqa.getQuestionTopic());
            Map<String, Object> scoreData = objectMapper.readValue(
                    scoringResponse, new TypeReference<Map<String, Object>>() {});

            Object score = scoreData.get("score");
            if (score instanceof Number) {
                dqa.setScore(((Number) score).intValue());
            }
            dqa.setAiFeedback((String) scoreData.get("aiFeedback"));
        } catch (Exception e) {
            log.error("Error scoring daily answer: {}", e.getMessage(), e);
        }

        dqa = dailyQuestionAnswerRepository.save(dqa);
        return mapToResponse(dqa);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserDailyHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return dailyQuestionAnswerRepository.findByUserOrderByQuestionDateDesc(user)
                .stream().map(this::mapToResponse).collect(java.util.stream.Collectors.toList());
    }

    @Scheduled(cron = "0 0 6 * * *") // 6 AM daily
    public void sendDailyQuestionEmails() {
        log.info("Daily question email scheduling triggered");
        // Email sending is handled by EmailService; this pre-generates the question
        LocalDate today = LocalDate.now();
        String todayStr = today.toString();
        if (!redisService.getCachedDailyQuestion(todayStr).isPresent()) {
            Map<String, Object> question = generateNewDailyQuestion();
            try {
                String json = objectMapper.writeValueAsString(question);
                redisService.cacheDailyQuestion(todayStr, json);
                log.info("Daily question generated and cached for: {}", todayStr);
            } catch (Exception e) {
                log.error("Error caching scheduled daily question: {}", e.getMessage());
            }
        }
    }

    private Map<String, Object> generateNewDailyQuestion() {
        // Pick a topic based on day of year for variety
        int dayOfYear = LocalDate.now().getDayOfYear();
        String topic = QUESTION_TOPICS.get(dayOfYear % QUESTION_TOPICS.size());
        String[] difficulties = {"EASY", "MEDIUM", "HARD"};
        String difficulty = difficulties[dayOfYear % 3];

        try {
            String response = claudeService.generateDailyQuestion(topic, difficulty);
            return objectMapper.readValue(response, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.error("Error generating daily question from Claude: {}", e.getMessage(), e);
            return getFallbackQuestion(topic, difficulty);
        }
    }

    private Map<String, Object> getFallbackQuestion(String topic, String difficulty) {
        Map<String, Object> question = new HashMap<>();
        question.put("questionText", "Describe a time when you demonstrated strong " + topic.toLowerCase() + " skills. What was the situation and what was the outcome?");
        question.put("topic", topic);
        question.put("difficulty", difficulty);
        question.put("sampleAnswer", "Use the STAR framework to structure your response: describe the Situation, your Task, the Actions you took, and the Results achieved.");
        return question;
    }

    private Map<String, Object> mapToResponse(DailyQuestionAnswer dqa) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", dqa.getId());
        response.put("questionDate", dqa.getQuestionDate());
        response.put("questionText", dqa.getQuestionText());
        response.put("questionTopic", dqa.getQuestionTopic());
        response.put("questionDifficulty", dqa.getQuestionDifficulty());
        response.put("isAnswered", dqa.getIsAnswered());
        response.put("answerText", dqa.getAnswerText());
        response.put("score", dqa.getScore());
        response.put("aiFeedback", dqa.getAiFeedback());
        response.put("answeredAt", dqa.getAnsweredAt());
        return response;
    }
}
