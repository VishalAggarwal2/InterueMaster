package com.intervai.repository;

import com.intervai.entity.NegotiationSession;
import com.intervai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NegotiationSessionRepository extends JpaRepository<NegotiationSession, UUID> {

    List<NegotiationSession> findByUserOrderByCreatedAtDesc(User user);

    Optional<NegotiationSession> findByIdAndUser(UUID id, User user);

    List<NegotiationSession> findByUserAndStatus(User user, String status);
}
