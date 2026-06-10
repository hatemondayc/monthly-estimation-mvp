# Product Spec — Monthly Estimation MVP

## 한 줄 정의

이노션 DX팀/커머스셀이 월별 실적을 **1차 추정**과 **중간·월말 업데이트** 버전으로 입력·비교·공유하는 내부 웹 원장.

## 이번 MVP가 하는 것 (PRD §3.1)

- 월별 실적 추정 데이터 입력 (행 추가/수정/삭제)
- 1차 추정 / 업데이트 버전 구분
- 제작 / 매체 정산 구분
- 취급고 / 매출액 / 매출원가 / 매출이익 입력 + 계산 방식 선택 + 이익률 자동 계산
- 추정근거 / 비고 / 담당자 / 상태 / 신뢰도 입력
- 월별 Summary, 1차 대비 업데이트 비교
- CSV Export
- 간단한 접근 제한(패스코드)

## 하지 않는 것 (PRD §3.2)

ERP 연동, 회계 마감, 실제 정산/지급, 복잡한 승인 플로우, MCN 정산 엔진, 완전한 엑셀 파서, 고급 BI.

## 화면

| 경로 | 화면 | 설명 |
|---|---|---|
| `/login` | 접근 제한 | 패스코드 입력 |
| `/dashboard` | Home Summary | 1차/업데이트 요약 + 증감 (§11.2) |
| `/estimates` | 추정 입력 | 핵심 입력 테이블 (§11.3) |
| `/compare` | 버전 비교 | 합계·브랜드별·JOB별 증감 (§11.4) |

## 아키텍처

```
UI (app/, components/)
  → 서비스 계층 (lib/data.ts)
    → 저장소 계약 (lib/repository.ts: EstimateRepository)
      → FileRepository (data/estimates.local.json)
```

- 계산 로직은 `lib/calculations.ts`에 순수 함수로 분리 — UI(즉시 미리보기)와 서비스(영속화 전 재계산)에서 공유.
- 저장소는 인터페이스로 분리 → 추후 Prisma/Supabase 구현체로 교체 가능(데이터/서비스/ UI 변경 없음).
- 인증은 `lib/auth.ts` + `middleware.ts`로 분리 → 추후 Supabase Auth/OS 권한 체계로 교체 가능.

## 향후 OS 병합 (PRD §15)

유지 필드: settlementType, advertiser/brand/campaign/jobCode/jobName, gmv, revenue, cost, profit, basisNote, remark, ownerName. 연결 대상(Brands, Campaigns, Settlement_Preparation, Performance_Summary, Activity_Log)은 이번 MVP에서 만들지 않는다.
