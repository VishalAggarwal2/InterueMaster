package com.intervai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "negotiation_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NegotiationSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String role;

    @Column(length = 255)
    private String company;

    @Column(name = "initial_offer", precision = 12, scale = 2)
    private BigDecimal initialOffer;

    @Column(name = "target_salary", precision = 12, scale = 2)
    private BigDecimal targetSalary;

    @Column(name = "final_offer", precision = 12, scale = 2)
    private BigDecimal finalOffer;

    @Column(length = 100)
    private String outcome;

    @Column(length = 50)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "ai_persona", columnDefinition = "TEXT")
    private String aiPersona;

    @Column(name = "context_notes", columnDefinition = "TEXT")
    private String contextNotes;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
