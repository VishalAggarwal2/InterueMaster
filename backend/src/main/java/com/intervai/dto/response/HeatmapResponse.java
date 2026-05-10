package com.intervai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeatmapResponse {

    private List<HeatmapDay> days;
    private int totalActiveDays;
    private int currentStreak;
    private int longestStreak;
    private BigDecimal averageScore;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HeatmapDay {
        private LocalDate date;
        private int sessionsCount;
        private int questionsAnswered;
        private BigDecimal averageScore;
        private int intensity; // 0-4 for color coding
    }
}
