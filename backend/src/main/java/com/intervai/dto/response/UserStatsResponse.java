package com.intervai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsResponse {

    private UUID userId;
    private String fullName;
    private String email;
    private String targetRole;
    private List<String> targetCompanies;
    private Integer experienceYears;
    private String plan;
    private String profilePictureUrl;
    private Integer dailyStreak;
    private Integer longestStreak;
    private Integer totalSessions;
    private Integer totalQuestionsAnswered;
    private BigDecimal averageScore;
    private List<String> weakTopics;
    private List<TopicScore> topicBreakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopicScore {
        private String topic;
        private Double averageScore;
        private Integer questionCount;
    }
}
