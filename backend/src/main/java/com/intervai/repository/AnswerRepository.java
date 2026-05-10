package com.intervai.repository;

import com.intervai.entity.Answer;
import com.intervai.entity.Session;
import com.intervai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, UUID> {

    List<Answer> findBySessionOrderByCreatedAtAsc(Session session);

    List<Answer> findByUser(User user);

    Optional<Answer> findByQuestionId(UUID questionId);

    @Query("SELECT AVG(a.score) FROM Answer a WHERE a.session = :session AND a.score IS NOT NULL")
    Double findAverageScoreBySession(@Param("session") Session session);

    @Query("SELECT AVG(a.score) FROM Answer a WHERE a.user = :user AND a.score IS NOT NULL")
    Double findAverageScoreByUser(@Param("user") User user);

    @Query("SELECT a FROM Answer a WHERE a.user = :user AND a.score < :threshold AND a.score IS NOT NULL")
    List<Answer> findLowScoringAnswersByUser(@Param("user") User user, @Param("threshold") int threshold);

    @Query("SELECT a.question.topic, AVG(a.score) FROM Answer a WHERE a.user = :user AND a.score IS NOT NULL AND a.question.topic IS NOT NULL GROUP BY a.question.topic ORDER BY AVG(a.score) ASC")
    List<Object[]> findAverageScoreByTopicForUser(@Param("user") User user);

    @Query("SELECT COUNT(a) FROM Answer a WHERE a.session = :session")
    long countBySession(@Param("session") Session session);
}
