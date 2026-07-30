# ADR-002: S3-compatible object storage for AI artifacts

- Status: Accepted
- Date: 2026-07-30
- Verified Commit: `TO_BE_FILLED_AFTER_VERIFICATION`

## Context

The repository already has `StoredFile` metadata and a document-oriented
`FileStorage` port. AI tasks additionally need temporary delegated GET/PUT
access without giving FastAPI database access or administrator credentials.
Putting S3 presign methods on the document port would couple stable upload and
parsing behavior to a new remote-storage contract.

## Decision

Keep `FileStorage` unchanged. Add `ObjectStoragePort` for object
store/read/delete/exists/metadata and presigned GET/PUT. Provide a path-safe
local adapter and an AWS SDK v2 S3 adapter. MinIO is the local S3-compatible
server; deployment changes endpoint, region, bucket, and credentials.

Reuse `StoredFile` as the canonical object metadata. Add only
`ai_task_artifacts`, linking a stored file to project, `AnalysisJob`,
`AiTaskResult`, and SOURCE/RESULT role. `AnalysisJob` remains the sole status
ledger.

Spring creates opaque UUID keys and short-lived URLs. Its internal endpoint is
used for SDK operations; `public-endpoint` is used for signing URLs reachable
by FastAPI. FastAPI must not rewrite signed URLs, follows no redirects, and
accepts only configured exact origins.

Both sides validate content type, maximum size, and SHA-256. The bucket is
private. Credentials are configured only in Spring and local infrastructure,
never in the task envelope.

## Alternatives

- Extending `StoredFile` alone could not express project/job/result roles
  without embedding AI-specific relationships into shared metadata.
- A separate AI object metadata table duplicated key, provider, MIME, size,
  checksum, status, and retention fields.
- Extending `FileStorage` directly risked the existing document upload and
  parsing path.

## Consequences

The local object adapter intentionally does not presign; artifact task
execution requires the S3 provider. Small JSON results remain in
`AiTaskResult` for provenance while durable bytes are referenced through
`StoredFile`.

Failed in-flight output objects are deleted immediately. General S3 orphan
reconciliation and lifecycle expiration remain future work. Marketing and
report domains can later link their generated artifacts without changing the
storage metadata model.
