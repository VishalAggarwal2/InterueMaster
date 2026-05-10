package com.intervai.controller;

import com.intervai.exception.ApiResponse;
import com.intervai.service.DailyQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/daily-question")
@RequiredArgsConstructor
public class DailyQuestionController {

    private final DailyQuestionService dailyQuestionService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDailyQuestion(
            @AuthenticationPrincipal UserDetails userDetails) {
        Map<String, Object> question = dailyQuestionService.getDailyQuestion(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(question));
    }

    @PostMapping("/answer")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitAnswer(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String answerText = request.get("answerText");
        Map<String, Object> response = dailyQuestionService.submitDailyAnswer(
                userDetails.getUsername(), answerText);
        return ResponseEntity.ok(ApiResponse.success(response, "Daily answer submitted and scored"));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDailyHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<Map<String, Object>> history = dailyQuestionService.getUserDailyHistory(
                userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
