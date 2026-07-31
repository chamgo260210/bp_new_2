# ADR-001: Use AnalysisJob as the AI task run ledger

- Status: Accepted
- Date: 2026-07-30
- Verified Commit: `TO_BE_FILLED_AFTER_VERIFICATION`

## Context

The service already owns a durable `AnalysisJob` lifecycle with queued and
running states, claim leases, heartbeat, bounded retry metadata, safe errors,
idempotency, external request IDs, result references, stale recovery, and
owner-scoped lookup APIs. Adding a second generic AI run table would duplicate
the same state machine and create conflicting sources of truth.

## Decision

Use `AnalysisJob` as the only Spring-owned AI task execution ledger. Add
`SYSTEM_SMOKE_TEST` as the first task-envelope-backed operational JobType.
FastAPI remains stateless with respect to the service database and returns
only the execution result.

Use a separate `ai_task_results` entity only for the small, versioned task
result payload and handler provenance. `AnalysisJob.resultReferenceType` is
`AI_TASK_RESULT`, and `resultReferenceId` identifies that row. This is a
result record, not a second run or status model.

Add nullable `rerun_of_job_id` to `analysis_jobs`. An explicit rerun creates a
new job with a new idempotency key, preserving the previous job and result.
The existing `(project_id, job_type, idempotency_key)` uniqueness constraint
continues to prevent duplicate execution; a per-project lock serializes the
check-and-create path.

`SYSTEM_SMOKE_TEST` does not schedule automatic retry. Remote 4xx/5xx
classification is stored as safe `errorCode`, `errorMessage`, and
`retryable`, but the job becomes `FAILED`. Existing retry/backoff behavior for
the four established analysis types is unchanged.

## Alternatives

- Extending only `AnalysisJob` avoided a new table but left no structured,
  versioned result/provenance record.
- A separate `AiRun` entity duplicated status, claim, retry, idempotency, and
  lookup semantics and was rejected.

## Consequences

Spring remains the sole database owner and task-status source of truth.
Frontend job polling can reuse the existing APIs. New handlers must be added
deliberately to the JobType allowlists and executor registry.

MinIO/S3 can later replace result payload or object references without adding
another execution ledger. Marketing remains on its compatibility endpoint
until its domain contract and object-storage boundary are designed.
