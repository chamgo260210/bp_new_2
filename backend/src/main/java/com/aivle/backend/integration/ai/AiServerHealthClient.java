package com.aivle.backend.integration.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AiServerHealthClient {

    private final RestClient restClient;

    @Autowired
    public AiServerHealthClient(
        @Value("${app.ai-server.base-url:http://127.0.0.1:8000}")
        String baseUrl
    ) {
        this(RestClient.builder()
            .baseUrl(baseUrl)
            .build());
    }

    AiServerHealthClient(RestClient restClient) {
        this.restClient = restClient;
    }

    public AiServerHealthResponse checkHealth() {
        AiServerHealthResponse response = restClient.get()
            .uri("/health")
            .retrieve()
            .body(AiServerHealthResponse.class);

        if (response == null) {
            throw new IllegalStateException(
                "AI 서버에서 응답을 받지 못했습니다."
            );
        }
        return response;
    }

    public record AiServerHealthResponse(
        String status,
        String service
    ) {
    }
}
