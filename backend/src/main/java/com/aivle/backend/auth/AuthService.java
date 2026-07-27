package com.aivle.backend.auth;

import com.aivle.backend.audit.AuditEventType;
import com.aivle.backend.audit.DomainAuditService;
import com.aivle.backend.auth.dto.AuthResponse;
import com.aivle.backend.auth.dto.TokenPairResponse;
import com.aivle.backend.auth.dto.SignupResponse;
import com.aivle.backend.auth.dto.UserResponse;
import com.aivle.backend.auth.dto.UsernamePolicy;
import com.aivle.backend.common.exception.BusinessException;
import com.aivle.backend.common.exception.ErrorCode;
import com.aivle.backend.user.entity.User;
import com.aivle.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.Normalizer;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final String DUMMY_PASSWORD_HASH =
        "$2a$10$7EqJtq98hPqEX7fNZaFWoO5Z14qfIVxqMFXvYI7P0n0nK5YzT.y1C";
    private static final int PASSWORD_MIN_CHARACTERS = 15;
    private static final int PASSWORD_MAX_CHARACTERS = 64;
    private static final Set<String> COMMON_PASSWORDS = Set.of("password", "password123", "qwerty", "123456789", "ventureverify", "ventureverify123", "letmein", "welcome123");

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final JwtProperties jwtProperties;
    private final DomainAuditService auditService;
    private final Clock jobClock;
    private final LoginAttemptRateLimiter loginAttemptRateLimiter;

    @Transactional
    public SignupResponse signup(
        String username,
        String rawPassword,
        String displayName,
        String email, String organizationName, String departmentName, String jobTitle,
        String requestId
    ) {
        String normalizedUsername = normalizeUsername(username);
        validateUsername(normalizedUsername); validatePassword(rawPassword, normalizedUsername, displayName);
        String normalizedEmail = normalizeEmail(email);
        if (userRepository.existsByUsername(normalizedUsername)) throw new BusinessException(ErrorCode.USERNAME_ALREADY_EXISTS);
        if (normalizedEmail != null && userRepository.existsByEmailIgnoreCase(normalizedEmail)) throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);

        User user = User.register(
            normalizedUsername, normalizedEmail,
            passwordEncoder.encode(rawPassword),
            normalizeDisplayName(displayName), organizationName, departmentName, jobTitle
        );
        try {
            userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            throw new BusinessException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }
        auditService.record(
            user.getId(),
            null,
            AuditEventType.USER_SIGNED_UP,
            "USER",
            user.getId(),
            requestId,
            Map.of("status", user.getStatus().name())
        );
        return SignupResponse.from(UserResponse.from(user));
    }

    @Transactional(noRollbackFor = BusinessException.class)
    public AuthResponse login(
        String username,
        String rawPassword,
        String ipAddress,
        String requestId
    ) {
        String normalizedUsername = normalizeUsername(username);
        if (loginAttemptRateLimiter.isLimited(normalizedUsername, ipAddress)) {
            throw new LoginRateLimitExceededException(
                loginAttemptRateLimiter.retryAfterSeconds(normalizedUsername, ipAddress)
            );
        }
        User user = userRepository.findByUsername(normalizedUsername)
            .orElse(null);
        boolean passwordShapeValid = isLoginPasswordShapeValid(rawPassword);
        String storedHash = user == null
            ? DUMMY_PASSWORD_HASH
            : user.getPasswordHash();
        String passwordCandidate = passwordShapeValid
            ? rawPassword
            : "invalid-password-shape";
        if (!passwordEncoder.matches(passwordCandidate, storedHash)
            || user == null
            || !passwordShapeValid) {
            auditService.record(
                null,
                null,
                AuditEventType.LOGIN_FAILED,
                "USER",
                null,
                requestId,
                Map.of("safeErrorCode", ErrorCode.INVALID_CREDENTIALS.name())
            );
            loginAttemptRateLimiter.recordFailure(normalizedUsername, ipAddress);
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
        if (!user.canLogin()) {
            auditService.record(
                user.getId(),
                null,
                AuditEventType.LOGIN_FAILED,
                "USER",
                user.getId(),
                requestId,
                Map.of("safeErrorCode", ErrorCode.USER_INACTIVE.name())
            );
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (passwordEncoder.upgradeEncoding(user.getPasswordHash())) user.updatePasswordHash(passwordEncoder.encode(rawPassword));
        loginAttemptRateLimiter.recordSuccess(normalizedUsername, ipAddress);

        user.recordSuccessfulLogin(LocalDateTime.now(jobClock));
        JwtTokenService.IssuedTokenPair pair = issueAndStore(user);
        auditService.record(
            user.getId(),
            null,
            AuditEventType.LOGIN_SUCCEEDED,
            "USER",
            user.getId(),
            requestId,
            Map.of("status", user.getStatus().name())
        );
        return response(user, pair);
    }

    @Transactional
    public TokenPairResponse refresh(String rawToken, String requestId) {
        Jwt jwt = decodeRefresh(rawToken);
        RefreshToken stored = refreshTokenRepository
            .findByTokenHashAndDeletedAtIsNull(hash(rawToken))
            .orElseThrow(() ->
                new BusinessException(ErrorCode.REFRESH_TOKEN_INVALID));
        LocalDateTime now = LocalDateTime.now(jobClock);
        if (!stored.isUsableAt(now)
            || !stored.getTokenJti().equals(jwt.getId())
            || !stored.getUser().getId().toString().equals(jwt.getSubject())
            || !stored.getUser().canLogin()) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        stored.revoke(now);
        JwtTokenService.IssuedTokenPair pair = issueAndStore(stored.getUser());
        auditService.record(
            stored.getUser().getId(),
            null,
            AuditEventType.REFRESH_ROTATED,
            "REFRESH_TOKEN",
            stored.getId(),
            requestId,
            Map.of("status", "ROTATED")
        );
        return tokenResponse(pair);
    }

    @Transactional
    public void logout(
        Long currentUserId,
        String rawToken,
        String requestId
    ) {
        Jwt jwt = decodeRefresh(rawToken);
        RefreshToken stored = refreshTokenRepository
            .findByTokenHashAndDeletedAtIsNull(hash(rawToken))
            .orElseThrow(() ->
                new BusinessException(ErrorCode.REFRESH_TOKEN_INVALID));
        if (!stored.getUser().getId().equals(currentUserId)
            || !stored.getTokenJti().equals(jwt.getId())
            || !stored.getUser().getId().toString().equals(jwt.getSubject())) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_INVALID);
        }
        stored.revoke(LocalDateTime.now(jobClock));
        auditService.record(
            currentUserId,
            null,
            AuditEventType.LOGOUT_COMPLETED,
            "REFRESH_TOKEN",
            stored.getId(),
            requestId,
            Map.of("status", "REVOKED")
        );
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long currentUserId) {
        User user = userRepository.findById(currentUserId)
            .filter(User::canLogin)
            .orElseThrow(() ->
                new BusinessException(ErrorCode.AUTHENTICATION_REQUIRED));
        return UserResponse.from(user);
    }

    private JwtTokenService.IssuedTokenPair issueAndStore(User user) {
        JwtTokenService.IssuedTokenPair pair =
            jwtTokenService.issue(user.getId());
        JwtTokenService.IssuedToken refresh = pair.refresh();
        refreshTokenRepository.save(RefreshToken.issue(
            user,
            hash(refresh.value()),
            refresh.jti(),
            LocalDateTime.ofInstant(refresh.expiresAt(), ZoneOffset.UTC)
        ));
        return pair;
    }

    private AuthResponse response(
        User user,
        JwtTokenService.IssuedTokenPair pair
    ) {
        return new AuthResponse(UserResponse.from(user), tokenResponse(pair));
    }

    private TokenPairResponse tokenResponse(
        JwtTokenService.IssuedTokenPair pair
    ) {
        return new TokenPairResponse(
            "Bearer",
            pair.access().value(),
            jwtProperties.accessTokenTtl().toSeconds(),
            pair.refresh().value(),
            jwtProperties.refreshTokenTtl().toSeconds()
        );
    }

    private Jwt decodeRefresh(String rawToken) {
        try {
            return jwtTokenService.decodeRefresh(rawToken);
        } catch (JwtException | IllegalArgumentException exception) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_INVALID);
        }
    }

    private String normalizeEmail(String email) {
        return email == null || email.trim().isEmpty() ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeUsername(String username) { return username.trim().toLowerCase(Locale.ROOT); }
    private void validateUsername(String username) { if (UsernamePolicy.RESERVED.contains(username)) throw new BusinessException(ErrorCode.USERNAME_NOT_ALLOWED); }

    private String normalizeDisplayName(String displayName) {
        return Normalizer.normalize(displayName.trim(), Normalizer.Form.NFC);
    }

    private void validatePassword(String password, String username, String displayName) {
        String folded = password.toLowerCase(Locale.ROOT);
        String normalizedName = normalizeDisplayName(displayName).toLowerCase(Locale.ROOT);
        if (!isPasswordShapeValid(password) || COMMON_PASSWORDS.contains(folded) || folded.equals(username) || folded.matches(java.util.regex.Pattern.quote(username) + "\\d+") || (normalizedName.length() >= 4 && folded.contains(normalizedName))) {
            throw new BusinessException(ErrorCode.PASSWORD_POLICY_VIOLATION);
        }
    }

    private boolean isPasswordShapeValid(String password) {
        return password.length() >= PASSWORD_MIN_CHARACTERS && password.length() <= PASSWORD_MAX_CHARACTERS;
    }

    private boolean isLoginPasswordShapeValid(String password) {
        return password != null && !password.isEmpty() && password.length() <= 72;
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
