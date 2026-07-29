package com.aivle.backend.admin;
import com.aivle.backend.common.exception.*;
import com.aivle.backend.user.entity.User;
import java.nio.charset.StandardCharsets; import java.security.MessageDigest; import java.time.*; import java.util.HexFormat; import java.util.UUID;
import lombok.RequiredArgsConstructor; import org.springframework.security.crypto.password.PasswordEncoder; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
@Service @RequiredArgsConstructor public class AdminReauthenticationService {
 private final PasswordEncoder passwords; private final AdminActionTokenRepository tokens; private final Clock jobClock;
 @Transactional public IssuedToken issue(User actor,String password,AdminActionPurpose purpose){if(!passwords.matches(password,actor.getPasswordHash()))throw new BusinessException(ErrorCode.ADMIN_REAUTHENTICATION_FAILED); String raw=UUID.randomUUID()+"."+UUID.randomUUID(); LocalDateTime now=LocalDateTime.now(jobClock); tokens.save(AdminActionToken.issue(actor.getId(),purpose.name(),hash(raw),now.plusMinutes(5),actor.getSecurityVersion(),now)); return new IssuedToken(raw,now.plusMinutes(5));}
 @Transactional public void requireAndConsume(User actor,String raw,AdminActionPurpose purpose){if(raw==null||raw.isBlank())throw new BusinessException(ErrorCode.REAUTHENTICATION_REQUIRED); AdminActionToken token=tokens.findByTokenHash(hash(raw)).orElseThrow(()->new BusinessException(ErrorCode.ADMIN_REAUTHENTICATION_FAILED)); LocalDateTime now=LocalDateTime.now(jobClock); if(token.getUsedAt()!=null)throw new BusinessException(ErrorCode.ADMIN_ACTION_TOKEN_ALREADY_USED); if(!token.getPurpose().equals(purpose.name()))throw new BusinessException(ErrorCode.ADMIN_REAUTHENTICATION_PURPOSE_MISMATCH); if(!token.getExpiresAt().isAfter(now))throw new BusinessException(ErrorCode.ADMIN_REAUTHENTICATION_EXPIRED); if(!token.getActorUserId().equals(actor.getId())||!token.getSecurityVersion().equals(actor.getSecurityVersion()))throw new BusinessException(ErrorCode.ADMIN_REAUTHENTICATION_FAILED); token.consume(now);}
 private String hash(String raw){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
 public record IssuedToken(String actionToken,LocalDateTime expiresAt){}
}
