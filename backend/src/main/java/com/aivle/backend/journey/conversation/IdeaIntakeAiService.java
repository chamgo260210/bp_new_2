package com.aivle.backend.journey.conversation;

import com.aivle.backend.document.parsing.DocumentParseRequest;
import com.aivle.backend.document.parsing.DocumentParser;
import com.aivle.backend.file.storage.FileStorage;
import com.aivle.backend.journey.IdeaSource;
import com.aivle.backend.journey.brief.FieldDecisionStatus;
import com.aivle.backend.journey.brief.FieldSourceType;
import com.aivle.backend.journey.brief.OpportunityBriefWorkspaceService;
import com.aivle.backend.jobevent.JobEvent;
import com.aivle.backend.jobevent.JobEventPublisher;
import com.aivle.backend.taskrun.domain.TaskRun;
import com.aivle.backend.taskrun.domain.TaskType;
import com.aivle.backend.taskrun.integration.InternalAiExecutionClient;
import com.aivle.backend.taskrun.integration.InternalAiExecutionClient.ExecutionFailure;
import com.aivle.backend.taskrun.service.CanonicalInputHasher;
import com.aivle.backend.taskrun.service.TaskRunService;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

@Service
public class IdeaIntakeAiService {
    private static final Set<String> RESULT_FIELDS = Set.of("extractedFields", "fieldSuggestions", "assumptions",
        "openFields", "contradictions", "clarificationQuestions", "readiness", "userFacingSummary");
    private static final Set<String> FIELD_FIELDS = Set.of("fieldKey", "valueJson", "decisionStatus", "sourceType", "confidence");
    private static final Set<String> QUESTION_FIELDS = Set.of("id", "fieldKey", "prompt", "type", "options", "allowUndecided");
    private static final Set<String> READINESS = Set.of("NEEDS_INPUT", "READY_FOR_CONFIRMATION");
    private final TaskRunService taskRuns;
    private final CanonicalInputHasher hasher;
    private final InternalAiExecutionClient ai;
    private final ConversationService conversations;
    private final IdeaMessageRepository messages;
    private final IdeaAttachmentRepository attachments;
    private final FileStorage storage;
    private final DocumentParser parser;
    private final OpportunityBriefWorkspaceService briefs;
    private final JobEventPublisher events;
    private final ObjectMapper mapper;
    private final IdeaTurnCompletionService completion;

    public IdeaIntakeAiService(TaskRunService taskRuns, CanonicalInputHasher hasher,
            InternalAiExecutionClient ai, ConversationService conversations, IdeaMessageRepository messages,
            IdeaAttachmentRepository attachments, FileStorage storage, DocumentParser parser,
            OpportunityBriefWorkspaceService briefs, JobEventPublisher events, ObjectMapper mapper,
            IdeaTurnCompletionService completion) {
        this.taskRuns = taskRuns; this.hasher = hasher; this.ai = ai; this.conversations = conversations; this.messages = messages;
        this.attachments = attachments; this.storage = storage; this.parser = parser; this.briefs = briefs;
        this.events = events; this.mapper = mapper; this.completion = completion;
    }

    public TaskView start(Long ownerId, Long projectId, IdeaConversation conversation, IdeaMessage userMessage) {
        String input = buildInput(ownerId, projectId, conversation);
        String key = "idea-conversation-turn:" + userMessage.getId();
        TaskRun run = taskRuns.create(ownerId, projectId, TaskType.IDEA_CONVERSATION_TURN,
            "IDEA_CONVERSATION_MESSAGE", userMessage.getId().toString(), input,
            hasher.hash(TaskType.IDEA_CONVERSATION_TURN, "1.0", "ko-KR", input), key, key, 3);
        events.publish(command(projectId, run.getId(), run.getId(), "BRIEF_DRAFT",
            "job.idea.brief.draft.queued", JobEvent.Status.QUEUED, "job.idea.brief.draft.queued", null));
        return new TaskView(run.getId(), run.getState().name());
    }

