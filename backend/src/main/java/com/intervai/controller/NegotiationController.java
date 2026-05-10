package com.intervai.controller;

import com.intervai.dto.request.NegotiationMessageRequest;
import com.intervai.dto.request.NegotiationStartRequest;
import com.intervai.entity.NegotiationMessage;
import com.intervai.entity.NegotiationSession;
import com.intervai.exception.ApiResponse;
import com.intervai.service.NegotiationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/negotiation")
@RequiredArgsConstructor
public class NegotiationController {

    private final NegotiationService negotiationService;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<Map<String, Object>>> startNegotiation(
            @Valid @RequestBody NegotiationStartRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Map<String, Object> response = negotiationService.startNegotiation(
                userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Negotiation session started"));
    }

    @PostMapping("/message")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendMessage(
            @Valid @RequestBody NegotiationMessageRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Map<String, Object> response = negotiationService.sendMessage(
                userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{sessionId}/message")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendMessageById(
            @PathVariable UUID sessionId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        NegotiationMessageRequest request = new NegotiationMessageRequest();
        request.setSessionId(sessionId);
        request.setContent((String) body.get("content"));
        if (body.get("offer") != null) {
            request.setOfferAmount(new BigDecimal(body.get("offer").toString()));
        }
        Map<String, Object> response = negotiationService.sendMessage(
                userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<ApiResponse<Map<String, Object>>> endNegotiation(
            @PathVariable UUID sessionId,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails userDetails) {

        BigDecimal finalOffer = request.get("finalOffer") != null
                ? new BigDecimal(request.get("finalOffer").toString()) : null;
        String outcome = (String) request.getOrDefault("outcome", "COMPLETED");

        Map<String, Object> response = negotiationService.endNegotiation(
                userDetails.getUsername(), sessionId, finalOffer, outcome);
        return ResponseEntity.ok(ApiResponse.success(response, "Negotiation session ended"));
    }

    @GetMapping("/{sessionId}/messages")
    public ResponseEntity<ApiResponse<List<NegotiationMessage>>> getMessages(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<NegotiationMessage> messages = negotiationService.getSessionMessages(
                userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<NegotiationSession>>> getUserSessions(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<NegotiationSession> sessions = negotiationService.getUserSessions(
                userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }
}
