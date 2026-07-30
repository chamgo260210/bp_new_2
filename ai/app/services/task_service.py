from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from app.models.tasks import AiTaskRequest, AiTaskType


TaskHandler = Callable[[AiTaskRequest], dict[str, Any]]


@dataclass(frozen=True)
class TaskHandlerRegistration:
    name: str
    version: str
    execute: TaskHandler


@dataclass(frozen=True)
class TaskExecutionResult:
    result: dict[str, Any]
    handler: str
    handler_version: str


def system_smoke_handler(
    task: AiTaskRequest,
) -> dict[str, Any]:
    return {
        "ok": True,
        "message": "SYSTEM_SMOKE_OK",
        "received_input": task.input,
    }


TASK_HANDLERS: dict[AiTaskType, TaskHandlerRegistration] = {
    AiTaskType.SYSTEM_SMOKE_TEST: TaskHandlerRegistration(
        name="system-smoke",
        version="1.0",
        execute=system_smoke_handler,
    ),
}


def execute_task(task: AiTaskRequest) -> TaskExecutionResult:
    registration = TASK_HANDLERS[task.task_type]
    return TaskExecutionResult(
        result=registration.execute(task),
        handler=registration.name,
        handler_version=registration.version,
    )
