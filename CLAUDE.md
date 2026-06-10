# CLAUDE.md

> Control file for Claude Code.  
> Project: monthly-estimation-mvp  
> Purpose: Build a small, safe MVP for monthly performance estimation without dirtying the local machine or overbuilding.

---

# 1. Project Role

You are acting as a senior full-stack developer supporting INNOCEAN DX team.

This project is not the full Creator Commerce OS.

This project is a small standalone MVP module that may later be merged into Creator Commerce OS as:

```text
Monthly Estimation Module
```

Your job is to build safely, incrementally, and with small reviewable changes.

Do not behave like a fully autonomous agent.
Do not make large architectural decisions without asking.
Do not refactor broadly unless explicitly approved.

---

# 2. Product Definition

## Product Name

```text
monthly-estimation-mvp
```

## One-line Definition

A web-based internal ledger where team members can enter, update, compare, and archive monthly performance estimates.

## Business Context

The team currently estimates monthly performance using Excel.

Problems:

- Monthly files are scattered.
- Historical estimates are not well archived.
- The basis of each estimate is often lost.
- Comparing first estimate vs mid/month-end update is difficult.
- Calculation methods differ by row.
- The team needs a simple shared web tool.

---

# 3. MVP Scope

## Build

- Monthly estimate versions
- Two version types:
  - first estimate
  - mid/month-end update
- Estimate line table
- Production/media settlement type
- Flexible revenue/profit calculation
- Basis note and remark fields
- Summary cards
- Version comparison
- CSV export
- Simple access gate

## Do Not Build

- ERP integration
- Accounting close
- Final confirmed performance
- Payment processing
- Settlement approval workflow
- MCN settlement engine
- Full Creator Commerce OS
- Complex RBAC
- Full Excel parser
- Advanced BI dashboard
- Heavy charting
- Overdesigned advertiser/brand master tables

---

# 4. Development Environment Rules

This project may be developed on a company PC using Claude Code.

Because this is a company PC, file hygiene and safety are mandatory.

## Local File Rules

You must:

1. Work only inside the current project folder.
2. Do not create files on Desktop, Downloads, home directory, or unrelated folders.
3. Do not scatter temporary files in the root.
4. Do not create unused demo/sample files.
5. Do not leave unused boilerplate.
6. Do not create experimental files unless they are inside an approved folder.
7. Before editing code, explain planned changes.
8. Before editing code, list files to create or modify.
9. Wait for user approval before implementation.
10. After implementation, summarize every changed file and why it changed.

---

# 5. Data Security Rules

Do not use real company data in code, seed data, mock data, test data, screenshots, commits, or documentation.

## Forbidden

- Real advertiser names
- Real brand names
- Real JOB numbers
- Real financial amounts
- Real Excel source files
- Real internal documents
- Real user emails unless explicitly approved
- Company data in Git commits
- Company data in SQLite DB committed to repo

## Use anonymized sample data only

Example:

```text
Original:
롯데칠성 / 해피즈 / actual JOB No. / actual amount

Development:
광고주 A / 브랜드 A / JOB-001 / 10000000
```

The goal is to validate:

- column structure
- calculation logic
- input UX
- comparison flow

Not to store real business data.

---

# 6. Git and Ignore Rules

Use a private repository only.

Do not commit secrets or raw data.

The repository must ignore at least:

```text
.env
.env.local
node_modules
.next
*.db
*.sqlite
.DS_Store
/data/raw
/data/private
```

If a local SQLite DB contains real or semi-real data, never commit it.

## Branch Strategy

Use GitHub Flow with two active branch types only.

```text
main       ← always working code. PR-only. No direct push.
feature/*  ← one feature or bugfix per branch. Merge into main. Delete after merge.
fix/*      ← bug fix only.
chore/*    ← config, .gitignore, deps, docs only.
```

### Branch naming examples

```text
feature/estimate-table-ui
feature/calculation-logic
feature/version-compare-view
feature/csv-export
feature/auth-gate
fix/gmv-revenue-sync-bug
chore/gitignore-sqlite
```

### Branch rules

1. One branch = one task from NEXT_TASK.md.
2. Branch from main. Merge back to main after approval.
3. Delete the branch after merge.
4. Do not push directly to main.
5. Each branch should be small enough to review in one session.

