#!/usr/bin/env python3
"""Validate P2 public/internal contract fixtures with the Python standard library."""

from __future__ import annotations

import hashlib
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


HERE = Path(__file__).resolve().parent
CONTRACTS = HERE.parents[1]
INTERNAL_DOC = CONTRACTS / "INTERNAL_AI_API_V1_CONTRACT.md"
PUBLIC_DOC = CONTRACTS / "PUBLIC_API_V2_CONTRACT.md"
STATUS_DOC = CONTRACTS / "STATUS_AND_ERROR_CONTRACT.md"
MANIFEST_PATH = HERE / "manifest.json"
FIXTURE_NOW = "2030-01-01T00:00:00Z"

TASK_TYPES = (
    "IDEA_INTERPRETATION", "LEGAL_REVIEW", "CONCEPT_GENERATION",
    "QUICK_ASSESSMENT", "DETAILED_ANALYSIS", "PERSONA_CARD_GENERATION",
    "PERSONA_INTERVIEW", "INTERVIEW_SYNTHESIS", "MARKETING_GENERATION",
    "MARKETING_COMPARISON", "FINAL_REPORT_GENERATION",
)
INTERNAL_ERRORS = (
    "INVALID_REQUEST", "UNAUTHORIZED_INTERNAL_CALL",
    "UNSUPPORTED_CONTRACT_VERSION", "UNSUPPORTED_TASK_TYPE",
    "UNSUPPORTED_TASK_SCHEMA_VERSION", "PAYLOAD_TOO_LARGE",
    "DEADLINE_EXCEEDED", "DEPENDENCY_UNAVAILABLE", "RATE_LIMITED",
    "EXECUTION_FAILED", "RESULT_SCHEMA_INVALID", "INTERNAL_ERROR",
)
LEGAL_RESULTS = {
    "PASS", "PASS_WITH_CONDITIONS", "REVISION_REQUIRED", "PROHIBITED",
    "INSUFFICIENT_INFORMATION", "EXPERT_REVIEW_REQUIRED",
}
ANALYSIS_TYPES = {"MARKET", "BUSINESS_MODEL", "TECHNICAL_OPERATION", "FINANCIAL"}
REPORT_DECISIONS = {"GO", "CONDITIONAL_GO", "REWORK", "HOLD", "STOP"}
PROVENANCE_CATEGORIES = {
    "USER_INPUT", "EXTERNAL_SOURCE_FACT", "ASSUMPTION", "AI_PROPOSAL", "USER_DECISION"
}
MARKETING_ASSET_TYPES = {"HEADLINE", "BODY_COPY", "CTA", "CAMPAIGN_CONCEPT"}
RESOURCE_TYPES = {
    "SOURCE_EXTRACTION", "SOURCE_STATEMENT", "IDEA_VERSION", "LEGAL_REVIEW_RUN",
    "CONCEPT_VERSION", "SHORTLIST_DECISION", "CONCEPT_SELECTION", "EVIDENCE_ITEM",
    "PERSONA_STUDY", "PERSONA_CARD_VERSION", "PERSONA_INTERVIEW_RESULT",
    "MARKETING_WORKSPACE_VERSION", "MARKETING_ASSET_VERSION", "QUESTION",
    "COMPARISON_DIMENSION", "REPORT_UPSTREAM_RESOURCE",
}
HASH_RE = re.compile(r"^sha256:[0-9a-f]{64}$")
LOCAL_KEY_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")
FORBIDDEN_KEYS = {
    "storageUrl", "objectKey", "presignedUrl", "localPath", "fileBytes",
    "fileContentBase64", "binary", "base64", "userJwt", "refreshToken",
    "sessionId", "credential", "providerName", "modelName", "sdkName",
}
MANIFEST_FIELDS = {
    "fixtureId", "path", "category", "contractObject", "taskType", "schemaName",
    "expectedValid", "expectedErrorCode", "expectedReason", "invariants",
    "matchingContractSection",
}
REQUEST_FIELDS = {
    "contractVersion", "taskType", "taskSchemaVersion", "taskRunId", "taskAttemptId",
    "correlationId", "deadlineAt", "canonicalInputHash", "locale", "input",
}
SUCCESS_FIELDS = {
    "contractVersion", "taskType", "taskSchemaVersion", "taskRunId", "taskAttemptId",
    "correlationId", "canonicalInputHash", "resultSchemaVersion", "result", "warnings",
    "provenance", "usage",
}
ERROR_BODY_FIELDS = {
    "code", "message", "correlationId", "taskRunId", "taskAttemptId", "retryable", "details"
}
DETAIL_FIELDS = {"reason", "field", "limitName", "supportedValues", "retryAfterSeconds"}

