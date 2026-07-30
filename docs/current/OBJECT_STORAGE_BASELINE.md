# Object Storage Baseline

Verified Commit: `TO_BE_FILLED_AFTER_VERIFICATION`

## Ownership and boundaries

Spring owns `StoredFile`, project/job/result relationships, authorization,
checksums, retention metadata, and object keys. FastAPI receives only
short-lived presigned URLs and never receives storage credentials or accesses
the service database. Frontend clients download through Spring.

The existing document `FileStorage` and `LocalFileStorage` remain unchanged.
AI artifacts use `ObjectStoragePort`, because presigned GET/PUT and S3
metadata do not belong in the document upload contract.

## Providers and configuration

`app.object-storage.provider` selects `local` or `s3`. The local adapter is
for direct store/read/delete tests and intentionally cannot issue presigned
URLs. `SYSTEM_ARTIFACT_SMOKE_TEST` therefore requires the `s3` provider.

Important environment variables:

- `OBJECT_STORAGE_ENDPOINT`: Spring-to-storage endpoint
- `OBJECT_STORAGE_PUBLIC_ENDPOINT`: endpoint embedded into signed URLs
- `OBJECT_STORAGE_REGION`, `OBJECT_STORAGE_BUCKET`
- `OBJECT_STORAGE_ACCESS_KEY`, `OBJECT_STORAGE_SECRET_KEY`
- `OBJECT_STORAGE_PRESIGNED_GET_EXPIRY`,
  `OBJECT_STORAGE_PRESIGNED_PUT_EXPIRY`
- `OBJECT_STORAGE_ARTIFACT_MAX_SIZE`
- `AI_ARTIFACT_ALLOWED_ORIGINS`: exact FastAPI URL origins, including port

The endpoint used to sign a URL is part of its signature. Set
`public-endpoint` to an origin that the FastAPI process can reach without
rewriting its host. Production credentials must come from runtime secret
management.

## Security baseline

- Buckets remain private.
- Keys are UUID-based and do not contain user input.
- GET and PUT URLs expire after five minutes by default.
- FastAPI accepts only configured HTTP(S) origins and does not follow
  redirects.
- Both sides enforce a 1 MiB default limit and `application/json`.
- Input and output SHA-256, MIME type, and byte count are verified.
- URLs, signatures, credentials, and file contents are not logged.

## Retention

`StoredFile` remains the canonical metadata row. `ai_task_artifacts` only
links it to project, job, result, and SOURCE/RESULT role. Automated S3
retention and reconciliation are not enabled in this phase; failed output
creation is cleaned up immediately, with future S3 reconciliation as the
fallback design.
