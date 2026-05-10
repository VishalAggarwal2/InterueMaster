package com.intervai.controller;

import com.intervai.dto.response.RecordingResponse;
import com.intervai.exception.ApiResponse;
import com.intervai.service.RecordingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/recordings")
@RequiredArgsConstructor
public class RecordingController {

    private final RecordingService recordingService;

    @PostMapping("/upload-url")
    public ResponseEntity<ApiResponse<RecordingResponse>> getUploadUrl(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID sessionId = UUID.fromString((String) request.get("sessionId"));
        String answerIdStr = (String) request.get("answerId");
        UUID answerId = answerIdStr != null ? UUID.fromString(answerIdStr) : null;
        String mimeType = (String) request.getOrDefault("mimeType", "video/webm");

        RecordingResponse response = recordingService.generateUploadUrl(
                userDetails.getUsername(), sessionId, answerId, mimeType);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Upload URL generated"));
    }

    @PostMapping("/{recordingId}/confirm")
    public ResponseEntity<ApiResponse<RecordingResponse>> confirmUpload(
            @PathVariable UUID recordingId,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long fileSizeBytes = request.get("fileSizeBytes") != null
                ? Long.valueOf(request.get("fileSizeBytes").toString()) : null;
        Integer durationSeconds = request.get("durationSeconds") != null
                ? Integer.valueOf(request.get("durationSeconds").toString()) : null;

        RecordingResponse response = recordingService.confirmUpload(
                userDetails.getUsername(), recordingId, fileSizeBytes, durationSeconds);
        return ResponseEntity.ok(ApiResponse.success(response, "Recording confirmed"));
    }

    @GetMapping("/{recordingId}/download-url")
    public ResponseEntity<ApiResponse<String>> getDownloadUrl(
            @PathVariable UUID recordingId,
            @AuthenticationPrincipal UserDetails userDetails) {
        String url = recordingService.getDownloadUrl(userDetails.getUsername(), recordingId);
        return ResponseEntity.ok(ApiResponse.success(url));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<List<RecordingResponse>>> getSessionRecordings(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<RecordingResponse> recordings = recordingService.getSessionRecordings(
                userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(ApiResponse.success(recordings));
    }
}
