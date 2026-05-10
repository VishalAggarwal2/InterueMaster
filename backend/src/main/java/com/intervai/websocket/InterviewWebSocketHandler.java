package com.intervai.websocket;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intervai.security.JwtTokenProvider;
import com.intervai.service.ClaudeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class InterviewWebSocketHandler extends TextWebSocketHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final ClaudeService claudeService;
    private final ObjectMapper objectMapper;

    // sessionId -> WebSocketSession
    private final Map<String, WebSocketSession> activeSessions = new ConcurrentHashMap<>();
    // sessionId -> conversation history
    private final Map<String, List<Map<String, String>>> conversationHistory = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String token = extractToken(session);
        if (token == null || !jwtTokenProvider.validateToken(token)) {
            log.warn("WebSocket connection rejected - invalid token");
            session.close(CloseStatus.NOT_ACCEPTABLE);
            return;
        }

        String email = jwtTokenProvider.getEmailFromToken(token);
        session.getAttributes().put("email", email);
        activeSessions.put(session.getId(), session);
        conversationHistory.put(session.getId(), new ArrayList<>());

        log.info("WebSocket connected: session={}, user={}", session.getId(), email);

        Map<String, Object> welcomeMsg = new HashMap<>();
        welcomeMsg.put("type", "CONNECTED");
        welcomeMsg.put("sessionId", session.getId());
        welcomeMsg.put("message", "Connected to IntervAI interview session");
        sendMessage(session, welcomeMsg);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String email = (String) session.getAttributes().get("email");
        if (email == null) {
            sendError(session, "Unauthorized");
            return;
        }

        try {
            Map<String, Object> payload = objectMapper.readValue(
                    message.getPayload(), new TypeReference<Map<String, Object>>() {});

            String type = (String) payload.get("type");

            switch (type != null ? type : "") {
                case "START_INTERVIEW" -> handleStartInterview(session, payload, email);
                case "ANSWER" -> handleAnswer(session, payload, email);
                case "REQUEST_HINT" -> handleHintRequest(session, payload, email);
                case "PING" -> sendPong(session);
                default -> sendError(session, "Unknown message type: " + type);
            }
        } catch (Exception e) {
            log.error("Error handling WebSocket message: {}", e.getMessage(), e);
            sendError(session, "Error processing message: " + e.getMessage());
        }
    }

    private void handleStartInterview(WebSocketSession session, Map<String, Object> payload, String email) throws IOException {
        String role = (String) payload.getOrDefault("role", "Software Engineer");
        String company = (String) payload.get("company");
        String difficulty = (String) payload.getOrDefault("difficulty", "MEDIUM");

        String systemPrompt = buildInterviewSystemPrompt(role, company, difficulty);
        session.getAttributes().put("systemPrompt", systemPrompt);
        session.getAttributes().put("role", role);

        conversationHistory.get(session.getId()).clear();

        Map<String, Object> response = new HashMap<>();
        response.put("type", "INTERVIEW_STARTED");
        response.put("role", role);
        response.put("company", company);
        response.put("difficulty", difficulty);
        response.put("message", "Interview session started. I'll be your interviewer today.");
        sendMessage(session, response);
    }

    private void handleAnswer(WebSocketSession session, Map<String, Object> payload, String email) throws IOException {
        String answerText = (String) payload.get("answerText");
        String questionId = (String) payload.get("questionId");

        if (answerText == null || answerText.isBlank()) {
            sendError(session, "Answer text is required");
            return;
        }

        String systemPrompt = (String) session.getAttributes().getOrDefault("systemPrompt", "You are a professional interviewer.");
        List<Map<String, String>> history = conversationHistory.getOrDefault(session.getId(), new ArrayList<>());

        // Send typing indicator
        Map<String, Object> typingMsg = new HashMap<>();
        typingMsg.put("type", "TYPING");
        typingMsg.put("message", "AI is processing your answer...");
        sendMessage(session, typingMsg);

        try {
            String aiResponse = claudeService.sendConversation(systemPrompt, history, answerText);

            // Update conversation history
            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", answerText);
            history.add(userMsg);

            Map<String, String> assistantMsg = new HashMap<>();
            assistantMsg.put("role", "assistant");
            assistantMsg.put("content", aiResponse);
            history.add(assistantMsg);

            Map<String, Object> response = new HashMap<>();
            response.put("type", "AI_RESPONSE");
            response.put("questionId", questionId);
            response.put("aiResponse", aiResponse);
            response.put("messageCount", history.size());
            sendMessage(session, response);

        } catch (Exception e) {
            log.error("Error getting AI response: {}", e.getMessage(), e);
            sendError(session, "Failed to get AI response. Please try again.");
        }
    }

    private void handleHintRequest(WebSocketSession session, Map<String, Object> payload, String email) throws IOException {
        String questionText = (String) payload.get("questionText");
        String role = (String) session.getAttributes().getOrDefault("role", "professional");

        if (questionText == null) {
            sendError(session, "Question text is required for hint");
            return;
        }

        try {
            String hintPrompt = String.format(
                    "For this interview question for a %s role: '%s'\nProvide a brief hint (2-3 sentences) on how to structure a good answer using the STAR framework. Don't give the answer, just guidance.",
                    role, questionText);

            String hint = claudeService.sendMessage("You are a helpful interview coach.", hintPrompt);

            Map<String, Object> response = new HashMap<>();
            response.put("type", "HINT");
            response.put("hint", hint);
            sendMessage(session, response);

        } catch (Exception e) {
            log.error("Error generating hint: {}", e.getMessage(), e);
            sendError(session, "Failed to generate hint. Please try again.");
        }
    }

    private void sendPong(WebSocketSession session) throws IOException {
        Map<String, Object> pong = new HashMap<>();
        pong.put("type", "PONG");
        pong.put("timestamp", System.currentTimeMillis());
        sendMessage(session, pong);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("WebSocket transport error for session {}: {}", session.getId(), exception.getMessage());
        cleanupSession(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        log.info("WebSocket disconnected: session={}, status={}", session.getId(), closeStatus);
        cleanupSession(session);
    }

    private void cleanupSession(WebSocketSession session) {
        activeSessions.remove(session.getId());
        conversationHistory.remove(session.getId());
    }

    private void sendMessage(WebSocketSession session, Map<String, Object> payload) throws IOException {
        if (session.isOpen()) {
            String json = objectMapper.writeValueAsString(payload);
            session.sendMessage(new TextMessage(json));
        }
    }

    private void sendError(WebSocketSession session, String errorMsg) throws IOException {
        Map<String, Object> error = new HashMap<>();
        error.put("type", "ERROR");
        error.put("message", errorMsg);
        sendMessage(session, error);
    }

    private String extractToken(WebSocketSession session) {
        String query = session.getUri() != null ? session.getUri().getQuery() : null;
        if (query != null) {
            for (String param : query.split("&")) {
                String[] parts = param.split("=", 2);
                if (parts.length == 2 && "token".equals(parts[0])) {
                    return parts[1];
                }
            }
        }
        // Try Authorization header
        List<String> authHeaders = session.getHandshakeHeaders().get("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String auth = authHeaders.get(0);
            if (auth.startsWith("Bearer ")) return auth.substring(7);
        }
        return null;
    }

    private String buildInterviewSystemPrompt(String role, String company, String difficulty) {
        return String.format("""
                You are an expert interviewer conducting a %s interview for a %s position%s.
                
                Your responsibilities:
                1. Ask insightful, relevant interview questions one at a time
                2. Follow up on answers to dig deeper
                3. Provide encouragement while maintaining professionalism
                4. Evaluate answers based on clarity, structure, and relevance
                5. Guide candidates to use the STAR framework
                
                Difficulty level: %s
                
                After each answer, briefly acknowledge it and naturally transition to the next question.
                Keep your responses concise and conversational. Be professional but friendly.
                """,
                difficulty, role,
                company != null ? " at " + company : "",
                difficulty);
    }

    public int getActiveSessionCount() {
        return activeSessions.size();
    }
}
