package com.aivle.backend.journey.boundary;

import com.aivle.backend.common.entity.BaseEntity;
import com.aivle.backend.journey.brief.OpportunityBriefVersion;
import com.aivle.backend.project.entity.Project;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "regulatory_boundary_versions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RegulatoryBoundaryVersion extends BaseEntity {
    public enum Status { READY, NEEDS_INPUT, BLOCKED, FAILED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "project_id", nullable = false) private Project project;
    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "run_id", nullable = false) private RegulatoryBoundaryRun run;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "brief_version_id", nullable = false) private OpportunityBriefVersion briefVersion;
    @Column(nullable = false) private int versionNumber;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Status status;
    @Column(nullable = false, columnDefinition = "TEXT") private String snapshotJson;
    @Column(nullable = false, length = 71) private String snapshotHash;

    public static RegulatoryBoundaryVersion create(RegulatoryBoundaryRun run, int versionNumber,
            Status status, String snapshotJson, String snapshotHash) {
        if (run.getState() != RegulatoryBoundaryRun.State.SUCCEEDED) {
            throw new IllegalStateException("boundary version requires a successful run");
        }
        if (versionNumber <= 0) throw new IllegalArgumentException("version number must be positive");
        if (snapshotHash == null || !snapshotHash.startsWith("sha256:")) {
            throw new IllegalArgumentException("canonical snapshot hash is required");
        }
        RegulatoryBoundaryVersion value = new RegulatoryBoundaryVersion();
        value.project = run.getProject();
        value.run = run;
        value.briefVersion = run.getBriefVersion();
        value.versionNumber = versionNumber;
        value.status = status;
        value.snapshotJson = snapshotJson;
        value.snapshotHash = snapshotHash;
        return value;
    }
}
