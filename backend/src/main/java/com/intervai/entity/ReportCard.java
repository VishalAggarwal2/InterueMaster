package com.intervai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "report_cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportCard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false, unique = true)
    private Session session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "overall_score", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal overallScore = BigDecimal.ZERO;

    @Column(name = "communication_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal communicationScore = BigDecimal.ZERO;

    @Column(name = "technical_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal technicalScore = BigDecimal.ZERO;

    @Column(name = "problem_solving_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal problemSolvingScore = BigDecimal.ZERO;

    @Column(name = "star_framework_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal starFrameworkScore = BigDecimal.ZERO;

    @Column(name = "confidence_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal confidenceScore = BigDecimal.ZERO;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]")
    private List<String> strengths;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]")
    private List<String> improvements;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "weak_topics", columnDefinition = "text[]")
    private List<String> weakTopics;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "top_topics", columnDefinition = "text[]")
    private List<String> topTopics;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Column(name = "hiring_recommendation", length = 100)
    private String hiringRecommendation;

    @Column(name = "share_token", length = 255, unique = true)
    private String shareToken;

    @Column(name = "is_shared")
    @Builder.Default
    private Boolean isShared = false;

    @Column(name = "shared_at")
    private OffsetDateTime sharedAt;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
