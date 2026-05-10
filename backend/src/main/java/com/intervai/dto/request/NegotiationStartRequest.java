package com.intervai.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class NegotiationStartRequest {

    @NotBlank(message = "Role is required")
    private String role;

    private String company;
    private BigDecimal initialOffer;
    private BigDecimal targetSalary;
    private String contextNotes;
    private String aiPersona;
}
