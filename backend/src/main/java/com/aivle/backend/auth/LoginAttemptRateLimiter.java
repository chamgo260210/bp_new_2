package com.aivle.backend.auth;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginAttemptRateLimiter {
    private static final int MAX_FAILURES = 5;
    private static final Duration WINDOW = Duration.ofMinutes(10);
    private final ConcurrentHashMap<String, Attempt> attempts = new ConcurrentHashMap<>();
    private final Clock clock;

    public LoginAttemptRateLimiter(Clock clock) { this.clock = clock; }

    public boolean isLimited(String username, String ipAddress) {
        Instant now = clock.instant();
        return limited("user:" + username, now) || limited("ip:" + ipAddress, now);
    }

    public long retryAfterSeconds(String username, String ipAddress) {
        Instant now = clock.instant();
        return Math.max(remainingSeconds("user:" + username, now), remainingSeconds("ip:" + ipAddress, now));
    }

    public void recordFailure(String username, String ipAddress) {
        Instant now = clock.instant();
        record("user:" + username, now); record("ip:" + ipAddress, now);
    }

    public void recordSuccess(String username, String ipAddress) {
        attempts.remove("user:" + username); attempts.remove("ip:" + ipAddress);
    }

    private boolean limited(String key, Instant now) { Attempt attempt = attempts.get(key); return attempt != null && now.isBefore(attempt.startedAt.plus(WINDOW)) && attempt.count >= MAX_FAILURES; }
    private long remainingSeconds(String key, Instant now) {
        Attempt attempt = attempts.get(key);
        if (attempt == null || attempt.count < MAX_FAILURES) return 0;
        long seconds = Duration.between(now, attempt.startedAt.plus(WINDOW)).toSeconds();
        return Math.max(0, seconds);
    }
    private void record(String key, Instant now) { attempts.compute(key, (ignored, current) -> current == null || !now.isBefore(current.startedAt.plus(WINDOW)) ? new Attempt(now, 1) : new Attempt(current.startedAt, current.count + 1)); }
    private record Attempt(Instant startedAt, int count) { }
}
