package com.aivle.backend.journey.boundary;

import com.aivle.backend.common.entity.BaseEntity;
import com.aivle.backend.project.entity.Project;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "boundary_evidence")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoundaryEvidence extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "project_id", nullable = false) private Project project;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "boundary_version_id", nullable = false) private RegulatoryBoundaryVersion boundaryVersion;
    @Column(nullable = false, length = 100) private String evidenceKey;
    @Column(nullable = false, length = 300) private String lawName;
    @Column(length = 200) private String article;
    @Column(length = 500) private String title;
    @Column(nullable = false, columnDefinition = "TEXT") private String excerpt;
    @Column(length = 40) private String effectiveDate;
    @Column(nullable = false, length = 1000) private String sourceUrl;
    @Column(nullable = false, length = 30) private String sourceStatus;

    public static BoundaryEvidence create(RegulatoryBoundaryVersion boundaryVersion, String evidenceKey,
            String lawName, String article, String title, String excerpt, String effectiveDate,
            String sourceUrl, String sourceStatus) {
        requireText(evidenceKey, "evidence key");
        requireText(lawName, "law name");
        requireText(excerpt, "excerpt");
        requireText(sourceUrl, "source URL");
        requireText(sourceStatus, "source status");
        BoundaryEvidence value = new BoundaryEvidence();
        value.project = boundaryVersion.getProject();
        value.boundaryVersion = boundaryVersion;
        value.evidenceKey = evidenceKey;
        value.lawName = lawName;
        value.article = article;
        value.title = title;
        value.excerpt = excerpt;
        value.effectiveDate = effectiveDate;
        value.sourceUrl = sourceUrl;
        value.sourceStatus = sourceStatus;
        return value;
    }

    private static void requireText(String value, String name) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(name + " is required");
    }
}
