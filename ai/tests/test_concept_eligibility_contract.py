import asyncio
import json

from app.legal import concept_validation
from app.models.journey import ConceptGenerationResult


def candidate(name: str = "Companion Safety Care") -> dict:
    return {
        "conceptName": name,
        "targetSegment": {"segment": "first-time companion animal owners"},
        "positioning": "sensor-assisted care guidance",
        "featureSet": ["condition alerts"],
        "pricing": {"amount": 39000, "currency": "KRW"},
        "revenueModel": {"type": "DEVICE_SALE"},
        "channels": ["direct store"],
        "operatingModel": {"seller": "operator", "dataHandling": "user consent"},
        "newAssumptions": [],
        "newBusinessActivities": ["sensor data processing"],
        "originTrace": [
            {
                "structureKey": "problem",
                "sourceValue": ["difficulty detecting hydration"],
                "conceptValue": ["difficulty detecting hydration"],
            }
        ],
        "legalTrace": [
            {
                "guardrailType": "requiredDisclosures",
                "constraint": "disclose processing policy",
                "implementation": "show policy before activation",
            }
        ],
    }


def test_concept_generation_contract_accepts_eligibility_fields():
    value = ConceptGenerationResult.model_validate(
        {"concepts": [candidate("A"), candidate("B"), candidate("C")]}
    )
    assert len(value.concepts) == 3
    assert value.concepts[0].originTrace[0].structureKey == "problem"


def test_concept_legal_validation_contract(monkeypatch):
    async def fake_prompt(system, user):
        payload = json.loads(user)
        assert payload["input"]["guardrails"]["hardConstraints"] == ["consent required"]
        return {
            "status": "FAIL_LEGAL",
            "reasons": ["consent flow is missing"],
            "violatedStructureKeys": ["operatingModel.dataHandling"],
            "legalTrace": [],
        }

    monkeypatch.setattr(concept_validation, "execute_structured_prompt", fake_prompt)
    result = asyncio.run(
        concept_validation.execute_concept_legal_validation(
            {"validationMode": "GUARDRAIL"},
            json.dumps({"guardrails": {"hardConstraints": ["consent required"]}}),
        )
    )
    assert result["status"] == "FAIL_LEGAL"
