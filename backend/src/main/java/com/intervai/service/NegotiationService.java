package com.intervai.service;

import com.intervai.dto.request.NegotiationMessageRequest;
import com.intervai.dto.request.NegotiationStartRequest;
import com.intervai.entity.NegotiationMessage;
import com.intervai.entity.NegotiationSession;
import com.intervai.entity.User;
import com.intervai.exception.BadRequestException;
import com.intervai.exception.ResourceNotFoundException;
import com.intervai.repository.NegotiationMessageRepository;
import com.intervai.repository.NegotiationSessionRepository;
import com.intervai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NegotiationService {

    private final NegotiationSessionRepository negotiationSessionRepository;
    private final NegotiationMessageRepository negotiationMessageRepository;
    private final UserRepository userRepository;
    private final ClaudeService claudeService;

    @Transactional
    public Map<String, Object> startNegotiation(String email, NegotiationStartRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        String aiPersona = request.getAiPersona();
        if (aiPersona == null || aiPersona.isBlank()) {
            aiPersona = buildDefaultPersona(request.getCompany(), request.getRole());
        }

        NegotiationSession session = NegotiationSession.builder()
                .user(user)
                .role(request.getRole())
                .company(request.getCompany())
                .initialOffer(request.getInitialOffer())
                .targetSalary(request.getTargetSalary())
                .status("ACTIVE")
                .aiPersona(aiPersona)
                .contextNotes(request.getContextNotes())
                .build();

        session = negotiationSessionRepository.save(session);

        // Generate opening message from AI
        String systemPrompt = buildNegotiationSystemPrompt(session);
        String openingMessage = generateOpeningMessage(systemPrompt, request);

        NegotiationMessage aiMessage = NegotiationMessage.builder()
                .negotiationSession(session)
                .role("ASSISTANT")
                .content(openingMessage)
                .messageType("TEXT")
                .offerAmount(request.getInitialOffer())
                .build();
        negotiationMessageRepository.save(aiMessage);

        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", session.getId());
        response.put("role", session.getRole());
        response.put("company", session.getCompany());
        response.put("initialOffer", session.getInitialOffer());
        response.put("targetSalary", session.getTargetSalary());
        response.put("status", session.getStatus());
        response.put("openingMessage", openingMessage);
        response.put("createdAt", session.getCreatedAt());

        return response;
    }

    @Transactional
    public Map<String, Object> sendMessage(String email, NegotiationMessageRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        NegotiationSession session = negotiationSessionRepository.findByIdAndUser(request.getSessionId(), user)
                .orElseThrow(() -> new ResourceNotFoundException("NegotiationSession", "id", request.getSessionId()));

        if (!"ACTIVE".equals(session.getStatus())) {
            throw new BadRequestException("Negotiation session is not active");
        }

        // Save user message
        NegotiationMessage userMessage = NegotiationMessage.builder()
                .negotiationSession(session)
                .role("USER")
                .content(request.getContent())
                .messageType(request.getMessageType() != null ? request.getMessageType() : "TEXT")
                .offerAmount(request.getOfferAmount())
                .build();
        negotiationMessageRepository.save(userMessage);

        // Build conversation history for Claude
        List<NegotiationMessage> allMessages = negotiationMessageRepository
                .findByNegotiationSessionIdOrderByCreatedAtAsc(session.getId());

        List<Map<String, String>> history = allMessages.stream()
                .filter(m -> !m.getId().equals(userMessage.getId()))
                .map(m -> {
                    Map<String, String> msg = new HashMap<>();
                    msg.put("role", "USER".equals(m.getRole()) ? "user" : "assistant");
                    msg.put("content", m.getContent());
                    return msg;
                })
                .collect(Collectors.toList());

        // Get AI response
        String systemPrompt = buildNegotiationSystemPrompt(session);
        String aiResponse;
        try {
            aiResponse = claudeService.negotiateWithAI(systemPrompt, history, request.getContent());
        } catch (Exception e) {
            log.error("Error getting AI negotiation response: {}", e.getMessage(), e);
            aiResponse = "I understand your position. Let me consider this and get back to you.";
        }

        // Save AI response
        NegotiationMessage aiMessage = NegotiationMessage.builder()
                .negotiationSession(session)
                .role("ASSISTANT")
                .content(aiResponse)
                .messageType("TEXT")
                .build();
        negotiationMessageRepository.save(aiMessage);

        Map<String, Object> response = new HashMap<>();
        response.put("userMessage", request.getContent());
        response.put("aiResponse", aiResponse);
        response.put("sessionId", session.getId());
        response.put("status", session.getStatus());

        return response;
    }

    @Transactional
    public Map<String, Object> endNegotiation(String email, UUID sessionId, BigDecimal finalOffer, String outcome) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        NegotiationSession session = negotiationSessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new ResourceNotFoundException("NegotiationSession", "id", sessionId));

        session.setFinalOffer(finalOffer);
        session.setOutcome(outcome);
        session.setStatus("COMPLETED");
        session.setCompletedAt(OffsetDateTime.now());
        negotiationSessionRepository.save(session);

        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", session.getId());
        response.put("finalOffer", session.getFinalOffer());
        response.put("outcome", session.getOutcome());
        response.put("status", session.getStatus());
        response.put("completedAt", session.getCompletedAt());

        return response;
    }

    @Transactional(readOnly = true)
    public List<NegotiationMessage> getSessionMessages(String email, UUID sessionId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        NegotiationSession session = negotiationSessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new ResourceNotFoundException("NegotiationSession", "id", sessionId));

        return negotiationMessageRepository.findByNegotiationSessionIdOrderByCreatedAtAsc(session.getId());
    }

    @Transactional(readOnly = true)
    public List<NegotiationSession> getUserSessions(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return negotiationSessionRepository.findByUserOrderByCreatedAtDesc(user);
    }

    private String buildNegotiationSystemPrompt(NegotiationSession session) {
        return String.format("""
                You are an experienced HR recruiter and hiring manager at %s.
                You are negotiating a salary offer for a %s position.
                Initial offer: $%s
                
                %s
                
                Your goals:
                1. Stay within budget while being fair
                2. Be professional but firm on compensation limits
                3. Highlight non-salary benefits when pressed
                4. Be realistic about market rates
                5. Make the candidate feel valued
                
                Respond naturally as a recruiter would in a real salary negotiation.
                Keep responses concise and conversational. Be specific about numbers.
                """,
                session.getCompany() != null ? session.getCompany() : "our company",
                session.getRole(),
                session.getInitialOffer() != null ? session.getInitialOffer() : "to be discussed",
                session.getAiPersona() != null ? session.getAiPersona() : "");
    }

    private String generateOpeningMessage(String systemPrompt, NegotiationStartRequest request) {
        try {
            String userMessage = String.format(
                    "Start the salary negotiation conversation. You're making an offer of $%s for the %s position%s.",
                    request.getInitialOffer() != null ? request.getInitialOffer() : "competitive salary",
                    request.getRole(),
                    request.getCompany() != null ? " at " + request.getCompany() : "");
            return claudeService.sendMessage(systemPrompt, userMessage);
        } catch (Exception e) {
            log.error("Error generating opening message: {}", e.getMessage());
            return String.format("Hello! I'm pleased to offer you the %s position%s. " +
                            "We'd like to start with a base salary of $%s. " +
                            "I'm looking forward to discussing the details with you.",
                    request.getRole(),
                    request.getCompany() != null ? " at " + request.getCompany() : "",
                    request.getInitialOffer() != null ? request.getInitialOffer() : "competitive");
        }
    }

    private String buildDefaultPersona(String company, String role) {
        return String.format(
                "You are a professional HR manager with 10 years of experience in talent acquisition. " +
                "You are direct, professional, and fair in your negotiations for the %s role%s.",
                role, company != null ? " at " + company : "");
    }
}