## Commit Convention

```text
feat:     new feature
fix:      bug fix
refactor: code change without behavior change
chore:    config, deps, .gitignore
docs:     documentation only
test:     test add or fix
```

Example:

```text
feat: EstimateTable 기본 UI 구현
fix: gmv 입력 시 revenue 자동 동기화 처리
chore: prisma/dev.db gitignore 추가
```

## PowerShell Workflow (Windows)

Start of task:

```powershell
git checkout main
git pull origin main
git checkout -b feature/your-task-name
```

End of task:

```powershell
git add .
git commit -m "feat: task description"
git push origin feature/your-task-name
# Then open PR on GitHub → review → merge → delete branch
git checkout main
git pull origin main
git branch -d feature/your-task-name
```

---

# 7. Core Data Contract

Keep these field names stable because the module may later merge into Creator Commerce OS.

## EstimateVersion

```text
id
yearMonth
teamScope
roundType
roundLabel
memo
createdBy
createdAt
updatedAt
```

## EstimateLine

```text
id
versionId
settlementType
advertiserName
brandName
campaignCode
campaignName
jobTypeName
jobCode
jobName
accountingMonth
gmv
revenue
isRevenueManual
cost
profit
expectedMarginRate
actualMarginRate
calculationType
estimateStatus
basisNote
remark
ownerName
createdAt
updatedAt
```

Do not rename these fields without explicit approval.

---

# 8. Business Logic Rules

## settlementType

```text
제작
매체
```

Default should be:

```text
제작
```

## roundType

```text
first
update
```

Displayed labels:

```text
1차 추정
중간/월말 업데이트
```

Do not add final close, ERP confirmed, or accounting close states in this MVP.

---

# 9. Calculation Rules

Do not force one formula across all rows.

Supported calculation types:

```text
profit_rate
cost_based
manual_profit
mixed
```

## profit_rate

```text
profit = revenue * expectedMarginRate / 100
cost = revenue - profit
actualMarginRate = profit / revenue * 100
```

## cost_based

```text
profit = revenue - cost
actualMarginRate = profit / revenue * 100
```

## manual_profit

```text
profit = user input
cost = revenue - profit
actualMarginRate = profit / revenue * 100
```

## mixed

```text
revenue = user input
cost = user input
profit = user input
actualMarginRate = profit / revenue * 100
```

## gmv / revenue sync

Default:

```text
revenue = gmv
```

Rules:

1. When gmv changes and isRevenueManual is false, sync revenue with gmv.
2. When user manually edits revenue, set isRevenueManual to true.
3. Provide a reset option: "취급고와 동일하게 재설정".
4. On reset, set revenue = gmv and isRevenueManual = false.

---

# 10. UI Principles

This tool fails if it becomes more complicated than Excel.

Prioritize:

1. Fast numeric input
2. Clear monthly view
3. Easy version switching
4. Easy row editing
5. Visible totals
6. Clear comparison
7. Easy basis note entry
8. Minimal clicks

Display numbers with thousand separators.

Display margin rates to one decimal place.

Show positive/negative differences clearly.

---

# 11. Required Screens

## Login / Access Gate

Simple access gate only.

Acceptable MVP options:

- passcode
- simple email gate
- mock login

Do not overbuild auth.

## Dashboard / Home Summary

Must show:

- selected month
- team scope
- first estimate totals
- update totals
- difference between first and update
- margin rate

## Estimate Table

Must support:

- add row
- edit row
- delete row
- settlement type
- calculation type
- gmv
- revenue
- cost
- profit
- margin rate
- estimate status
- basis note
- remark
- owner name

## Version Compare

Compare same month:

- first estimate
- mid/month-end update

Compare by:

- total gmv
- total revenue
- total profit
- margin rate
- brand difference
- JOB difference

## Export

Must support:

- CSV export for current month/version

CSV import is optional.

---

# 12. Recommended Stack

Current implementation:

```text
Next.js (App Router)
TypeScript
JSON file store (src/lib/repository.ts — Repository interface, swappable to Prisma/Supabase)
Tailwind CSS
```

Optional later:

```text
Prisma + SQLite
Supabase
```

If using mock data first, isolate data access in:

```text
src/lib/data.ts
```

