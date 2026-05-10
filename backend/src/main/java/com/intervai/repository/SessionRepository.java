package com.intervai.repository;

import com.intervai.entity.Session;
import com.intervai.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

    Page<Session> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    List<Session> findByUserAndStatusOrderByCreatedAtDesc(User user, String status);

    Optional<Session> findByIdAndUser(UUID id, User user);

    @Query("SELECT COUNT(s) FROM Session s WHERE s.user = :user AND DATE(s.createdAt) = :date")
    long countByUserAndDate(@Param("user") User user, @Param("date") LocalDate date);

    @Query("SELECT COUNT(s) FROM Session s WHERE s.user = :user AND s.createdAt >= :since")
    long countByUserSince(@Param("user") User user, @Param("since") OffsetDateTime since);

    @Query("SELECT s FROM Session s WHERE s.user = :user AND s.status = 'COMPLETED' ORDER BY s.completedAt DESC")
    List<Session> findCompletedSessionsByUser(@Param("user") User user);

    @Query("SELECT s FROM Session s WHERE s.user.id = :userId AND s.status = 'COMPLETED' ORDER BY s.createdAt DESC LIMIT :limit")
    List<Session> findRecentCompletedSessions(@Param("userId") UUID userId, @Param("limit") int limit);
}
