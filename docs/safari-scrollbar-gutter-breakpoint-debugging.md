# Safari 스크롤바 거터로 인한 브레이크포인트 오동작 디버깅 기록

## 배경

캠페인 등록 기능을 구현하면서 `Dialog` 내부의 `Select` 드롭다운을 열 때, Safari 실브라우저에서만 레이아웃이 갑자기 데스크탑 뷰처럼 바뀌는 문제가 발생했다.

문제는 특히 브라우저 창 너비가 `1023px`일 때 명확하게 재현되었다. 이 프로젝트의 주요 레이아웃 전환 기준은 `lg` 브레이크포인트인 `1024px`이므로, 실제 뷰포트 폭이 1px만 늘어나도 아래 변화가 즉시 발생한다.

- [App.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/App.tsx): `lg:grid-cols-[260px_minmax(0,1fr)]`
- [App.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/App.tsx): `SidebarNav`는 `lg:block`
- [App.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/App.tsx): 모바일 메뉴는 `lg:hidden`

즉, `1023px` 근처에서 뷰포트 계산이 흔들리면 즉시 레이아웃이 갈라지는 구조였다.

---

## 초기 증상

다음 증상이 확인되었다.

- Safari 브라우저 창 너비를 `1023px`로 맞춘다.
- 페이지에 세로 스크롤바가 보이는 상태에서 `Dialog`를 열거나 `Select` 의 드롭다운을 연다.
- 그 순간 글로벌 필터가 데스크탑 레이아웃으로 바뀌고, `SidebarNav`가 보이기 시작한다.

처음에는 다음 후보들이 의심되었다.

- `Select`의 `z-index` 문제
- `Dialog` 오버레이의 `backdrop-blur`
- 모바일 Safari의 입력 자동 확대(auto zoom)

---

## 실패한 가설

### 1. `Select` 자체의 상호작용 문제

초기에는 `Dialog` 안의 `Select`가 보이지 않거나 클릭되지 않는 문제가 있었고, 이는 실제로 다음 두 문제였다.

- 모달보다 낮은 `z-index`
- 포털된 `SelectContent`의 pointer event 처리

하지만 이 문제를 해결한 뒤에도 Safari의 브레이크포인트 붕괴는 남아 있었다. 따라서 이는 별개의 이슈였다.

### 2. 입력 자동 확대(auto zoom)

모바일 Safari는 `16px` 미만의 입력 컨트롤에 포커스가 가면 확대될 수 있다. 이 가설도 한때 유력했지만, 이번 케이스는 다음 점에서 달랐다.

- 문제는 모바일뿐 아니라 데스크탑 Safari의 `1023px` 실브라우저 창에서도 발생
- `Dialog` 오픈 시점과 `Select` 드롭다운 오픈 시점 모두에서 재현
- 핵심 증상이 “줌”이 아니라 `lg` 미디어쿼리 발동

즉, 이번 문제는 auto zoom보다는 viewport 폭 재계산에 가깝다.

### 3. `backdrop-blur` 자체

오버레이의 `backdrop-blur`는 Safari에서 합성 레이어 관련 문제를 자주 만들 수 있어 충분히 의심할 만했다. 다만 최종 관찰 결과, blur 유무보다 “오버레이가 열리며 스크롤이 잠기는 순간”이 핵심이었다.

즉, blur가 보조적인 트리거가 될 수는 있어도 근본 원인은 아니었다.

---

## 관찰 결과

관찰 범위를 넓히면서 원인이 더 구체적으로 좁혀졌다.

### 1. 크롬과 사파리의 차이

- Chrome 실브라우저에서는 같은 조건에서도 레이아웃이 깨지지 않았다.
- Safari 실브라우저에서는 동일 조건에서 `lg` 브레이크포인트가 발동했다.

### 2. Safari 반응형 모드와 실브라우저의 차이

- Safari 실브라우저 창 너비를 `1023px`로 맞췄을 때는 문제 재현
- Safari 반응형 모드에서 `1023px`로 맞췄을 때는 문제 미재현

즉, 단순한 CSS 미디어쿼리 정의 오류가 아니라, 실브라우저의 viewport 계산 방식이 개입하고 있다고 판단할 수 있었다.

### 3. 스크롤바 존재 여부에 따른 차이

브라우저 테스트 도중, 오버레이가 렌더링 되면 `html` 요소의 너비가 `1023px`을 벗어나는 현상을 발견했다.
여기에 원인이 있을 것으로 추정, 다양한 실험을 수행했다.

그 결과, 가장 결정적인 관찰은 스크롤바 존재 여부였다.

#### 케이스 A. 스크롤바가 보이는 상태

- Safari 브라우저 창 너비: `1023px`
- 페이지에 세로 스크롤바가 표시됨
- `Dialog`를 열면 `html` 요소의 너비가 약 `1037px`로 증가
- 결과적으로 `lg` 브레이크포인트가 발동

#### 케이스 B. 스크롤바를 숨긴 상태 (`::-webkit-scrollbar`)

- Safari 브라우저 창 너비: `1023px`
- 페이지에 세로 스크롤바가 없음
- `Dialog`를 열어도 `html` 요소의 너비가 `1023px`로 유지
- `lg` 브레이크포인트가 발동하지 않음

#### 케이스 C. Safari 개발자 도구의 반응형 모드

- 반응형 모드에서 `1023px`로 지정하면 실제 `html` 너비는 약 `1008px`
- 이미 스크롤바 공간이 다른 방식으로 포함된 상태로 계산되는 것으로 보임
- 따라서 `Dialog`를 열어도 `1024px`를 넘지 않아 `lg`가 발동하지 않음

