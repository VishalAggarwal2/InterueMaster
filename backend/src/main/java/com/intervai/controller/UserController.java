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
import java.util.Map;

@RestController
@RequestMapping("/users/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final HeatmapService heatmapService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<UserStatsResponse>> getStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserStatsResponse stats = userService.getUserStats(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserStatsResponse>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserStatsResponse stats = userService.getUserStats(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @PatchMapping("/profile")
    public ResponseEntity<ApiResponse<Void>> updateProfile(
            @RequestBody Map<String, Object> updates,
            @AuthenticationPrincipal UserDetails userDetails) {
        userService.updateProfile(userDetails.getUsername(), updates);
        return ResponseEntity.ok(ApiResponse.message("Profile updated successfully"));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Void>> updateProfilePut(
            @RequestBody Map<String, Object> updates,
            @AuthenticationPrincipal UserDetails userDetails) {
        userService.updateProfile(userDetails.getUsername(), updates);
        return ResponseEntity.ok(ApiResponse.message("Profile updated successfully"));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            @AuthenticationPrincipal UserDetails userDetails) {
        userService.deleteAccount(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.message("Account deleted"));
    }

    @GetMapping("/weak-topics")
    public ResponseEntity<ApiResponse<List<String>>> getWeakTopics(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<String> weakTopics = userService.getWeakTopics(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(weakTopics));
    }

    @GetMapping("/heatmap")
    public ResponseEntity<ApiResponse<HeatmapResponse>> getHeatmap(
            @RequestParam(defaultValue = "365") int days,
            @AuthenticationPrincipal UserDetails userDetails) {
        HeatmapResponse heatmap = heatmapService.getActivityHeatmap(userDetails.getUsername(), days);
        return ResponseEntity.ok(ApiResponse.success(heatmap));
    }

    @GetMapping("/topic-heatmap")
    public ResponseEntity<ApiResponse<List<UserStatsResponse.TopicScore>>> getTopicHeatmap(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserStatsResponse stats = userService.getUserStats(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(stats.getTopicBreakdown()));
    }

    @PostMapping("/resume")
    public ResponseEntity<ApiResponse<Void>> uploadResume(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        String resumeUrl = payload.get("resumeUrl");
        String resumeText = payload.get("resumeText");
        userService.saveResumeText(userDetails.getUsername(), resumeUrl, resumeText);
        return ResponseEntity.ok(ApiResponse.message("Resume saved successfully"));
    }
}
