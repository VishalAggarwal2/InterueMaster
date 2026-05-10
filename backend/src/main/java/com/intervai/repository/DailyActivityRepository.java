package com.intervai.repository;

import com.intervai.entity.DailyActivity;
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
public interface DailyActivityRepository extends JpaRepository<DailyActivity, UUID> {

    Optional<DailyActivity> findByUserAndActivityDate(User user, LocalDate activityDate);

    List<DailyActivity> findByUserAndActivityDateBetweenOrderByActivityDateAsc(
            User user, LocalDate startDate, LocalDate endDate);

    @Query("SELECT da FROM DailyActivity da WHERE da.user = :user ORDER BY da.activityDate DESC LIMIT :days")
    List<DailyActivity> findRecentActivityByUser(@Param("user") User user, @Param("days") int days);

    @Query("SELECT da FROM DailyActivity da WHERE da.user.id = :userId AND da.activityDate >= :startDate ORDER BY da.activityDate ASC")
    List<DailyActivity> findByUserIdAndDateRange(@Param("userId") UUID userId, @Param("startDate") LocalDate startDate);
}