이 단계에서 스크롤바 너비가 원인이라는 가설이 매우 강해졌다.

---

## 실제 원인

문제의 핵심은 다음 순서로 정리된다.

1. 페이지에 세로 스크롤바가 보이는 상태에서 Safari 창 너비를 `1023px`로 둔다.
2. `Dialog` 또는 `Select` 오버레이가 열리며 배경 스크롤이 잠긴다.
3. 스크롤이 잠기면서 기존 스크롤바 거터 공간이 사라진다.
4. Safari가 그 거터 폭만큼 `layout viewport`를 넓게 다시 계산한다.
5. 결과적으로 `1023px + 스크롤바 너비`가 `1024px`를 넘는다.
6. `lg` 브레이크포인트가 발동한다.

Safari 기본 스크롤바 너비가 약 `13px`이므로, 실제 관찰값인 `1036~1037px`은 이 설명과 정확히 맞아떨어진다.

즉, 이번 문제는:

- `Dialog` 자체의 레이아웃 문제도 아니고
- `Select` 자체의 미디어쿼리 문제도 아니며
- Safari의 스크롤바 거터 변화와 scroll lock이 결합된 결과다

---

## 왜 `Dialog`와 `Select`를 열 때 재현되었는가

이번 이슈는 “오버레이를 여는 행위”와 묶여서 나타났다. 이유는 오버레이가 열릴 때 Radix 계열 컴포넌트가 배경 스크롤을 제어하기 때문이다.

프로젝트 구조상 관련 위치는 다음과 같다.

- [dialog.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/shared/ui/dialog.tsx)
- [select.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/shared/ui/select.tsx)
- [campaign-create-dialog.tsx](/Users/einere/WebstormProjects/mobidays-dashboard/src/widgets/campaign-table/ui/campaign-create-dialog.tsx)

`Dialog`와 `Select`는 포털로 바깥 레이어에 렌더링되며, 오버레이가 열릴 때 스크롤 락이 적용된다. Safari는 이 순간 스크롤바 거터가 사라진 뒤 viewport를 다시 계산했고, 그 결과가 브레이크포인트 발동으로 드러났다.

---

## 해결 방법

해결은 매우 단순했다.

```css
html {
	scrollbar-gutter: stable;
}
```

이 속성을 `html`에 적용하면, 스크롤바가 사라지더라도 브라우저가 스크롤바 거터 공간을 계속 예약해둔다. 따라서 `Dialog`가 열리며 scroll lock이 걸려도 viewport 폭이 증가하지 않는다.

이번 케이스에서는 `scrollbar-gutter: stable`을 적용한 뒤 다음이 확인되었다.

- Safari 실브라우저 `1023px`에서 `Dialog`를 열어도 레이아웃 유지
- `Select` 드롭다운을 열어도 `lg` 브레이크포인트 비발동
- `SidebarNav`가 갑자기 나타나는 현상 사라짐

즉, 이번 문제는 레이아웃 컴포넌트를 바꾸지 않고도 스크롤바 거터를 안정화하는 것만으로 해결되었다.

---

## 왜 이 해결책이 맞는가

이번 해결이 적절한 이유는 다음과 같다.

- 문제의 원인이 “뷰포트 폭 자체의 변동”이었기 때문이다.
- 레이아웃 컴포넌트나 브레이크포인트 정의는 올바르게 동작하고 있었다.
- 잘못된 것은 Safari에서 스크롤바가 사라질 때 폭 계산이 흔들린다는 점이었다.
- `scrollbar-gutter: stable`은 바로 그 흔들림을 막는 속성이다.

즉, 현상을 덮는 workaround가 아니라 원인에 직접 대응하는 수정이다.

---

## 디버깅 과정 요약

이번 이슈는 다음 순서로 좁혀졌다.

1. `Select`가 보이지 않음
2. `z-index`와 pointer events 문제 해결
3. 여전히 Safari에서만 레이아웃 붕괴 발생
4. `1023px` 경계에서만 재현된다는 점 확인
5. Safari 반응형 모드에서는 재현되지 않는다는 점 확인
6. 스크롤바가 보일 때만 `html` 폭이 `1037px`로 튄다는 점 확인
7. scroll lock + scrollbar gutter 변화가 원인임을 확정
8. `html { scrollbar-gutter: stable; }` 적용 후 해결

---

## 후속 주의사항

비슷한 문제가 다시 생길 수 있는 지점은 다음과 같다.

- `Dialog`
- `Popover`
- `Select`
- `Sheet`
- 모바일 사이드바처럼 배경 스크롤을 잠그는 모든 오버레이

특히 브레이크포인트 경계값 바로 아래에서만 재현되는 현상은, CSS 정의 자체보다 viewport 계산과 스크롤바 거터를 먼저 의심하는 편이 낫다.

또한 Safari 실브라우저와 반응형 모드는 결과가 다를 수 있으므로, 경계값 관련 이슈는 반드시 실브라우저 창에서도 확인해야 한다.

---

## 결론

이번 문제는 Safari에서 `Dialog`/`Select` 오버레이가 열리며 스크롤바가 사라질 때, 스크롤바 거터 폭만큼 viewport가 넓게 다시 계산되면서 `lg` 브레이크포인트가 잘못 발동한 사례였다.

해결은 `html`에 `scrollbar-gutter: stable`을 적용해 스크롤바 거터를 항상 예약하는 방식으로 처리했다. 이 수정은 레이아웃 구조를 바꾸지 않고 원인 자체를 제거하는 가장 정확한 대응이었다.
