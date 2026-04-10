# Dashboard Stability Backlog

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this backlog task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카드형 대시보드에서 `동기화 중` 상태가 나타날 때 레이아웃이 흔들리지 않도록, 상태 영역을 고정 슬롯으로 정리한다.

**Architecture:** 상태 문구를 본문에 직접 붙이는 대신 카드 내부의 고정 높이 슬롯에 배치한다. 카드 본문과 상태 피드백의 책임을 분리해서, refetch 중에도 차트와 테이블 위치가 안정적으로 유지되게 한다.

**Tech Stack:** React 19, TypeScript, Vite, Testing Library, Vitest

---

### Task 1: 캠페인 랭킹과 플랫폼 성과 카드의 동기화 상태 슬롯 고정

**Files:**
- Modify: `src/widgets/campaign-ranking-top3/ui/campaign-ranking-top3-card.tsx`
- Modify: `src/widgets/platform-performance-chart/ui/platform-performance-chart-card.tsx`
- Modify: `src/widgets/campaign-ranking-top3/ui/__tests__/campaign-ranking-top3-card.test.tsx`
- Modify: `src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-card.test.tsx`

- [x] **Step 1: 상태 텍스트를 `min-h-5` 슬롯 안으로 이동**
- [x] **Step 2: 성공 경로 테스트에서 카드 내부에 고정 상태 슬롯이 렌더링되는지 확인**
- [x] **Step 3: `npm run test:run -- src/widgets/campaign-ranking-top3/ui/__tests__/campaign-ranking-top3-card.test.tsx src/widgets/platform-performance-chart/ui/__tests__/platform-performance-chart-card.test.tsx` 실행**

### Task 2: 캠페인 테이블 카드의 동기화 상태 슬롯 고정

**Files:**
- Modify: `src/widgets/campaign-table/ui/campaign-table-card.tsx`
- Modify: `src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx`

- [x] **Step 1: `동기화 중` 문구를 `min-h-5` 슬롯 안으로 이동**
- [x] **Step 2: 성공 경로 테스트에서 카드 내부에 고정 상태 슬롯이 렌더링되는지 확인**
- [x] **Step 3: `npm run test:run -- src/widgets/campaign-table/ui/__tests__/campaign-table-card.test.tsx` 실행**

### Task 3: 전체 검증 및 완료 체크

**Files:**
- Modify: `docs/superpowers/plans/2026-04-11-dashboard-stability-backlog.md`

- [x] **Step 1: 전체 테스트를 실행해 카드 UI 변경이 기존 경로를 깨지 않는지 확인**
- [x] **Step 2: 완료된 작업을 `x`로 표시하고 백로그를 정리**
- [x] **Step 3: `npm run test:run` 실행**
