package com.intervai.service;

import com.intervai.dto.response.UserStatsResponse;
import com.intervai.entity.User;
import com.intervai.exception.ResourceNotFoundException;
import com.intervai.repository.AnswerRepository;
import com.intervai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final AnswerRepository answerRepository;

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    @Transactional(readOnly = true)
    public UserStatsResponse getUserStats(String email) {
        User user = getUserByEmail(email);

        List<Object[]> topicScores = answerRepository.findAverageScoreByTopicForUser(user);
        List<UserStatsResponse.TopicScore> topicBreakdown = topicScores.stream()
                .map(row -> UserStatsResponse.TopicScore.builder()
                        .topic((String) row[0])
                        .averageScore(row[1] != null ? ((Number) row[1]).doubleValue() : 0.0)
                        .build())
                .collect(Collectors.toList());

        return UserStatsResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .targetRole(user.getTargetRole())
                .targetCompanies(user.getTargetCompanies())
                .experienceYears(user.getExperienceYears())
                .plan(user.getPlan())
                .profilePictureUrl(user.getProfilePictureUrl())
                .dailyStreak(user.getDailyStreak())
                .longestStreak(user.getLongestStreak())
                .totalSessions(user.getTotalSessions())
                .totalQuestionsAnswered(user.getTotalQuestionsAnswered())
                .averageScore(user.getAverageScore())
                .weakTopics(user.getWeakTopics() != null ? user.getWeakTopics() : new ArrayList<>())
                .topicBreakdown(topicBreakdown)
                .build();
    }

    @Transactional
    public User updateProfile(String email, Map<String, Object> updates) {
        User user = getUserByEmail(email);

        if (updates.containsKey("fullName")) {
            user.setFullName((String) updates.get("fullName"));
        }
        if (updates.containsKey("targetRole")) {
            user.setTargetRole((String) updates.get("targetRole"));
        }
        if (updates.containsKey("targetCompanies")) {
            Object companies = updates.get("targetCompanies");
            if (companies instanceof List) {
                user.setTargetCompanies((List<String>) companies);
            }
        }
        if (updates.containsKey("experienceYears")) {
            Object years = updates.get("experienceYears");
            if (years instanceof Integer) {
                user.setExperienceYears((Integer) years);
            }
        }
        if (updates.containsKey("profilePictureUrl")) {
            user.setProfilePictureUrl((String) updates.get("profilePictureUrl"));
        }
        if (updates.containsKey("emailNotificationsEnabled")) {
            Object enabled = updates.get("emailNotificationsEnabled");
            if (enabled instanceof Boolean) {
                user.setEmailNotificationsEnabled((Boolean) enabled);
            }
        }

        return userRepository.save(user);
    }

    @Transactional
    public List<String> getWeakTopics(String email) {
        User user = getUserByEmail(email);
        return user.getWeakTopics() != null ? user.getWeakTopics() : new ArrayList<>();
    }

    @Transactional
    public void updateWeakTopics(UUID userId, List<String> weakTopics) {
        User user = getUserById(userId);
        List<String> current = user.getWeakTopics() != null ? new ArrayList<>(user.getWeakTopics()) : new ArrayList<>();

        for (String topic : weakTopics) {
            if (!current.contains(topic)) {
                current.add(topic);
            }
        }

        // Keep only the most recent 10 weak topics
        if (current.size() > 10) {
            current = current.subList(current.size() - 10, current.size());
        }

        user.setWeakTopics(current);
        userRepository.save(user);
    }

    @Transactional
    public void saveResumeText(String email, String resumeUrl, String resumeText) {
        User user = getUserByEmail(email);
        user.setResumeUrl(resumeUrl);
        user.setResumeText(resumeText);
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(String email) {
        User user = getUserByEmail(email);
        user.setIsActive(false);
        userRepository.save(user);
    }

    @Transactional
    public void recalculateAverageScore(UUID userId) {
        User user = getUserById(userId);
        Double avgScore = answerRepository.findAverageScoreByUser(user);
        if (avgScore != null) {
            user.setAverageScore(new java.math.BigDecimal(String.format("%.2f", avgScore)));
            userRepository.save(user);
        }
    }
}
