# Design System

현재 프로젝트의 디자인 시스템은 운영툴형 대시보드를 위한 토큰 중심 구조를 기준으로 한다.

## Status

- 적용 상태: 구현 반영됨
- 기준 파일: `src/app/styles/tokens.css`, `src/app/styles/base.css`
- 목적: 높은 정보 밀도에서도 판독성, 상태 구분, 조작 일관성을 유지

## Structure

디자인 토큰은 아래 계층으로 구성한다.

1. `primitive`
색상 팔레트, 폰트, 크기, spacing, radius, shadow, motion, z-index 같은 원재료 값

2. `semantic`
`text-*`, `surface-*`, `border-*`, `interactive-*`, `status-*`, `chart-*`처럼 UI 의미를 직접 표현하는 계층

3. `component`
`panel`, `button`, `table`, `input`, `sidebar`처럼 공용 컴포넌트에 필요한 alias 계층

## Core Rules

- 컴포넌트는 raw hex보다 semantic token을 우선 사용한다.
- 상태 색상은 `bg + fg + border` 세트로 관리한다.
- 차트 색상은 순번만이 아니라 의미 기반 alias를 함께 사용한다.
- `focus`, `hover`, `selected`, `disabled`는 별도 토큰으로 정의한다.
- 운영툴 텍스트 역할인 `table`, `metric`, `form`, `caption`을 구분한다.

## Active References

- 디자인 컨텍스트: `docs/design-context.md`
- 현재 구현: `src/app/styles/tokens.css`
- 글로벌 베이스 스타일: `src/app/styles/base.css`

## Archive

이전 설계 과정 문서와 Stitch 산출물은 `docs/archive/design/` 아래에 보관한다.

- 초기 Stitch 산출물: `docs/archive/design/stitch/`
