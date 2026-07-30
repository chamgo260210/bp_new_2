from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.models.marketing import AdvertisingMood, BannerFormat
from app.api import marketing as marketing_api
from app.services import banner_service
from app.utils.image_validator import MAX_IMAGE_SIZE
from main import app


client = TestClient(app)
safe_client = TestClient(app, raise_server_exceptions=False)


def banner_form(**overrides):
    values = {
        "promotion_name": " 여름 프로모션 ",
        "main_banner": " 지금 시작하세요 ",
        "supporting_copy": " 특별 혜택을 확인하세요 ",
        "mood": AdvertisingMood.TRUSTWORTHY.value,
        "banner_format": BannerFormat.LANDSCAPE.value,
        "emphasis_keywords": " 혜택, 신규, 혜택,  ",
    }
    values.update(overrides)
    return values


def upload(
    tmp_path: Path,
    *,
    test_client: TestClient = client,
    headers: dict[str, str] | None = None,
    filename: str = "product.png",
    content: bytes = b"AIdev mock image bytes",
    content_type: str = "image/png",
    **form_overrides,
):
    original_output = banner_service.OUTPUT_DIRECTORY
    banner_service.OUTPUT_DIRECTORY = tmp_path
    try:
        return test_client.post(
            "/api/v1/marketing/banners/generate",
            data=banner_form(**form_overrides),
            files={"image": (filename, content, content_type)},
            headers=headers,
        )
    finally:
        banner_service.OUTPUT_DIRECTORY = original_output


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "ai-server"
    assert response.json()["request_id"]
    assert response.headers["X-Request-Id"] == response.json()["request_id"]


def test_live_and_ready_health(tmp_path, monkeypatch):
    monkeypatch.setattr(
        banner_service,
        "OUTPUT_DIRECTORY",
        tmp_path / "outputs",
    )

    live = client.get("/health/live")
    ready = client.get("/health/ready")

    assert live.status_code == 200
    assert live.json()["status"] == "live"
    assert ready.status_code == 200
    assert ready.json()["status"] == "ready"
    assert (tmp_path / "outputs").is_dir()


def test_request_id_is_propagated_or_generated():
    supplied = "phase2-request-id"
    propagated = client.get(
        "/health",
        headers={"X-Request-Id": supplied},
    )
    generated = client.get("/health")

    assert propagated.json()["request_id"] == supplied
    assert propagated.headers["X-Request-Id"] == supplied
    assert generated.json()["request_id"]
    assert generated.json()["request_id"] != supplied


def test_echo():
    response = client.post("/api/v1/test", json={"message": "연결 확인"})
    assert response.status_code == 200
    assert response.json()["received_message"] == "연결 확인"
    assert "연결 확인" in response.json()["reply"]


def test_valid_multipart_normalizes_keywords_and_creates_mock(tmp_path):
    response = upload(
        tmp_path,
        headers={"X-Request-Id": "marketing-request-id"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "completed"
    assert payload["data"]["promotion_name"] == "여름 프로모션"
    assert payload["data"]["emphasis_keywords"] == ["혜택", "신규"]
    assert payload["banner"]["mock"] is True
    assert payload["request_id"] == "marketing-request-id"
    assert payload["banner"]["preview_url"].startswith(
        "http://testserver/outputs/banner_"
    )
    generated = list(tmp_path.glob("banner_*.png"))
    assert len(generated) == 1
    assert generated[0].read_bytes() == b"AIdev mock image bytes"


def test_invalid_enum_returns_422(tmp_path):
    response = upload(tmp_path, mood="존재하지 않는 분위기")
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "INVALID_REQUEST"
    assert response.json()["request_id"]


@pytest.mark.parametrize("filename", ["product.gif", "product.bmp"])
def test_unsupported_extension_returns_415(tmp_path, filename):
    response = upload(
        tmp_path,
        filename=filename,
        content_type="image/gif",
    )
    assert response.status_code == 415
    assert response.json()["error"]["code"] == "UNSUPPORTED_IMAGE_TYPE"
    assert response.json()["error"]["retryable"] is False


def test_extension_and_mime_mismatch_returns_415(tmp_path):
    response = upload(
        tmp_path,
        filename="product.png",
        content_type="image/jpeg",
    )
    assert response.status_code == 415
    assert response.json()["error"]["code"] == "UNSUPPORTED_IMAGE_TYPE"


def test_empty_file_returns_400(tmp_path):
    response = upload(tmp_path, content=b"")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "EMPTY_IMAGE"


def test_file_over_10mb_returns_413(tmp_path):
    response = upload(
        tmp_path,
        content=b"x" * (MAX_IMAGE_SIZE + 1),
    )
    assert response.status_code == 413
    assert response.json()["error"]["code"] == "IMAGE_TOO_LARGE"


def test_response_models_are_declared_in_openapi():
    schema = client.get("/openapi.json").json()
    responses = schema["paths"][
        "/api/v1/marketing/banners/generate"
    ]["post"]["responses"]

    assert "MarketingBannerResult" in str(responses["200"])
    assert "HealthResponse" in str(
        schema["paths"]["/health"]["get"]["responses"]["200"]
    )


def test_internal_error_is_safe_and_does_not_expose_trace(
    tmp_path,
    monkeypatch,
):
    def fail_mock_banner(**kwargs):
        raise RuntimeError("sensitive provider stack detail")

    monkeypatch.setattr(
        marketing_api,
        "create_mock_banner",
        fail_mock_banner,
    )
    response = upload(
        tmp_path,
        test_client=safe_client,
        headers={"X-Request-Id": "internal-error-id"},
    )

    assert response.status_code == 500
    assert response.json() == {
        "request_id": "internal-error-id",
        "error": {
            "code": "AI_SERVER_INTERNAL_ERROR",
            "message": "AI 서버에서 요청을 처리하지 못했습니다.",
            "retryable": True,
        },
    }
    assert "sensitive provider stack detail" not in response.text
