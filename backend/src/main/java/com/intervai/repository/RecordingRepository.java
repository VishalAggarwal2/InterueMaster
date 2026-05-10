package com.intervai.repository;

import com.intervai.entity.Recording;
import com.intervai.entity.Session;
import com.intervai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecordingRepository extends JpaRepository<Recording, UUID> {

    List<Recording> findBySessionOrderByCreatedAtDesc(Session session);

    List<Recording> findByUserOrderByCreatedAtDesc(User user);

    Optional<Recording> findByAnswerId(UUID answerId);

    @Query("SELECT r FROM Recording r WHERE r.expiresAt IS NOT NULL AND r.expiresAt < :now")
    List<Recording> findExpiredRecordings(@Param("now") OffsetDateTime now);

    @Query("SELECT SUM(r.fileSizeBytes) FROM Recording r WHERE r.user = :user")
    Long findTotalStorageByUser(@Param("user") User user);
}
