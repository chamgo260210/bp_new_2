package com.aivle.backend.journey.boundary;

import com.aivle.backend.common.entity.BaseEntity;
import com.aivle.backend.journey.brief.OpportunityBriefVersion;
import com.aivle.backend.project.entity.Project;
import com.aivle.backend.taskrun.domain.TaskRun;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "regulatory_boundary_runs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RegulatoryBoundaryRun extends BaseEntity {
    public enum State { QUEUED, RUNNING, SUCCEEDED, FAILED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "project_id", nullable = false) private Project project;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "brief_version_id", nullable = false) private OpportunityBriefVersion briefVersion;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "task_run_id") private TaskRun taskRun;
    @Column(nullable = false, length = 71) private String inputSnapshotHash;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private State state;
    @Column(length = 80) private String errorCode;
    private LocalDateTime completedAt;

    public static RegulatoryBoundaryRun queued(Project project, OpportunityBriefVersion briefVersion,
            TaskRun taskRun, String inputSnapshotHash) {
        if (briefVersion.getState() != OpportunityBriefVersion.State.CONFIRMED) {
            throw new IllegalArgumentException("boundary run requires a confirmed brief");
        }
        if (!briefVersion.getProject().getId().equals(project.getId())) {
            throw new IllegalArgumentException("brief must belong to project");
        }
        if (taskRun != null && !taskRun.getProject().getId().equals(project.getId())) {
            throw new IllegalArgumentException("task run must belong to project");
        }
        if (inputSnapshotHash == null || !inputSnapshotHash.startsWith("sha256:")) {
            throw new IllegalArgumentException("canonical input snapshot hash is required");
        }
        RegulatoryBoundaryRun value = new RegulatoryBoundaryRun();
        value.project = project;
        value.briefVersion = briefVersion;
        value.taskRun = taskRun;
        value.inputSnapshotHash = inputSnapshotHash;
        value.state = State.QUEUED;
        return value;
    }

    public void start() {
        requireState(State.QUEUED);
        state = State.RUNNING;
    }

    public void succeed(LocalDateTime now) {
        requireState(State.RUNNING);
        state = State.SUCCEEDED;
        errorCode = null;
        completedAt = now;
    }

    public void fail(String code, LocalDateTime now) {
        requireState(State.RUNNING);
        if (code == null || code.isBlank()) throw new IllegalArgumentException("failure code is required");
        state = State.FAILED;
        errorCode = code;
        completedAt = now;
    }

    private void requireState(State expected) {
        if (state != expected) throw new IllegalStateException("invalid boundary run state transition");
    }
}
