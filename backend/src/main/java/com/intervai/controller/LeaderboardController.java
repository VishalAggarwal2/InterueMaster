package com.intervai.controller;

import com.intervai.entity.User;
import com.intervai.exception.ApiResponse;
import com.intervai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLeaderboard(
            @RequestParam(defaultValue = "score") String type,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal UserDetails userDetails) {

        List<User> topUsers;
        if ("streak".equalsIgnoreCase(type)) {
            topUsers = userRepository.findTopUsersByStreak(Math.min(limit, 50));
        } else {
            topUsers = userRepository.findTopUsersByScore(Math.min(limit, 50));
        }

        List<Map<String, Object>> leaderboard = new ArrayList<>();
        for (int i = 0; i < topUsers.size(); i++) {
            User user = topUsers.get(i);
            Map<String, Object> entry = new HashMap<>();
            entry.put("rank", i + 1);
            entry.put("userId", user.getId());
            entry.put("fullName", user.getFullName());
            entry.put("profilePictureUrl", user.getProfilePictureUrl());
            entry.put("targetRole", user.getTargetRole());
            entry.put("averageScore", user.getAverageScore());
            entry.put("totalSessions", user.getTotalSessions());
            entry.put("dailyStreak", user.getDailyStreak());
            entry.put("totalQuestionsAnswered", user.getTotalQuestionsAnswered());

            // Flag if this is the current user
            if (userDetails != null && user.getEmail().equals(userDetails.getUsername())) {
                entry.put("isCurrentUser", true);
            } else {
                entry.put("isCurrentUser", false);
            }

            leaderboard.add(entry);
        }

        return ResponseEntity.ok(ApiResponse.success(leaderboard));
    }

    @GetMapping("/my-rank")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyRank(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<User> allUsers = userRepository.findTopUsersByScore(1000);
        Map<String, Object> result = new HashMap<>();

        for (int i = 0; i < allUsers.size(); i++) {
            if (allUsers.get(i).getEmail().equals(userDetails.getUsername())) {
                result.put("rank", i + 1);
                result.put("totalUsers", allUsers.size());
                result.put("averageScore", allUsers.get(i).getAverageScore());
                result.put("totalSessions", allUsers.get(i).getTotalSessions());
                result.put("dailyStreak", allUsers.get(i).getDailyStreak());
                break;
            }
        }

        if (result.isEmpty()) {
            result.put("rank", -1);
            result.put("message", "Complete at least one session to appear on the leaderboard");
        }

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