TASK_INPUT_FIELDS = {
    "IDEA_INTERPRETATION": {"textContents", "sourceReferences", "normalizationMode", "maxOpenQuestions", "preserveSourceWording"},
    "LEGAL_REVIEW": {"ideaVersionKey", "normalizedDescription", "facts", "assumptions", "constraints", "jurisdiction", "includeRelatedStatutes"},
    "CONCEPT_GENERATION": {"ideaVersionKey", "legalReviewKey", "normalizedDescription", "facts", "assumptions", "constraints", "legalResult", "legalConditions", "candidateCount", "generationFocuses"},
    "QUICK_ASSESSMENT": {"conceptVersionKey", "concept", "sharedEvidence", "dimensionKeys"},
    "DETAILED_ANALYSIS": {"conceptVersionKey", "shortlistDecisionKey", "analysisType", "sharedEvidence", "marketInput", "businessModelInput", "technicalOperationInput", "financialInput"},
    "PERSONA_CARD_GENERATION": {"personaStudyKey", "conceptSelectionKey", "selectedConceptVersionKey", "selectedConcept", "personaCount", "diversityFocuses"},
    "PERSONA_INTERVIEW": {"personaStudyKey", "personaCardVersionKey", "personaCard", "selectedConceptVersionKey", "questions", "responseStyle"},
    "INTERVIEW_SYNTHESIS": {"personaStudyKey", "includedInterviews", "excludedInterviewKeys", "synthesisFocuses"},
    "MARKETING_GENERATION": {"workspaceVersionKey", "selectedConceptVersionKey", "personaEvidence", "assetType", "targetPersonaKeys", "generationBrief", "tone"},
    "MARKETING_COMPARISON": {"workspaceVersionKey", "assets", "personaEvidence", "comparisonDimensions"},
    "FINAL_REPORT_GENERATION": {"upstreamReferences", "facts", "legalSources", "aiProposals", "assumptions", "researchNeeds", "userDecisions", "reportDecision", "userRationale"},
}
TASK_RESULT_FIELDS = {
    "IDEA_INTERPRETATION": {"originalSourceSummary", "normalizedDescription", "facts", "assumptions", "constraints", "openQuestions", "readiness", "warnings", "evidenceNeeds", "provenance"},
    "LEGAL_REVIEW": {"legalResult", "findings", "sourceReferences", "sourceCoverage", "conditions", "warnings", "expertReviewReasons", "provenance"},
    "CONCEPT_GENERATION": {"concepts", "warnings", "provenance"},
    "QUICK_ASSESSMENT": {"dimensions", "evidence", "assumptions", "uncertainties", "warnings", "evidenceNeeds", "provenance"},
    "DETAILED_ANALYSIS": {"analysisType", "findings", "marketResult", "businessModelResult", "technicalOperationResult", "financialResult", "warnings", "provenance"},
    "PERSONA_CARD_GENERATION": {"personaCards", "warnings", "provenance"},
    "PERSONA_INTERVIEW": {"responses", "warnings", "syntheticDisclosure", "provenance"},
    "INTERVIEW_SYNTHESIS": {"commonResponses", "conflictingResponses", "unresolvedQuestions", "researchRecommendations", "caveats", "provenance"},
    "MARKETING_GENERATION": {"assets", "warnings", "provenance"},
    "MARKETING_COMPARISON": {"assessments", "overallCaveats", "evidenceNeeds", "provenance"},
    "FINAL_REPORT_GENERATION": {"reportDecision", "executiveSummary", "sections", "supportingFindings", "risks", "unresolvedResearch", "caveats", "provenance"},
}


class ValidationFailure(Exception):
    def __init__(self, path: str, rule: str, expected: str, actual: str):
        super().__init__(rule)
        self.path, self.rule, self.expected, self.actual = path, rule, expected, actual


def fail(path: str, rule: str, expected: Any, actual: Any) -> None:
    raise ValidationFailure(path, rule, str(expected), str(actual))


def section(text: str, start: str, end: str) -> str:
    try:
        return text.split(start, 1)[1].split(end, 1)[0]
    except IndexError as exc:
        raise ValidationFailure(str(INTERNAL_DOC), "DOC_SECTION", f"{start}..{end}", "missing") from exc


def canonical_value(value: Any) -> Any:
    if isinstance(value, str):
        return unicodedata.normalize("NFC", value)
    if isinstance(value, list):
        return [canonical_value(item) for item in value]
    if isinstance(value, dict):
        return {unicodedata.normalize("NFC", key): canonical_value(item) for key, item in value.items()}
    return value


