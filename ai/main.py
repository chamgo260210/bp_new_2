from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.api.marketing import router as marketing_router


app = FastAPI(
    title="AIVLE Test AI Server",
    version="0.1.0",
)

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


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "ai-server",
    }


class TestRequest(BaseModel):
    message: str


@app.post("/api/v1/test")
def connection_test(request: TestRequest):
    return {
        "success": True,
        "received_message": request.message,
        "reply": f"AI 서버가 '{request.message}'를 정상적으로 받았습니다.",
    }
