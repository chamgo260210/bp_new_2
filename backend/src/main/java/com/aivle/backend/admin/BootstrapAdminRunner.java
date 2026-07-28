package com.aivle.backend.admin;

import com.aivle.backend.audit.AuditEventType;
import com.aivle.backend.audit.DomainAuditService;
import com.aivle.backend.common.entity.UserRole;
import com.aivle.backend.user.entity.User;
import com.aivle.backend.user.repository.UserRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class BootstrapAdminRunner implements ApplicationRunner {
    private final BootstrapAdminProperties properties;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final DomainAuditService audits;
    private final Clock jobClock;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!properties.enabled()) return;
        if (blank(properties.username()) || blank(properties.email()) || blank(properties.password())) {
            log.warn("Bootstrap admin is enabled but required environment variables are missing; no account was created.");
            return;
        }
        String username = properties.username().trim().toLowerCase(Locale.ROOT);
        String email = properties.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByUsername(username) || users.existsByEmailIgnoreCase(email)) {
            log.info("Bootstrap admin already exists; creation skipped.");
            return;
        }
        User user = User.register(username, email, passwordEncoder.encode(properties.password()), "Bootstrap Admin", null, null, null);
        user.updateRole(UserRole.ADMIN, null, LocalDateTime.now(jobClock));
        users.save(user);
        audits.record(user.getId(), null, AuditEventType.BOOTSTRAP_ADMIN_CREATED, "USER", user.getId(), null, Map.of("status", "ACTIVE"));
        log.info("Bootstrap admin created for username {}.", username);
    }

    private boolean blank(String value) { return value == null || value.isBlank(); }
}
