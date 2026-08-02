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


class ConceptCandidate(StrictResult):
    name: str
    oneLineSummary: str
    targetCustomer: str
    problem: str
    solution: str
    valueProposition: str
    revenueModel: str
    keyFeatures: list[str]
    differentiators: list[str]
    assumptions: list[str]
    risks: list[str]


class ConceptGenerationResult(StrictResult):
    concepts: list[ConceptCandidate]


class QuickAssessmentItem(StrictResult):
    conceptVersionId: int
    market: int
    customerValue: int
    feasibility: int
    differentiation: int
    revenuePotential: int
    legalRisk: int
    overallScore: float
    summary: str
    strengths: list[str]
    weaknesses: list[str]


class QuickAssessmentResult(StrictResult):
    assessments: list[QuickAssessmentItem]


class DetailedAnalysisItem(StrictResult):
    conceptVersionId: int
    marketAnalysis: str
    customerAnalysis: str
    businessModelAnalysis: str
    operationAnalysis: str
    riskAnalysis: str
    recommendation: str
    assumptions: list[str]
    researchNeeds: list[str]


class DetailedAnalysisResult(StrictResult):
    analyses: list[DetailedAnalysisItem]
