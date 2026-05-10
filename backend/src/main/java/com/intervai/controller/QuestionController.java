package com.intervai.controller;

import com.intervai.dto.request.PredictQuestionsRequest;
import com.intervai.dto.response.QuestionResponse;
import com.intervai.exception.ApiResponse;
import com.intervai.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping("/sessions/{sessionId}/questions/generate")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> generateQuestions(
            @PathVariable UUID sessionId,
            @RequestParam(defaultValue = "5") int count,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<QuestionResponse> questions = questionService.generateQuestionsForSession(
                userDetails.getUsername(), sessionId, count);
        return ResponseEntity.ok(ApiResponse.success(questions, "Questions generated successfully"));
    }

    @GetMapping("/sessions/{sessionId}/questions")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getSessionQuestions(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<QuestionResponse> questions = questionService.getSessionQuestions(
                userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(ApiResponse.success(questions));
    }

    @PostMapping("/questions/predict")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> predictQuestions(
            @Valid @RequestBody PredictQuestionsRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<Map<String, Object>> questions = questionService.predictQuestionsFromJD(
                request.getJdText(),
                request.getRole(),
                request.getCompany(),
                request.getCount() != null ? request.getCount() : 10);
        return ResponseEntity.ok(ApiResponse.success(questions, "Questions predicted from job description"));
    }
}
