import json
from typing import Any

from pydantic import ValidationError

from app.models.journey import ConceptLegalValidationResult
from app.services.journey_provider import ProviderFailure, execute_structured_prompt


SYSTEM = """Validate only whether the supplied Concept Draft complies with the supplied Legal Guardrail.
Do not invent statutes or legal sources. Compare the concept structure and activities against hardConstraints,
prohibitedPatterns, conditionalConstraints, requiredDisclosures, and requiredOperationalControls.
Return FAIL_LEGAL when any constraint is violated; otherwise return PASS. Return one JSON object only."""


async def execute_concept_legal_validation(task_input: dict[str, Any], text: str) -> dict[str, Any]:
    if task_input.get("validationMode") != "GUARDRAIL":
        raise ProviderFailure("INVALID_REQUEST", "CONCEPT_LEGAL_VALIDATION_MODE_INVALID", 400, False)
    try:
        prompt = {
            "input": json.loads(text),
            "output": {
                "status": "PASS|FAIL_LEGAL",
                "reasons": ["string"],
                "violatedStructureKeys": ["string"],
                "legalTrace": [
                    {"guardrailType": "string", "constraint": "string", "implementation": "string"}
                ],
            },
        }
        raw = await execute_structured_prompt(SYSTEM, json.dumps(prompt, ensure_ascii=False))
        return ConceptLegalValidationResult.model_validate(raw).model_dump()
    except (ValidationError, ValueError, TypeError, json.JSONDecodeError) as failure:
        raise ProviderFailure(
            "RESULT_SCHEMA_INVALID", "CONCEPT_LEGAL_VALIDATION_INVALID", 502, False
        ) from failure
