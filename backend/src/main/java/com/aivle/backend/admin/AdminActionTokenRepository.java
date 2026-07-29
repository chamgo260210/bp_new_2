package com.aivle.backend.admin;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface AdminActionTokenRepository extends JpaRepository<AdminActionToken,Long>{ Optional<AdminActionToken> findByTokenHash(String tokenHash); }
