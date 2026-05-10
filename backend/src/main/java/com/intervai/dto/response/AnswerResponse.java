package com.intervai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerResponse {

    private UUID id;
    private UUID questionId;
    private UUID sessionId;
    private String answerText;
    private String audioUrl;
    private Integer score;
    private Integer starSituation;
    private Integer starTask;
    private Integer starAction;
    private Integer starResult;
    private String aiFeedback;
    private List<String> strengths;
    private List<String> improvements;
    private Integer timeTakenSeconds;
    private Boolean isVoiceAnswer;
    private OffsetDateTime createdAt;
}
