# ADR-003: MarketingContentVersion as the AI result version

Status: Accepted

Verified Commit: `TO_BE_FILLED_AFTER_VERIFICATION`

## Decision

`AnalysisJob` remains the execution-status ledger. A successful
`MARKETING_GENERATION` creates a new `MarketingContentVersion`; it never
overwrites the selected source version. The generated version has one nullable
`analysis_job_id`, from which the associated `AiTaskResult` and SOURCE/RESULT
`AiTaskArtifact` rows are reachable.

No `MarketingGenerationResult` table is introduced. Provider, handler,
schema, prompt preview, and normalized input remain in `AiTaskResult`; object
metadata remains in `StoredFile` and `AiTaskArtifact`.

## Lifecycle

- Spring validates project ownership, the selected source version, image MIME,
  extension, size, idempotency key, and optional rerun origin.
- Spring stores the source image and creates a queued
  `MARKETING_GENERATION` job.
- FastAPI routes `MARKETING_BANNER_GENERATION` through the versioned task
  registry. The current Mock provider copies the verified source bytes to the
  presigned result target while reusing the existing marketing prompt builder.
- Spring verifies result size, MIME, checksum, and object key before creating
  `AiTaskResult`, RESULT artifact metadata, and the new content version.
- Failure creates no version. A rerun creates a new Job, object pair, result,
  and version while preserving all prior records.
- Editing an AI-generated current version first creates a new user-edit
  version, so the AI result remains immutable.

## Consequences

The current provider is intentionally Mock-only. A real provider can replace
the FastAPI handler implementation without changing Spring's state or
artifact ownership. Report linkage remains out of scope. Retention and
provider/model provenance can evolve through the existing task/artifact
records without duplicating generation status in the marketing domain.