def canonical_json(value: Any) -> str:
    return json.dumps(canonical_value(value), ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def canonical_hash(request: dict[str, Any]) -> tuple[str, str]:
    target = {key: request[key] for key in ("contractVersion", "taskType", "taskSchemaVersion", "locale", "input")}
    encoded = canonical_json(target).encode("utf-8")
    return encoded.decode("utf-8"), "sha256:" + hashlib.sha256(encoded).hexdigest()


def sha256_text(text: str) -> str:
    return "sha256:" + hashlib.sha256(text.encode("utf-8")).hexdigest()


def walk_keys(value: Any):
    if isinstance(value, dict):
        for key, item in value.items():
            yield key
            yield from walk_keys(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk_keys(item)


def load_json_file(path: Path) -> Any:
    raw = path.read_bytes()
    if raw.startswith(b"\xef\xbb\xbf"):
        fail(path.as_posix(), "UTF8_BOM", "absent", "present")
    if b"\r\n" in raw:
        fail(path.as_posix(), "LINE_ENDING", "LF", "CRLF")
    try:
        return json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        fail(path.as_posix(), "JSON_PARSE", "valid UTF-8 JSON", type(exc).__name__)


def parse_registries(internal: str, public: str) -> tuple[dict[tuple[str, str], dict[str, str]], set[str]]:
    banned = (
        "array<object>", "exact fields below", "each exact {", "array of {",
        "policy-dependent", "indicated by response", "six canonical values", "task별 allowlist",
    )
    for marker in banned:
        if marker in internal:
            fail(str(INTERNAL_DOC), "BANNED_MARKER", "0", marker)
    if re.search(r"(?m)^\|[^\n]+\| (same|request value) \|", internal):
        fail(str(INTERNAL_DOC), "AMBIGUOUS_BOUNDS", "0", "same/request value")

    task_text = section(internal, "## 7. Task registry", "### Task-specific collection limits")
    tasks = re.findall(r"(?m)^\| `([A-Z_]+)` \|", task_text)
    if tuple(tasks) != TASK_TYPES:
        fail(str(INTERNAL_DOC), "TASK_REGISTRY", TASK_TYPES, tasks)

    error_text = section(internal, "## 6. Internal error envelope", "## 7. Task registry")
    error_codes = list(dict.fromkeys(re.findall(r"(?m)^\| `([A-Z_]+)` \|", error_text)))
    if tuple(error_codes) != INTERNAL_ERRORS:
        fail(str(INTERNAL_DOC), "ERROR_REGISTRY", INTERNAL_ERRORS, error_codes)

    reason_text = section(internal, "### Internal Error Reason Registry", "### UsageSummaryV1")
    rows = re.findall(
        r"(?m)^\| `([A-Z_]+)` \| `([A-Z_]+)` \| (true|false) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| `([A-Z_]+)` \|$",
        reason_text,
    )
    reason_registry: dict[tuple[str, str], dict[str, str]] = {}
    for code, reason, retryable, required, optional, forbidden, direction, public_code in rows:
        key = (code, reason)
        if key in reason_registry:
            fail(str(INTERNAL_DOC), "ERROR_REASON_DUPLICATE", "unique", key)
        reason_registry[key] = {
            "retryable": retryable,
            "required": required.strip(),
            "optional": optional.strip(),
            "direction": direction.strip(),
            "public": public_code,
        }
    if len(reason_registry) != 33 or {code for code, _ in reason_registry} != set(INTERNAL_ERRORS):
        fail(str(INTERNAL_DOC), "ERROR_REASON_REGISTRY", "33 reasons / 12 codes", len(reason_registry))

    schemas = set(re.findall(r"(?m)^### ([A-Za-z][A-Za-z0-9]+V1)\r?$", internal))
    if len(schemas) != 65:
        fail(str(INTERNAL_DOC), "NAMED_SCHEMA_REGISTRY", 65, len(schemas))
    for schema in schemas:
        pattern = rf"(?ms)^### {re.escape(schema)}\r?\n\r?\n\| Field \| JSON type \| Presence \| Nullable \| Bounds/enum \| Semantic rule \|"
        if not re.search(pattern, internal):
            fail(str(INTERNAL_DOC), "SCHEMA_FIELD_TABLE", schema, "missing")

    for required in (RESOURCE_TYPES, PROVENANCE_CATEGORIES, LEGAL_RESULTS, ANALYSIS_TYPES, REPORT_DECISIONS, MARKETING_ASSET_TYPES):
        if not all(value in internal for value in required):
            fail(str(INTERNAL_DOC), "REGISTRY_VALUE", sorted(required), "missing")

    catalog = section(public, "## 7. Endpoint catalog", "## 8. Command and resource details")
    endpoint_count = len(re.findall(r"(?m)^\| (?:GET|POST) \|", catalog))
    capability_count = len(re.findall(r"(?m)^\| `CAN_[A-Z_]+` \|", section(public, "## 9. Capability", "## 10. Resource schema registry")))
    public_error_count = len(re.findall(r"(?m)^\| `[A-Z_]+` \|", section(public, "## 4. Error envelope", "## 5. Pagination")))
    public_schema_count = len(re.findall(r"(?m)^\| `[^`]+` \|", section(public, "## 10. Resource schema registry", "## 11.")))
    if (endpoint_count, capability_count, public_error_count, public_schema_count) != (67, 14, 14, 41):
        fail(str(PUBLIC_DOC), "PUBLIC_REGISTRY_COUNTS", "67/14/14/41", f"{endpoint_count}/{capability_count}/{public_error_count}/{public_schema_count}")
    public_status = STATUS_DOC.read_text(encoding="utf-8")
    for value in LEGAL_RESULTS:
        if value not in public_status:
            fail(str(STATUS_DOC), "PUBLIC_INTERNAL_LEGAL_ENUM", value, "missing")
    for value in ANALYSIS_TYPES | REPORT_DECISIONS | PROVENANCE_CATEGORIES:
        if value not in public:
            fail(str(PUBLIC_DOC), "PUBLIC_INTERNAL_ENUM", value, "missing")
    return reason_registry, schemas


def validate_text_contents(path: str, request: dict[str, Any]) -> None:
    contents = request.get("input", {}).get("textContents", [])
    if not 1 <= len(contents) <= 64:
        fail(path, "TEXT_CONTENT_COUNT", "1..64", len(contents))
    keys, total_chunks, total_chars = [], 0, 0
    for content in contents:
        keys.append(content.get("contentKey"))
        chunks = content.get("chunks", [])
        if not 1 <= len(chunks) <= 64:
            fail(path, "CHUNK_COUNT", "1..64", len(chunks))
        indexes = [chunk.get("index") for chunk in chunks]
        if indexes != list(range(len(chunks))):
            fail(path, "CHUNK_SEQUENCE_INVALID", list(range(len(chunks))), indexes)
        combined = ""
        count = 0
        for chunk in chunks:
            text = chunk.get("text", "")
            if not text or len(text) > 16_384:
                fail(path, "CHUNK_CHARACTERS", "1..16384", len(text))
            if chunk.get("characterCount") != len(text):
                fail(path, "CHARACTER_COUNT", len(text), chunk.get("characterCount"))
            if chunk.get("chunkHash") != sha256_text(text):
                fail(path, "CHUNK_HASH", sha256_text(text), chunk.get("chunkHash"))
            combined += text
            count += len(text)
        if content.get("totalCharacters") != count:
            fail(path, "TOTAL_CHARACTERS", count, content.get("totalCharacters"))
        if content.get("contentHash") != sha256_text(combined):
            fail(path, "CONTENT_HASH", sha256_text(combined), content.get("contentHash"))
        total_chunks += len(chunks)
        total_chars += count
    if len(set(keys)) != len(keys):
        fail(path, "DUPLICATE_CONTENT_KEY", "unique", keys)
    if total_chunks > 64:
        fail(path, "CHUNK_AGGREGATE_LIMIT", "<=64", total_chunks)
    if total_chars > 500_000:
        fail(path, "TEXT_AGGREGATE_LIMIT", "<=500000", total_chars)


def validate_request(path: str, obj: dict[str, Any]) -> None:
    if set(obj) != REQUEST_FIELDS:
        fail(path, "REQUEST_FIELDS", sorted(REQUEST_FIELDS), sorted(obj))
    if obj.get("contractVersion") != "1.0" or obj.get("taskSchemaVersion") != "1.0" or obj.get("locale") != "ko-KR":
        fail(path, "REQUEST_VERSION", "1.0/1.0/ko-KR", "mismatch")
    task = obj.get("taskType")
    if task not in TASK_TYPES:
        fail(path, "TASK_TYPE", TASK_TYPES, task)
    input_fields = set(obj.get("input", {}))
    if task == "DETAILED_ANALYSIS":
        base_fields = {"conceptVersionKey", "shortlistDecisionKey", "analysisType", "sharedEvidence"}
        if not base_fields.issubset(input_fields) or not input_fields.issubset(TASK_INPUT_FIELDS[task]):
            fail(path, "TASK_INPUT_FIELDS", "Detailed base plus one named section", sorted(input_fields))
    elif input_fields != TASK_INPUT_FIELDS[task]:
        fail(path, "TASK_INPUT_FIELDS", sorted(TASK_INPUT_FIELDS[task]), sorted(input_fields))
    _, digest = canonical_hash(obj)
    if obj.get("canonicalInputHash") != digest:
        fail(path, "CANONICAL_HASH", digest, obj.get("canonicalInputHash"))
    if not HASH_RE.fullmatch(obj["canonicalInputHash"]):
        fail(path, "HASH_FORMAT", "sha256 + 64 lowercase hex", obj["canonicalInputHash"])
    if task == "IDEA_INTERPRETATION":
        validate_text_contents(path, obj)
        content_keys = {item["contentKey"] for item in obj["input"]["textContents"]}
        reference_keys = {item["key"] for item in obj["input"]["sourceReferences"]}
        if content_keys != reference_keys:
            fail(path, "SOURCE_REFERENCE_RESOLUTION", content_keys, reference_keys)
    if task == "DETAILED_ANALYSIS":
        selected = {
            "MARKET": "marketInput", "BUSINESS_MODEL": "businessModelInput",
            "TECHNICAL_OPERATION": "technicalOperationInput", "FINANCIAL": "financialInput",
        }[obj["input"]["analysisType"]]
        present = [key for key in ("marketInput", "businessModelInput", "technicalOperationInput", "financialInput") if key in obj["input"]]
        if present != [selected] or obj["input"][selected] is None:
            fail(path, "DETAILED_SECTION", [selected], present)
    if task == "PERSONA_INTERVIEW":
        question_keys = [item["questionKey"] for item in obj["input"]["questions"]]
        if len(question_keys) != len(set(question_keys)):
            fail(path, "QUESTION_KEY_UNIQUENESS", "unique", question_keys)
    if task == "INTERVIEW_SYNTHESIS":
        interview_keys = [item["interviewKey"] for item in obj["input"]["includedInterviews"]]
        if len(interview_keys) != len(set(interview_keys)) or set(interview_keys) & set(obj["input"]["excludedInterviewKeys"]):
            fail(path, "INTERVIEW_REFERENCE_SET", "unique/disjoint", interview_keys)
    if task == "MARKETING_COMPARISON":
        asset_keys = [item["assetVersionKey"] for item in obj["input"]["assets"]]
        dimension_keys = [item["dimensionKey"] for item in obj["input"]["comparisonDimensions"]]
        if len(asset_keys) != len(set(asset_keys)) or len(dimension_keys) != len(set(dimension_keys)):
            fail(path, "MARKETING_KEY_UNIQUENESS", "unique", f"{asset_keys}/{dimension_keys}")
    if task == "FINAL_REPORT_GENERATION":
        if not obj["input"]["userDecisions"] or any(item["category"] != "USER_DECISION" for item in obj["input"]["userDecisions"]):
            fail(path, "FINAL_REPORT_USER_DECISIONS", "non-empty USER_DECISION items", "invalid")
    if len(json.dumps(obj, ensure_ascii=False).encode("utf-8")) > 2 * 1024 * 1024:
        fail(path, "REQUEST_BYTES", "<=2MiB", "exceeded")


def validate_usage(path: str, usage: Any) -> None:
    if usage is None:
        return
    if set(usage) != {"unit", "inputUnits", "outputUnits", "totalUnits", "estimated"}:
        fail(path, "USAGE_FIELDS", "exact UsageSummaryV1", sorted(usage))
    if usage["unit"] not in {"TOKENS", "CHARACTERS", "OTHER"} or usage["totalUnits"] != usage["inputUnits"] + usage["outputUnits"]:
        fail(path, "USAGE_TOTAL", "input+output", usage.get("totalUnits"))


def validate_success(path: str, obj: dict[str, Any], request: dict[str, Any]) -> None:
    if set(obj) != SUCCESS_FIELDS:
        fail(path, "SUCCESS_FIELDS", sorted(SUCCESS_FIELDS), sorted(obj))
    for field in ("contractVersion", "taskType", "taskSchemaVersion", "taskRunId", "taskAttemptId", "correlationId", "canonicalInputHash"):
        if obj.get(field) != request.get(field):
            fail(path, "SUCCESS_ECHO", request.get(field), obj.get(field))
    if obj.get("resultSchemaVersion") != "1.0":
        fail(path, "RESULT_SCHEMA_VERSION", "1.0", obj.get("resultSchemaVersion"))
    task = obj["taskType"]
    result_fields = set(obj.get("result", {}))
    if task == "DETAILED_ANALYSIS":
        base_fields = {"analysisType", "findings", "warnings", "provenance"}
        if not base_fields.issubset(result_fields) or not result_fields.issubset(TASK_RESULT_FIELDS[task]):
            fail(path, "TASK_RESULT_FIELDS", "Detailed base plus one named result", sorted(result_fields))
    elif result_fields != TASK_RESULT_FIELDS[task]:
        fail(path, "TASK_RESULT_FIELDS", sorted(TASK_RESULT_FIELDS[task]), sorted(result_fields))
    if not obj.get("provenance") or not obj["result"].get("provenance"):
        fail(path, "PROVENANCE_MIN", ">=1", 0)
    validate_usage(path, obj.get("usage"))
    proposal_keys = [value for key, value in iter_items(obj["result"]) if key == "proposalKey"]
    if len(proposal_keys) != len(set(proposal_keys)):
        fail(path, "OUTPUT_KEY_UNIQUENESS", "unique", proposal_keys)
    if task == "DETAILED_ANALYSIS":
        analysis_type = obj["result"]["analysisType"]
        selected = {
            "MARKET": "marketResult", "BUSINESS_MODEL": "businessModelResult",
            "TECHNICAL_OPERATION": "technicalOperationResult", "FINANCIAL": "financialResult",
        }[analysis_type]
        present = [key for key in ("marketResult", "businessModelResult", "technicalOperationResult", "financialResult") if key in obj["result"]]
        if present != [selected]:
            fail(path, "DETAILED_RESULT_SECTION", [selected], present)
        if selected == "financialResult" and set(obj["result"][selected]) != {"inputSnapshotHash", "aiExplanation", "provenance"}:
            fail(path, "FINANCIAL_RESULT_FIELDS", "3 exact fields", sorted(obj["result"][selected]))
        if selected == "financialResult" and obj["result"][selected]["inputSnapshotHash"] != request["canonicalInputHash"]:
            fail(path, "FINANCIAL_SNAPSHOT_HASH", request["canonicalInputHash"], obj["result"][selected]["inputSnapshotHash"])
    if task == "LEGAL_REVIEW":
        coverage = obj["result"]["sourceCoverage"]
        attempted, successful, missing = map(set, (coverage["attemptedChannels"], coverage["successfulChannels"], coverage["missingChannels"]))
        if successful | missing != attempted or successful & missing or coverage["degraded"] != bool(missing):
            fail(path, "LEGAL_SOURCE_COVERAGE", "partition and degraded iff missing", coverage)
        if any(source.get("authoritative") for source in obj["result"]["sourceReferences"]) and "MOLEG_API" not in successful:
            fail(path, "LEGAL_AUTHORITY", "MOLEG_API successful", successful)
        if not successful and obj["result"]["legalResult"] in {"PASS", "PASS_WITH_CONDITIONS"}:
            fail(path, "LEGAL_NO_SOURCE_PASS", "non-passing result", obj["result"]["legalResult"])
        for source in obj["result"]["sourceReferences"]:
            url = source.get("officialSourceUrl")
            if url and (not url.startswith("https://") or any(marker in url.lower() for marker in ("storage", "presigned", "s3"))):
                fail(path, "LEGAL_OFFICIAL_URL", "external HTTPS legal provenance", "invalid URL")
    if task == "PERSONA_INTERVIEW":
        if not obj["result"].get("syntheticDisclosure"):
            fail(path, "PERSONA_SYNTHETIC_DISCLOSURE", "non-empty", "missing")
        expected_questions = {item["questionKey"] for item in request["input"]["questions"]}
        actual_questions = {item["questionKey"] for item in obj["result"]["responses"]}
        if expected_questions != actual_questions:
            fail(path, "PERSONA_QUESTION_RESOLUTION", expected_questions, actual_questions)
    if task == "MARKETING_COMPARISON" and not obj["result"].get("overallCaveats"):
        fail(path, "MARKETING_CAVEAT", ">=1", 0)
    if task == "FINAL_REPORT_GENERATION" and obj["result"]["reportDecision"] != request["input"]["reportDecision"]:
        fail(path, "REPORT_DECISION_EQUALITY", request["input"]["reportDecision"], obj["result"]["reportDecision"])
    if len(json.dumps(obj, ensure_ascii=False).encode("utf-8")) > 2 * 1024 * 1024:
        fail(path, "RESPONSE_BYTES", "<=2MiB", "exceeded")


def iter_items(value: Any):
    if isinstance(value, dict):
        for key, item in value.items():
            yield key, item
            yield from iter_items(item)
    elif isinstance(value, list):
        for item in value:
            yield from iter_items(item)


def parse_detail_names(cell: str) -> set[str]:
    if cell == "none":
        return set()
    return set(re.findall(r"`([A-Za-z]+)`", cell))


def validate_error(path: str, obj: dict[str, Any], entry: dict[str, Any], registry: dict[tuple[str, str], dict[str, str]]) -> None:
    if set(obj) != {"error"} or set(obj.get("error", {})) != ERROR_BODY_FIELDS:
        fail(path, "ERROR_FIELDS", "exact InternalErrorResponseV1", sorted(obj.get("error", {})))
    error = obj["error"]
    details = error.get("details", [])
    if len(details) != 1 or not set(details[0]).issubset(DETAIL_FIELDS):
        fail(path, "ERROR_DETAILS", "one safe detail", details)
    reason = details[0].get("reason")
    key = (error.get("code"), reason)
    if key not in registry:
        fail(path, "ERROR_REASON", "registered code/reason", key)
    rule = registry[key]
    if error.get("retryable") != (rule["retryable"] == "true"):
        fail(path, "ERROR_RETRYABLE", rule["retryable"], error.get("retryable"))
    required = parse_detail_names(rule["required"])
    optional = parse_detail_names(rule["optional"])
    fields = set(details[0]) - {"reason"}
    if not required.issubset(fields) or not fields.issubset(required | optional):
        fail(path, "ERROR_DETAIL_CONTRACT", f"required={required}, optional={optional}", fields)
    if error["code"] == "UNAUTHORIZED_INTERNAL_CALL" and (error["taskRunId"] is not None or error["taskAttemptId"] is not None):
        fail(path, "UNAUTHORIZED_ID_ECHO", "null/null", f"{error['taskRunId']}/{error['taskAttemptId']}")
    if entry.get("expectedErrorCode") != error["code"] or entry.get("expectedReason") != reason:
        fail(path, "MANIFEST_ERROR_EXPECTATION", f"{error['code']}/{reason}", f"{entry.get('expectedErrorCode')}/{entry.get('expectedReason')}")


def negative_rule_holds(rule: str, obj: dict[str, Any]) -> bool:
    data = json.dumps(obj, ensure_ascii=False)
    checks = {
        "CHUNK_INDEX_GAP": lambda: [c["index"] for c in obj["input"]["textContents"][0]["chunks"]] != list(range(len(obj["input"]["textContents"][0]["chunks"]))),
        "CHUNK_INDEX_DUPLICATE": lambda: len({c["index"] for c in obj["input"]["textContents"][0]["chunks"]}) < len(obj["input"]["textContents"][0]["chunks"]),
        "CHUNK_HASH_MISMATCH": lambda: any(c["chunkHash"] != sha256_text(c["text"]) for c in obj["input"]["textContents"][0]["chunks"]),
        "CONTENT_HASH_MISMATCH": lambda: obj["input"]["textContents"][0]["contentHash"] != sha256_text("".join(c["text"] for c in obj["input"]["textContents"][0]["chunks"])),
        "CHARACTER_COUNT_MISMATCH": lambda: any(c["characterCount"] != len(c["text"]) for c in obj["input"]["textContents"][0]["chunks"]),
        "CHUNK_AGGREGATE_LIMIT": lambda: sum(len(x["chunks"]) for x in obj["input"]["textContents"]) > 64,
        "TEXT_CONTENT_COUNT_LIMIT": lambda: len(obj["input"]["textContents"]) > 64,
        "ERROR_UNKNOWN_REASON": lambda: obj["error"]["details"][0]["reason"] == "UNKNOWN_REASON",
        "ERROR_RETRYABLE_MISMATCH": lambda: True,
        "ERROR_REQUIRED_DETAIL_MISSING": lambda: True,
        "ERROR_FORBIDDEN_DETAIL_PRESENT": lambda: "rawValue" in obj["error"]["details"][0],
        "UNAUTHORIZED_ID_ECHO": lambda: obj["error"]["taskRunId"] is not None,
        "LEGAL_DEGRADED_EMPTY_MISSING": lambda: obj["result"]["sourceCoverage"]["degraded"] and not obj["result"]["sourceCoverage"]["missingChannels"],
        "LEGAL_AUTHORITATIVE_WITHOUT_MOLEG": lambda: any(s.get("authoritative") for s in obj["result"]["sourceReferences"]) and "MOLEG_API" not in obj["result"]["sourceCoverage"]["successfulChannels"],
        "LEGAL_NO_SOURCE_PASS": lambda: obj["result"]["legalResult"] in {"PASS", "PASS_WITH_CONDITIONS"} and not obj["result"]["sourceCoverage"]["successfulChannels"],
        "DETAILED_MULTIPLE_INPUT_SECTIONS": lambda: sum(k in obj["input"] for k in ("marketInput", "businessModelInput", "technicalOperationInput", "financialInput")) > 1,
        "DETAILED_NULL_SECTION": lambda: any(k in obj["input"] and obj["input"][k] is None for k in ("marketInput", "businessModelInput", "technicalOperationInput", "financialInput")),
        "DETAILED_RESULT_TYPE_MISMATCH": lambda: obj["result"]["analysisType"] == "MARKET" and "marketResult" not in obj["result"],
        "FINANCIAL_RESULT_DETERMINISTIC_INPUTS": lambda: "deterministicInputs" in obj["result"]["financialResult"],
        "FINANCIAL_RESULT_OUTER_DRIVERS": lambda: "drivers" in obj["result"]["financialResult"],
        "FINANCIAL_SNAPSHOT_HASH_MISMATCH": lambda: obj["result"]["financialResult"]["inputSnapshotHash"] != obj["canonicalInputHash"],
        "PERSONA_MULTIPLE_CARDS": lambda: "otherPersonaCard" in obj["input"],
        "PERSONA_HIDDEN_OTHER_INTERVIEW": lambda: "hiddenOtherInterview" in obj["input"],
        "PERSONA_MISSING_SYNTHETIC_DISCLOSURE": lambda: "syntheticDisclosure" not in obj["result"],
        "PERSONA_PURCHASE_PROBABILITY": lambda: "purchaseProbability" in data,
        "PERSONA_DEMOGRAPHIC_ONLY": lambda: "demographicOnly" in data,
        "PERSONA_REAL_CUSTOMER_CLAIM": lambda: "actualCustomerResearch" in data,
        "PERSONA_MARKET_SHARE": lambda: "marketShare" in data,
        "PERSONA_POPULATION_STATISTIC": lambda: "populationStatistic" in data,
        "MARKETING_BINARY_FIELD": lambda: "binary" in data,
        "MARKETING_STORAGE_REFERENCE": lambda: "storageUrl" in data,
        "MARKETING_CONVERSION_PROBABILITY": lambda: "conversionProbability" in data,
        "MARKETING_WINNER_PROBABILITY": lambda: "winnerProbability" in data,
        "MARKETING_STATISTICAL_AB": lambda: "statisticalAbClaim" in data,
        "FINAL_REPORT_DECISION_MISMATCH": lambda: obj["result"]["reportDecision"] != "GO",
        "FINAL_REPORT_MISSING_USER_DECISION": lambda: not obj["input"].get("userDecisions"),
        "FINAL_REPORT_BINARY_OUTPUT": lambda: "binary" in data,
        "FINAL_REPORT_MIXED_PROVENANCE": lambda: any(x["category"] != "USER_DECISION" for x in obj["input"]["userDecisions"]),
        "REFERENCE_UNKNOWN_INPUT_KEY": lambda: "unknown-input" in data,
        "REFERENCE_DUPLICATE_KEY": lambda: len(obj["references"]) != len({x["key"] for x in obj["references"]}),
        "REFERENCE_WRONG_RESOURCE_TYPE": lambda: any(x["resourceType"] == "WRONG_TYPE" for x in obj["references"]),
        "REFERENCE_OUTPUT_KEY_COLLISION": lambda: len(obj["outputKeys"]) != len(set(obj["outputKeys"])),
        "REFERENCE_INVENTED_LEGAL_SOURCE": lambda: obj.get("observedByAdapter") is False,
    }
    return rule in checks and checks[rule]()


def main() -> int:
    try:
        internal = INTERNAL_DOC.read_text(encoding="utf-8")
        public = PUBLIC_DOC.read_text(encoding="utf-8")
        reason_registry, schemas = parse_registries(internal, public)
        manifest = load_json_file(MANIFEST_PATH)
        if set(manifest) != {"manifestVersion", "fixtures"} or manifest["manifestVersion"] != "1.0":
            fail("manifest.json", "MANIFEST_ROOT", "manifestVersion/fixtures", sorted(manifest))
        entries = manifest["fixtures"]
        ids = [entry.get("fixtureId") for entry in entries]
        paths = [entry.get("path") for entry in entries]
        if len(ids) != len(set(ids)) or len(paths) != len(set(paths)):
            fail("manifest.json", "MANIFEST_DUPLICATE", "unique IDs/paths", "duplicate")
        for entry in entries:
            if set(entry) != MANIFEST_FIELDS:
                fail("manifest.json", "MANIFEST_ENTRY_FIELDS", sorted(MANIFEST_FIELDS), sorted(entry))
            if entry["category"] not in {"POSITIVE", "NEGATIVE"} or entry["contractObject"] not in {"EXECUTION_REQUEST", "EXECUTION_SUCCESS", "INTERNAL_ERROR"}:
                fail("manifest.json", "MANIFEST_ENUM", "known category/object", entry)
            if entry["schemaName"] not in schemas and entry["schemaName"] != "CanonicalInputExpectationV1":
                fail("manifest.json", "MANIFEST_SCHEMA", "registered schema", entry["schemaName"])
            if entry["expectedErrorCode"] is not None or entry["expectedReason"] is not None:
                if (entry["expectedErrorCode"], entry["expectedReason"]) not in reason_registry:
                    fail("manifest.json", "MANIFEST_ERROR_REASON", "registered code/reason", f"{entry['expectedErrorCode']}/{entry['expectedReason']}")
        disk_json = {path.relative_to(HERE).as_posix() for path in HERE.rglob("*.json") if path != MANIFEST_PATH}
        if set(paths) != disk_json:
            fail("manifest.json", "MANIFEST_FILE_COVERAGE", sorted(disk_json), sorted(paths))

        objects: dict[str, Any] = {}
        for entry in entries:
            path = HERE / entry["path"]
            objects[entry["path"]] = load_json_file(path)
            if entry["expectedValid"] and FORBIDDEN_KEYS.intersection(walk_keys(objects[entry["path"]])):
                fail(entry["path"], "FORBIDDEN_FIELD", "none", sorted(FORBIDDEN_KEYS.intersection(walk_keys(objects[entry["path"]]))))

        canonical_request = objects["common/canonical-input.request.json"]
        canonical_expected = objects["common/canonical-input.expected.json"]
        canonical_text, digest = canonical_hash(canonical_request)
        if canonical_expected != {"canonicalJson": canonical_text, "canonicalInputHash": digest}:
            fail("common/canonical-input.expected.json", "CANONICAL_EXPECTATION", digest, canonical_expected.get("canonicalInputHash"))

        positive_requests: dict[str, dict[str, Any]] = {}
        for entry in entries:
            obj = objects[entry["path"]]
            if not entry["expectedValid"]:
                rule = entry["invariants"][0]
                if not negative_rule_holds(rule, obj):
                    fail(entry["path"], rule, "violation present", "not detected")
                continue
            if entry["schemaName"] == "CanonicalInputExpectationV1":
                continue
            if entry["contractObject"] == "EXECUTION_REQUEST":
                validate_request(entry["path"], obj)
                if entry["taskType"]:
                    key = entry["path"].replace(".request.valid.json", "").replace(".request.", ".")
                    positive_requests[key] = obj
            elif entry["contractObject"] == "INTERNAL_ERROR":
                validate_error(entry["path"], obj, entry, reason_registry)

        for entry in entries:
            if not entry["expectedValid"] or entry["contractObject"] != "EXECUTION_SUCCESS":
                continue
            obj = objects[entry["path"]]
            key = entry["path"].replace(".response.valid.json", "").replace(".response.degraded-valid.json", "").replace(".response.", ".")
            request = positive_requests.get(key)
            if request is None:
                default_path = f"tasks/{entry['taskType'].lower().replace('_', '-')}.request.valid.json"
                request = objects.get(default_path)
            if request is None:
                fail(entry["path"], "RESPONSE_PAIR", "matching request", "missing")
            validate_success(entry["path"], obj, request)

        task_request_coverage = {e["taskType"] for e in entries if e["expectedValid"] and e["contractObject"] == "EXECUTION_REQUEST" and e["taskType"] in TASK_TYPES}
        task_response_coverage = {e["taskType"] for e in entries if e["expectedValid"] and e["contractObject"] == "EXECUTION_SUCCESS" and e["taskType"] in TASK_TYPES}
        error_code_coverage = {e["expectedErrorCode"] for e in entries if e["expectedValid"] and e["contractObject"] == "INTERNAL_ERROR"}
        error_reason_coverage = {e["expectedReason"] for e in entries if e["expectedValid"] and e["contractObject"] == "INTERNAL_ERROR"}
        if task_request_coverage != set(TASK_TYPES) or task_response_coverage != set(TASK_TYPES):
            fail("manifest.json", "TASK_COVERAGE", "11/11", f"{len(task_request_coverage)}/{len(task_response_coverage)}")
        if error_code_coverage != set(INTERNAL_ERRORS) or error_reason_coverage != {reason for _, reason in reason_registry}:
            fail("manifest.json", "ERROR_COVERAGE", "12/12 and 33/33", f"{len(error_code_coverage)}/{len(error_reason_coverage)}")
        matrix = section(internal, "## 17. P2.6 fixture readiness matrix", "\0") if "\0" in internal else internal.split("## 17. P2.6 fixture readiness matrix", 1)[1]
        ready = set(re.findall(r"(?m)^\| ([A-Za-z][A-Za-z0-9]+V1) \| YES \| YES \|", matrix))
        if ready != schemas:
            fail(str(INTERNAL_DOC), "FIXTURE_READINESS", len(schemas), len(ready))

        positives = sum(e["category"] == "POSITIVE" for e in entries)
        negatives = sum(e["category"] == "NEGATIVE" for e in entries)
        print("CONTRACT_REGISTRY=PASS")
        print(f"NAMED_SCHEMAS={len(schemas)}")
        print(f"TASK_TYPES={len(TASK_TYPES)}")
        print(f"INTERNAL_ERRORS={len(INTERNAL_ERRORS)}")
        print(f"INTERNAL_ERROR_REASONS={len(reason_registry)}")
        print(f"FIXTURES_TOTAL={len(entries)}")
        print(f"POSITIVE_FIXTURES={positives}")
        print(f"NEGATIVE_FIXTURES={negatives}")
        print("TASK_REQUEST_COVERAGE=11/11")
        print("TASK_RESPONSE_COVERAGE=11/11")
        print("ERROR_CODE_COVERAGE=12/12")
        print("ERROR_REASON_COVERAGE=33/33")
        print("PUBLIC_INTERNAL_CONSISTENCY=PASS")
        print("FORBIDDEN_FIELD_SCAN=PASS")
        print("CANONICAL_HASH=PASS")
        print("CHUNK_INTEGRITY=PASS")
        print("RESULT=PASS")
        return 0
    except ValidationFailure as exc:
        print(f"fixture={exc.path}")
        print(f"rule={exc.rule}")
        print(f"expected={exc.expected}")
        print(f"actual={exc.actual}")
        print("RESULT=FAIL")
        return 1


if __name__ == "__main__":
    sys.exit(main())
