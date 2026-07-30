from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.models.contracts import AiServerErrorDetail


class AiTaskType(str, Enum):
    SYSTEM_SMOKE_TEST = "SYSTEM_SMOKE_TEST"


class AiTaskRequest(BaseModel):
    request_id: str = Field(min_length=1, max_length=100)
    task_id: str = Field(min_length=1, max_length=100)
    task_type: AiTaskType
    schema_version: str = Field(min_length=1, max_length=20)
    input: dict[str, Any] = Field(default_factory=dict)
    context: dict[str, Any] = Field(default_factory=dict)
    options: dict[str, Any] = Field(default_factory=dict)


class AiTaskExecution(BaseModel):
    handler: str
    handler_version: str


class AiTaskResponse(BaseModel):
    request_id: str
    task_id: str
    task_type: AiTaskType
    status: Literal["SUCCEEDED"]
    schema_version: str
    result: dict[str, Any]
    warnings: list[str] = Field(default_factory=list)
    execution: AiTaskExecution
    error: AiServerErrorDetail | None = None
