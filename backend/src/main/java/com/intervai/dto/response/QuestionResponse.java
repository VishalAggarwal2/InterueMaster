package com.intervai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionResponse {

    private UUID id;
    private UUID sessionId;
    private String questionText;
    private String questionType;
    private String topic;
    private String difficulty;
    private Integer orderIndex;
    private Integer expectedDurationSeconds;
    private String hint;
    private Boolean isAnswered;
}
