package com.intervai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportCardResponse {

    private UUID id;
    private UUID sessionId;
    private String sessionTitle;
    private String sessionRole;
    private String sessionCompany;
    private BigDecimal overallScore;
    private BigDecimal communicationScore;
    private BigDecimal technicalScore;
    private BigDecimal problemSolvingScore;
    private BigDecimal starFrameworkScore;
    private BigDecimal confidenceScore;
    private List<String> strengths;
    private List<String> improvements;
    private List<String> weakTopics;
    private List<String> topTopics;
    private String aiSummary;
    private String hiringRecommendation;
    private String shareToken;
    private Boolean isShared;
    private OffsetDateTime sharedAt;
    private OffsetDateTime createdAt;
    private List<QuestionAnswerSummary> questionAnswers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionAnswerSummary {
        private UUID questionId;
        private String questionText;
        private String topic;
        private Integer score;
        private String aiFeedback;
        private Integer starSituation;
        private Integer starTask;
        private Integer starAction;
        private Integer starResult;
    }
}
