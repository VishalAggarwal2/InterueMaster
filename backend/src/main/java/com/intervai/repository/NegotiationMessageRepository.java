package com.intervai.repository;

import com.intervai.entity.NegotiationMessage;
import com.intervai.entity.NegotiationSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NegotiationMessageRepository extends JpaRepository<NegotiationMessage, UUID> {

    List<NegotiationMessage> findByNegotiationSessionOrderByCreatedAtAsc(NegotiationSession negotiationSession);

    List<NegotiationMessage> findByNegotiationSessionIdOrderByCreatedAtAsc(UUID negotiationSessionId);

    long countByNegotiationSessionId(UUID negotiationSessionId);
}
