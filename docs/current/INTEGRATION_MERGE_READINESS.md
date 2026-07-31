# Integration Merge Readiness

> Baseline commit: `e5c7b594709a5b0706c225f8bb1a7080be389527`
>
> Verification record: the Phase 7B commit containing this document

## Merge target and current scope

- Source: `integration/ai-task-hub-foundation`
- Target: `origin/main`
- `origin/main` is an ancestor of the integration branch.
- Baseline delta: 151 files, 12,034 insertions, 22 deletions.
- Scope: the AIdev marketing Mock vertical slice, typed Spring–FastAPI contract,
  `AnalysisJob`-backed task lifecycle, S3-compatible artifacts, marketing version
  linkage, Docker Compose E2E, and failure/recovery E2E.

The integration history is intentionally split into reviewable commits:

1. `982c086` — AIdev marketing vertical slice, manually transplanted
2. `2821abd` — typed Spring–FastAPI integration contract
3. `e67e697` — `AnalysisJob`-backed AI task lifecycle
4. `f5d3e8b` — S3-compatible AI artifact storage
5. `96316a9` — marketing generation lifecycle connection
6. `999dfd6` — full Docker Compose E2E environment
7. `eb251a3` — frontend Docker guide-resource context fix
8. `e5c7b59` — Docker failure and recovery E2E coverage

## Team AIdev absorption

`team/AIdev` is one commit (`060cb74`) ahead of `team/main`. Because the personal
and team repositories did not share Git ancestry at the start of integration, that
commit was not cherry-picked. Its FastAPI health/echo/marketing multipart behavior,
validation, prompt builder, Mock output semantics, and Spring relay behavior were
manually preserved in `982c086` and then hardened by the later commits. The original
marketing endpoint remains compatible; the common task route was added in parallel.

## Database migrations

Only additive migrations were introduced. Existing migrations were not modified.

- `V23__add_ai_task_result_lifecycle.sql`
  - adds the nullable `analysis_jobs.rerun_of_job_id` relationship;
  - creates the one-result-per-job `ai_task_results` table.
- `V24__add_ai_task_artifacts.sql`
  - creates `ai_task_artifacts`;
  - links project, job, optional task result, and existing `stored_files` metadata;
  - enforces one artifact per job/role and one artifact link per stored file.
- `V25__connect_marketing_versions_to_ai_jobs.sql`
  - adds a nullable, unique `analysis_job_id` to `marketing_content_versions`.

All additions preserve existing rows through nullable links. A merge deployment must
run Flyway through V25 before accepting AI task traffic. Database downgrade is not
automated and must not be attempted by editing or deleting these migrations.

## Environment variables

Required secrets must be supplied outside Git for shared or deployed environments:

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`
- `AI_SERVER_INTERNAL_API_KEY` when internal authentication is enabled

Service and storage configuration:

- `AI_SERVER_BASE_URL`, `AI_SERVER_READ_TIMEOUT`
- `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_PUBLIC_ENDPOINT`,
  `OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_ACCESS_KEY`,
  `OBJECT_STORAGE_SECRET_KEY`
- `AI_ARTIFACT_HTTP_TIMEOUT_SECONDS`, `AI_ARTIFACT_MAX_BYTES`
- `CORS_ALLOWED_ORIGINS`
- `DOCUMENT_JOB_RUNNER_ENABLED`, `DOCUMENT_JOB_POLL_INTERVAL`,
  `DOCUMENT_JOB_EXECUTION_TIMEOUT`, `DOCUMENT_JOB_RECOVERY_INTERVAL`,
  `DOCUMENT_JOB_STALE_TIMEOUT`

Local port overrides:

- `FRONTEND_PORT`, `BACKEND_PORT`, `AI_SERVER_PORT`, `POSTGRES_PORT`
- `MINIO_API_PORT`, `MINIO_CONSOLE_PORT`

Failure hooks are test-only:

- `APP_ENVIRONMENT=E2E`
- `AI_E2E_FAULTS_ENABLED`, `AI_E2E_FAULT_MODE`,
  `AI_E2E_FAULT_DELAY_SECONDS`
- `APP_E2E_DEFER_ARTIFACT_WAKE`

The committed `.env.e2e.example` values are local placeholders, not deployable
credentials.

## Docker verification

From the repository root:

```powershell
docker compose --env-file .env.e2e.example -f compose.yaml -f compose.e2e.yaml config
powershell -ExecutionPolicy Bypass -File scripts/docker-e2e-smoke.ps1 -EnvFile .env.e2e.example
powershell -ExecutionPolicy Bypass -File scripts/docker-failure-e2e.ps1 -EnvFile .env.e2e.example
```

Normal E2E covers all six services, Flyway V1–V25, MinIO bucket initialization,
system task, artifact task, marketing generation, artifact download, rerun, result
preservation, and cleanup. Failure E2E covers AI outage, MinIO outage, malformed
response, checksum mismatch, timeout, and stale recovery.

## Merge gates

The branch is ready for team review only when all of the following are recorded for
the final commit:

- AI tests: 36/36
- Backend tests: 237/237 and build success
- Frontend: the documented stable baseline with no unhandled rejection, plus build
  success
- GitHub Actions: backend, backend-postgresql, frontend, docker-e2e, and
  contract-and-security results reviewed
- normal Docker E2E and six failure scenarios remain green
- `git diff --check`, generated-file audit, secret audit, and migration audit pass

## Rollback criteria

Stop or roll back the application release when Flyway does not reach V25, any
service remains unhealthy, job state/result persistence diverges, artifacts cannot
be verified through the Spring download path, or the new marketing version overwrites
an earlier version. Roll back application containers to the previously verified
image set first. Preserve database rows and object storage for diagnosis; do not
delete volumes or reverse migrations as an incident response shortcut.

The commits are dependency-ordered. If source rollback is required before merge,
revert them in reverse order and rerun the full test and migration compatibility
checks. Do not selectively remove V23–V25 while retaining code that references them.

## Known limitations

- Marketing image generation still uses the Mock provider.
- The legacy direct OpenAI adapter remains; migration to the task hub is incomplete.
- MinIO is the local S3-compatible implementation; cloud object storage is unverified.
- Frontend has 40 pre-existing provider-wrapper failures. CI permits only the exact
  file/test-name pairs in `frontEnd/test-debt-baseline.json`; new failures and stale
  entries fail the job, and the baseline expires on 2026-09-30. See
  `docs/current/FRONTEND_TEST_DEBT_BASELINE.md`.
- `GHSA-qwww-vcr4-c8h2` affects only unstable React Router RSC APIs, which this
  declarative Vite SPA does not use. A PURL/path-scoped Trivy exception expires on
  2026-10-31. See `docs/security/REACT_ROUTER_ADVISORY_DECISION.md`. A dedicated
  React Router 8 migration remains the permanent resolution.
- No automatic business-operation retry, message queue, autonomous agent, report
  linkage, or production deployment is included.
- The AIdev code was behaviorally absorbed, not Git-history merged, because the
  repositories had no common ancestor.

## Phase 7C merge policy

The frontend job must run `npm run test:baseline`; neither the test step nor the
job may use `continue-on-error`. The allowlist is temporary debt accounting, not a
general test bypass. Contract, secret, and Trivy scans remain blocking, with only
the documented React Router advisory exception.

Merge review requires:

- the exact 225/40 frontend baseline with zero unexpected failures;
- frontend lint and production build success;
- Trivy success with the exception shown as scoped and unexpired;
- Backend, PostgreSQL, and Docker E2E jobs green;
- no RSC, SSR, Data Router, or server-action code added while the exception exists.
