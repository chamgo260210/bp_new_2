package com.aivle.backend.admin;

import com.aivle.backend.audit.AuditEvent;
import com.aivle.backend.audit.AuditEventRepository;
import com.aivle.backend.audit.AuditEventType;
import com.aivle.backend.audit.DomainAuditService;
import com.aivle.backend.common.entity.UserRole;
import com.aivle.backend.common.entity.UserStatus;
import com.aivle.backend.common.exception.BusinessException;
import com.aivle.backend.common.exception.ErrorCode;
import com.aivle.backend.common.response.ApiResponse;
import com.aivle.backend.user.entity.User;
import com.aivle.backend.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminAccessService access;
    private final AdminUserService adminUsers;
    private final UserRepository users;
    private final AdminProjectService adminProjects;
    private final AuditEventRepository auditEvents;
    private final ServiceSettingRepository settings;
    private final DomainAuditService audits;
    private final Clock jobClock;
    private final AdminOverviewService overviewService;
    private final AdminReauthenticationService reauthentication;

    @PostMapping("/reauthenticate")
    public ApiResponse<AdminReauthenticationService.IssuedToken> reauthenticate(@Valid @RequestBody ReauthenticationRequest body, HttpServletRequest request) {
        return ApiResponse.success(reauthentication.issue(access.requireAdmin(), body.password(), body.purpose()), requestId(request));
    }

    @GetMapping("/overview")
    public ApiResponse<OverviewResponse> overview(HttpServletRequest request) {
        access.requireAdmin();
        return ApiResponse.success(overviewService.overview(), requestId(request));
    }

    @GetMapping("/users")
    public ApiResponse<Page<AdminUserService.AdminUserResponse>> users(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String role,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "createdAt,desc") String sort,
        HttpServletRequest request
    ) {
        access.requireAdmin();
        return ApiResponse.success(adminUsers.list(keyword, parseRole(role), parseStatus(status), pageable(page, size, sort)), requestId(request));
    }

    @GetMapping("/users/{userId}")
    public ApiResponse<AdminUserService.AdminUserResponse> user(@PathVariable Long userId, HttpServletRequest request) {
        access.requireAdmin();
        return ApiResponse.success(adminUsers.detail(userId), requestId(request));
    }

    @PatchMapping("/users/{userId}/status")
    public ApiResponse<AdminUserService.AdminUserResponse> updateStatus(@PathVariable Long userId, @Valid @RequestBody StatusRequest body, @RequestHeader(name = "X-Admin-Action-Token", required = false) String actionToken, HttpServletRequest request) {
        User actor = access.requireAdmin();
        if (parseStatus(body.status()) == UserStatus.DISABLED) reauthentication.requireAndConsume(actor, actionToken, AdminActionPurpose.USER_DISABLE);
        return ApiResponse.success(adminUsers.changeStatus(actor, userId, parseStatus(body.status()), body.reason(), requestId(request)), requestId(request));
    }

    @PatchMapping("/users/{userId}/role")
    public ApiResponse<AdminUserService.AdminUserResponse> updateRole(@PathVariable Long userId, @Valid @RequestBody RoleRequest body, @RequestHeader(name = "X-Admin-Action-Token", required = false) String actionToken, HttpServletRequest request) {
        User actor = access.requireAdmin();
        reauthentication.requireAndConsume(actor, actionToken, AdminActionPurpose.USER_ROLE_CHANGE);
        return ApiResponse.success(adminUsers.changeRole(actor, userId, parseRole(body.role()), body.reason(), requestId(request)), requestId(request));
    }

    @PostMapping("/users/{userId}/sessions/revoke")
    public ApiResponse<Void> revokeSessions(@PathVariable Long userId, @Valid @RequestBody ReasonRequest body, HttpServletRequest request) {
        adminUsers.revokeSessions(access.requireAdmin(), userId, body.reason(), requestId(request));
        return ApiResponse.success(null, requestId(request));
    }

    @GetMapping("/projects")
    public ApiResponse<Page<AdminProjectService.ProjectListItem>> projectList(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String owner,
        @RequestParam(required = false) String area,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String stage,
        @RequestParam(required = false) String industryCategory,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdFrom,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdTo,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "updatedAt,desc") String sort,
        HttpServletRequest request
    ) {
        access.requireAdmin();
        if (createdFrom != null && createdTo != null && createdFrom.isAfter(createdTo)) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }
        var filter = new AdminProjectService.ProjectQuery(
            keyword, owner, parseArea(area), parseProjectStatus(status), parseProjectStage(stage),
            industryCategory, createdFrom, createdTo
        );
        return ApiResponse.success(adminProjects.list(filter, projectPageable(page, size, sort)), requestId(request));
    }

    @GetMapping("/projects/{projectId}")
    public ApiResponse<AdminProjectService.ProjectDetail> project(@PathVariable Long projectId, HttpServletRequest request) {
        access.requireAdmin();
        return ApiResponse.success(adminProjects.detail(projectId), requestId(request));
    }

    @GetMapping("/audit")
    public ApiResponse<Page<AuditResponse>> audit(@RequestParam(required = false) String action, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size, HttpServletRequest request) {
        access.requireAdmin();
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        Page<AuditEvent> events = action == null || action.isBlank()
            ? auditEvents.findAllByOrderByOccurredAtDesc(pageable)
            : auditEvents.findAllByEventTypeContainingIgnoreCaseOrderByOccurredAtDesc(action.trim(), pageable);
        return ApiResponse.success(events.map(this::auditResponse), requestId(request));
    }

    @GetMapping("/settings")
    public ApiResponse<List<SettingResponse>> settings(HttpServletRequest request) {
        access.requireAdmin();
        return ApiResponse.success(java.util.Arrays.stream(ServiceSettingKey.values()).map(key -> settings.findById(key.name())
            .map(this::settingResponse).orElse(new SettingResponse(key.name(), key.defaultValue(), null, null))).toList(), requestId(request));
    }

    @PatchMapping("/settings/{key}")
    public ApiResponse<SettingResponse> updateSetting(@PathVariable String key, @Valid @RequestBody SettingRequest body, @RequestHeader(name = "X-Admin-Action-Token", required = false) String actionToken, HttpServletRequest request) {
        User actor = access.requireAdmin();
        ServiceSettingKey settingKey;
        try { settingKey = ServiceSettingKey.valueOf(key); } catch (IllegalArgumentException exception) { throw new BusinessException(ErrorCode.SERVICE_SETTING_INVALID); }
        if (!("true".equals(body.value()) || "false".equals(body.value()))) throw new BusinessException(ErrorCode.SERVICE_SETTING_INVALID);
        if (settingKey == ServiceSettingKey.MAINTENANCE_MODE && "true".equals(body.value())) reauthentication.requireAndConsume(actor, actionToken, AdminActionPurpose.MAINTENANCE_MODE_ENABLE);
        LocalDateTime now = LocalDateTime.now(jobClock);
        ServiceSetting setting = settings.findById(settingKey.name()).orElseGet(() -> new ServiceSetting(settingKey.name(), body.value(), actor.getId(), now));
        String before = setting.getSettingValue();
        setting.update(body.value(), actor.getId(), now);
        settings.save(setting);
        audits.record(actor.getId(), null, AuditEventType.ADMIN_SETTING_UPDATED, "SERVICE_SETTING", null, requestId(request),
            Map.of("settingKey", settingKey.name(), "before", before, "after", body.value(), "reason", body.reason()));
        return ApiResponse.success(settingResponse(setting), requestId(request));
    }

    @GetMapping("/ai/services")
    public ApiResponse<AvailabilityResponse> aiServices(HttpServletRequest request) { access.requireAdmin(); return ApiResponse.success(new AvailabilityResponse(false, List.of()), requestId(request)); }
    @GetMapping("/jobs")
    public ApiResponse<AvailabilityResponse> jobs(HttpServletRequest request) { access.requireAdmin(); return ApiResponse.success(new AvailabilityResponse(false, List.of()), requestId(request)); }

    private Pageable pageable(int page, int size, String sort) {
        String[] parts = sort.split(",", 2);
        boolean supported = switch (parts[0]) {
            case "lastLoginAt", "username", "createdAt", "displayName" -> true;
            default -> false;
        };
        String property = supported && "displayName".equals(parts[0]) ? "name" : supported ? parts[0] : "createdAt";
        Sort.Direction direction = supported && parts.length > 1 && "asc".equalsIgnoreCase(parts[1])
            ? Sort.Direction.ASC
            : Sort.Direction.DESC;
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(direction, property));
    }
    private Pageable projectPageable(int page, int size, String sort) {
        String[] parts = sort.split(",", 2);
        boolean supported = switch (parts[0]) {
            case "createdAt", "updatedAt", "title", "status", "stage" -> true;
            default -> false;
        };
        String property = supported ? parts[0] : "updatedAt";
        Sort.Direction direction = supported && parts.length > 1 && "asc".equalsIgnoreCase(parts[1])
            ? Sort.Direction.ASC
            : Sort.Direction.DESC;
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(direction, property));
    }
    private UserRole parseRole(String value) { if (value == null || value.isBlank()) return null; try { return UserRole.valueOf(value.toUpperCase(Locale.ROOT)); } catch (IllegalArgumentException e) { throw new BusinessException(ErrorCode.INVALID_REQUEST); } }
    private UserStatus parseStatus(String value) { if (value == null || value.isBlank()) return null; try { return UserStatus.valueOf(value.toUpperCase(Locale.ROOT)); } catch (IllegalArgumentException e) { throw new BusinessException(ErrorCode.INVALID_REQUEST); } }
    private ProjectArea parseArea(String value) { if (value == null || value.isBlank()) return null; try { return ProjectArea.valueOf(value.toUpperCase(Locale.ROOT)); } catch (IllegalArgumentException e) { throw new BusinessException(ErrorCode.INVALID_REQUEST); } }
    private com.aivle.backend.common.entity.ProjectStatus parseProjectStatus(String value) { if (value == null || value.isBlank()) return null; try { return com.aivle.backend.common.entity.ProjectStatus.valueOf(value.toUpperCase(Locale.ROOT)); } catch (IllegalArgumentException e) { throw new BusinessException(ErrorCode.INVALID_REQUEST); } }
    private com.aivle.backend.common.entity.ProjectStage parseProjectStage(String value) { if (value == null || value.isBlank()) return null; try { return com.aivle.backend.common.entity.ProjectStage.valueOf(value.toUpperCase(Locale.ROOT)); } catch (IllegalArgumentException e) { throw new BusinessException(ErrorCode.INVALID_REQUEST); } }
    private AuditResponse auditResponse(AuditEvent a) { return new AuditResponse(a.getId(), a.getActorUserId(), a.getEventType(), a.getAggregateType(), a.getAggregateId(), a.getRequestId(), a.getMetadataJson(), a.getOccurredAt()); }
    private SettingResponse settingResponse(ServiceSetting s) { return new SettingResponse(s.getSettingKey(), s.getSettingValue(), s.getUpdatedBy(), s.getUpdatedAt()); }
    private String requestId(HttpServletRequest request) { return request.getHeader("X-Request-Id"); }

    public record StatusRequest(String status, @NotBlank(message = "reason is required") String reason) { }
    public record RoleRequest(String role, @NotBlank(message = "reason is required") String reason) { }
    public record ReasonRequest(@NotBlank(message = "reason is required") String reason) { }
    public record SettingRequest(String value, @NotBlank(message = "reason is required") String reason) { }
    public record ReauthenticationRequest(@NotBlank String password, AdminActionPurpose purpose) { }
    public record UserMetrics(long total, long active, long locked) { }
    public record ProjectMetrics(long total, long active, long completed) { }
    public record JobMetrics(long pending, long running, long failed, boolean available) { }
    public record OverviewResponse(UserMetrics users, ProjectMetrics projects, JobMetrics jobs, LocalDateTime generatedAt) { }
    public record AuditResponse(Long id, Long actorUserId, String action, String aggregateType, Long aggregateId, String requestId, String metadata, LocalDateTime occurredAt) { }
    public record SettingResponse(String key, String value, Long updatedBy, LocalDateTime updatedAt) { }
    public record AvailabilityResponse(boolean available, List<Object> items) { }
}
