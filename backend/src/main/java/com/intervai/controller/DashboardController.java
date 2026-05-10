package com.intervai.controller;

import com.intervai.dto.response.HeatmapResponse;
import com.intervai.dto.response.UserStatsResponse;
import com.intervai.exception.ApiResponse;
import com.intervai.service.HeatmapService;
import com.intervai.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Convenience controller that exposes /dashboard/* aliases
 * so both old and new frontend paths work.
 * All logic delegates to UserService / HeatmapService.
 */
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final UserService userService;
    private final HeatmapService heatmapService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<UserStatsResponse>> getStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.getUserStats(userDetails.getUsername())));
    }

    @GetMapping("/score-history")
    public ResponseEntity<ApiResponse<UserStatsResponse>> getScoreHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.getUserStats(userDetails.getUsername())));
    }

    @GetMapping("/heatmap")
    public ResponseEntity<ApiResponse<HeatmapResponse>> getHeatmap(
            @RequestParam(defaultValue = "365") int days,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                heatmapService.getActivityHeatmap(userDetails.getUsername(), days)));
    }

    @GetMapping("/topic-heatmap")
    public ResponseEntity<ApiResponse<List<UserStatsResponse.TopicScore>>> getTopicHeatmap(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserStatsResponse stats = userService.getUserStats(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(stats.getTopicBreakdown()));
    }

    @GetMapping("/weak-topics")
    public ResponseEntity<ApiResponse<List<String>>> getWeakTopics(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.getWeakTopics(userDetails.getUsername())));
    }

    @GetMapping("/radar")
    public ResponseEntity<ApiResponse<UserStatsResponse>> getRadarData(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.getUserStats(userDetails.getUsername())));
    }
}
