package com.aivle.backend.integration.ai.task.dto;

import com.aivle.backend.integration.ai.task.AiTaskType;
import com.fasterxml.jackson.annotation.JsonProperty;
import tools.jackson.databind.JsonNode;

public record AiTaskRequest(
    @JsonProperty("request_id")
    String requestId,
    @JsonProperty("task_id")
    String taskId,
    @JsonProperty("task_type")
    AiTaskType taskType,
    @JsonProperty("schema_version")
    String schemaVersion,
    JsonNode input,
    JsonNode context,
    JsonNode options
) {
}
