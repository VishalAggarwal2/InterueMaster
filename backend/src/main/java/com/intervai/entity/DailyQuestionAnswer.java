package com.intervai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "daily_question_answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyQuestionAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "question_date", nullable = false)
    private LocalDate questionDate;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "question_topic", length = 255)
    private String questionTopic;

    @Column(name = "question_difficulty", length = 50)
    @Builder.Default
    private String questionDifficulty = "MEDIUM";

    @Column(name = "answer_text", columnDefinition = "TEXT")
    private String answerText;

    @Column
    private Integer score;

    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback;

    @Column(name = "is_answered")
    @Builder.Default
    private Boolean isAnswered = false;

    @Column(name = "answered_at")
    private OffsetDateTime answeredAt;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
