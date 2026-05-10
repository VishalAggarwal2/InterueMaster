package com.intervai.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SessionRequest {

    @NotBlank(message = "Role is required")
    private String role;

    private String company;
    private String difficulty;
    private String interviewType;
    private String mode;
    private String title;
    private Boolean isTimed;
    private Integer timeLimitSeconds;
    private String jdText;
    private Integer questionCount;
    private String notes;
}
