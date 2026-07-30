# Spring–FastAPI Integration Baseline

Verified Commit: `TO_BE_FILLED_AFTER_VERIFICATION`

This integration is a Mock vertical slice. Spring calls a FastAPI task
boundary, while FastAPI copies the uploaded image to a local `ai/outputs`
directory and returns a preview URL. It does not call an image-generation
provider or access the service database.

## Endpoints

- `GET /health`: compatibility health response
- `GET /health/live`: FastAPI process liveness
- `GET /health/ready`: router and local Mock output readiness
- `POST /api/v1/test`: connection echo
- `POST /api/v1/marketing/banners/generate`: multipart Mock banner generation
- `POST /internal/v1/tasks`: versioned internal task envelope; currently only
  `SYSTEM_SMOKE_TEST`, `SYSTEM_ARTIFACT_SMOKE_TEST`, and
  `MARKETING_BANNER_GENERATION`

All responses return `X-Request-Id`. When the caller supplies the header,
FastAPI returns the same value; otherwise it generates a UUID. Error responses
use the common `request_id` and `error` envelope.

## Spring configuration

- `AI_SERVER_BASE_URL` (default `http://127.0.0.1:8000`)
- `AI_SERVER_CONNECT_TIMEOUT` (default `3s`)
- `AI_SERVER_READ_TIMEOUT` (default `30s`)
- `AI_SERVER_INTERNAL_API_KEY` (optional; no repository secret)

The local-only relay controller is available with the `local` or
`dev-header-auth` profile and is not registered in production profiles.
Use `dev-header-auth` for an authenticated manual relay check; do not weaken
the normal security configuration.

## Local smoke

Create `ai/.venv`, install `ai/requirements-dev.txt`, and run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/ai-local-smoke.ps1
```

To include the AnalysisJob-backed task lifecycle:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/ai-local-smoke.ps1 -JobSmoke
```

The script checks ports 8000 and 8080, starts both processes, calls the Spring
health and multipart relays, verifies request-ID propagation and the Mock
file, then stops the process trees and removes its generated files.
`-JobSmoke` additionally creates a temporary user/project, submits a
`SYSTEM_SMOKE_TEST`, and verifies the persisted `SUCCEEDED` job and
`AI_TASK_RESULT` reference.
If port 8000 is already owned by another service, pass an unused AI port, for
example `-AiPort 18000`; the script injects the matching base URL into Spring.

The artifact smoke starts MinIO through `compose.infrastructure.yaml` when
Docker is available. A native MinIO binary can be supplied when it is not:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/ai-artifact-smoke.ps1
powershell -ExecutionPolicy Bypass -File scripts/ai-artifact-smoke.ps1 `
  -MinioExecutable C:\tools\minio.exe
```

It verifies Spring-owned input metadata, presigned GET/PUT transfer through
FastAPI, output checksum and metadata finalization, `SUCCEEDED`, and the
owner-authorized Spring download endpoint.

The marketing lifecycle smoke additionally creates a content/version, runs
the Mock banner task, verifies the generated version and downloadable result,
and submits an explicit rerun:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/ai-marketing-smoke.ps1
```

## Known limitations

- Local output storage and `/outputs` static serving are Mock-only.
- The Spring multipart adapter still buffers the upload into a byte array.
- `SYSTEM_SMOKE_TEST` remote failures are terminal; the remote retryable
  classification is recorded but no automatic task rerun occurs.
- There is no separate AI Run table, image-generation provider, or Actuator
  `HealthIndicator`.
- System artifact smoke supports small JSON. Marketing tasks allow the
  existing PNG/JPG/JPEG/WEBP and 10 MiB baseline. The compatibility endpoint
  still uses its
  compatibility `ai/outputs` directory.

A later phase can connect marketing/report artifacts to the same storage
boundary while keeping `AnalysisJob` as the Spring-owned run ledger.
