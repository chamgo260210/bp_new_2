# Job architecture and extension guide

- Status: Current
- Verified HEAD: `TO_BE_FILLED_AFTER_VERIFICATION`
- Verified Date: 2026-07-30
- Owners: Backend
- Related Source: `backend/src/main/java/com/aivle/backend/job`
- Supersedes: job handoffs through Phase 10
- Known Limitations: generic core branches on five source/result families

Operational JobTypes are `DOCUMENT_PARSE`, `LEGAL_REVIEW`,
`FEASIBILITY_ANALYSIS`, `PERSONA_RECOMMENDATION`, and
`SYSTEM_SMOKE_TEST`. Other enum values, including `MARKETING_GENERATION`,
remain reserved and are rejected by latest-query/runners.

Lifecycle:

1. Command validates owner, confirmed inputs/stage, duplicate active job, and idempotency.
2. Transaction persists `AnalysisJob` with an immutable input snapshot/fingerprint and the matching source FK.
3. Polling runner claims eligible jobs with token, worker, heartbeat and attempt metadata.
4. Registry selects a typed `JobExecutor`; context service rehydrates a bounded input.
5. Executor advances factual phases, calls a typed AI port, and persistence service writes result/provenance.
6. Failure classification schedules bounded exponential backoff or terminal failure.
7. Recovery releases stale running jobs; latest/job queries support refresh recovery.

`SYSTEM_SMOKE_TEST` reuses the same ledger, claim token, heartbeat, ownership,
and lookup APIs. Its small response is stored in versioned
`ai_task_results`, and the job points to it through
`AI_TASK_RESULT`/`resultReferenceId`. The FastAPI request ID is recorded as
`externalRequestId`. Unlike the established analysis types, a remote failure
or stale smoke execution is terminal: retryability is retained for diagnosis,
but no automatic task rerun is scheduled.

Explicit user reruns always create a new job with a new idempotency key and
an optional `rerun_of_job_id`; previous jobs and results remain immutable.
The project row is locked while checking the existing idempotency key, and
the database unique constraint remains the final duplicate guard.

To add a type, change the enum, job factory/invariants, repository claim query, claim filter/source validation, latest-query allowlist, failure/audit mapping, recovery, executor registry, result reference, OpenAPI/frontend mapping, and tests. This breadth is the primary extension cost; do not add a generic workflow framework in Phase 10.5.
