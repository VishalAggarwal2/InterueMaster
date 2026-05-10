package com.intervai.repository;

import com.intervai.entity.DailyQuestionAnswer;
import com.intervai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyQuestionAnswerRepository extends JpaRepository<DailyQuestionAnswer, UUID> {

    Optional<DailyQuestionAnswer> findByUserAndQuestionDate(User user, LocalDate questionDate);

    List<DailyQuestionAnswer> findByUserOrderByQuestionDateDesc(User user);

    @Query("SELECT COUNT(dqa) FROM DailyQuestionAnswer dqa WHERE dqa.user = :user AND dqa.isAnswered = true AND dqa.questionDate >= :startDate")
    long countAnsweredSince(@Param("user") User user, @Param("startDate") LocalDate startDate);

    boolean existsByUserAndQuestionDate(User user, LocalDate questionDate);

    @Query("SELECT dqa FROM DailyQuestionAnswer dqa WHERE dqa.user = :user AND dqa.isAnswered = true ORDER BY dqa.questionDate DESC LIMIT :limit")
    List<DailyQuestionAnswer> findRecentAnsweredByUser(@Param("user") User user, @Param("limit") int limit);
}