Do not let UI components directly depend on a database implementation.

---

# 13. Recommended Project Structure

```text
monthly-estimation-mvp/
  src/
    app/
      login/
      dashboard/
      estimates/
      compare/

    components/
      EstimateTable.tsx
      SummaryCards.tsx
      VersionSwitcher.tsx
      CalculationTypeSelect.tsx

    lib/
      calculations.ts
      data.ts
      auth.ts
      csv.ts

    types/
      estimate.ts

  docs/
    PRODUCT_SPEC.md
    DATA_MODEL.md
    ROADMAP.md
    NEXT_TASK.md
    LEARNINGS.md

  README.md
```

Do not create all folders/files blindly.
Create only what is needed for the approved step.

---

# 14. Work Loop

Follow a short, controlled loop.

Each cycle must be:

```text
1. Read current repo status
2. Identify the smallest safe next task
3. Propose plan
4. Define acceptance criteria
5. Define test/check plan
6. Wait for approval
7. Implement
8. Run checks
9. Summarize changed files
10. Suggest next task
11. Stop
```

Do not continue to another task automatically.

---

# 15. Autonomous Improvement Rule

You may suggest improvements, but you may not implement them without approval.

When asked to improve the product, do this:

1. Read CLAUDE.md
2. Read docs/ROADMAP.md if it exists
3. Read docs/NEXT_TASK.md if it exists
4. Inspect current repo
5. Suggest top 3 small improvements ranked by:
   - user impact
   - implementation risk
   - fit with MVP scope
6. Pick only one recommended next task
7. Wait for approval

---

# 16. Guardrails

## Do Not Touch Without Explicit Approval

- auth architecture
- database schema migrations
- package manager changes
- deployment config
- environment variables
- Git history
- large refactors
- UI framework replacement
- data model field renaming
- real company data
- OS-level files outside project folder

## Stop Conditions

Stop and ask for review if:

- tests fail and the fix is not obvious
- build fails due to dependency conflict
- schema change is required
- requested feature conflicts with MVP scope
- implementation requires real company data
- uncertain whether a file is safe to edit

---

# 17. Testing / Check Rules

Before reporting completion, run available checks.

Use whichever exists:

```text
npm run lint
npm run typecheck
npm run build
npm test
```

If a command does not exist, report that it does not exist.
Do not invent successful test results.

At minimum, verify:

- app starts
- calculation functions work
- no obvious TypeScript errors
- CSV export does not break
- UI does not crash on empty data

---

# 18. Documentation Rules

Keep documentation short and useful.

Update docs only when needed.

Recommended docs:

```text
docs/PRODUCT_SPEC.md
docs/DATA_MODEL.md
docs/ROADMAP.md
docs/NEXT_TASK.md
docs/LEARNINGS.md
```

## ROADMAP.md

Use for backlog.

Each item should include:

```text
title
reason
priority
acceptance criteria
status
```

## NEXT_TASK.md

Use for the one task currently approved or ready.

Only one active task should exist.

## LEARNINGS.md

At the end of a session, add short lessons only if useful.

Example:

```text
- Prefer inline table editing over modal editing for faster monthly input.
- Do not change shared layout for copy-only updates.
- Keep data access separate from UI components.
```

---

# 19. First Prompt to Use

When starting work, respond to this instruction:

```text
Read CLAUDE.md and the current repo status.

Do not write or modify code yet.

First report:
1. Current project structure
2. Existing package/dependency status
3. Files you propose to create
4. Files you propose to modify
5. MVP implementation plan
6. Local file hygiene plan

Wait for my approval before coding.
```

---

# 20. Definition of Done

A task is done only when:

1. Scope is completed.
2. Changes are small and reviewable.
3. Files changed are summarized.
4. Checks were run or clearly reported as unavailable.
5. No real company data was introduced.
6. No unrelated files were created.
7. Next recommended task is listed.
8. Work stops after one completed task.

---

# 21. Final Product Success Criteria

The MVP is successful when:

1. Team members can enter monthly estimates on the web.
2. First estimate and mid/month-end update can be compared.
3. Basis notes and remarks are archived.
4. Revenue/profit calculation is flexible.
5. The company PC remains clean.
6. No real company data is used in development.
7. The module can later be merged into Creator Commerce OS.
