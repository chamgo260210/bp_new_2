# Current feature inventory

- Status: Current
- Verified HEAD: pending final commit
- Verified Date: 2026-07-30 working tree

| Feature | Backend | Frontend / route | Persistence / Job | Status |
|---|---|---|---|---|
| Auth/User | `auth`, `user` | `/auth/*` | users, refresh_tokens | Active |
| Project CRUD | `project` | `/projects`, `/projects/:id/overview` | projects | Active |
| Project dashboard | existing latest APIs | `.../overview` | runtime aggregation | Active |
| Document/version | `file`, `document` | `.../documents` | stored/document/version | Active |
| DOCX parsing | parser/AI port | polling UI | `DOCUMENT_PARSE` | Active |
| Structured plan | structure | `.../structure` | plan/section/missing_field | Active |
| Legal review | `analysis.legal` | `.../legal-review` | V7 + job | Active |
| Feasibility | `analysis.feasibility` | `.../feasibility` | V8 + job | Active |
| Persona/validation plan | `persona.*` | `.../personas` | V9 + job | Active |
| Integrated report/export | no endpoint | `.../report` | current-view only | Active |
| Audit | `audit` | no audit UI | audit_events | Active backend |
| OpenAPI | controllers/DTO | API clients | none | Active |
| Financial analysis | `analysis.financial` | `.../review/financial` | V21 schema + V22 legacy backfill + synchronous calculation | Active MVP |
| Persona panel interview | `validation` | `.../validate/interview` | V19 | Active MVP (예상 인터뷰) |
| Market response | `validation` | `.../validate/market-response` | V19 | Active MVP (상대 지표) |
| Marketing content | `marketing.content` | `.../validate/marketing` | V18 + V20 | Active MVP |

Report는 저장된 최종본이 아니며 공유·서명·version history를 제공하지 않습니다.

재무 분석은 일회성·구독·혼합 수익 모델, 12·24·36개월, 세 시나리오와 단일 변수 민감도를 지원합니다. 결과는 `BigDecimal` 기반 규칙 계산이며 실제 회계·세무·투자 자문이 아닙니다.
