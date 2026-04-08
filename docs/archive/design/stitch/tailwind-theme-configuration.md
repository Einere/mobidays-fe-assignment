# Tailwind CSS Theme Configuration: Insight Architecture

이 문서는 현재 적용된 'Insight Architecture' 디자인 시스템의 시각적 요소를 Tailwind CSS 설정 파일(`tailwind.config.js`)과 글로벌 CSS에 적용하기 위한 가이드라인입니다.

## 1. Tailwind Configuration (JSON)

```json
{
  "theme": {
    "extend": {
      "colors": {
        "brand": {
          "primary": "#1A2B4B",     // Deep Navy (Insight Architecture core)
          "secondary": "#031635",   // Darker Navy for headers
          "accent": "#008080",      // Teal for success/positive trends
          "muted": "#44474E"        // Neutral grey for secondary text
        },
        "surface": {
          "base": "#FFFFFF",
          "subtle": "#F7F9FB",
          "border": "#ECEEF0"
        },
        "status": {
          "active": "#E7F8F2",      // Light green bg
          "active-text": "#0D9488", // Dark green text
          "paused": "#F1F3F5",      // Light grey bg
          "paused-text": "#64748B", // Grey text
          "ended": "#FEF2F2",       // Light red bg
          "ended-text": "#EF4444"   // Red text
        }
      },
      "fontFamily": {
        "sans": ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      "borderRadius": {
        "brand": "4px"              // ROUND_FOUR setting
      },
      "boxShadow": {
        "card": "0 8px 32px rgba(3, 22, 53, 0.04)",
        "dropdown": "0 4px 12px rgba(0, 0, 0, 0.08)"
      }
    }
  }
}
```

## 2. Design Tokens & CSS Variables

```css
@layer base {
  :root {
    --color-primary: 26 43 75;      /* #1A2B4B */
    --color-secondary: 3 22 53;     /* #031635 */
    --radius-brand: 4px;
    --font-main: 'Manrope', sans-serif;
  }

  body {
    @apply font-sans bg-surface-subtle text-brand-primary antialiased;
  }
}
```

## 3. Component Style Guidelines

### Buttons
- **Primary**: `bg-brand-secondary text-white px-4 py-2 rounded-brand hover:opacity-90 transition-all`
- **Secondary/Outline**: `border border-surface-border text-brand-primary px-4 py-2 rounded-brand hover:bg-surface-subtle`

### Dashboard Cards
- **Base**: `bg-white border border-surface-border rounded-brand p-6 shadow-card`
- **Header**: `text-sm font-semibold text-brand-muted uppercase tracking-wider`

### Data Tables
- **Header Cell**: `bg-surface-subtle py-3 px-4 text-left text-xs font-bold text-brand-muted border-b border-surface-border`
- **Row**: `border-b border-surface-border hover:bg-surface-subtle/50 transition-colors`

### Status Badges
- **Active**: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-status-active text-status-active-text`
- **Paused**: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-status-paused text-status-paused-text`

---

## 4. Implementation Tips (Mobidays Assignment)
- **Division by Zero**: 계산 로직에서 분모가 0일 때 `0` 또는 `-`를 반환하도록 유틸리티 함수를 작성하세요.
- **Null Safety**: `conversionsValue`가 null인 경우 `0`으로 처리하거나 `Optional Chaining`을 적극 활용하세요.
- **Responsive**: `grid-cols-1 lg:grid-cols-12` 구조를 사용하여 태블릿/데스크톱 해상도에 대응하세요.