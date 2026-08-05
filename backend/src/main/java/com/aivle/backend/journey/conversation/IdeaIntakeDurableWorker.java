package com.aivle.backend.journey.conversation;

import com.aivle.backend.jobevent.JobEvent;
import com.aivle.backend.jobevent.JobEventPublisher;
import com.aivle.backend.taskrun.domain.TaskRun;
import com.aivle.backend.taskrun.domain.TaskType;
import com.aivle.backend.taskrun.service.TaskRunService;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class IdeaIntakeDurableWorker {
    private static final List<TaskType> TYPES = List.of(TaskType.IDEA_ATTACHMENT_PARSE, TaskType.IDEA_CONVERSATION_TURN);
    private final TaskRunService tasks;
    private final IdeaAttachmentProcessor attachments;
    private final IdeaAttachmentStateService attachmentState;
    private final IdeaAttachmentRepository attachmentRepository;
    private final IdeaIntakeAiService turns;
    private final JobEventPublisher events;
    private final ObjectMapper mapper;
    private final String workerId = "idea-intake-" + java.util.UUID.randomUUID();

    public IdeaIntakeDurableWorker(TaskRunService tasks, IdeaAttachmentProcessor attachments,
            IdeaAttachmentStateService attachmentState, IdeaAttachmentRepository attachmentRepository,
            IdeaIntakeAiService turns,
            JobEventPublisher events, ObjectMapper mapper) {
        this.tasks = tasks; this.attachments = attachments; this.attachmentState = attachmentState;
        this.attachmentRepository = attachmentRepository;
        this.turns = turns; this.events = events; this.mapper = mapper;
    }

    @Scheduled(fixedDelayString = "${app.task-run.idea-intake-poll-interval-ms:1000}")
    public void poll() {
        process(TaskType.IDEA_ATTACHMENT_PARSE);
        process(TaskType.IDEA_CONVERSATION_TURN);
    }

    @Scheduled(fixedDelayString = "${app.task-run.idea-intake-recovery-interval-ms:5000}")
    public void recover() {
        for (String id : tasks.recoverExpiredTaskIds(Duration.ZERO, TYPES)) {
            TaskRun run = tasks.getOwnedForWorker(id);
            publish(run, "RECOVERY", "job.recovered", JobEvent.Status.QUEUED, "job.recovered", null);
        }
    }

    void process(TaskType type) {
        // Lease intentionally exceeds the execution deadline so a healthy worker cannot be
        // recovered and executed concurrently before its bounded call has timed out.
        TaskRunService.Claim claim = tasks.claimNext(type, workerId, Duration.ofMinutes(5), Duration.ofMinutes(3));
        if (claim == null) return;
        TaskRun run = tasks.getOwnedForWorker(claim.taskRunId());
        publish(run, "WORKER", "job.claimed", JobEvent.Status.RUNNING, "job.claimed", null);
        tasks.startExecution(claim.taskRunId(), claim.taskAttemptId(), claim.claimToken());
        publish(run, "WORKER", "job.started", JobEvent.Status.RUNNING, "job.started", null);
        if (type == TaskType.IDEA_CONVERSATION_TURN) {
            turns.executeClaim(claim);
            return;
        }
        executeAttachment(run, claim);
    }

    private void executeAttachment(TaskRun run, TaskRunService.Claim claim) {
        var input = mapper.readTree(run.getInputSnapshot());
        Long attachmentId = input.path("attachmentId").asLong();
        Long conversationId = input.path("conversationId").asLong();
        try {
            IdeaAttachment attachment = attachmentRepository.findByIdAndProjectIdAndConversationIdAndDeletedAtIsNull(
                attachmentId, run.getProject().getId(), conversationId).orElseThrow();
            String hash;
            if (attachment.getStatus() == IdeaAttachment.Status.EXTRACTED
                    && input.path("contentChecksum").asText().equals(attachment.getStoredFile().getChecksumSha256())) {
                hash = attachment.getExtractedTextHash();
            } else {
                hash = attachments.process(run.getProject().getId(), conversationId, attachmentId, run.getId());
            }
            String result = mapper.writeValueAsString(Map.of("attachmentId", attachmentId, "extractedTextHash", hash));
            tasks.adopt(run.getId(), claim.taskAttemptId(), claim.claimToken(), result, run.getInputHash(), "1.0");
            publish(run, "INFORMATION_EXTRACTION", "job.completed", JobEvent.Status.COMPLETED,
                "job.idea.information.extraction.completed", null);
        } catch (RuntimeException failure) {
            tasks.fail(run.getId(), claim.taskAttemptId(), claim.claimToken(),
                "ATTACHMENT_PARSE_FAILED", "ATTACHMENT_PARSE_FAILED", true);
            if (tasks.scheduleRetry(run.getId(), backoff(run.getAttemptCount()))) {
                publish(run, "RETRY", "job.retry.scheduled", JobEvent.Status.RUNNING, "job.retry.scheduled", null);
            } else {
                attachmentState.fail(run.getProject().getId(), conversationId, attachmentId, run.getId(), "ATTACHMENT_PARSE_FAILED");
                publish(run, "ATTACHMENT_PARSING", "job.failed", JobEvent.Status.FAILED,
                    "job.idea.attachment.parsing.failed", "ATTACHMENT_PARSE_FAILED");
            }
        }
    }

    static Duration backoff(int attempt) { return Duration.ofSeconds(Math.min(30, 1L << Math.max(0, attempt - 1))); }

    private void publish(TaskRun run, String stage, String type, JobEvent.Status status, String key, String code) {
        events.publish(new JobEventPublisher.Command(run.getProject().getId(), run.getId(), run.getId(),
            stage, type, status, key, Map.of(), code));
    }
}
