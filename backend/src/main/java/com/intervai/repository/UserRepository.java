package com.intervai.repository;

import com.intervai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.isActive = true ORDER BY u.averageScore DESC, u.totalSessions DESC LIMIT :limit")
    List<User> findTopUsersByScore(@Param("limit") int limit);

    @Query("SELECT u FROM User u WHERE u.isActive = true ORDER BY u.dailyStreak DESC LIMIT :limit")
    List<User> findTopUsersByStreak(@Param("limit") int limit);

    @Modifying
    @Query("UPDATE User u SET u.totalSessions = u.totalSessions + 1 WHERE u.id = :userId")
    void incrementTotalSessions(@Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE User u SET u.totalQuestionsAnswered = u.totalQuestionsAnswered + :count WHERE u.id = :userId")
    void incrementQuestionsAnswered(@Param("userId") UUID userId, @Param("count") int count);
}