    void executeClaim(TaskRunService.Claim claim) {
        String taskRunId = claim.taskRunId();
        TaskRun run = taskRuns.getOwnedForWorker(taskRunId);
        Long projectId = run.getProject().getId();
        Long ownerId = run.getProject().getOwner().getId();
        Long sourceMessageId = Long.valueOf(run.getSubjectId());
        IdeaMessage source = messages.findById(sourceMessageId).orElseThrow();
        Long conversationId = source.getConversation().getId();
        try {
            events.publish(command(projectId, taskRunId, taskRunId, "INFORMATION_EXTRACTION",
                "job.idea.information.extraction.started", JobEvent.Status.RUNNING,
                "job.idea.information.extraction.started", null));
            var response = ai.execute(run, claim.taskAttemptId(), LocalDateTime.now().plusMinutes(2));
            JsonNode result = response.result();
            validate(result);
            events.publish(command(projectId, taskRunId, taskRunId, "BRIEF_DRAFT",
                "job.idea.brief.draft.started", JobEvent.Status.RUNNING, "job.idea.brief.draft.started", null));
            List<OpportunityBriefWorkspaceService.AiField> proposals = fields(result);
            if (!result.get("assumptions").isEmpty()) proposals.add(new OpportunityBriefWorkspaceService.AiField(
                "assumptions", result.get("assumptions"), FieldDecisionStatus.ASSUMPTION,
                FieldSourceType.AI_PROPOSED, null));
            List<IdeaMessageContract.Question> questions = questions(result.get("clarificationQuestions"));
            IdeaMessageContract.Type messageType = questions.isEmpty()
                ? IdeaMessageContract.Type.BRIEF_REVIEW : IdeaMessageContract.Type.QUESTION_SET;
            completion.complete(ownerId, projectId, conversationId, sourceMessageId, run, claim,
                result.toString(), proposals, IdeaMessageContract.assistant(mapper, messageType,
                    result.get("userFacingSummary").asText(), questions,
                    strings(result.get("contradictions")), result.get("readiness").asText()));
            boolean needsInput = "NEEDS_INPUT".equals(result.get("readiness").asText());
            events.publish(command(projectId, taskRunId, taskRunId, "FOLLOW_UP_QUESTIONS",
                needsInput ? "job.idea.questions.completed" : "job.idea.brief.draft.completed",
                needsInput ? JobEvent.Status.NEEDS_INPUT : JobEvent.Status.COMPLETED,
                needsInput ? "job.idea.questions.completed" : "job.idea.brief.draft.completed", null));
        } catch (ExecutionFailure failure) {
            taskRuns.fail(taskRunId, claim.taskAttemptId(), claim.claimToken(),
                failure.code(), failure.reason(), failure.retryable());
            if (failure.retryable() && taskRuns.scheduleRetry(taskRunId,
                    IdeaIntakeDurableWorker.backoff(run.getAttemptCount()))) {
                events.publish(command(projectId, taskRunId, taskRunId, "RETRY",
                    "job.retry.scheduled", JobEvent.Status.RUNNING, "job.retry.scheduled", null));
            } else events.publish(command(projectId, taskRunId, taskRunId, "BRIEF_DRAFT",
                    "job.failed", JobEvent.Status.FAILED, "job.idea.brief.draft.failed", safeCode(failure.reason())));
        } catch (RuntimeException invalid) {
            taskRuns.rejectAndFail(taskRunId, claim.taskAttemptId(), claim.claimToken(),
                "{}", "1.0", "AI_RESULT_INVALID");
            events.publish(command(projectId, taskRunId, taskRunId, "BRIEF_DRAFT",
                "job.failed", JobEvent.Status.FAILED, "job.idea.brief.draft.failed",
                "AI_RESULT_INVALID"));
        }
    }

    public void validate(JsonNode result) {
        if (result == null || !result.isObject() || !Set.copyOf(result.propertyNames()).equals(RESULT_FIELDS))
            throw invalid();
        array(result, "extractedFields"); array(result, "fieldSuggestions"); array(result, "assumptions");
        array(result, "openFields"); array(result, "contradictions"); array(result, "clarificationQuestions");
        if (!READINESS.contains(text(result, "readiness")) || text(result, "userFacingSummary").length() > 2000)
            throw invalid();
        validateFields(result.get("extractedFields")); validateFields(result.get("fieldSuggestions"));
        for (JsonNode value : result.get("assumptions")) if (!value.isTextual() || value.asText().isBlank()) throw invalid();
        for (String key : List.of("openFields", "contradictions")) {
            for (JsonNode value : result.get(key)) if (!value.isTextual() || value.asText().isBlank()) throw invalid();
        }
        JsonNode questions = result.get("clarificationQuestions");
        if (questions.size() > 4 || ("NEEDS_INPUT".equals(result.get("readiness").asText()) && questions.size() < 2))
            throw invalid();
        for (JsonNode question : questions) {
            if (!question.isObject() || !Set.copyOf(question.propertyNames()).equals(QUESTION_FIELDS)
                || text(question, "id").length() > 80 || !OpportunityBriefWorkspaceService.FIELD_KEYS.contains(text(question, "fieldKey"))
                || text(question, "prompt").length() > 500 || !Set.of("FREE_TEXT", "SINGLE_SELECT", "MULTI_SELECT", "UNDECIDED").contains(text(question, "type"))
                || !question.get("options").isArray() || !question.get("allowUndecided").isBoolean()) throw invalid();
        }
    }

    private void validateFields(JsonNode values) {
        for (JsonNode value : values) {
            if (!value.isObject() || !Set.copyOf(value.propertyNames()).equals(FIELD_FIELDS)
                || !OpportunityBriefWorkspaceService.FIELD_KEYS.contains(text(value, "fieldKey"))
                || !Set.of("PREFERRED", "OPEN", "ASSUMPTION").contains(text(value, "decisionStatus"))
                || !Set.of("SOURCE_EXTRACTED", "AI_PROPOSED", "MISSING").contains(text(value, "sourceType"))
                || value.get("valueJson") == null
                || ("MISSING".equals(text(value, "sourceType")) != value.get("valueJson").isNull())
                || (!value.get("confidence").isNull() && (!value.get("confidence").isNumber()
                    || value.get("confidence").asDouble() < 0 || value.get("confidence").asDouble() > 1))) throw invalid();
        }
    }

