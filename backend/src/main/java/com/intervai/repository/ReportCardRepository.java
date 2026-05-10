package com.intervai.repository;

import com.intervai.entity.ReportCard;
import com.intervai.entity.Session;
import com.intervai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReportCardRepository extends JpaRepository<ReportCard, UUID> {

    Optional<ReportCard> findBySession(Session session);

    Optional<ReportCard> findBySessionId(UUID sessionId);

    Optional<ReportCard> findByShareToken(String shareToken);

    List<ReportCard> findByUserOrderByCreatedAtDesc(User user);

    boolean existsBySessionId(UUID sessionId);
}
