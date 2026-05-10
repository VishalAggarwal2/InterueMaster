package com.intervai.controller;

import com.intervai.dto.response.ReportCardResponse;
import com.intervai.exception.ApiResponse;
import com.intervai.service.ReportCardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/report-cards")
@RequiredArgsConstructor
public class ReportCardController {

    private final ReportCardService reportCardService;

    @PostMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<ReportCardResponse>> generateReportCard(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        ReportCardResponse reportCard = reportCardService.generateReportCard(
                userDetails.getUsername(), sessionId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(reportCard, "Report card generated successfully"));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<ReportCardResponse>> getReportCardBySession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        ReportCardResponse reportCard = reportCardService.getReportCardBySession(
                userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(ApiResponse.success(reportCard));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReportCardResponse>>> getUserReportCards(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ReportCardResponse> reportCards = reportCardService.getUserReportCards(
                userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(reportCards));
    }

    @PostMapping("/{reportCardId}/share")
    public ResponseEntity<ApiResponse<ReportCardResponse>> shareReportCard(
            @PathVariable UUID reportCardId,
            @AuthenticationPrincipal UserDetails userDetails) {
        ReportCardResponse reportCard = reportCardService.shareReportCard(
                userDetails.getUsername(), reportCardId);
        return ResponseEntity.ok(ApiResponse.success(reportCard, "Report card shared successfully"));
    }

    @GetMapping("/share/{shareToken}")
    public ResponseEntity<ApiResponse<ReportCardResponse>> getSharedReportCard(
            @PathVariable String shareToken) {
        ReportCardResponse reportCard = reportCardService.getSharedReportCard(shareToken);
        return ResponseEntity.ok(ApiResponse.success(reportCard));
    }
}
