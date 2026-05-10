package com.intervai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class RedisService {

    private final RedisTemplate<String, Object> redisTemplate;

    public RedisService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    private static final String STREAK_KEY_PREFIX = "streak:";
    private static final String RATE_LIMIT_KEY_PREFIX = "rate_limit:";
    private static final String SESSION_CACHE_KEY_PREFIX = "session:";
    private static final String DAILY_SESSION_KEY_PREFIX = "daily_sessions:";
    private static final String TOKEN_BLACKLIST_PREFIX = "blacklist:";
    private static final String DAILY_QUESTION_KEY = "daily_question:";

    public void updateStreak(UUID userId, int streakDays) {
        String key = STREAK_KEY_PREFIX + userId;
        redisTemplate.opsForValue().set(key, streakDays, Duration.ofDays(2));
    }

    public Optional<Integer> getStreak(UUID userId) {
        String key = STREAK_KEY_PREFIX + userId;
        Object value = redisTemplate.opsForValue().get(key);
        if (value instanceof Integer i) return Optional.of(i);
        if (value instanceof Long l) return Optional.of(l.intValue());
        return Optional.empty();
    }

    public boolean isRateLimited(String identifier, String action, int maxRequests, Duration window) {
        String key = RATE_LIMIT_KEY_PREFIX + action + ":" + identifier;
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, window);
        }
        return count != null && count > maxRequests;
    }

    public long getRemainingRequests(String identifier, String action, int maxRequests) {
        String key = RATE_LIMIT_KEY_PREFIX + action + ":" + identifier;
        Object count = redisTemplate.opsForValue().get(key);
        if (count instanceof Long l) return Math.max(0, maxRequests - l);
        if (count instanceof Integer i) return Math.max(0, maxRequests - i);
        return maxRequests;
    }

    public int getDailySessionCount(UUID userId) {
        String key = DAILY_SESSION_KEY_PREFIX + userId + ":" + java.time.LocalDate.now();
        Object count = redisTemplate.opsForValue().get(key);
        if (count instanceof Integer i) return i;
        if (count instanceof Long l) return l.intValue();
        return 0;
    }

    public void incrementDailySessionCount(UUID userId) {
        String key = DAILY_SESSION_KEY_PREFIX + userId + ":" + java.time.LocalDate.now();
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, Duration.ofHours(25));
        }
    }

    public void blacklistToken(String token, long expirationMs) {
        String key = TOKEN_BLACKLIST_PREFIX + token;
        redisTemplate.opsForValue().set(key, "blacklisted", Duration.ofMillis(expirationMs));
    }

    public boolean isTokenBlacklisted(String token) {
        String key = TOKEN_BLACKLIST_PREFIX + token;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public void set(String key, Object value, Duration ttl) {
        redisTemplate.opsForValue().set(key, value, ttl);
    }

    public Optional<Object> get(String key) {
        return Optional.ofNullable(redisTemplate.opsForValue().get(key));
    }

    public void delete(String key) {
        redisTemplate.delete(key);
    }

    public boolean hasKey(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public void cacheDailyQuestion(String date, String questionJson) {
        String key = DAILY_QUESTION_KEY + date;
        redisTemplate.opsForValue().set(key, questionJson, Duration.ofDays(2));
    }

    public Optional<String> getCachedDailyQuestion(String date) {
        String key = DAILY_QUESTION_KEY + date;
        Object val = redisTemplate.opsForValue().get(key);
        return Optional.ofNullable(val != null ? val.toString() : null);
    }

    public void cacheSession(UUID sessionId, Object sessionData) {
        String key = SESSION_CACHE_KEY_PREFIX + sessionId;
        redisTemplate.opsForValue().set(key, sessionData, Duration.ofMinutes(30));
    }

    public void evictSessionCache(UUID sessionId) {
        String key = SESSION_CACHE_KEY_PREFIX + sessionId;
        redisTemplate.delete(key);
    }
}
