package com.aivle.backend.journey.boundary;

import com.aivle.backend.common.entity.BaseEntity;
import com.aivle.backend.project.entity.Project;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "boundary_questions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoundaryQuestion extends BaseEntity {
    public enum State { OPEN, ANSWERED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "project_id", nullable = false) private Project project;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "boundary_version_id", nullable = false) private RegulatoryBoundaryVersion boundaryVersion;
    @Column(nullable = false, length = 100) private String questionKey;
    @Column(nullable = false, columnDefinition = "TEXT") private String question;
    @Column(nullable = false, columnDefinition = "TEXT") private String reason;
    @Column(length = 100) private String targetBriefField;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private State state;
    @Column(columnDefinition = "TEXT") private String answerJson;
    private LocalDateTime answeredAt;

    public static BoundaryQuestion open(RegulatoryBoundaryVersion boundaryVersion, String questionKey,
            String question, String reason, String targetBriefField) {
        if (questionKey == null || questionKey.isBlank()) throw new IllegalArgumentException("question key is required");
        if (question == null || question.isBlank()) throw new IllegalArgumentException("question is required");
        if (reason == null || reason.isBlank()) throw new IllegalArgumentException("question reason is required");
        BoundaryQuestion value = new BoundaryQuestion();
        value.project = boundaryVersion.getProject();
        value.boundaryVersion = boundaryVersion;
        value.questionKey = questionKey;
        value.question = question;
        value.reason = reason;
        value.targetBriefField = targetBriefField;
        value.state = State.OPEN;
        return value;
    }

    public void answer(String answerJson, LocalDateTime now) {
        if (state != State.OPEN) throw new IllegalStateException("question is not open");
        if (answerJson == null || answerJson.isBlank()) throw new IllegalArgumentException("answer is required");
        state = State.ANSWERED;
        this.answerJson = answerJson;
        answeredAt = now;
    }
}
