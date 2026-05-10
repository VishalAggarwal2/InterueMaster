package com.intervai.service;

import com.intervai.dto.response.HeatmapResponse;
import com.intervai.entity.DailyActivity;
import com.intervai.entity.User;
import com.intervai.exception.ResourceNotFoundException;
import com.intervai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HeatmapService {

    private final UserRepository userRepository;
    private final DailyActivityService dailyActivityService;

    @Transactional(readOnly = true)
    public HeatmapResponse getActivityHeatmap(String email, int days) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);

        List<DailyActivity> activities = dailyActivityService.getUserActivityForPeriod(
                user, startDate, endDate);

        Map<LocalDate, DailyActivity> activityMap = activities.stream()
                .collect(Collectors.toMap(DailyActivity::getActivityDate, a -> a));

        List<HeatmapResponse.HeatmapDay> heatmapDays = new ArrayList<>();
        int activeDays = 0;

        // Find max sessions for intensity calculation
        int maxSessions = activities.stream()
                .mapToInt(DailyActivity::getSessionsCount)
                .max()
                .orElse(1);

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            DailyActivity activity = activityMap.get(date);
            int sessionsCount = activity != null ? activity.getSessionsCount() : 0;
            int questionsAnswered = activity != null ? activity.getQuestionsAnswered() : 0;
            BigDecimal avgScore = activity != null ? activity.getAverageScore() : BigDecimal.ZERO;

            if (sessionsCount > 0 || questionsAnswered > 0) {
                activeDays++;
            }

            // Calculate intensity (0-4 for GitHub-style heatmap)
            int intensity = calculateIntensity(questionsAnswered, maxSessions);

            heatmapDays.add(HeatmapResponse.HeatmapDay.builder()
                    .date(date)
                    .sessionsCount(sessionsCount)
                    .questionsAnswered(questionsAnswered)
                    .averageScore(avgScore)
                    .intensity(intensity)
                    .build());
        }

        // Calculate overall average
        BigDecimal overallAvg = activities.stream()
                .filter(a -> a.getAverageScore() != null && a.getAverageScore().compareTo(BigDecimal.ZERO) > 0)
                .map(DailyActivity::getAverageScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long activeDaysWithScore = activities.stream()
                .filter(a -> a.getAverageScore() != null && a.getAverageScore().compareTo(BigDecimal.ZERO) > 0)
                .count();

        BigDecimal avgScore = activeDaysWithScore > 0
                ? overallAvg.divide(BigDecimal.valueOf(activeDaysWithScore), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return HeatmapResponse.builder()
                .days(heatmapDays)
                .totalActiveDays(activeDays)
                .currentStreak(user.getDailyStreak())
                .longestStreak(user.getLongestStreak())
                .averageScore(avgScore)
                .build();
    }

    private int calculateIntensity(int questionsAnswered, int maxSessions) {
        if (questionsAnswered == 0) return 0;
        if (maxSessions <= 0) return 1;
        double ratio = (double) questionsAnswered / Math.max(maxSessions, 10);
        if (ratio >= 0.75) return 4;
        if (ratio >= 0.50) return 3;
        if (ratio >= 0.25) return 2;
        return 1;
    }
}
