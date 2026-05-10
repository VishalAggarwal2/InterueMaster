package com.intervai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 255)
    private String title;

    @Column(nullable = false, length = 255)
    private String role;

    @Column(length = 255)
    private String company;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String difficulty = "MEDIUM";

    @Column(name = "interview_type", nullable = false, length = 100)
    @Builder.Default
    private String interviewType = "TECHNICAL";

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String mode = "TEXT";

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "total_questions")
    @Builder.Default
    private Integer totalQuestions = 0;

    @Column(name = "answered_questions")
    @Builder.Default
    private Integer answeredQuestions = 0;

    @Column(name = "overall_score", precision = 5, scale = 2)
    private BigDecimal overallScore;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "is_timed")
    @Builder.Default
    private Boolean isTimed = false;

    @Column(name = "time_limit_seconds")
    private Integer timeLimitSeconds;

    @Column(name = "jd_text", columnDefinition = "TEXT")
    private String jdText;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        startedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
