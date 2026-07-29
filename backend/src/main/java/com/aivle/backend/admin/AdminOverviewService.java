package com.aivle.backend.admin;

import com.aivle.backend.common.entity.ProjectStatus;
import com.aivle.backend.common.entity.UserRole;
import com.aivle.backend.common.entity.UserStatus;
import com.aivle.backend.project.repository.ProjectRepository;
import com.aivle.backend.user.repository.UserRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminOverviewService {
    private final UserRepository users;
    private final ProjectRepository projects;
    private final Clock jobClock;
    @Transactional(readOnly = true)
    public AdminController.OverviewResponse overview() {
        long active = users.countByRoleAndStatusAndDeletedAtIsNull(UserRole.USER, UserStatus.ACTIVE)
            + users.countByRoleAndStatusAndDeletedAtIsNull(UserRole.ADMIN, UserStatus.ACTIVE);
        long locked = users.countByRoleAndStatusAndDeletedAtIsNull(UserRole.USER, UserStatus.LOCKED)
            + users.countByRoleAndStatusAndDeletedAtIsNull(UserRole.ADMIN, UserStatus.LOCKED);
        long inProgressProjects = projects.countAdminVisibleByStatusIn(
            List.of(ProjectStatus.DRAFT, ProjectStatus.ACTIVE)
        );
        long pausedProjects = projects.countAdminVisibleByStatus(ProjectStatus.PAUSED);
        return new AdminController.OverviewResponse(
            new AdminController.UserMetrics(
                users.countByDeletedAtIsNull(),
                active,
                locked,
                users.countByStatusAndDeletedAtIsNull(UserStatus.DISABLED),
                users.countByRoleAndDeletedAtIsNull(UserRole.ADMIN)
            ),
            new AdminController.ProjectMetrics(
                projects.countAdminVisible(),
                inProgressProjects,
                pausedProjects,
                projects.countAdminVisibleByStatus(ProjectStatus.COMPLETED),
                projects.countAdminVisibleCreatedSince(
                    LocalDateTime.now(jobClock).minusDays(7)
                )
            ),
            new AdminController.JobMetrics(
                false,
                "AI_SERVER_NOT_CONNECTED",
                null,
                null,
                null
            ),
            LocalDateTime.now(jobClock)
        );
    }
}
