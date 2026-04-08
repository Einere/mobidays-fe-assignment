# Design System Documentation: Insight Architecture

이 문서는 'Insight Architecture' 디자인 시스템의 시각적 언어를 정의하며, 개발 시 일관성을 유지하기 위한 구체적인 사양을 제공합니다.

---

## 1. Color Palette (컬러 팔레트)

### Core Colors
| Category | Variable | HEX | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | `brand-primary` | `#1A2B4B` | 브랜드 아이덴티티, 텍스트 기본 컬러, 심볼릭 요소 |
| **Secondary** | `brand-secondary` | `#031635` | 헤더 배경, 강조 버튼, 카드 쉐도우 베이스 |
| **Accent** | `brand-accent` | `#008080` | 성공 지표, 긍정적 트렌드, 강조 액션 |
| **Muted** | `brand-muted` | `#44474E` | 보조 텍스트, 비활성화 요소, 설명 텍스트 |

### UI & Backgrounds
| Category | Variable | HEX | Usage |
| :--- | :--- | :--- | :--- |
| **Base** | `surface-base` | `#FFFFFF` | 카드 배경, 메인 본문 배경 |
| **Subtle** | `surface-subtle` | `#F7F9FB` | 대시보드 전체 배경, 테이블 헤더, 호버 상태 |
| **Border** | `surface-border` | `#ECEEF0` | 구분선, 입력창 테두리, 카드 외곽선 |

### Status Colors (과제 요구사항 반영)
| Status | BG (HEX) | Text (HEX) | Description |
| :--- | :--- | :--- | :--- |
| **Active** | `#E7F8F2` | `#0D9488` | 진행 중 (신뢰감 있는 그린) |
| **Paused** | `#F1F3F5` | `#64748B` | 일시중지 (중립적인 그레이) |
| **Ended** | `#FEF2F2` | `#EF4444` | 종료 (경고/종료의 레드) |

---

## 2. Typography (타이포그래피)

- **Main Font**: `Manrope` (Sans-serif)
- **Scale**:
    - **Display**: 24px / Bold / #1A2B4B (대시보드 타이틀)
    - **Headline**: 18px / Semibold / #1A2B4B (섹션/카드 타이틀)
    - **Body 1**: 14px / Regular / #1A2B4B (기본 본문 텍스트)
    - **Body 2**: 12px / Medium / #44474E (테이블 데이터, 보조 텍스트)
    - **Caption**: 10px / Bold / #44474E (Uppercase, 배지, 테이블 헤더)

---

## 3. Shape & Shadows (형태 및 그림자)

### Border Radius
- **Round Four (Default)**: `4px`
- **Full**: `9999px` (상태 배지, 프로필 아바타 등)

### Shadows
- **Card Shadow**: `0 8px 32px rgba(3, 22, 53, 0.04)` - 은은하고 깊이감 있는 그림자
- **Dropdown Shadow**: `0 4px 12px rgba(0, 0, 0, 0.08)` - 플로팅 요소용 그림자

---

## 4. Spacing (간격 시스템)

일관된 리듬을 위해 4px 배수 시스템을 권장합니다.

- **Container Padding**: `24px` (Desktop) / `16px` (Mobile)
- **Between Sections**: `32px`
- **Inside Cards**: `24px`
- **Element Spacing**: `8px`, `12px`, `16px` (컴포넌트 내부 요소 간격)

---

## 5. Component Styles (컴포넌트 스타일)

### Buttons
- **Primary**: `bg-brand-secondary text-white rounded-brand`
- **Outline**: `border border-surface-border text-brand-primary rounded-brand`

### Dashboard Widgets
- **Layout**: `bg-white border border-surface-border rounded-brand shadow-card`
- **Padding**: `p-6` (24px)

### Data Table
- **Header**: `bg-surface-subtle text-xs font-bold uppercase tracking-wider`
- **Row**: `border-b border-surface-border hover:bg-surface-subtle/50`
