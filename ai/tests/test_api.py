from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.models.marketing import AdvertisingMood, BannerFormat
from app.services import banner_service
from app.utils.image_validator import MAX_IMAGE_SIZE
from main import app


client = TestClient(app)


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
    filename: str = "product.png",
    content: bytes = b"AIdev mock image bytes",
    content_type: str = "image/png",
    **form_overrides,
):
    original_output = banner_service.OUTPUT_DIRECTORY
    banner_service.OUTPUT_DIRECTORY = tmp_path
    try:
        return client.post(
            "/api/v1/marketing/banners/generate",
            data=banner_form(**form_overrides),
            files={"image": (filename, content, content_type)},
        )
    finally:
        banner_service.OUTPUT_DIRECTORY = original_output


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "ai-server",
    }


def test_echo():
    response = client.post("/api/v1/test", json={"message": "연결 확인"})
    assert response.status_code == 200
    assert response.json()["received_message"] == "연결 확인"
    assert "연결 확인" in response.json()["reply"]


def test_valid_multipart_normalizes_keywords_and_creates_mock(tmp_path):
    response = upload(tmp_path)

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "completed"
    assert payload["data"]["promotion_name"] == "여름 프로모션"
    assert payload["data"]["emphasis_keywords"] == ["혜택", "신규"]
    assert payload["banner"]["mock"] is True
    assert payload["banner"]["preview_url"].startswith(
        "http://testserver/outputs/banner_"
    )
    generated = list(tmp_path.glob("banner_*.png"))
    assert len(generated) == 1
    assert generated[0].read_bytes() == b"AIdev mock image bytes"


def test_invalid_enum_returns_422(tmp_path):
    response = upload(tmp_path, mood="존재하지 않는 분위기")
    assert response.status_code == 422


@pytest.mark.parametrize("filename", ["product.gif", "product.bmp"])
def test_unsupported_extension_returns_415(tmp_path, filename):
    response = upload(
        tmp_path,
        filename=filename,
        content_type="image/gif",
    )
    assert response.status_code == 415


def test_extension_and_mime_mismatch_returns_415(tmp_path):
    response = upload(
        tmp_path,
        filename="product.png",
        content_type="image/jpeg",
    )
    assert response.status_code == 415


def test_empty_file_returns_400(tmp_path):
    response = upload(tmp_path, content=b"")
    assert response.status_code == 400


def test_file_over_10mb_returns_413(tmp_path):
    response = upload(
        tmp_path,
        content=b"x" * (MAX_IMAGE_SIZE + 1),
    )
    assert response.status_code == 413
