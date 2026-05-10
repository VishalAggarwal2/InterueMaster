package com.intervai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@intervai.com}")
    private String fromEmail;

    @Async
    public void sendDailyQuestionEmail(String to, String fullName, String questionText, String questionTopic) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("IntervAI Daily Practice Question - " + questionTopic);

            String htmlContent = buildDailyQuestionEmailHtml(fullName, questionText, questionTopic);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Daily question email sent to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send daily question email to {}: {}", to, e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error sending email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendReportCardEmail(String to, String fullName, String sessionTitle, String shareUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Your IntervAI Interview Report Card is Ready!");

            String htmlContent = buildReportCardEmailHtml(fullName, sessionTitle, shareUrl);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Report card email sent to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send report card email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendWelcomeEmail(String to, String fullName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Welcome to IntervAI - Your AI Interview Coach!");

            String htmlContent = buildWelcomeEmailHtml(fullName);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Welcome email sent to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send welcome email to {}: {}", to, e.getMessage());
        }
    }

    private String buildDailyQuestionEmailHtml(String fullName, String questionText, String questionTopic) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
                        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; color: white; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .question-box { background: white; border-left: 4px solid #6366f1; padding: 20px; margin: 20px 0; border-radius: 4px; }
                        .cta-button { background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 20px; }
                        .topic-badge { background: #ede9fe; color: #5b21b6; padding: 4px 10px; border-radius: 20px; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>IntervAI Daily Practice</h1>
                        <p>Your daily question is ready!</p>
                    </div>
                    <div class="content">
                        <h2>Hi %s!</h2>
                        <p>Here's your practice question for today:</p>
                        <span class="topic-badge">%s</span>
                        <div class="question-box">
                            <p><strong>%s</strong></p>
                        </div>
                        <p>Use the STAR framework to structure your answer: <strong>Situation, Task, Action, Result</strong>.</p>
                        <a href="https://app.intervai.com/daily-question" class="cta-button">Answer Now</a>
                        <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
                            You're receiving this because you enabled daily practice emails in IntervAI.
                            <a href="#">Unsubscribe</a>
                        </p>
                    </div>
                </body>
                </html>
                """.formatted(fullName, questionTopic, questionText);
    }

    private String buildReportCardEmailHtml(String fullName, String sessionTitle, String shareUrl) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
                        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; color: white; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .cta-button { background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Your Report Card is Ready!</h1>
                    </div>
                    <div class="content">
                        <h2>Hi %s!</h2>
                        <p>Your interview report card for <strong>%s</strong> has been generated.</p>
                        <p>View your detailed performance analysis, STAR framework scores, and personalized improvement recommendations.</p>
                        <a href="%s" class="cta-button">View Report Card</a>
                    </div>
                </body>
                </html>
                """.formatted(fullName, sessionTitle, shareUrl != null ? shareUrl : "https://app.intervai.com");
    }

    private String buildWelcomeEmailHtml(String fullName) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
                        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; color: white; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .feature { display: flex; margin: 15px 0; }
                        .cta-button { background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Welcome to IntervAI!</h1>
                        <p>Your AI-powered interview coach</p>
                    </div>
                    <div class="content">
                        <h2>Hi %s!</h2>
                        <p>You're all set to ace your next interview! Here's what you can do:</p>
                        <ul>
                            <li><strong>AI Mock Interviews</strong> - Practice with role-specific questions</li>
                            <li><strong>STAR Framework Scoring</strong> - Get detailed feedback on your answers</li>
                            <li><strong>Report Cards</strong> - Track your progress over time</li>
                            <li><strong>Daily Questions</strong> - Build a consistent practice habit</li>
                            <li><strong>Salary Negotiation</strong> - Practice negotiating with an AI recruiter</li>
                        </ul>
                        <a href="https://app.intervai.com" class="cta-button">Start Practicing</a>
                    </div>
                </body>
                </html>
                """.formatted(fullName);
    }
}
