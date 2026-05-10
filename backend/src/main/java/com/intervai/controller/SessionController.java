package com.intervai.controller;

import com.intervai.dto.request.SessionRequest;
import com.intervai.dto.response.SessionResponse;
import com.intervai.exception.ApiResponse;
import com.intervai.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @PostMapping
    public ResponseEntity<ApiResponse<SessionResponse>> createSession(
            @Valid @RequestBody SessionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        SessionResponse response = sessionService.createSession(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Session created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<SessionResponse>>> getUserSessions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        Page<SessionResponse> sessions = sessionService.getUserSessions(userDetails.getUsername(), page, size);
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<SessionResponse>> getSession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        SessionResponse session = sessionService.getSession(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(ApiResponse.success(session));
    }

    @PostMapping("/{sessionId}/complete")
    public ResponseEntity<ApiResponse<SessionResponse>> completeSession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        SessionResponse session = sessionService.completeSession(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(ApiResponse.success(session, "Session completed"));
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        sessionService.deleteSession(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(ApiResponse.message("Session deleted successfully"));
    }
}
