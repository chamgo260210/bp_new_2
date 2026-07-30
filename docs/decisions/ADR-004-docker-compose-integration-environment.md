# ADR-004: Docker Compose integration environment

Status: Accepted

Verified Commit: `TO_BE_FILLED_AFTER_VERIFICATION`

## Decision

The local integration baseline uses Docker Compose for six services:
Frontend, Spring backend, FastAPI AI server, PostgreSQL, MinIO, and a one-shot
MinIO bucket initializer. `compose.yaml` contains the complete portable
service graph and private network. `compose.e2e.yaml` publishes host ports and
enables the E2E-only `dev-header-auth` Spring profile.

The Frontend is a production Vite build served by unprivileged Nginx. Browser
API calls remain relative to `/api/v1`; Nginx proxies `/api/` to the backend.
This avoids embedding host-specific backend URLs at build time and keeps
MinIO and FastAPI internal endpoints out of browser contracts.

## Network and storage endpoints

- Spring calls FastAPI at `http://ai-server:8000`.
- Spring connects to PostgreSQL at `postgres:5432`.
- Spring signs and FastAPI consumes MinIO URLs at `http://minio:9000`.
- Browser artifact downloads continue through the authorized Spring endpoint.

For this container topology, object-storage internal and signing endpoints are
the same. A deployment that requires browser-consumable presigned URLs must
configure a separate reachable public endpoint; host rewriting is forbidden
because it invalidates S3 signatures.

## Health and startup

PostgreSQL and MinIO use native health probes. FastAPI uses `/health/ready`;
Spring exposes only Actuator health with details hidden; Nginx serves
`/healthz`. Application dependencies use healthy conditions, while the
one-shot bucket initializer uses successful completion.

## Security consequences

Images contain no credentials. Runtime environment variables provide database,
JWT, AI internal-key, and storage secrets. Repository defaults are explicitly
local E2E placeholders, not deployable credentials. Buckets stay private.
`dev-header-auth` is absent from the base service and enabled only by the E2E
override. Automatic retry, cloud deployment, and production secret management
remain out of scope.