    private String buildInput(Long ownerId, Long projectId, IdeaConversation conversation) {
        ObjectNode input = mapper.createObjectNode();
        input.put("conversationContract", "opportunity-brief-v1");
        input.set("supportedFields", mapper.valueToTree(OpportunityBriefWorkspaceService.FIELD_KEYS));
        input.set("sourceRules", mapper.valueToTree(Map.of(
            "aiAllowed", List.of("SOURCE_EXTRACTED", "AI_PROPOSED", "MISSING"),
            "neverAutoConfirm", true, "neverDefaultAssumption", true)));
        ArrayNode messageArray = input.putArray("messages");
        conversations.messages(ownerId, projectId, conversation.getId()).forEach(message -> {
            ObjectNode item = messageArray.addObject(); item.put("role", message.getRole().name());
            item.put("content", message.getContent());
        });
        if (conversation.getSource() != null) input.put("legacyIdeaSource", conversation.getSource().getOriginalText());
        var brief = briefs.current(ownerId, projectId, conversation.getId());
        ObjectNode currentBrief = mapper.createObjectNode();
        if (brief != null) brief.fields().forEach(field -> {
            ObjectNode value = currentBrief.putObject(field.fieldKey());
            value.put("valueJson", field.value() == null ? "null" : mapper.writeValueAsString(field.value()));
            value.put("decisionStatus", field.decisionStatus().name());
            value.put("sourceType", field.sourceType().name());
            value.put("userConfirmed", field.userConfirmed());
        });
        input.set("currentBrief", currentBrief);
        ArrayNode sources = input.putArray("attachments");
        for (IdeaAttachment attachment : attachments.findByConversationIdAndDeletedAtIsNullOrderByCreatedAtAscIdAsc(conversation.getId())) {
            if (attachment.getStatus() != IdeaAttachment.Status.EXTRACTED) continue;
            try (InputStream stream = storage.open(attachment.getStoredFile().getStorageKey())) {
                String text = "txt".equals(attachment.getStoredFile().getExtension())
                    ? new String(stream.readAllBytes(), StandardCharsets.UTF_8)
                    : parser.parse(stream, new DocumentParseRequest(attachment.getStoredFile().getOriginalFilename(),
                        attachment.getStoredFile().getMimeType(), attachment.getStoredFile().getSizeBytes(), Map.of())).plainText();
                ObjectNode item = sources.addObject(); item.put("attachmentId", attachment.getId()); item.put("text", text);
            } catch (Exception unreadable) { /* failed attachments are not silently promoted into AI input */ }
        }
        return mapper.writeValueAsString(input);
    }

    private List<OpportunityBriefWorkspaceService.AiField> fields(JsonNode result) {
        List<OpportunityBriefWorkspaceService.AiField> values = new ArrayList<>();
        for (String key : List.of("extractedFields", "fieldSuggestions")) for (JsonNode item : result.get(key)) {
            values.add(new OpportunityBriefWorkspaceService.AiField(text(item, "fieldKey"), item.get("valueJson"),
                FieldDecisionStatus.valueOf(text(item, "decisionStatus")), FieldSourceType.valueOf(text(item, "sourceType")),
                item.get("confidence").isNull() ? null : item.get("confidence").asDouble()));
        }
        return values;
    }
    private List<IdeaMessageContract.Question> questions(JsonNode values) {
        List<IdeaMessageContract.Question> result = new ArrayList<>();
        for (JsonNode value : values) result.add(new IdeaMessageContract.Question(text(value, "id"),
            text(value, "fieldKey"), text(value, "prompt"), IdeaMessageContract.QuestionType.valueOf(text(value, "type")),
            strings(value.get("options")), value.get("allowUndecided").asBoolean()));
        return result;
    }
    private List<String> strings(JsonNode array) { List<String> values = new ArrayList<>(); for (JsonNode item : array) values.add(item.asText()); return values; }
    private JsonNode array(JsonNode root, String key) { JsonNode value = root.get(key); if (value == null || !value.isArray()) throw invalid(); return value; }
    private String text(JsonNode root, String key) { JsonNode value = root.get(key); if (value == null || !value.isTextual() || value.asText().isBlank()) throw invalid(); return value.asText(); }
    private IllegalArgumentException invalid() { return new IllegalArgumentException("invalid opportunity brief AI result"); }
    private String safeCode(String value) { return value != null && value.matches("[A-Z0-9._-]{1,80}") ? value : "AI_SERVICE_UNAVAILABLE"; }
    private JobEventPublisher.Command command(Long projectId, String jobId, String taskRunId, String stage,
            String type, JobEvent.Status status, String key, String code) {
        return new JobEventPublisher.Command(projectId, jobId, taskRunId, stage, type, status, key, Map.of(), code);
    }
    private void afterCommit(Runnable task) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) { task.run(); return; }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { task.run(); }
        });
    }
    public record TaskView(String jobId, String status) { }
}
