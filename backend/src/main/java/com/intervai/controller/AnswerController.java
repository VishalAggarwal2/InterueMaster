package com.intervai.controller;

import com.intervai.dto.request.AnswerRequest;
import com.intervai.dto.response.AnswerResponse;
import com.intervai.exception.ApiResponse;
import com.intervai.service.AnswerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/answers")
@RequiredArgsConstructor
public class AnswerController {

    private final AnswerService answerService;

    @PostMapping
    public ResponseEntity<ApiResponse<AnswerResponse>> submitAnswer(
            @Valid @RequestBody AnswerRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        AnswerResponse response = answerService.submitAnswer(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Answer submitted and scored successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AnswerResponse>>> getUserAnswers(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<AnswerResponse> answers = answerService.getUserAnswers(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(answers));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<List<AnswerResponse>>> getSessionAnswers(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<AnswerResponse> answers = answerService.getSessionAnswers(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(ApiResponse.success(answers));
    }
}
