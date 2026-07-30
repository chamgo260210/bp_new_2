package com.aivle.backend.integration.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class AiServerHealthClientTests {

    @Test
    void deserializesHealthResponse() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server =
            MockRestServiceServer.bindTo(builder).build();
        AiServerHealthClient client = new AiServerHealthClient(
            builder.baseUrl("http://ai.test").build()
        );

        server.expect(requestTo("http://ai.test/health"))
            .andExpect(method(HttpMethod.GET))
            .andRespond(withSuccess(
                """
                {"status":"ok","service":"ai-server"}
                """,
                MediaType.APPLICATION_JSON
            ));

        AiServerHealthClient.AiServerHealthResponse response =
            client.checkHealth();

        assertEquals("ok", response.status());
        assertEquals("ai-server", response.service());
        server.verify();
    }
}
