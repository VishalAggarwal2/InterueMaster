package com.intervai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ClaudeService {

    @Value("${anthropic.api-key}")
    private String apiKey;

    @Value("${anthropic.api-url}")
    private String apiUrl;

    @Value("${anthropic.model}")
    private String model;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public ClaudeService(ObjectMapper objectMapper) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    public String sendMessage(String systemPrompt, String userMessage) {
        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", model);
            requestBody.put("max_tokens", 4096);

            if (systemPrompt != null && !systemPrompt.isBlank()) {
                requestBody.put("system", systemPrompt);
            }

            ArrayNode messages = requestBody.putArray("messages");
            ObjectNode userMsg = messages.addObject();
            userMsg.put("role", "user");
            userMsg.put("content", userMessage);

            HttpHeaders headers = buildHeaders();
            HttpEntity<String> entity = new HttpEntity<>(requestBody.toString(), headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    apiUrl, HttpMethod.POST, entity, String.class);

            JsonNode responseJson = objectMapper.readTree(response.getBody());
            String text = responseJson.path("content").get(0).path("text").asText();
            return stripCodeFences(text);
        } catch (Exception e) {
            log.error("Error calling Claude API: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get response from Claude API: " + e.getMessage());
        }
    }

    /**
     * Claude often wraps JSON in ```json ... ``` markdown fences.
     * Strip them so downstream JSON parsers don't choke on backticks.
     */
    private String stripCodeFences(String text) {
        if (text == null) return null;
        String trimmed = text.trim();
        // Remove leading ```json, ```JSON, or just ```
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline > 0) {
                trimmed = trimmed.substring(firstNewline + 1);
            } else {
                trimmed = trimmed.substring(3);
            }
        }
        // Remove trailing ```
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        return trimmed.trim();
    }

    public String sendConversation(String systemPrompt, List<Map<String, String>> conversationHistory, String newMessage) {
        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", model);
            requestBody.put("max_tokens", 4096);

            if (systemPrompt != null && !systemPrompt.isBlank()) {
                requestBody.put("system", systemPrompt);
            }

            ArrayNode messages = requestBody.putArray("messages");
            for (Map<String, String> msg : conversationHistory) {
                ObjectNode msgNode = messages.addObject();
                msgNode.put("role", msg.get("role"));
                msgNode.put("content", msg.get("content"));
            }

            ObjectNode userMsg = messages.addObject();
            userMsg.put("role", "user");
            userMsg.put("content", newMessage);

            HttpHeaders headers = buildHeaders();
            HttpEntity<String> entity = new HttpEntity<>(requestBody.toString(), headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    apiUrl, HttpMethod.POST, entity, String.class);

            JsonNode responseJson = objectMapper.readTree(response.getBody());
            String text = responseJson.path("content").get(0).path("text").asText();
            return stripCodeFences(text);
        } catch (Exception e) {
            log.error("Error calling Claude API for conversation: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get response from Claude API: " + e.getMessage());
        }
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");
        return headers;
    }

    public String generateInterviewQuestions(String role, String company, String difficulty,
                                              String interviewType, int count, String jdText,
                                              String resumeText, List<String> weakTopics) {
        String systemPrompt = """
                You are an expert technical interviewer with deep knowledge across software engineering,
                product management, data science, and other technology roles.
                Your task is to generate realistic, challenging interview questions.
                Always respond with valid JSON only.
                """;

        StringBuilder userMessage = new StringBuilder();
        userMessage.append(String.format(
                "Generate exactly %d interview questions for a %s position", count, role));

        if (company != null && !company.isBlank()) {
            userMessage.append(String.format(" at %s", company));
        }
        userMessage.append(String.format(
                ". Difficulty: %s. Interview type: %s.", difficulty, interviewType));

        if (jdText != null && !jdText.isBlank()) {
            userMessage.append(String.format("\n\nJob Description:\n%s", jdText));
        }

        if (resumeText != null && !resumeText.isBlank()) {
            userMessage.append(String.format("\n\nCandidate Resume:\n%s",
                    resumeText.substring(0, Math.min(resumeText.length(), 2000))));
        }

        if (weakTopics != null && !weakTopics.isEmpty()) {
            userMessage.append(String.format(
                    "\n\nFocus more on these weak areas: %s", String.join(", ", weakTopics)));
        }

        userMessage.append("""
                
                Return a JSON array of questions with this exact format:
                [
                  {
                    "questionText": "...",
                    "questionType": "BEHAVIORAL|TECHNICAL|SYSTEM_DESIGN|CODING|HR",
                    "topic": "...",
                    "difficulty": "EASY|MEDIUM|HARD",
                    "expectedDurationSeconds": 120,
                    "hint": "..."
                  }
                ]
                Only return the JSON array, no other text.
                """);

        return sendMessage(systemPrompt, userMessage.toString());
    }

    public String scoreAnswer(String questionText, String answerText, String role, String topic) {
        String systemPrompt = """
                You are an expert interview coach and evaluator.
                You evaluate interview answers using the STAR framework (Situation, Task, Action, Result).
                Always respond with valid JSON only.
                Be honest, direct, and constructive in your feedback.
                """;

        String userMessage = String.format("""
                Evaluate this interview answer for a %s position.
                
                Question: %s
                Topic: %s
                
                Answer: %s
                
                Score each component (0-10) and provide detailed feedback.
                Return JSON with this exact format:
                {
                  "score": <overall score 0-10>,
                  "starSituation": <0-10>,
                  "starTask": <0-10>,
                  "starAction": <0-10>,
                  "starResult": <0-10>,
                  "aiFeedback": "<detailed paragraph feedback>",
                  "strengths": ["strength1", "strength2", "strength3"],
                  "improvements": ["improvement1", "improvement2", "improvement3"]
                }
                Only return the JSON object, no other text.
                """, role, questionText, topic != null ? topic : "General", answerText);

        return sendMessage(systemPrompt, userMessage);
    }

    public String generateReportCardSummary(String role, String company, double overallScore,
                                             List<String> strengths, List<String> weakTopics,
                                             int totalQuestions, int answeredQuestions) {
        String systemPrompt = """
                You are an expert interview coach creating detailed performance reports.
                Be honest, constructive, and specific. Always respond with valid JSON only.
                """;

        String userMessage = String.format("""
                Generate a comprehensive interview report card summary.
                
                Role: %s
                Company: %s
                Overall Score: %.1f/10
                Questions Answered: %d/%d
                Key Strengths: %s
                Areas for Improvement: %s
                
                Return JSON with this exact format:
                {
                  "aiSummary": "<3-4 paragraph comprehensive performance summary>",
                  "hiringRecommendation": "STRONG_HIRE|HIRE|BORDERLINE|NO_HIRE",
                  "communicationScore": <0-10>,
                  "technicalScore": <0-10>,
                  "problemSolvingScore": <0-10>,
                  "starFrameworkScore": <0-10>,
                  "confidenceScore": <0-10>
                }
                Only return the JSON object, no other text.
                """,
                role, company != null ? company : "Unknown",
                overallScore, answeredQuestions, totalQuestions,
                String.join(", ", strengths),
                String.join(", ", weakTopics));

        return sendMessage(systemPrompt, userMessage);
    }

    public String predictQuestionsFromJD(String jdText, String role, String company, int count) {
        String systemPrompt = """
                You are an expert recruiter and interview strategist.
                Analyze job descriptions to predict likely interview questions.
                Always respond with valid JSON only.
                """;

        String userMessage = String.format("""
                Based on this job description, predict the %d most likely interview questions.
                Role: %s
                Company: %s
                
                Job Description:
                %s
                
                Return a JSON array with this exact format:
                [
                  {
                    "questionText": "...",
                    "questionType": "BEHAVIORAL|TECHNICAL|SYSTEM_DESIGN|HR",
                    "topic": "...",
                    "difficulty": "EASY|MEDIUM|HARD",
                    "reasoning": "Why this question is likely to be asked"
                  }
                ]
                Only return the JSON array, no other text.
                """, count, role != null ? role : "Unknown", company != null ? company : "Unknown", jdText);

        return sendMessage(systemPrompt, userMessage);
    }

    public String negotiateWithAI(String systemPrompt, List<Map<String, String>> history, String userMessage) {
        return sendConversation(systemPrompt, history, userMessage);
    }

    public String generateDailyQuestion(String topic, String difficulty) {
        String systemPrompt = """
                You are an expert interview coach creating a daily practice question.
                Make questions thought-provoking and relevant to current industry trends.
                Always respond with valid JSON only.
                """;

        String userMessage = String.format("""
                Generate a single daily practice interview question.
                Topic: %s
                Difficulty: %s
                
                Return JSON with this exact format:
                {
                  "questionText": "...",
                  "topic": "...",
                  "difficulty": "EASY|MEDIUM|HARD",
                  "sampleAnswer": "A comprehensive sample answer using the STAR framework"
                }
                Only return the JSON object, no other text.
                """, topic, difficulty);

        return sendMessage(systemPrompt, userMessage);
    }
}
