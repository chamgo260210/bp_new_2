package com.aivle.backend.integration.ai.task.dto;

import com.aivle.backend.integration.ai.dto.AiServerErrorResponse;
import com.aivle.backend.integration.ai.task.AiTaskType;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import tools.jackson.databind.JsonNode;

public record AiTaskResponse(
    @JsonProperty("request_id")
    String requestId,
    @JsonProperty("task_id")
    String taskId,
    @JsonProperty("task_type")
    AiTaskType taskType,
    String status,
    @JsonProperty("schema_version")
    String schemaVersion,
    JsonNode result,
    List<String> warnings,
    Execution execution,
    AiServerErrorResponse.ErrorDetail error
) {
    public record Execution(
        String handler,
        @JsonProperty("handler_version")
        String handlerVersion
    ) {
    }
}
