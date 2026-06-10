# Data Model

> PRD §7 기준. 향후 Creator Commerce OS 병합을 위해 굵게 표시한 필드는 유지한다.

## EstimateVersion (월별 추정 버전)

| 필드 | 타입 | 설명 |
|---|---|---|
| id | string | 버전 ID |
| yearMonth | string | 예: 2026-06 |
| teamScope | string | 디이팀 / 커머스셀 |
| roundType | `first` \| `update` | 1차 추정 / 업데이트 |
| roundLabel | string | 표시용 라벨 |
| memo | string | 버전 메모 |
| createdBy | string | 생성자 |
| createdAt / updatedAt | ISO datetime | 생성·수정 시각 |

## EstimateLine (실적 추정 행)

| 필드 | 타입 | 설명 |
|---|---|---|
| id | string | 행 ID |
| versionId | string | EstimateVersion 연결 |
| **settlementType** | `제작` \| `매체` | 정산 구분 |
| **advertiserName** | string | 광고주명 |
| **brandName** | string | 브랜드명 |
| **campaignName** | string | 캠페인명 |
| jobTypeName | string | JOB 유형명 |
| **jobCode** | string | JOB 코드 |
| **jobName** | string | JOB 명 |
| accountingMonth | string | 회계기간 |
| **gmv** | number | 취급고 |
| **revenue** | number | 매출액 |
| isRevenueManual | boolean | 매출액 수동수정 여부 |
| **cost** | number | 매출원가 |
| **profit** | number | 매출이익 |
| expectedMarginRate | number | 예상이익률(%) |
| actualMarginRate | number | 실적이익률(%) — 계산값 |
| calculationType | enum | 계산 방식 (아래) |
| estimateStatus | `예상`\|`진행중`\|`확정`\|`이월가능`\|`제외` | 상태 |
| confidenceLevel | `High`\|`Mid`\|`Low` | 신뢰도 |
| **basisNote** | string | 추정근거 |
| **remark** | string | 비고 |
| **ownerName** | string | 담당자 |
| createdAt / updatedAt | ISO datetime | 생성·수정 시각 |

## calculationType (계산 방식, PRD §8)

| 값 | 동작 |
|---|---|
| `profit_rate` | profit = revenue × expectedMarginRate/100, cost = revenue − profit |
| `cost_based` | profit = revenue − cost |
| `manual_profit` | profit 직접 입력, cost = revenue − profit |
| `mixed` | revenue·cost·profit 직접 입력, actualMarginRate만 계산 |

공통: `actualMarginRate = profit / revenue × 100` (revenue=0 가드).

## 취급고 ↔ 매출액 (PRD §9)

- 기본: `revenue = gmv`
- `isRevenueManual=false` → gmv 변경 시 revenue 자동 동기화
- 사용자가 revenue 직접 수정 → `isRevenueManual=true`
- "취급고와 동일" 버튼 → `revenue=gmv`, `isRevenueManual=false`

## 저장 형식

런타임 데이터는 `data/estimates.local.json` 단일 파일.

```json
{ "versions": [ /* EstimateVersion[] */ ], "lines": [ /* EstimateLine[] */ ] }
```

이 파일은 `.gitignore` 처리되어 커밋되지 않는다. 첫 실행 시 익명 시드(`src/lib/seed.ts`)로 생성된다.
