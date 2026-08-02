from typing import Literal

from pydantic import BaseModel, ConfigDict


class StrictResult(BaseModel):
    model_config = ConfigDict(extra="forbid")


class IdeaInterpretationResult(StrictResult):
    originalSourceSummary: str
    normalizedDescription: str
    facts: list[str]
    assumptions: list[str]
    constraints: list[str]
    openQuestions: list[str]
    readiness: Literal["UNDER_SPECIFIED", "APPROPRIATE", "OVER_SPECIFIED"]
    warnings: list[str]
    evidenceNeeds: list[str]


class LegalReviewResult(StrictResult):
    status: Literal[
        "PASS", "PASS_WITH_CONDITIONS", "REVISION_REQUIRED", "PROHIBITED",
        "INSUFFICIENT_INFORMATION", "EXPERT_REVIEW_REQUIRED",
    ]
    summary: str
    issues: list[str]
    conditions: list[str]
    prohibitedElements: list[str]
    researchNeeds: list[str]
    sourceVerified: Literal[False]
    disclaimer: str
