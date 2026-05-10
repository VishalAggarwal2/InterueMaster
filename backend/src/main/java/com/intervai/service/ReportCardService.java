package com.intervai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intervai.dto.response.ReportCardResponse;
import com.intervai.entity.*;
import com.intervai.exception.BadRequestException;
import com.intervai.exception.ResourceNotFoundException;
import com.intervai.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportCardService {

    private final ReportCardRepository reportCardRepository;
    private final SessionRepository sessionRepository;
    private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final ClaudeService claudeService;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    @Transactional
    public ReportCardResponse generateReportCard(String email, UUID sessionId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Session session = sessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        // Return existing if already generated
        Optional<ReportCard> existing = reportCardRepository.findBySessionId(sessionId);
        if (existing.isPresent()) {
            return mapToResponse(existing.get());
        }

        List<Answer> answers = answerRepository.findBySessionOrderByCreatedAtAsc(session);
        if (answers.isEmpty()) {
            throw new BadRequestException("No answers found for this session");
        }

        // Collect stats
        List<String> allStrengths = new ArrayList<>();
        List<String> allImprovements = new ArrayList<>();
        List<String> weakTopics = new ArrayList<>();
        List<String> topTopics = new ArrayList<>();
        Map<String, List<Integer>> topicScores = new HashMap<>();

        int totalScore = 0;
        int scoredAnswers = 0;

        for (Answer answer : answers) {
            if (answer.getScore() != null) {
                totalScore += answer.getScore();
                scoredAnswers++;

                String topic = answer.getQuestion().getTopic();
                if (topic != null) {
                    topicScores.computeIfAbsent(topic, k -> new ArrayList<>()).add(answer.getScore());
                }

                if (answer.getScore() < 6 && topic != null && !weakTopics.contains(topic)) {
                    weakTopics.add(topic);
                }
                if (answer.getScore() >= 7 && topic != null && !topTopics.contains(topic)) {
                    topTopics.add(topic);
                }
            }
            if (answer.getStrengths() != null) allStrengths.addAll(answer.getStrengths());
            if (answer.getImprovements() != null) allImprovements.addAll(answer.getImprovements());
        }

        BigDecimal overallScore = scoredAnswers > 0
                ? BigDecimal.valueOf((double) totalScore / scoredAnswers).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Deduplicate and limit lists
        allStrengths = deduplicateList(allStrengths, 5);
        allImprovements = deduplicateList(allImprovements, 5);
        weakTopics = deduplicateList(weakTopics, 5);
        topTopics = deduplicateList(topTopics, 5);

        // Generate AI summary
        String communicationScore = "7";
        String technicalScore = "7";
        String problemSolvingScore = "7";
        String starFrameworkScore = "7";
        String confidenceScore = "7";
        String aiSummary = "Interview completed successfully.";
        String hiringRecommendation = "HIRE";

        try {
            String summaryResponse = claudeService.generateReportCardSummary(
                    session.getRole(),
                    session.getCompany(),
                    overallScore.doubleValue(),
                    allStrengths,
                    weakTopics,
                    session.getTotalQuestions(),
                    answers.size());

            Map<String, Object> summaryData = objectMapper.readValue(
                    summaryResponse, new TypeReference<Map<String, Object>>() {});

            aiSummary = (String) summaryData.getOrDefault("aiSummary", aiSummary);
            hiringRecommendation = (String) summaryData.getOrDefault("hiringRecommendation", hiringRecommendation);
            communicationScore = String.valueOf(summaryData.getOrDefault("communicationScore", 7));
            technicalScore = String.valueOf(summaryData.getOrDefault("technicalScore", 7));
            problemSolvingScore = String.valueOf(summaryData.getOrDefault("problemSolvingScore", 7));
            starFrameworkScore = String.valueOf(summaryData.getOrDefault("starFrameworkScore", 7));
            confidenceScore = String.valueOf(summaryData.getOrDefault("confidenceScore", 7));
        } catch (Exception e) {
            log.error("Error generating AI summary: {}", e.getMessage(), e);
        }

        ReportCard reportCard = ReportCard.builder()
                .session(session)
                .user(user)
                .overallScore(overallScore)
                .communicationScore(parseBigDecimal(communicationScore))
                .technicalScore(parseBigDecimal(technicalScore))
                .problemSolvingScore(parseBigDecimal(problemSolvingScore))
                .starFrameworkScore(parseBigDecimal(starFrameworkScore))
                .confidenceScore(parseBigDecimal(confidenceScore))
                .strengths(allStrengths)
                .improvements(allImprovements)
                .weakTopics(weakTopics)
                .topTopics(topTopics)
                .aiSummary(aiSummary)
                .hiringRecommendation(hiringRecommendation)
                .isShared(false)
                .build();

        reportCard = reportCardRepository.save(reportCard);

        // Update session score
        session.setOverallScore(overallScore);
        sessionRepository.save(session);

        // Update user weak topics
        if (!weakTopics.isEmpty()) {
            userService.updateWeakTopics(user.getId(), weakTopics);
        }

        log.info("Report card generated for session: {}", sessionId);
        return mapToResponse(reportCard);
    }

    @Transactional
    public ReportCardResponse shareReportCard(String email, UUID reportCardId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        ReportCard reportCard = reportCardRepository.findById(reportCardId)
                .orElseThrow(() -> new ResourceNotFoundException("ReportCard", "id", reportCardId));

        if (!reportCard.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Report card does not belong to the user");
        }

        if (reportCard.getShareToken() == null) {
            reportCard.setShareToken(UUID.randomUUID().toString().replace("-", ""));
        }
        reportCard.setIsShared(true);
        reportCard.setSharedAt(OffsetDateTime.now());
        reportCard = reportCardRepository.save(reportCard);

        return mapToResponse(reportCard);
    }

    @Transactional(readOnly = true)
    public ReportCardResponse getSharedReportCard(String shareToken) {
        ReportCard reportCard = reportCardRepository.findByShareToken(shareToken)
                .orElseThrow(() -> new ResourceNotFoundException("ReportCard", "shareToken", shareToken));

        if (!reportCard.getIsShared()) {
            throw new BadRequestException("This report card is not shared");
        }

        return mapToResponse(reportCard);
    }

    @Transactional(readOnly = true)
    public ReportCardResponse getReportCardBySession(String email, UUID sessionId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        ReportCard reportCard = reportCardRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ReportCard", "sessionId", sessionId));

        if (!reportCard.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Report card does not belong to the user");
        }

        return mapToResponse(reportCard);
    }

    @Transactional(readOnly = true)
    public List<ReportCardResponse> getUserReportCards(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return reportCardRepository.findByUserOrderByCreatedAtDesc(user)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private ReportCardResponse mapToResponse(ReportCard reportCard) {
        Session session = reportCard.getSession();

        // Fetch Q&A summaries
        List<Answer> answers = answerRepository.findBySessionOrderByCreatedAtAsc(session);
        List<ReportCardResponse.QuestionAnswerSummary> qaSummaries = answers.stream()
                .map(a -> ReportCardResponse.QuestionAnswerSummary.builder()
                        .questionId(a.getQuestion().getId())
                        .questionText(a.getQuestion().getQuestionText())
                        .topic(a.getQuestion().getTopic())
                        .score(a.getScore())
                        .aiFeedback(a.getAiFeedback())
                        .starSituation(a.getStarSituation())
                        .starTask(a.getStarTask())
                        .starAction(a.getStarAction())
                        .starResult(a.getStarResult())
                        .build())
                .collect(Collectors.toList());

        return ReportCardResponse.builder()
                .id(reportCard.getId())
                .sessionId(session.getId())
                .sessionTitle(session.getTitle())
                .sessionRole(session.getRole())
                .sessionCompany(session.getCompany())
                .overallScore(reportCard.getOverallScore())
                .communicationScore(reportCard.getCommunicationScore())
                .technicalScore(reportCard.getTechnicalScore())
                .problemSolvingScore(reportCard.getProblemSolvingScore())
                .starFrameworkScore(reportCard.getStarFrameworkScore())
                .confidenceScore(reportCard.getConfidenceScore())
                .strengths(reportCard.getStrengths())
                .improvements(reportCard.getImprovements())
                .weakTopics(reportCard.getWeakTopics())
                .topTopics(reportCard.getTopTopics())
                .aiSummary(reportCard.getAiSummary())
                .hiringRecommendation(reportCard.getHiringRecommendation())
                .shareToken(reportCard.getShareToken())
                .isShared(reportCard.getIsShared())
                .sharedAt(reportCard.getSharedAt())
                .createdAt(reportCard.getCreatedAt())
                .questionAnswers(qaSummaries)
                .build();
    }

    private List<String> deduplicateList(List<String> list, int maxSize) {
        return list.stream().distinct().limit(maxSize).collect(Collectors.toList());
    }

    private BigDecimal parseBigDecimal(String value) {
        try {
            double d = Double.parseDouble(value);
            return BigDecimal.valueOf(d).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            return BigDecimal.valueOf(7.0).setScale(2, RoundingMode.HALF_UP);
        }
    }
}
