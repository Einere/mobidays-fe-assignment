# src/widgets 클린코드 분석

대상 위젯:

- `campaign-ranking-top3`
- `campaign-table`
- `daily-trend-chart`
- `global-filter`
- `platform-performance-chart`

## 결론

5개 위젯이 모두 같은 수준으로 클린하다고 보긴 어렵다.  
전체적으로는 변경 가능한 구조를 향해 잘 정리되어 있지만, 일부 위젯은 아직 **가독성**과 **응집도** 측면에서 개선 여지가 남아 있다.

현재 기준으로는 다음 순서가 적절하다.

1. `global-filter`
2. `daily-trend-chart`
3. `platform-performance-chart`
4. `campaign-ranking-top3`
5. `campaign-table`

`campaign-table`은 이번 리팩토링으로 가장 많이 정리된 상태라 상대적으로 가장 안정적이다.

## 위젯별 판단

### campaign-table

현재 가장 잘 정리된 편이다.

- 카드 컴포넌트에서 상태 오케스트레이션을 `view model`로 분리했다.
- 선택 초기화 규칙을 helper로 분리해 정책이 이름으로 드러난다.
- toolbar, table, dialog의 props 계약을 목적별 객체로 정리했다.

남은 과제는 많지 않다.

- 선택 계산이 데이터가 커질 때 비용이 늘 수 있다.
- 현재 규모에서는 구조 단순화 이점이 더 크다.

### campaign-ranking-top3

대체로 무난하다.

- 상태 분기와 렌더 책임이 비교적 명확하다.
- 메트릭 선택과 차트 렌더링의 경계도 크게 어긋나 있지 않다.

다만 완전히 얇은 카드라고 보기는 어렵다.

- 카드가 view state 판정과 렌더 분기를 함께 맡고 있다.
- 필요하면 상태 해석과 프레임 렌더를 더 분리할 수 있다.

### daily-trend-chart

아직 구조적으로 가장 무거운 편이다.

- query 처리, view state 해석, 메트릭 토글, 차트 렌더링이 한 카드에 모여 있다.
- 프레임 컴포넌트와 메타 컴포넌트가 나뉘어 있지만, 핵심 orchestration은 아직 카드에 있다.

주요 개선 방향은 다음과 같다.

- query와 view state 해석을 훅 또는 model 계층으로 더 명확히 분리
- 차트 렌더와 상태 메시지를 더 얇은 하위 컴포넌트로 분리

### global-filter

현재 가장 먼저 손볼 후보다.

- draft 상태 관리
- 날짜 검증
- atom 동기화
- 데스크톱/모바일 분기

가 한 컴포넌트에 함께 있다.

이 구조는 동작 자체는 분명하지만, 변경 비용이 높다.

- 날짜 입력 정책을 바꾸려면 draft/검증/적용 흐름을 함께 봐야 한다.
- 화면 폭 분기까지 섞여 있어 읽는 시점 이동이 많다.

### platform-performance-chart

구조는 동작하지만 아직 응집도가 높다고 보긴 어렵다.

- query 상태 해석
- 집계 계산
- 필터 상호작용
- 차트와 상태 메시지 렌더링

이 한 파일에 모여 있다.

특히 집계 로직과 UI 조립이 같이 있어, 기능 추가 시 수정 범위가 커질 가능성이 있다.

## 네 기준으로 요약

### 가독성

- 가장 좋은 편: `campaign-table`, `campaign-ranking-top3`
- 개선 필요: `daily-trend-chart`, `platform-performance-chart`, `global-filter`

### 예측 가능성

- `campaign-table`은 책임 경계가 비교적 예측 가능하다.
- `global-filter`와 두 차트 카드는 내부 흐름이 더 복합적이다.

### 응집도

- `campaign-table`은 관련 책임을 잘 묶었다.
- `global-filter`는 함께 바뀌지 않는 책임이 같은 파일에 섞여 있다.

### 결합도

- `campaign-table`은 하위 UI와 상태 오케스트레이션을 분리한 편이다.
- `global-filter`와 차트 카드는 여전히 상위 상태와 UI가 강하게 붙어 있다.

## 권장 다음 작업

1. `global-filter`를 draft/validation/selection 렌더 단위로 분리
2. `daily-trend-chart`와 `platform-performance-chart`에 view model 또는 orchestration 훅 도입
3. `campaign-ranking-top3`는 필요할 때만 미세 조정
4. `campaign-table`은 현재 구조 유지, 데이터 증가 시 선택 계산만 재검토

## 최종 판단

`campaign-table`은 이번 리팩토링 이후 충분히 클린한 편이다.  
나머지 위젯은 동작은 명확하지만, 변경하기 쉬운 코드라는 기준에서는 아직 정리 여지가 남아 있다.
