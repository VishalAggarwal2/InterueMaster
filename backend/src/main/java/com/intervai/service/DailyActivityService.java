package com.intervai.service;

import com.intervai.entity.Answer;
import com.intervai.entity.DailyActivity;
import com.intervai.entity.Session;
import com.intervai.entity.User;
import com.intervai.repository.DailyActivityRepository;
import com.intervai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DailyActivityService {

    private final DailyActivityRepository dailyActivityRepository;
    private final UserRepository userRepository;

    @Transactional
    public void recordActivity(User user, Session session, Answer answer) {
        LocalDate today = LocalDate.now();

        DailyActivity activity = dailyActivityRepository
                .findByUserAndActivityDate(user, today)
                .orElse(DailyActivity.builder()
                        .user(user)
                        .activityDate(today)
                        .sessionsCount(0)
                        .questionsAnswered(0)
                        .averageScore(BigDecimal.ZERO)
                        .topicsCovered(new ArrayList<>())
                        .build());

        activity.setQuestionsAnswered(activity.getQuestionsAnswered() + 1);

        if (answer.getScore() != null) {
            // Recalculate rolling average
            int prevCount = activity.getQuestionsAnswered() - 1;
            BigDecimal prevTotal = activity.getAverageScore().multiply(BigDecimal.valueOf(prevCount));
            BigDecimal newTotal = prevTotal.add(BigDecimal.valueOf(answer.getScore()));
            BigDecimal newAvg = activity.getQuestionsAnswered() > 0
                    ? newTotal.divide(BigDecimal.valueOf(activity.getQuestionsAnswered()), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            activity.setAverageScore(newAvg);
        }

        // Add topic if not already present
        if (answer.getQuestion().getTopic() != null) {
            List<String> topics = activity.getTopicsCovered() != null
                    ? new ArrayList<>(activity.getTopicsCovered()) : new ArrayList<>();
            if (!topics.contains(answer.getQuestion().getTopic())) {
                topics.add(answer.getQuestion().getTopic());
                activity.setTopicsCovered(topics);
            }
        }

        dailyActivityRepository.save(activity);

        // Update user streak
        updateStreak(user, today);
    }

    @Transactional
    public void recordSessionActivity(User user) {
        LocalDate today = LocalDate.now();

        DailyActivity activity = dailyActivityRepository
                .findByUserAndActivityDate(user, today)
                .orElse(DailyActivity.builder()
                        .user(user)
                        .activityDate(today)
                        .sessionsCount(0)
                        .questionsAnswered(0)
                        .averageScore(BigDecimal.ZERO)
                        .topicsCovered(new ArrayList<>())
                        .build());

        activity.setSessionsCount(activity.getSessionsCount() + 1);
        dailyActivityRepository.save(activity);
    }

    private void updateStreak(User user, LocalDate today) {
        LocalDate lastActivity = user.getLastActivityDate();

        if (lastActivity == null) {
            user.setDailyStreak(1);
            user.setLongestStreak(1);
        } else if (lastActivity.equals(today)) {
            // Same day, no change
        } else if (lastActivity.equals(today.minusDays(1))) {
            // Consecutive day - increment streak
            int newStreak = user.getDailyStreak() + 1;
            user.setDailyStreak(newStreak);
            if (newStreak > user.getLongestStreak()) {
                user.setLongestStreak(newStreak);
            }
        } else {
            // Streak broken - reset
            user.setDailyStreak(1);
        }

        user.setLastActivityDate(today);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<DailyActivity> getUserActivityForPeriod(User user, LocalDate startDate, LocalDate endDate) {
        return dailyActivityRepository.findByUserAndActivityDateBetweenOrderByActivityDateAsc(
                user, startDate, endDate);
    }
}
