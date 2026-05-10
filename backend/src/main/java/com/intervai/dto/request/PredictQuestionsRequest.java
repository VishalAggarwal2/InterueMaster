package com.intervai.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PredictQuestionsRequest {

    @NotBlank(message = "Job description is required")
    private String jdText;

    private String role;
    private String company;
    private Integer count;
}
