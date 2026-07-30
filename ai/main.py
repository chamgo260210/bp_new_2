import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.api.errors import (
    ApiHttpException,
    api_http_exception_handler,
    http_exception_handler,
    internal_exception_handler,
    validation_exception_handler,
)
from app.api.marketing import router as marketing_router
from app.models.contracts import EchoResponse, HealthResponse
from app.request_context import (
    REQUEST_ID_HEADER,
    current_request_id,
    resolve_request_id,
)
from app.services import banner_service


app = FastAPI(
    title="AIVLE Test AI Server",
    version="0.2.0",
)
app.add_exception_handler(
    ApiHttpException,
    api_http_exception_handler,
)
app.add_exception_handler(
    RequestValidationError,
    validation_exception_handler,
)
app.add_exception_handler(
    HTTPException,
    http_exception_handler,
)
app.add_exception_handler(
    Exception,
    internal_exception_handler,
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = resolve_request_id(
        request.headers.get(REQUEST_ID_HEADER)
    )
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers[REQUEST_ID_HEADER] = request_id
    return response


output_directory = Path(__file__).resolve().parent / "outputs"

# Mock-only static output serving. A later MinIO phase replaces this boundary.
app.mount(
    "/outputs",
    StaticFiles(
        directory=str(output_directory),
        check_dir=False,
    ),
    name="outputs",
)
app.include_router(marketing_router)


def health_payload(
    request: Request,
    health_status: str,
) -> HealthResponse:
    return HealthResponse(
        status=health_status,
        service="ai-server",
        request_id=current_request_id(request),
    )


@app.get("/health", response_model=HealthResponse)
def health_check(request: Request):
    return health_payload(request, "ok")


@app.get("/health/live", response_model=HealthResponse)
def health_live(request: Request):
    return health_payload(request, "live")


@app.get("/health/ready", response_model=HealthResponse)
def health_ready(request: Request):
    marketing_route_ready = any(
        getattr(route, "path", None)
        == "/api/v1/marketing/banners/generate"
        for route in app.routes
    )
    try:
        banner_service.OUTPUT_DIRECTORY.mkdir(
            parents=True,
            exist_ok=True,
        )
        output_ready = (
            banner_service.OUTPUT_DIRECTORY.is_dir()
            and os.access(
                banner_service.OUTPUT_DIRECTORY,
                os.W_OK,
            )
        )
    except OSError:
        output_ready = False

    if not marketing_route_ready or not output_ready:
        raise ApiHttpException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            code="AI_SERVER_INTERNAL_ERROR",
            message="AI 서버가 요청을 처리할 준비가 되지 않았습니다.",
            retryable=True,
        )
    return health_payload(request, "ready")


class TestRequest(BaseModel):
    message: str


@app.post("/api/v1/test", response_model=EchoResponse)
def connection_test(request: Request, body: TestRequest):
    return EchoResponse(
        success=True,
        received_message=body.message,
        reply=f"AI 서버가 '{body.message}'를 정상적으로 받았습니다.",
        request_id=current_request_id(request),
    )
