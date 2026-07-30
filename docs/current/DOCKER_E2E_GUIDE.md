# Docker Compose E2E Guide

Verified Commit: `TO_BE_FILLED_AFTER_VERIFICATION`

This environment runs the current Mock AI integration. It does not connect an
image-generation provider.

## Verification status

Compose merge/config validation, all three image builds, container health,
Flyway V1 through V25, MinIO initialization, and the full task, artifact,
marketing, and rerun Docker E2E were completed for this revision. Port 8000 was
already owned by a local Apache process on the verification machine, so the
successful run published FastAPI on port 18000. The repository CI also
contains a Docker-capable `docker-e2e` job that runs this guide's smoke
command.

## Prerequisites

- Docker Desktop with the Linux container engine running
- Docker Compose v2
- PowerShell 7 for the automated smoke script
- Ports 3000, 8080, 8000, 5432, 9000, and 9001 available, or overridden

On Windows, wait until Docker Desktop reports that the engine is running
before invoking Compose. A missing
`dockerDesktopLinuxEngine` named pipe means the CLI is installed but the
daemon is unavailable.

## Environment

Copy the example only when custom values or ports are needed:

```powershell
Copy-Item .env.e2e.example .env.e2e
```

All committed values are disposable local placeholders. Do not reuse them in
a shared environment. Images never contain JWT, PostgreSQL, MinIO, or internal
API secrets.

## Start and URLs

```powershell
docker compose --env-file .env.e2e `
  -f compose.yaml -f compose.e2e.yaml up --build
```

Without a custom file, defaults work with the requested command:

```powershell
docker compose -f compose.yaml -f compose.e2e.yaml up --build
```

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8080/actuator/health`
- FastAPI live/ready: `http://localhost:8000/health/live`,
  `http://localhost:8000/health/ready`
- MinIO API/console: `http://localhost:9000`, `http://localhost:9001`
- PostgreSQL: `localhost:5432`

The browser uses the Frontend origin and Nginx proxies `/api/` to Spring.
FastAPI and MinIO are not browser API surfaces.

## Health and smoke

Inspect health and the one-shot bucket initializer:

```powershell
docker compose -f compose.yaml -f compose.e2e.yaml ps --all
```

Run the repeatable full smoke:

```powershell
powershell -ExecutionPolicy Bypass `
  -File scripts/docker-e2e-smoke.ps1
```

With a custom environment:

```powershell
pwsh -File scripts/docker-e2e-smoke.ps1 -EnvFile .env.e2e
```

When custom host ports are used, pass the matching `-FrontendPort`,
`-BackendPort`, and `-AiServerPort` arguments to the script.

The script validates Compose configuration, builds and starts the stack,
waits for health, creates a user/project, runs `SYSTEM_SMOKE_TEST`,
`SYSTEM_ARTIFACT_SMOKE_TEST`, and `MARKETING_GENERATION`, downloads both
artifact results, reruns marketing, and confirms the prior version remains.
It prints service logs on failure and removes containers and volumes in
`finally`. Use `-KeepEnvironment` only for diagnosis.

## Cleanup

```powershell
docker compose -f compose.yaml -f compose.e2e.yaml down -v --remove-orphans
```

This deletes disposable PostgreSQL and MinIO named-volume data.

## Endpoint notes

Inside the network, Spring uses `ai-server:8000`, `postgres:5432`, and
`minio:9000`; containers must never call one another through `localhost`.
Presigned URLs consumed by FastAPI are signed for `http://minio:9000`, which
is also on its allowlist. Browser downloads use Spring's permission-checked
proxy, so the internal MinIO hostname is not exposed to users.

## Troubleshooting

- Backend unhealthy: inspect Flyway/database errors with
  `docker compose ... logs backend postgres`.
- AI ready but artifact jobs fail: confirm `minio-init` exited with code 0 and
  `AI_ARTIFACT_ALLOWED_ORIGINS` includes exactly `http://minio:9000`.
- Frontend loads but APIs fail: check Nginx and backend health; no
  `VITE_API_BASE_URL` is needed for the container build.
- Port conflict: change the matching value in `.env.e2e`.
