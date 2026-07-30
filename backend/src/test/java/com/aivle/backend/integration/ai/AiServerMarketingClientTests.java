package com.aivle.backend.integration.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withBadRequest;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.http.client.MockClientHttpRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

class AiServerMarketingClientTests {

    private static final String URL =
        "http://ai.test/api/v1/marketing/banners/generate";

    private RestTemplate restTemplate;
    private MockRestServiceServer server;
    private AiServerMarketingClient client;

    @BeforeEach
    void setUp() {
        restTemplate = new RestTemplate();
        server = MockRestServiceServer.bindTo(restTemplate).build();
        client = new AiServerMarketingClient(restTemplate, URL);
    }

    @Test
    void sendsNamedUtf8PartsAndOriginalFilename() throws Exception {
        server.expect(requestTo(URL))
            .andExpect(method(HttpMethod.POST))
            .andExpect(request -> {
                assertTrue(
                    request.getHeaders().getContentType()
                        .isCompatibleWith(MediaType.MULTIPART_FORM_DATA)
                );
                String body = ((MockClientHttpRequest) request)
                    .getBodyAsString(StandardCharsets.UTF_8);
                assertTrue(body.contains("name=\"promotion_name\""));
                assertTrue(body.contains("name=\"main_banner\""));
                assertTrue(body.contains("name=\"supporting_copy\""));
                assertTrue(body.contains("name=\"mood\""));
                assertTrue(body.contains("name=\"banner_format\""));
                assertTrue(body.contains("name=\"emphasis_keywords\""));
                assertTrue(body.contains("여름 프로모션"));
                assertTrue(body.contains("신뢰감 있는"));
                assertTrue(body.contains("filename=\"한글 상품.png\""));
            })
            .andRespond(withSuccess(
                """
                {"status":"completed","banner":{"mock":true}}
                """,
                MediaType.APPLICATION_JSON
            ));

        Map<String, Object> response = client.generateBanner(
            "여름 프로모션",
            "지금 시작하세요",
            "특별 혜택",
            "신뢰감 있는",
            "가로형 배너",
            "혜택,신규",
            image()
        );

        assertEquals("completed", response.get("status"));
        server.verify();
    }

    @Test
    void rejectsNullResponseBody() {
        server.expect(requestTo(URL))
            .andRespond(withSuccess());

        assertThrows(
            IllegalStateException.class,
            () -> client.generateBanner(
                "프로모션",
                "메인",
                "보조",
                "신뢰감 있는",
                "가로형 배너",
                "",
                image()
            )
        );
    }

    @Test
    void preservesCurrent4xxExceptionBehavior() {
        server.expect(requestTo(URL))
            .andRespond(withBadRequest());

        assertThrows(
            HttpClientErrorException.BadRequest.class,
            () -> client.generateBanner(
                "프로모션", "메인", "보조",
                "신뢰감 있는", "가로형 배너", "", image()
            )
        );
    }

    @Test
    void preservesCurrent5xxExceptionBehavior() {
        server.expect(requestTo(URL))
            .andRespond(withServerError());

        assertThrows(
            HttpServerErrorException.InternalServerError.class,
            () -> client.generateBanner(
                "프로모션", "메인", "보조",
                "신뢰감 있는", "가로형 배너", "", image()
            )
        );
    }

    private MockMultipartFile image() {
        return new MockMultipartFile(
            "image",
            "한글 상품.png",
            "image/png",
            "mock-image".getBytes(StandardCharsets.UTF_8)
        );
    }
}
