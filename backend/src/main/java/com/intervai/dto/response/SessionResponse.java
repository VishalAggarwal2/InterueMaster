package com.intervai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {

    private UUID id;
    private String title;
    private String role;
    private String company;
    private String difficulty;
    private String interviewType;
    private String mode;
    private String status;
    private Integer totalQuestions;
    private Integer answeredQuestions;
    private BigDecimal overallScore;
    private Integer durationSeconds;
    private Boolean isTimed;
    private Integer timeLimitSeconds;
    private String jdText;
    private String notes;
    private OffsetDateTime startedAt;
    private OffsetDateTime completedAt;
    private OffsetDateTime createdAt;
}
