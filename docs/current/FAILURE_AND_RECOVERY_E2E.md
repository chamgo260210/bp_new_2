# Failure and Recovery Docker E2E

Verified Commit: `TO_BE_FILLED_AFTER_VERIFICATION`

This suite validates failure semantics of the current Mock AI Task
environment. It does not add automatic business retry or a real image
provider.

## Run

Docker Desktop must use the Linux engine. The script runs each scenario in an
independent PostgreSQL/MinIO volume and always calls `down --volumes
--remove-orphans`.

```powershell
powershell -ExecutionPolicy Bypass `
  -File scripts/docker-failure-e2e.ps1 `
  -EnvFile .env.e2e.example `
  -AiServerPort 18000
```

Use `-Scenario ai-down`, `minio-down`, `malformed`, `checksum`, `timeout`, or
`stale` to run one case. All six published ports accept the same override
parameters as the normal smoke script.

## Expected scenarios

| Scenario | Fault | Expected Job state and preservation |
| --- | --- | --- |
| `ai-down` | Stop `ai-server` before marketing rerun | New Job `FAILED`, `AI_SERVER_TIMEOUT`, retryable; no new Version/result; prior Job, Version, and RESULT remain downloadable |
| `minio-down` | Save SOURCE, stop MinIO, then wake artifact Job | New Job `FAILED`; no RESULT metadata; uploaded output is absent; prior RESULT remains after MinIO restart |
| `malformed` | E2E-only malformed task response | New Job `FAILED`, `AI_SERVER_INVALID_RESPONSE`, non-retryable; no result metadata |
| `checksum` | E2E-only incorrect RESULT checksum | Spring integrity validation fails; no RESULT metadata; generated output object is deleted; SOURCE and prior RESULT remain |
| `timeout` | E2E-only asynchronous delay beyond Spring read timeout | New Job `FAILED`, `AI_SERVER_TIMEOUT`, retryable; attempt remains 1 and is not replayed automatically |
| `stale` | Old RUNNING heartbeat for an AI Job | Existing recovery policy marks it `FAILED`, `STALE_EXECUTION`; attempt remains 1; previous successful Job remains |

The E2E fault hook is inactive unless both `APP_ENVIRONMENT=E2E` and
`AI_E2E_FAULTS_ENABLED=true`. The manual Job wake endpoint is registered only
with the Spring `e2e` profile and an enabled Job runner. Neither diagnostic
surface is available in production profiles.

## Diagnostics and logs

The normal smoke failure path emits:

1. the original failure and exit code;
2. `docker compose ps --all`;
3. state inspection for unhealthy/exited containers;
4. all service log tails;
5. the preserved original exception after diagnostics.

Diagnostic collection is best-effort and cannot replace the original
exception. Passwords, internal API keys, JWT secrets, and presigned URL
credential/signature/token query values are redacted. Application API
responses are also checked not to expose stack traces, URLs, or connection
details.

## Cleanup and inspection

Automatic cleanup removes disposable containers, networks, and named volumes.
If a manual run is interrupted, use:

```powershell
docker compose --env-file .env.e2e.example `
  -f compose.yaml -f compose.e2e.yaml `
  down --volumes --remove-orphans
```

For a locally retained normal environment, inspect with:

```powershell
docker compose --env-file .env.e2e.example `
  -f compose.yaml -f compose.e2e.yaml ps --all
docker compose --env-file .env.e2e.example `
  -f compose.yaml -f compose.e2e.yaml logs --no-color --tail 200
```

## Known limitations

- MinIO outage classification can be `AI_TASK_EXECUTION_FAILED` or the
  bounded outer `AI_TASK_TIMEOUT`, depending on whether the S3 SDK exhausts
  its existing attempts before the Job execution timeout. Both are terminal
  and non-retryable at the business Job layer.
- MinIO recovery can precede Actuator object-storage health recovery. The
  scenario verifies the authoritative DB Job state, MinIO readiness, Backend
  reachability, object inventory, and download independently.
- The fault hook and wake endpoint are test infrastructure, not public product
  APIs.
