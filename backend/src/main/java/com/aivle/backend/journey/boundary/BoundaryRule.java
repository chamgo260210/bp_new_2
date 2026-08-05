package com.aivle.backend.journey.boundary;

import com.aivle.backend.common.entity.BaseEntity;
import com.aivle.backend.project.entity.Project;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "boundary_rules")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoundaryRule extends BaseEntity {
    public enum RuleType {
        PROHIBITED_ROLE,
        PROHIBITED_ACTIVITY,
        ALLOWED_PATTERN,
        REQUIRED_CONTROL,
        REQUIRED_PARTNER,
        REQUIRED_DISCLOSURE,
        UNRESOLVED_FACT
    }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "project_id", nullable = false) private Project project;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "boundary_version_id", nullable = false) private RegulatoryBoundaryVersion boundaryVersion;
    @Column(nullable = false, length = 100) private String ruleKey;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 40) private RuleType ruleType;
    @Column(nullable = false, columnDefinition = "TEXT") private String statement;
    @Column(nullable = false, columnDefinition = "TEXT") private String rationale;
    @Column(nullable = false, columnDefinition = "TEXT") private String affectedBriefFieldsJson;
    @Column(nullable = false, columnDefinition = "TEXT") private String evidenceIdsJson;
    @Column(length = 20) private String severity;
    @Column(nullable = false, columnDefinition = "TEXT") private String userActionOptionsJson;

    public static BoundaryRule create(RegulatoryBoundaryVersion boundaryVersion, String ruleKey,
            RuleType ruleType, String statement, String rationale, String affectedBriefFieldsJson,
            String evidenceIdsJson, String severity, String userActionOptionsJson) {
        requireText(ruleKey, "rule key");
        requireText(statement, "statement");
        requireText(rationale, "rationale");
        requireText(affectedBriefFieldsJson, "affected brief fields");
        requireText(evidenceIdsJson, "evidence ids");
        requireText(userActionOptionsJson, "user action options");
        BoundaryRule value = new BoundaryRule();
        value.project = boundaryVersion.getProject();
        value.boundaryVersion = boundaryVersion;
        value.ruleKey = ruleKey;
        value.ruleType = ruleType;
        value.statement = statement;
        value.rationale = rationale;
        value.affectedBriefFieldsJson = affectedBriefFieldsJson;
        value.evidenceIdsJson = evidenceIdsJson;
        value.severity = severity;
        value.userActionOptionsJson = userActionOptionsJson;
        return value;
    }

    private static void requireText(String value, String name) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(name + " is required");
    }
}
