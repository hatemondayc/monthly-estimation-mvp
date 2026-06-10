# Monthly Estimation MVP

이노션 DX팀/커머스셀 **월별 실적 추정 웹 원장** (MVP).
엑셀 기반 월별 실적 추정 업무를 웹 공동작업 솔루션으로 전환한다.

- 1차 추정 / 중간·월말 업데이트 버전 입력·비교
- 취급고·매출액·매출원가·매출이익 + 유연한 계산 방식 + 이익률 자동 계산
- 추정근거/비고 아카이브, CSV Export
- 향후 Creator Commerce OS 병합 가능 구조

스펙은 [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md), 데이터 모델은 [docs/DATA_MODEL.md](docs/DATA_MODEL.md) 참고.

## 기술 스택

- Next.js (App Router) + TypeScript + Tailwind CSS
- 저장: 로컬 JSON 파일 (`data/estimates.local.json`) — Repository 인터페이스로 분리, 추후 Prisma/Supabase 교체 가능

## 회사 PC 실행 방법 (포터블 Node)

> 이 PC에는 시스템 Node가 없어, 프로젝트 내부 `.tools/node`에 **포터블 Node**가 설치되어 있습니다.
> 시스템 PATH를 건드리지 않고 세션 단위로만 사용합니다.

### PowerShell

```powershell
$env:Path = "$PWD\.tools\node;$env:Path"
node -v          # v22.x 확인
npm install      # 최초 1회 (이미 설치됨)
npm run dev      # http://localhost:3000
```

### Git Bash

```bash
export PATH="$PWD/.tools/node:$PATH"
node -v
npm run dev
```

> 다른 PC(시스템 Node 설치됨)에서는 `.tools` 없이 `npm install && npm run dev`만 하면 됩니다.

## 접근 패스코드

`.env.local`의 `APP_PASSCODE` 값 (기본 `estimation-2026`). 팀 배포 시 변경하세요.

## 폴더 구조

```
src/
  app/            # 라우트 (login, dashboard, estimates, compare) + api
  components/     # EstimateTable, SummaryCards, VersionSwitcher, CalculationTypeSelect, NavBar
  lib/            # calculations, repository, data(서비스), auth, csv, format, seed
  types/          # estimate.ts
data/             # 런타임 JSON 저장 (gitignore)
docs/             # 스펙 문서
.tools/           # 포터블 Node (gitignore)
```

## 데이터/보안 원칙

- 시드는 **익명 샘플**(광고주 A / JOB-001 / 임의 금액). 실제 회사 데이터 미사용.
- `data/estimates.local.json`, `.env*`, `.tools`, `node_modules`, `.next`는 커밋되지 않습니다(`.gitignore`).
