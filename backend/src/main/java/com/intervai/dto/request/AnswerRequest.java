package com.intervai.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AnswerRequest {

    @NotNull(message = "Question ID is required")
    private UUID questionId;

    @NotNull(message = "Session ID is required")
    private UUID sessionId;

    private String answerText;
    private String audioUrl;
    private Integer timeTakenSeconds;
    private Boolean isVoiceAnswer;
}
