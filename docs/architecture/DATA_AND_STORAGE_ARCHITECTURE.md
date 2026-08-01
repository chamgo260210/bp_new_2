# Data and Storage Architecture

- Status: TARGET_CANONICAL
- Last Reviewed Commit: e16bd316ac881f4c5fab076e65c14657f6a8c7d4
- Scope: RDB, Object Storage and artifact ownership
- Supersedes: Legacy data model and object storage documents
- Implementation Status: NOT_STARTED

Spring이 RDB와 Object Storage의 유일한 관리 주체다. RDB는 aggregate 상태, version metadata, TaskRun 계열, provenance와 Final Report snapshot을 저장한다. Object Storage는 사용자 파일, AI 입력·결과 중 binary artifact, report export를 저장한다.

파일은 project/owner scope, content type, size, checksum, storage key와 lifecycle을 검증한다. AI Server에는 storage URL이나 credential을 제공하지 않는다.

기존 Flyway V1~V26은 불변이다. 신규 Workflow 완료 후 신규 migration으로 legacy FK/table/index를 제거하며 기존 테스트 데이터는 이관하지 않는다.
