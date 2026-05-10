package com.intervai.repository;

import com.intervai.entity.Question;
import com.intervai.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {

    List<Question> findBySessionOrderByOrderIndexAsc(Session session);

    List<Question> findBySessionIdOrderByOrderIndexAsc(UUID sessionId);

    long countBySession(Session session);

    long countBySessionAndIsAnsweredTrue(Session session);

    @Query("SELECT q FROM Question q WHERE q.session.id = :sessionId AND q.isAnswered = false ORDER BY q.orderIndex ASC")
    List<Question> findUnansweredBySessionId(@Param("sessionId") UUID sessionId);

    @Query("SELECT DISTINCT q.topic FROM Question q WHERE q.session.user.id = :userId AND q.topic IS NOT NULL")
    List<String> findDistinctTopicsByUserId(@Param("userId") UUID userId);
}
