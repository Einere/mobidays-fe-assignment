# 사용한 AI 도구

## Claude Code

- 정보 분석
- 프로젝트 초기화

## Codex

- 디자인 시스템 구체화 및 구현

# 기술스택 선정 과정

[tech-decisions.md](./docs/tech-decisions.md)

# 기본적인 구현 시 주의사항

[implementation-notes.md](./docs/implementation-notes.md)


# 의사결정 과정

## 04.08.

과제 안내를 읽고 의사결정이 필요한 요소들을 정리, Claude Code를 이용해 비교분석 후 기술스택 결정.

`tech-decisions.md`와 `implementation-notes.md`를 정리한 뒤, 기본적인 환경을 설정함.

shadcn/ui 을 처음 써보다 보니, 사용법을 새롭게 알게 됨.
- cli 를 통해 컴포넌트를 통째로 복사하는 방식.

google stitch를 이용해서 기본적인 디자인 감각을 정의, 디자인 시스템 정보 추출 후 imppecable 을 활용하여 구체화.
- 디자인 토큰, 시맨틱 토큰을 구체적으로 정의
- shadcn 컴포넌트에 적용

SuperPower를 이용해 글로벌 필터 스펙/계획 정리 후 구현
- 집행기간 필터: 시작일 / 종료일 입력 2개
- 상태와 매체의 다중 선택 UI: 데스크톱은 칩, 모바일은 드롭다운
- 필터 책임: 기본적으로 서버 책임. 단, 캠페인 관리 테이블 관련 제어 변수는 클라이언트 책임.
- 전체 선택의 의미: AI는 빈 배열도 전체 선택으로 취급하자고 제안했지만, 사용자가 인지 부하를 줄이기 위해 명시적으로 배열에 값이 모두 있는 경우로 판단하자고 정정.