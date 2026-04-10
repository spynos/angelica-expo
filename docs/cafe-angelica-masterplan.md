# 안젤리카 (Angelica) — 마스터 기획 문서

> 프로젝트: angelica-expo | 버전: v0.1  
> 브랜드 · 서비스 · 개발 · 디자인 통합 문서

---

## 목차

### Part 1. 브랜드 & 서비스
1. [브랜드 스토리](#1-브랜드-스토리)
2. [브랜드 아이덴티티](#2-브랜드-아이덴티티)
3. [서비스 철학](#3-서비스-철학)
4. [타겟 사용자](#4-타겟-사용자)
5. [서비스 개요](#5-서비스-개요)
6. [핵심 기능](#6-핵심-기능)
7. [수익 모델](#7-수익-모델)
8. [성장 전략](#8-성장-전략)

### Part 2. 디자인 시스템
9. [디자인 원칙](#9-디자인-원칙)
10. [컬러 시스템](#10-컬러-시스템)
11. [타이포그래피](#11-타이포그래피)
12. [간격 & 그리드](#12-간격--그리드)
13. [모서리 & 그림자](#13-모서리--그림자)
14. [아이콘 시스템](#14-아이콘-시스템)

### Part 3. 컴포넌트 라이브러리
15. [버튼](#15-버튼)
16. [입력 필드](#16-입력-필드)
17. [카드](#17-카드)
18. [내비게이션](#18-내비게이션)
19. [배지 & 태그](#19-배지--태그)
20. [아바타](#20-아바타)
21. [바텀 시트](#21-바텀-시트)
22. [토스트 & 스낵바](#22-토스트--스낵바)
23. [스도쿠 그리드 컴포넌트](#23-스도쿠-그리드-컴포넌트)

### Part 4. 사이트맵 & 화면 명세
24. [사이트맵](#24-사이트맵)
25. [페이지별 상세 명세](#25-페이지별-상세-명세)
26. [인터랙션 & 애니메이션](#26-인터랙션--애니메이션)
27. [다크 모드](#27-다크-모드)

### Part 5. 기술 명세
28. [기술 스택](#28-기술-스택)
29. [프로젝트 구조](#29-프로젝트-구조)
30. [공통 기능 명세](#30-공통-기능-명세)
31. [문학카페 개발 명세](#31-문학카페-개발-명세)
32. [퍼즐게임 개발 명세](#32-퍼즐게임-개발-명세)
33. [백엔드 & 데이터베이스](#33-백엔드--데이터베이스)
34. [푸시 알림](#34-푸시-알림)
35. [비기능 요구사항](#35-비기능-요구사항)
36. [MVP 개발 우선순위](#36-mvp-개발-우선순위)

### Part 6. 에셋 & 산출물
37. [에셋 체크리스트](#37-에셋-체크리스트)
38. [피그마 파일 구조](#38-피그마-파일-구조)
39. [문서 이력](#39-문서-이력)

---

# Part 1. 브랜드 & 서비스

---

## 1. 브랜드 스토리

### 이름의 기원

안젤리카(Angelica)는 유럽에서 수백 년간 치유와 안식의 식물로 쓰인 허브입니다. 중세 약초학에서 '천사의 풀'이라 불리며, 피로와 불안을 가라앉히는 데 쓰였습니다. 동시에 여성 인물 이름으로 세계 어디서나 자연스럽게 통합니다.

바쁜 하루 속에서 잠시 멈추고 시 한 편을 읽거나 퍼즐 한 판을 푸는 시간 — 안젤리카는 그 작은 쉼의 이름입니다.

### 왜 지금인가

스마트폰을 들었을 때 우리를 기다리는 것은 대부분 자극입니다. 짧고 빠른 영상, 끝없는 스크롤, 알림의 연속. 그 안에서 정말 쉬고 싶은 사람들은 어디로 가야 할까요.

안젤리카는 그 질문에서 출발합니다. 광고 없이, 알고리즘 없이, 경쟁 없이 — 그냥 좋은 글을 읽고, 조용히 생각하고, 퍼즐 하나를 완성하는 공간.

### 프로젝트 정보

| 항목 | 내용 |
|------|------|
| 앱 이름 | 안젤리카 (Angelica) |
| 슬로건 | 지적인 휴식 공간 |
| 내부 프로젝트명 | angelica-expo |
| 깃 리포지토리 | `angelica-expo` |
| 플랫폼 | iOS / Android |
| 문서 버전 | v0.1 |

---

## 2. 브랜드 아이덴티티

### 슬로건

**"지적인 휴식 공간"**

### 핵심 가치 세 가지

**광고 없음**
어떤 배너도, 어떤 추적도 없습니다. 앱이 전적으로 사용자 편에 섭니다. 안젤리카의 수익은 광고가 아니라 사용자의 선택에서 옵니다.

**방해 없음**
푸시 알림은 기본값이 꺼짐입니다. 강제 유입 없음. 열고 싶을 때만 열면 됩니다. 앱이 먼저 연락하지 않습니다.

**완전히 무료로 쓸 수 있음**
유료 기능은 더 깊이 쓰고 싶을 때를 위한 것입니다. 기본 경험에 제한이 없고, 유료로 전환하지 않아도 앱의 핵심을 충분히 누릴 수 있습니다.

### 톤 & 보이스

- 차분하고 따뜻하게. 과하게 활기차지 않게.
- 사용자를 가르치려 하지 않고, 함께 있는 느낌.
- 짧고 정확한 문장. 불필요한 수식 없음.
- 한국어로는 존댓말이지만 딱딱하지 않게.

### 폰트 시스템 (브랜드 관점)

안젤리카는 두 가지 폰트를 씁니다. 두 폰트 모두 한글과 영어를 함께 지원합니다.

**Asta Sans** — 시스템 기본 폰트 (고딕체)  
UI 레이블, 버튼, 설명 텍스트, 숫자에 씁니다. Google Fonts에서 제공합니다.

**Gowun Batang** — 세리프 폰트 (명조체)  
시 본문, 앱 타이틀, 인용구, 감성적 맥락의 텍스트에 씁니다. Google Fonts에서 제공합니다.

```css
@import url('https://fonts.googleapis.com/css2?family=Asta+Sans:wght@400;500;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap');
```

---

## 3. 서비스 철학

### 느린 성장

안젤리카는 빠른 성장을 목표로 하지 않습니다. 바이럴 메커니즘도, 공격적인 마케팅도 없습니다. 진짜 이 앱이 필요한 사람들이 조용히 찾아오는 방식으로 성장합니다.

초기에는 작은 커뮤니티로 출발합니다. 그 안에서 시를 쓰고, 퍼즐을 풀고, 서로의 글을 감상하는 경험이 쌓이면, 그것이 입소문이 됩니다.

### 콘텐츠에 대한 존중

문학카페에 올라오는 시는 누군가의 진짜 감정과 시간으로 만들어진 것입니다. 안젤리카는 그 콘텐츠를 광고 소비의 배경으로 쓰지 않습니다. 알고리즘으로 조작하지 않습니다. 피드는 시간 순으로 흐릅니다.

### 퍼즐에 대한 철학

퍼즐은 뇌를 훈련시키는 도구가 아닙니다. 5분 동안 다른 생각을 잠시 내려놓게 해주는 도구입니다. 완성했을 때의 작은 성취감. 그것으로 충분합니다. 점수 경쟁도, 랭킹도, 광고 보상도 없습니다.

---

## 4. 타겟 사용자

### 주요 페르소나

**조용한 창작자**  
시를 쓰고 싶지만 인스타그램이나 트위터의 과도한 자극이 싫은 20–30대. 소수의 독자가 읽어준다면 충분합니다. 좋아요 수보다 진심 어린 한 명의 독자가 더 의미있는 사람. 문학카페 진입.

**짧은 휴식 탐색자**  
점심시간 10분, 지하철 안 5분. 스마트폰을 들었을 때 유튜브 쇼츠나 SNS 피드 대신 뭔가 다른 것을 원하는 직장인. 머리를 쉬게 해주는 퍼즐 하나면 충분한 사람. 퍼즐게임 진입.

**문학 감성 독자**  
책을 좋아하고, 좋은 글을 발견하면 저장해두는 습관이 있는 사람. 직접 창작하지 않더라도 좋은 시를 감상하고 고전시 아카이브를 탐색하는 것만으로 충분히 만족하는 사람. 고전시 아카이브 진입.

### 타겟 시장

| 단계 | 시장 | 대상 |
|------|------|------|
| 1차 | 한국 | 20–40대, 문학과 지적 활동에 관심 있는 직장인·대학생 |
| 2차 | 일본 | 한자 문화권, 감성 앱 수요 높음 |
| 3차 | 영어권 글로벌 | v2 이후 확장 검토 |

---

## 5. 서비스 개요

안젤리카는 두 개의 공간으로 이루어집니다.

### 문학카페

시를 쓰고, 나누고, 감상하는 공간입니다. SNS이지만 바이럴을 추구하지 않습니다. 피드는 알고리즘 없이 시간 순으로 흐릅니다. 팔로워 수가 프로필에 크게 표시되지 않습니다. 그냥 글이 중심입니다.

직접 시를 쓸 수도 있고, 좋아하는 고전시를 인용해 공유할 수도 있습니다. 서체와 배경을 골라 시 한 편을 카드처럼 만들 수 있습니다.

### 퍼즐게임

방해 없는 5분 게임의 공간입니다. MVP에서는 스도쿠 하나로 시작합니다. 매일 새로운 퍼즐이 난이도별로 제공됩니다. 시간 제한이 없고, 광고가 없고, 팝업이 없습니다. 그냥 퍼즐입니다.

---

## 6. 핵심 기능

### 문학카페 기능

| 기능 | 설명 | MVP 포함 |
|------|------|---------|
| 시 작성 & 공유 | 미니멀 에디터로 시를 쓰고 게시. 고전시 인용 지원 | ✅ |
| 피드 | 전체 공개 피드. 시간 순 정렬. 알고리즘 없음 | ✅ |
| 좋아요 & 저장 | 마음에 드는 시에 반응하고 저장 | ✅ |
| 데일리 프롬프트 | 매일 하나의 창작 주제 제공. 참여는 자유 | v2 |
| 고전시 아카이브 | 국내외 명시 큐레이션 | v2 |
| 팔로우 / 팔로워 | 사용자 간 팔로우 관계 | v2 |
| 댓글 | 시에 댓글 달기 | v2 |
| AI 시 도우미 | 운율 제안, 어휘 확장 | v2 |

### 퍼즐게임 기능

| 기능 | 설명 | MVP 포함 |
|------|------|---------|
| 스도쿠 | 난이도 3단계, 매일 새 퍼즐, 시간 제한 없음 | ✅ |
| 메모 모드 | 후보 숫자를 작게 입력하는 메모 기능 | ✅ |
| 힌트 | 게임당 3회, 선택 셀 정답 표시 | ✅ |
| 실행 취소 | 마지막 입력 되돌리기 | ✅ |
| 자동 저장 | 앱을 닫아도 진행 상태 유지 (MMKV) | ✅ |
| 데일리 기록 | 완료한 퍼즐 달력 기록 | ✅ |
| 블록 라인클리어 | 퍼즐형 블록 배치 게임 | v2 |
| 크로스워드 | 한국어 낱말 퀴즈 | v2 |
| 퍼즐 무제한 구독 | 아카이브 전체 접근 | v2 |

---

## 7. 수익 모델

안젤리카의 수익 구조는 단순합니다. 광고는 없습니다. 기본 사용은 영구 무료입니다.

### Free (기본 — 영구 무료)

- 문학카페 전체 이용 (시 작성·게시·피드·좋아요·저장)
- 데일리 퍼즐 3종 (난이도별 1개씩)
- 기본 시 에디터 (서체 3종, 배경 4종)
- 광고 없음

### 콘텐츠 팩 (개별 구매)

| 상품 | 가격 |
|------|------|
| 고급 시 서체 팩 | ₩1,900 |
| 계절·테마 배경 팩 | ₩1,900 |
| 시집 내보내기 (PDF) | ₩2,900 |
| 고전시 특선 컬렉션 | ₩3,900 |

### 퍼즐 무제한 (구독)

| 플랜 | 가격 |
|------|------|
| 월간 | ₩2,900/월 |
| 연간 | ₩19,900/년 (약 43% 절감) |

포함 혜택: 전체 퍼즐 아카이브 무제한, 과거 데일리 퍼즐 복습, 오프라인 플레이, 난이도별 커스텀 팩

---

## 8. 성장 전략

### 로드맵

| 단계 | 기간 | 목표 |
|------|------|------|
| Phase 1 — Foundation | 0–3개월 | 시 SNS MVP + 스도쿠 게임 + 계정/피드 기본. 소규모 베타 사용자와 함께 경험을 다듬습니다. |
| Phase 2 — Growth | 4–6개월 | 크로스워드 추가. 콘텐츠 팩 출시. 데일리 프롬프트 도입. 사용자 피드백 기반 UX 개선. |
| Phase 3 — Monetize | 7–9개월 | 퍼즐 구독 론칭. 고전시 아카이브. 오프라인 지원. 첫 수익 구조 안정화. |
| Phase 4 — Scale | 10–12개월 | PDF 시집 내보내기. 커뮤니티 기능 강화. 글로벌 언어(일본어/영어) 확장 검토. |

### 마케팅 원칙

바이럴보다 입소문. 광고 집행보다 콘텐츠 품질. 문학·독서 커뮤니티(북스타그램, 브런치, 독서 모임)를 통한 유기적 확산을 우선합니다. 앱 자체가 마케팅이 되는 구조를 지향합니다.

---

# Part 2. 디자인 시스템

---

## 9. 디자인 원칙

### 핵심 무드

> **"텅 빈 카페의 오후"**

조용하고, 따뜻하고, 집중되는 공간. 사용자가 앱을 열었을 때 심박수가 내려가는 느낌을 목표로 합니다.

### 4가지 원칙

**여백이 콘텐츠다**  
빈 공간을 채우려 하지 않습니다. 여백은 호흡이고, 콘텐츠가 돋보이게 하는 장치입니다.

**색은 최소한으로**  
전체 UI의 80%는 아이보리와 흰색, 회색 계열입니다. 오렌지와 퍼플, 틸은 의도가 있을 때만 씁니다.

**폰트가 분위기를 만든다**  
시 본문은 Gowun Batang(명조), UI는 Asta Sans(고딕). 두 폰트의 대비가 앱의 감성을 만듭니다.

**광고 영역이 없다**  
배너, 팝업, 인터스티셜을 위한 공간은 설계하지 않습니다. 모든 화면이 콘텐츠입니다.

---

## 10. 컬러 시스템

### Primary — Warm Orange

| 토큰명 | HEX | 사용처 |
|--------|-----|--------|
| `color/primary` | `#C8773A` | CTA 버튼 배경, 강조 텍스트, 선택 상태, 하단 탭 Active |
| `color/primary-light` | `#F5E6D8` | 카드 배경 옵션, 선택된 셀 배경, 배지 배경 |
| `color/primary-dark` | `#A05E28` | 버튼 Pressed 상태 |

### Accent — 기능별 구분색

| 토큰명 | HEX | 사용처 |
|--------|-----|--------|
| `color/cafe` | `#5C4A8F` | 문학카페 탭 아이콘 Active, 카페 섹션 헤더 |
| `color/cafe-light` | `#EDE8F5` | 카페 섹션 배경 배지 |
| `color/puzzle` | `#2E7D6B` | 퍼즐 탭 아이콘 Active, 완료 상태 |
| `color/puzzle-light` | `#E2F0EC` | 퍼즐 섹션 배경 배지 |

### Neutral

| 토큰명 | HEX | 사용처 |
|--------|-----|--------|
| `color/background` | `#FAF7F2` | 앱 전체 배경 (Warm Ivory) |
| `color/surface` | `#FFFFFF` | 카드, 모달, 에디터, 시트 배경 |
| `color/surface-alt` | `#FAF7F2` | 보조 영역 배경 |
| `color/text-primary` | `#3D3B38` | 본문, 제목, 주요 레이블 |
| `color/text-secondary` | `#6B6860` | 부제목, 메타 정보, Placeholder |
| `color/text-tertiary` | `#9E9B94` | 비활성 텍스트, 힌트 |
| `color/text-disabled` | `#C2BFBA` | 비활성 컴포넌트 텍스트 |
| `color/border` | `#D8D4CC` | 카드 테두리, 구분선 |
| `color/border-light` | `#EBE8E2` | 연한 구분선 |

### Semantic

| 토큰명 | HEX | 사용처 |
|--------|-----|--------|
| `color/error` | `#C0392B` | 스도쿠 오류 숫자, 입력 에러 상태 |
| `color/error-light` | `#FDEAEA` | 에러 배경 |
| `color/success` | `#2E7D6B` | 완료 상태 (puzzle 색과 동일) |
| `color/warning` | `#BA7517` | 경고 상태 |

### 다크 모드 컬러

| 토큰명 | HEX | 비고 |
|--------|-----|------|
| `color/dark/background` | `#1C1A17` | Warm Dark (순수 검정 아님) |
| `color/dark/surface` | `#28251F` | |
| `color/dark/surface-alt` | `#332F28` | |
| `color/dark/text-primary` | `#F0EDE6` | |
| `color/dark/text-secondary` | `#B8B4AD` | |
| `color/dark/text-tertiary` | `#7A7670` | |
| `color/dark/border` | `#3D3A34` | |
| `color/dark/border-light` | `#4A4640` | |
| `color/dark/primary` | `#C8773A` | **라이트와 동일 유지** |

> **중요**: Primary 오렌지(`#C8773A`)는 라이트/다크 모두 동일합니다. 브랜드 색상은 모드에 따라 변경하지 않습니다.

### TypeScript 컬러 토큰 정의

```typescript
// src/theme/colors.ts
export const colors = {
  primary:       '#C8773A',
  primaryLight:  '#F5E6D8',
  primaryDark:   '#A05E28',

  cafe:          '#5C4A8F',
  cafeLight:     '#EDE8F5',
  puzzle:        '#2E7D6B',
  puzzleLight:   '#E2F0EC',

  background:    '#FAF7F2',
  surface:       '#FFFFFF',
  surfaceAlt:    '#FAF7F2',

  textPrimary:   '#3D3B38',
  textSecondary: '#6B6860',
  textTertiary:  '#9E9B94',
  textDisabled:  '#C2BFBA',

  border:        '#D8D4CC',
  borderLight:   '#EBE8E2',

  error:         '#C0392B',
  errorLight:    '#FDEAEA',
  success:       '#2E7D6B',
  warning:       '#BA7517',

  dark: {
    background:    '#1C1A17',
    surface:       '#28251F',
    surfaceAlt:    '#332F28',
    textPrimary:   '#F0EDE6',
    textSecondary: '#B8B4AD',
    textTertiary:  '#7A7670',
    border:        '#3D3A34',
    borderLight:   '#4A4640',
  },
} as const;
```

---

## 11. 타이포그래피

### 폰트 패밀리

| 역할 | 폰트 | 출처 | 비고 |
|------|------|------|------|
| **시스템 기본 (고딕)** | **Asta Sans** | Google Fonts | UI 전반 기본 폰트. 한글·영어 모두 지원 |
| **세리프 (명조)** | **Gowun Batang** | Google Fonts | 시 본문, 감성 텍스트. 한글·영어 모두 지원 |

**한글과 영어 모두 동일한 폰트를 사용합니다. 언어별 폰트 분기 없음.**

### 폰트 파일

```
Asta Sans:
  AstaSans-Regular.ttf    (weight 400)
  AstaSans-Medium.ttf     (weight 500)
  AstaSans-Bold.ttf       (weight 700)

Gowun Batang:
  GowunBatang-Regular.ttf (weight 400)
  GowunBatang-Bold.ttf    (weight 700)
```

### React Native 폰트 로드

```typescript
// src/theme/typography.ts
import { useFonts } from 'expo-font';

export const fonts = {
  sans: {
    regular: 'AstaSans-Regular',
    medium:  'AstaSans-Medium',
    bold:    'AstaSans-Bold',
  },
  serif: {
    regular: 'GowunBatang-Regular',
    bold:    'GowunBatang-Bold',
  },
};

export function useAppFonts() {
  return useFonts({
    'AstaSans-Regular':    require('../assets/fonts/AstaSans-Regular.ttf'),
    'AstaSans-Medium':     require('../assets/fonts/AstaSans-Medium.ttf'),
    'AstaSans-Bold':       require('../assets/fonts/AstaSans-Bold.ttf'),
    'GowunBatang-Regular': require('../assets/fonts/GowunBatang-Regular.ttf'),
    'GowunBatang-Bold':    require('../assets/fonts/GowunBatang-Bold.ttf'),
  });
}
```

### 타입 스케일

| 토큰명 | 폰트 | 크기 | 굵기 | 행간 | 사용처 |
|--------|------|------|------|------|--------|
| `type/display` | Gowun Batang | 28px | Bold | 1.3 | 앱 타이틀, 스플래시 |
| `type/heading-1` | Gowun Batang | 24px | Bold | 1.35 | 섹션 대제목 |
| `type/heading-2` | Asta Sans | 20px | Medium | 1.4 | 카드 제목, 화면 제목 |
| `type/heading-3` | Asta Sans | 17px | Medium | 1.4 | 서브 섹션 제목 |
| `type/body-lg` | Gowun Batang | 18px | Regular | 1.75 | 시 본문 (세리프 선택시) |
| `type/body-lg-sans` | Asta Sans | 18px | Regular | 1.6 | 시 본문 (고딕 선택시) |
| `type/body-md` | Asta Sans | 16px | Regular | 1.6 | 일반 본문 |
| `type/body-sm` | Asta Sans | 14px | Regular | 1.55 | 부연 설명, 설명 텍스트 |
| `type/label-lg` | Asta Sans | 14px | Medium | 1.3 | 버튼 텍스트, 탭 레이블 |
| `type/label-md` | Asta Sans | 13px | Medium | 1.3 | 배지, UI 레이블 |
| `type/label-sm` | Asta Sans | 12px | Regular | 1.3 | 메타 정보, 날짜 |
| `type/caption` | Asta Sans | 11px | Regular | 1.3 | 보조 텍스트, 카운트 |
| `type/sudoku-num` | Asta Sans | 20px | Medium | 1.0 | 스도쿠 메인 숫자 |
| `type/sudoku-memo` | Asta Sans | 9px | Regular | 1.0 | 스도쿠 메모 숫자 |

---

## 12. 간격 & 그리드

### 간격 토큰 (8px 베이스)

| 토큰명 | 값 | 사용처 |
|--------|----|--------|
| `space/1` | 4px | 아이콘-텍스트 사이 최소 간격 |
| `space/2` | 8px | 컴포넌트 내부 소간격 |
| `space/3` | 12px | 컴포넌트 내부 중간 간격 |
| `space/4` | 16px | 카드 패딩, 섹션 간격 기본 |
| `space/5` | 20px | 버튼 수평 패딩 |
| `space/6` | 24px | 섹션 상하 패딩 |
| `space/8` | 32px | 화면 상하 여백 |
| `space/10` | 40px | 대형 섹션 구분 |
| `space/12` | 48px | 콘텐츠 최상단 여백 |

### TypeScript 간격 토큰

```typescript
// src/theme/spacing.ts
export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  xxxl: 48,
};

export const radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  full: 9999,
};
```

### 화면 그리드 (모바일 기준)

```
디자인 기준 사이즈: 390 × 844px (iPhone 14 기준)
좌우 여백 (Safe Area 포함): 16px
콘텐츠 영역 너비: 358px
컬럼: 4 columns
컬럼 간격 (gutter): 8px
```

### 안전 영역

```
상단 Status Bar: 44px (노치 기기 기준)
하단 Home Indicator: 34px
Tab Bar 높이: 49px (+ Safe Area 34px = 83px 총)
Navigation Bar 높이: 44px
```

---

## 13. 모서리 & 그림자

### 모서리 반경

| 토큰명 | 값 | 사용처 |
|--------|----|--------|
| `radius/sm` | 6px | 배지, 태그, 소형 버튼 |
| `radius/md` | 10px | 입력 필드, 소형 카드 |
| `radius/lg` | 14px | 일반 카드, 시트, 모달 |
| `radius/xl` | 20px | 바텀 시트 상단, 대형 카드 |
| `radius/full` | 9999px | 아바타, 원형 버튼, 토글 |

### 그림자

안젤리카는 그림자를 최소화합니다. 깊이감은 테두리와 배경 색상 차이로 표현합니다.

| 토큰명 | 값 | 사용처 |
|--------|----|--------|
| `shadow/none` | 없음 | 기본 카드 (border + bg 차이로 구분) |
| `shadow/sm` | `0 1px 3px rgba(0,0,0,0.06)` | 플로팅 버튼, 선택된 카드 |
| `shadow/modal` | `0 4px 24px rgba(0,0,0,0.10)` | 모달, 바텀 시트 |

> 카드에는 `shadow/none` + `border: 0.5px #D8D4CC` 조합을 기본으로 씁니다. 그림자는 꼭 필요한 곳에만.

---

## 14. 아이콘 시스템

- 라인: **SF Symbols** (iOS) / **Material Symbols** (Android) 기반
- 선 굵기: 1.5px (Regular weight)
- 크기: 24×24px (기본), 20×20px (탭 바), 16×16px (인라인)
- 색상: 텍스트 컬러와 동일한 토큰 사용

### 주요 아이콘 목록

| 위치 | 아이콘 설명 | SF Symbols 이름 |
|------|------------|----------------|
| 홈 탭 | 집 | `house` / `house.fill` |
| 문학카페 탭 | 펜 | `pencil` / `pencil.fill` |
| 퍼즐 탭 | 격자 | `square.grid.3x3` / `.fill` |
| 프로필 탭 | 사람 | `person` / `person.fill` |
| 좋아요 | 하트 | `heart` / `heart.fill` |
| 저장 | 북마크 | `bookmark` / `bookmark.fill` |
| 공유 | 공유 | `square.and.arrow.up` |
| 더보기 | 점 3개 | `ellipsis` |
| 닫기 | X | `xmark` |
| 뒤로가기 | 화살표 | `chevron.left` |
| 설정 | 톱니 | `gearshape` |
| 작성 | + | `plus` |
| 지우기 | 지우개 | `delete.left` |
| 실행취소 | 되돌리기 | `arrow.uturn.backward` |
| 힌트 | 전구 | `lightbulb` |
| 타이머 | 시계 | `clock` |
| 메모 | 연필 메모 | `pencil.and.outline` |
| 알림 | 종 | `bell` / `bell.fill` |
| 눈 (비밀번호) | 눈 | `eye` / `eye.slash` |

---

# Part 3. 컴포넌트 라이브러리

---

## 15. 버튼

### Primary Button

```
크기:   높이 48px, 최소 너비 120px, 수평 패딩 20px
배경:   #C8773A
텍스트: #FFFFFF, Asta Sans Medium 15px
모서리: 10px
상태:
  Default:  bg #C8773A
  Pressed:  bg #A05E28, scale 0.97 (80ms)
  Disabled: bg #D8D4CC, text #9E9B94
  Loading:  bg #C8773A + 흰색 원형 스피너 (20×20px)
```

### Secondary Button

```
크기:   높이 48px, 수평 패딩 20px
배경:   transparent
테두리: 1px solid #C8773A
텍스트: #C8773A, Asta Sans Medium 15px
모서리: 10px
상태:
  Default:  border #C8773A
  Pressed:  bg #F5E6D8, scale 0.97
  Disabled: border #D8D4CC, text #9E9B94
```

### Ghost Button

```
크기:   높이 44px, 수평 패딩 12px
배경:   transparent, 테두리 없음
텍스트: #6B6860, Asta Sans Regular 14px
상태:
  Default: text #6B6860
  Pressed: text #3D3B38
```

### Icon Button (원형)

```
크기:  44×44px
배경:  transparent
아이콘: 24×24px, #6B6860
상태:
  Default: bg transparent
  Pressed: bg rgba(0,0,0,0.05)
```

---

## 16. 입력 필드

### Text Input

```
높이:        48px
배경:        #FFFFFF
테두리:      1px solid #D8D4CC, radius 8px
패딩:        수평 14px
폰트:        Asta Sans Regular 16px, #3D3B38
플레이스홀더: #9E9B94
상태:
  Default:  border 1px #D8D4CC
  Focus:    border 2px #C8773A
  Error:    border 1px #C0392B
            + 에러 메시지 12px #C0392B, 상단 margin 6px
  Disabled: bg #FAF7F2, text #9E9B94
```

### Textarea (시 작성 전용)

```
최소 높이: 200px (자동 확장)
배경:      #FFFFFF (또는 사용자 선택 배경색)
테두리:    1px solid #D8D4CC, radius 10px
패딩:      16px
폰트:      선택에 따라 Gowun Batang 또는 Asta Sans, 18px
행간:      1.75
플레이스홀더: "시를 써보세요..."
```

### Search Input

```
높이:   44px
배경:   #FAF7F2
테두리: 없음, radius 10px
패딩:   수평 14px
좌측:   검색 아이콘 16×16px, #9E9B94
폰트:   Asta Sans Regular 15px
```

---

## 17. 카드

### 시 카드 (Poem Card)

```
배경:   #FFFFFF (기본) 또는 사용자 선택 배경색 4종
테두리: 0.5px solid #D8D4CC
모서리: 14px
패딩:   16px
그림자: 없음

내부 구성 (위에서 아래):

1. 작성자 행 (하단 margin 12px)
   ├ 아바타: 32×32px, radius full
   ├ 닉네임: Asta Sans Medium 13px #3D3B38
   ├ ·  날짜: Asta Sans 12px #9E9B94
   └ 더보기 버튼 (우측 정렬): 20×20px ellipsis 아이콘

2. 시 내용 (하단 margin 10px)
   ├ 제목 (옵션): Asta Sans Medium 16px #3D3B38, 하단 margin 4px
   ├ 본문: 사용자 선택 폰트 18px #3D3B38, 행간 1.75, 최대 5줄
   └ "...더 보기" (5줄 초과 시): Asta Sans 13px #C8773A

3. 해시태그 행 (하단 margin 12px, 태그 있을 경우)
   └ 태그 배지: bg #FAF7F2, text #6B6860, 12px, radius 6px, padding 3px 8px

4. 액션 행
   ├ 하트 아이콘 + 수: Asta Sans 12px #6B6860 (활성: #C8773A)
   ├ 북마크 아이콘 (활성: #C8773A)
   └ 공유 아이콘
```

#### 시 카드 배경 색상 4종

| 이름 | 라이트 | 다크 |
|------|--------|------|
| 흰색 | `#FFFFFF` | `#28251F` |
| 아이보리 | `#FAF7F2` | `#332F28` |
| 연한 오렌지 | `#F5E6D8` | `#3D2A1A` |
| 연한 보라 | `#EDE8F5` | `#2A2240` |

### 데일리 퍼즐 카드

```
배경:   #FFFFFF
테두리: 0.5px solid #D8D4CC
모서리: 14px
패딩:   16px

내부 구성:
1. 헤더 행
   ├ "오늘의 스도쿠": Asta Sans Medium 15px #3D3B38
   └ 날짜: Asta Sans 13px #9E9B94

2. 난이도 배지 3개 (가로 배열, gap 8px)
   미완료: bg #FAF7F2, text #6B6860
   진행중: bg #F5E6D8, text #C8773A (+ 진행 도트)
   완료:   bg #E2F0EC, text #2E7D6B (+ 체크 아이콘)

3. CTA 버튼
   "지금 풀기" / "이어하기" / "완료됨"
   전체 너비 Primary 버튼 (완료 시 Secondary)
```

---

## 18. 내비게이션

### Top Navigation Bar

```
높이:       44px
배경:       #FFFFFF (피드/설정), #FAF7F2 (홈)
하단 구분선: 0.5px solid #EBE8E2
padding:   수평 16px

구성:
  좌측: 뒤로가기 (chevron.left, 44×44 터치 영역) 또는 로고
  중앙: 제목 Asta Sans Medium 17px #3D3B38
  우측: 액션 버튼 최대 2개 (44×44 터치 영역)
```

### Bottom Tab Bar

```
높이:       49px (+ Safe Area Inset 34px)
배경:       #FFFFFF
상단 구분선: 0.5px solid #EBE8E2

탭 아이템 4개 (균등 분할):
  아이콘:   24×24px
  레이블:   Asta Sans 11px
  간격:     아이콘-레이블 4px

Active 색상 (탭별):
  홈:      #C8773A
  문학카페: #5C4A8F
  퍼즐:    #2E7D6B
  프로필:  #C8773A

Inactive:  #9E9B94
```

---

## 19. 배지 & 태그

### 난이도 배지

```
높이:   24px
패딩:   수평 10px
radius: 6px
폰트:   Asta Sans Medium 12px

쉬움:  bg #E2F0EC, text #2E7D6B
보통:  bg #F5E6D8, text #C8773A
어려움: bg #EDE8F5, text #5C4A8F
```

### 해시태그

```
높이:   24px
패딩:   수평 8px
radius: 6px
bg:     #FAF7F2
border: 0.5px solid #D8D4CC
text:   #6B6860, Asta Sans Regular 12px
```

### 상태 배지

```
완료:  bg #E2F0EC, text #2E7D6B, "완료" + 체크 아이콘
진행중: bg #F5E6D8, text #C8773A, "진행중" + 점 아이콘
미시작: bg #FAF7F2, text #9E9B94, "미시작"
```

---

## 20. 아바타

```
크기:
  소형 (피드): 32×32px
  중형 (상세): 40×40px
  대형 (프로필 페이지): 56×56px

radius: full (완전한 원형)

이미지 없을 경우 (기본 아바타):
  bg: #F5E6D8
  text: 닉네임 첫 글자, Asta Sans Medium
        32px → 14px
        40px → 16px
        56px → 22px
  text color: #C8773A

테두리: 없음
```

---

## 21. 바텀 시트

```
배경:       #FFFFFF
상단 모서리: radius 20px
상단 핸들:  4×36px, bg #D8D4CC, radius full, 중앙 정렬, top 12px
패딩:       수평 20px, 상단 8px (핸들 하단)
그림자:     shadow/modal

종류 및 내용:

1. 시 더보기 옵션
   항목 높이 52px, 아이콘 20×20 + 텍스트 16px
   - 수정하기 (pencil)
   - 삭제하기 (trash, text #C0392B)
   - 공유하기 (square.and.arrow.up)
   - 신고하기 (flag, text #C0392B) ← 타인 시만

2. 서체 선택
   제목: "서체" Asta Sans Medium 15px, 하단 16px
   옵션 3개 (라디오 버튼 스타일):
   - 명조체 (Gowun Batang 미리보기)
   - 고딕체 (Asta Sans 미리보기)
   - 필기체 (Cursive 미리보기)

3. 배경 선택
   제목: "배경" Asta Sans Medium 15px, 하단 16px
   색상 스와치 4개 (56×56px, radius 10px, 선택 시 border 2px #C8773A):
   - 흰색 (#FFFFFF)
   - 아이보리 (#FAF7F2)
   - 연한 오렌지 (#F5E6D8)
   - 연한 보라 (#EDE8F5)

4. 공개 범위 설정
   - 전체 공개 (globe 아이콘)
   - 나만 보기 (lock 아이콘)
   선택 항목: 우측 체크 아이콘 #C8773A
```

---

## 22. 토스트 & 스낵바

```
배경:   #3D3B38
텍스트: #FFFFFF, Asta Sans Regular 14px
모서리: 10px
패딩:   12px 16px
최대 너비: 화면 너비 - 32px
위치:   화면 하단, Tab Bar 위 8px (중앙 정렬)
자동 사라짐: 2.5초

종류:
  성공: 왼쪽 4px solid dot #2E7D6B
  에러: 왼쪽 4px solid dot #C0392B
  일반: dot 없음

등장 애니메이션: 아래 → 위 슬라이드 + 페이드인 (200ms)
사라짐 애니메이션: 페이드아웃 (150ms)
```

---

## 23. 스도쿠 그리드 컴포넌트

### 그리드 레이아웃

```
전체 크기: (screenWidth - 32px) × (screenWidth - 32px) 정사각형
셀 크기: 전체 크기 ÷ 9

테두리:
  전체 외곽: 2px solid #3D3B38
  3×3 박스 경계 (가로줄 2, 3 / 세로줄 2, 3): 2px solid #3D3B38
  일반 셀 경계: 0.5px solid #D8D4CC
```

### 셀 상태 배경

| 상태 | 배경색 |
|------|--------|
| 기본 | `#FFFFFF` |
| 선택된 셀 | `#F5E6D8` |
| 같은 숫자 셀 | `rgba(200,119,58,0.08)` |
| 같은 행/열/박스 | `rgba(200,119,58,0.04)` |
| 오류 셀 | `rgba(192,57,43,0.08)` |

### 셀 텍스트

| 종류 | 폰트 | 크기 | 색상 |
|------|------|------|------|
| 원본 고정 숫자 | Asta Sans Medium | 20px | `#3D3B38` |
| 사용자 입력 숫자 | Asta Sans Regular | 20px | `#C8773A` |
| 오류 숫자 | Asta Sans Regular | 20px | `#C0392B` |
| 메모 숫자 | Asta Sans Regular | 9px | `#6B6860` |

### 숫자 패드

```
배치: 1–9 버튼 가로 배열 (9등분)
버튼 크기: (screenWidth - 32px) ÷ 9, 높이 48px
텍스트: Asta Sans Medium 22px #3D3B38
Pressed: bg rgba(0,0,0,0.05)
완성된 숫자(9개 모두 채워진 경우): opacity 0.3
```

### 도구 버튼 행

```
버튼 크기: 56×56px
구성: [지우기] [메모] [힌트] [실행취소]
텍스트: Asta Sans 11px
아이콘 + 레이블 (아이콘 24×24, 레이블 margin-top 4px)

메모 활성화 상태:
  bg: #EDE8F5
  icon/text: #5C4A8F

힌트 카운트:
  버튼 우상단 뱃지: Asta Sans 10px #FFFFFF on #C8773A circle 16×16px
```

---

# Part 4. 사이트맵 & 화면 명세

---

## 24. 사이트맵

```
안젤리카 (angelica-expo)
│
├── [온보딩 플로우]
│   ├── 스플래시 화면
│   ├── 온보딩 슬라이드 1 — 브랜드 소개
│   ├── 온보딩 슬라이드 2 — 문학카페 소개
│   ├── 온보딩 슬라이드 3 — 퍼즐게임 소개
│   └── 온보딩 슬라이드 4 — 시작하기 CTA
│
├── [인증 플로우]
│   ├── 로그인 화면
│   ├── 회원가입 — 스텝 1 (이메일/비밀번호)
│   ├── 회원가입 — 스텝 2 (닉네임 설정)
│   ├── 소셜 로그인 중간 처리 (Apple / Google)
│   └── 비밀번호 재설정 화면
│
└── [메인 앱] ← 하단 탭 4개
    │
    ├── [홈 탭] ─ house 아이콘, active #C8773A
    │   └── 홈 화면
    │       ├── 데일리 퍼즐 카드 → 퍼즐 탭
    │       └── 최신 시 미리보기 → 문학카페 탭
    │
    ├── [문학카페 탭] ─ pencil 아이콘, active #5C4A8F
    │   ├── 피드 화면 (기본)
    │   │   └── 시 카드 탭 → 시 상세 화면
    │   ├── 시 상세 화면
    │   │   ├── 작성자 탭 → 타인 프로필 화면
    │   │   └── 더보기 → 바텀 시트 (수정/삭제/공유/신고)
    │   ├── 시 작성 화면 (+ 버튼 진입)
    │   │   ├── 서체 선택 → 바텀 시트
    │   │   ├── 배경 선택 → 바텀 시트
    │   │   ├── 태그 입력 → 인라인 확장
    │   │   ├── 공개 범위 → 바텀 시트
    │   │   └── 게시 → 완료 토스트 + 피드 복귀
    │   └── 시 수정 화면 (본인 시 더보기에서 진입)
    │
    ├── [퍼즐 탭] ─ grid 아이콘, active #2E7D6B
    │   ├── 퍼즐 메인 화면 (기본)
    │   │   └── 난이도별 카드 탭 → 스도쿠 게임 화면
    │   ├── 스도쿠 게임 화면
    │   │   ├── 뒤로가기 → 확인 모달 → 퍼즐 메인
    │   │   └── 완료 → 퍼즐 완료 화면
    │   └── 퍼즐 완료 화면 → 퍼즐 메인
    │
    └── [프로필 탭] ─ person 아이콘, active #C8773A
        ├── 내 프로필 화면
        │   ├── 내 시 탭 → 시 카드 목록
        │   ├── 저장한 시 탭 → 저장 시 목록
        │   └── 설정 아이콘 → 설정 화면
        ├── 타인 프로필 화면 (시 상세에서 진입)
        ├── 설정 화면
        │   ├── 다크 모드 토글
        │   ├── 알림 설정 →
        │   │   └── 알림 시각 설정
        │   ├── 계정 정보 수정 →
        │   ├── 비밀번호 변경 → (이메일 가입만)
        │   ├── 로그아웃 (확인 모달)
        │   ├── 계정 탈퇴 → (확인 모달)
        │   ├── 개인정보처리방침 → (웹뷰)
        │   └── 이용약관 → (웹뷰)
        └── 비밀번호 변경 화면
```

---

## 25. 페이지별 상세 명세

### 25.1 스플래시 화면

```
배경:   #FAF7F2
중앙 상단: 앱 아이콘 (80×80px, radius 18px)
중앙:    "안젤리카" Gowun Batang Bold 28px #3D3B38
하단 20%: 원형 로딩 인디케이터 (24×24px, stroke #C8773A 2px)
전환:    1.5초 후 자동 → 온보딩 또는 홈 (로그인 상태이면 홈)
```

---

### 25.2 온보딩

4개 슬라이드, 스와이프 또는 버튼으로 이동.

```
공통 레이아웃:
  배경: #FAF7F2
  상단 오른쪽: "건너뛰기" Ghost 버튼 (슬라이드 1–3만)
  하단: 페이지 인디케이터 4개 점
        활성: #C8773A 10px, 비활성: #D8D4CC 8px

슬라이드 1 — 브랜드
  일러스트: 카페 창문 + 따뜻한 햇빛 (280×280px SVG)
  제목: "지적인 휴식 공간" Gowun Batang Bold 26px #3D3B38
  부제목: "광고 없이, 방해 없이" Asta Sans Regular 16px #6B6860

슬라이드 2 — 문학카페
  일러스트: 시 카드 스택 (퍼플 계열 배경 요소)
  제목: "시를 쓰고, 나누고"
  부제목: "조용한 문학의 공간"

슬라이드 3 — 퍼즐게임
  일러스트: 스도쿠 그리드 단편 (틸 계열 배경 요소)
  제목: "5분의 조용한 집중"
  부제목: "광고 없는 퍼즐 게임"

슬라이드 4 — CTA
  상단: 앱 아이콘 (64×64px)
  제목: "안젤리카를 시작하세요"
  버튼 영역:
    Primary: "회원가입" (전체 너비)
    Secondary: "로그인" (전체 너비, 상단 margin 12px)
    Ghost: "둘러보기" (상단 margin 16px) [MVP에서 비활성화 가능]
```

---

### 25.3 로그인 화면

```
내비게이션: 뒤로가기 (좌상단)
배경: #FAF7F2

콘텐츠 (세로 스크롤 없음):
  상단 여백: 48px
  앱 아이콘: 48×48px, 중앙 정렬
  "안젤리카": Gowun Batang Bold 24px, 중앙 정렬, top margin 12px
  하단 여백: 40px

  이메일 Input
  비밀번호 Input (top margin 12px)
    우측: 눈 아이콘 토글 (보기/숨기기)
  비밀번호 찾기: 우측 정렬 Ghost 버튼 13px, top margin 8px

  로그인 버튼: Primary, 전체 너비, top margin 24px

  구분선 텍스트: "─── 또는 ───", top margin 24px
                Asta Sans 13px #D8D4CC

  Apple로 로그인:
    bg #000000, text #FFFFFF, 전체 너비, radius 10px, 높이 48px
    top margin 16px

  Google로 로그인:
    bg #FFFFFF, border 1px #D8D4CC, text #3D3B38, 전체 너비
    top margin 12px

하단 고정:
  "계정이 없으신가요? 회원가입"
  Asta Sans 14px, #6B6860 + #C8773A (링크)
  bottom: safe area + 24px
```

---

### 25.4 회원가입 화면

#### 스텝 1 — 이메일/비밀번호

```
내비게이션: 뒤로가기 + "회원가입"
진행 바: 상단, 50% (1/2), bg #C8773A

입력 항목 (top margin 32px):
  이메일 Input
  비밀번호 Input (top margin 12px)
    조건 표시: "8자 이상, 영문+숫자 포함" 12px #9E9B94
  비밀번호 확인 Input (top margin 12px)
    일치 시: "일치합니다" #2E7D6B 12px
    불일치 시: "비밀번호가 일치하지 않습니다" #C0392B 12px

다음 버튼: Primary, 전체 너비, 하단 고정 (safe area + 16px)
  비활성: 입력 완료 전
```

#### 스텝 2 — 닉네임 설정

```
내비게이션: 뒤로가기 + "닉네임 설정"
진행 바: 100% (2/2)

안내 텍스트: "안젤리카에서 사용할 닉네임을 정해주세요."
  Asta Sans Regular 15px #6B6860, top margin 24px

닉네임 Input (top margin 24px)
  최대 8자, 실시간 중복 확인
  사용 가능: "✓ 사용할 수 있는 닉네임입니다" #2E7D6B 12px
  중복:     "✗ 이미 사용 중인 닉네임입니다" #C0392B 12px
  글자 수: 우측 "X/8" 12px #9E9B94

소개글 Textarea (top margin 16px, 선택)
  높이: 80px (자동 확장 X)
  최대 100자, 플레이스홀더: "나를 소개해보세요 (선택)"
  글자 수: 우측 하단 "X/100" 12px #9E9B94

시작하기 버튼: Primary, 전체 너비, 하단 고정
  비활성: 닉네임 미입력 또는 중복 시
```

---

### 25.5 홈 화면

```
내비게이션:
  좌측: "안젤리카" Gowun Batang Medium 20px #3D3B38
  우측: 알림 아이콘 (bell, 24×24)
  bg: #FAF7F2, 하단 구분선 없음

스크롤 가능 콘텐츠 (배경 #FAF7F2):

  1. 인사 섹션 (padding top 20px, bottom 20px)
     "좋은 하루예요, [닉네임]님" Asta Sans Medium 18px #3D3B38
     "2025년 1월 15일 수요일" Asta Sans 13px #9E9B94, top margin 4px

  2. 구분선 0.5px #EBE8E2

  3. 데일리 퍼즐 섹션 (padding 20px)
     섹션 레이블: "오늘의 퍼즐" Asta Sans Medium 14px #9E9B94
     데일리 퍼즐 카드 (margin top 12px)

  4. 구분선 0.5px #EBE8E2

  5. 최근 시 섹션 (padding 20px)
     헤더 행:
       "최근 시" Asta Sans Medium 14px #9E9B94
       "더보기 >" Asta Sans 13px #C8773A (우측)
     시 카드 목록 (margin top 12px, gap 12px, 최대 5개)

  하단 여백: 16px
```

---

### 25.6 문학카페 — 피드 화면

```
내비게이션:
  중앙: "문학카페" Asta Sans Medium 17px #3D3B38
  우측: + (plus 아이콘, #C8773A) → 시 작성 화면
  bg: #FFFFFF, 하단 구분선 0.5px #EBE8E2

콘텐츠:
  배경: #FAF7F2
  좌우 패딩: 16px
  카드 상단 첫 여백: 16px
  카드 사이 간격: 12px

  시 카드 목록 (무한 스크롤)
    → 카드 탭: 시 상세 화면 Push

하단 로딩 (추가 로드 시):
  원형 스피너 24×24px #D8D4CC, 중앙 정렬, 패딩 20px
```

---

### 25.7 시 상세 화면

```
내비게이션:
  좌측: ← 뒤로
  우측: ··· (ellipsis) → 바텀 시트
        (본인: 수정/삭제/공유, 타인: 공유/신고)
  bg: #FFFFFF

콘텐츠 (스크롤 가능):
  패딩: 수평 16px

  1. 작성자 정보 행 (패딩 top 16px, bottom 20px)
     아바타 40×40px
     닉네임 Asta Sans Medium 15px + 날짜 Asta Sans 13px #9E9B94
     → 탭 시 타인 프로필 Push

  2. 시 본문 카드
     배경: 사용자 선택 색상
     내부 패딩: 20px
     제목 (있을 경우): Asta Sans Medium 18px #3D3B38, bottom margin 8px
     본문: 사용자 선택 폰트 18px #3D3B38, 행간 1.75 (전체 표시, 미리보기 아님)
     해시태그: top margin 16px

  3. 여백 (패딩 bottom 80px — 하단 액션 바 공간)

하단 고정 액션 바:
  bg: #FFFFFF, 상단 구분선 0.5px #EBE8E2
  패딩: 수평 16px, 수직 12px
  배치: [하트+수] [공간] [북마크] [공유]
  폰트: Asta Sans 13px #6B6860
  활성 하트: heart.fill #C8773A
  활성 북마크: bookmark.fill #C8773A
```

---

### 25.8 시 작성 화면

```
내비게이션:
  좌측: "취소" Ghost 버튼 (취소 시 작성 중 내용 버릴지 확인 모달)
  우측: "게시" Primary 버튼
        비활성: 본문 미입력 / 활성: #C8773A

콘텐츠 (키보드 위까지):

  1. 제목 Input
     높이: 44px
     테두리 없음, 하단 구분선 0.5px #EBE8E2
     폰트: Asta Sans Regular 18px
     플레이스홀더: "제목 (선택)"
     글자 수: 우측 "X/50" 13px #9E9B94 (입력 시 표시)

  2. 본문 Textarea (남은 공간 모두 차지)
     폰트: 선택한 서체로 실시간 반영
     배경: 선택한 배경색으로 실시간 반영
     플레이스홀더: "시를 써보세요..."
     글자 수: 우측 하단 "X/1000" 12px #9E9B94

  3. 해시태그 영역 (태그 추가 시 표시)
     태그 배지들 + "추가" 버튼 (+ outline)

키보드 위 고정 툴바:
  bg: #FFFFFF, 상단 구분선 0.5px #EBE8E2
  높이: 44px
  버튼 4개 (균등 배치):
    [Aa 서체] [◻ 배경] [# 태그] [👁 공개]
  활성 버튼: text/icon #C8773A
  각 버튼 탭 시 해당 바텀 시트 열림
```

---

### 25.9 퍼즐 메인 화면

```
내비게이션:
  중앙: "퍼즐" Asta Sans Medium 17px #3D3B38
  bg: #FAF7F2

콘텐츠 (스크롤 가능):
  패딩: 수평 16px

  1. 헤더 (top 20px)
     "오늘의 퍼즐" Gowun Batang Bold 22px #3D3B38
     "1월 15일 수요일" Asta Sans 13px #9E9B94, top margin 4px

  2. 난이도별 카드 3개 (gap 12px, top margin 20px)
     각 카드 높이: 자동 (내용에 따라)

     미시작 카드:
       난이도 배지 + "스도쿠" Asta Sans Medium 16px
       상태: "미시작" Asta Sans 13px #9E9B94
       버튼: "시작하기" Primary

     진행중 카드:
       (동일 헤더)
       상태: "진행중 · 03:42" Asta Sans 13px #C8773A
       버튼: "이어하기" Primary

     완료 카드:
       배경: #E2F0EC
       (동일 헤더)
       상태: "완료 · 05:21 · 오류 0회" Asta Sans 13px #2E7D6B
       체크 아이콘 #2E7D6B
       버튼: "다시 풀기" Secondary (disabled 스타일)

  3. 이번 주 기록 (top margin 28px)
     "이번 주" Asta Sans Medium 14px #9E9B94
     7일 달력 스트립 (top margin 12px):
       날짜 원형 (32×32px):
         오늘: 테두리 2px #C8773A, text #C8773A
         완료일: bg #E2F0EC, 체크 11px #2E7D6B
         미래: bg #FAF7F2, text #D8D4CC
         과거 미완료: bg #FAF7F2, text #9E9B94

  하단 여백: 24px
```

---

### 25.10 스도쿠 게임 화면

```
내비게이션:
  좌측: ← (진행 중이면 확인 모달)
  중앙: 난이도 배지 (쉬움/보통/어려움)
  우측: ⏱ 타이머 "04:32" Asta Sans Medium 15px #6B6860
        탭으로 숨김/표시 토글
  bg: #FFFFFF

메인 콘텐츠 (세로 중앙 정렬):

  1. 오류 카운트 (그리드 위 8px, 우측 정렬)
     "오류 2/3" Asta Sans 13px #9E9B94 (오류 있을 때만)

  2. 스도쿠 그리드 (화면 너비 - 32px)
     좌우 여백: 16px

  3. 숫자 패드 (그리드 하단 20px)
     1–9 버튼 가로 배열

  4. 도구 버튼 행 (패드 하단 16px)
     [지우기] [메모] [힌트 (N)] [↺ 실행취소]

뒤로가기 확인 모달:
  제목: "퍼즐을 나가시겠어요?"
  내용: "진행 상황은 자동으로 저장됩니다."
  버튼: [취소] [나가기 →]

```

---

### 25.11 스도쿠 완료 화면

```
배경: #FFFFFF (전체 화면 또는 모달)

콘텐츠 (세로 중앙 정렬):

  1. 완료 아이콘
     체크마크 원형 (64×64px, bg #E2F0EC, icon #2E7D6B)
     그리기 애니메이션 (360ms)

  2. 완료 텍스트
     "완료!" Gowun Batang Bold 28px #3D3B38, top margin 16px
     난이도 배지, top margin 8px

  3. 결과 카드 (top margin 24px)
     bg #FAF7F2, radius 14px, padding 20px
     행 형식 (각 행 height 44px, border-bottom 0.5px #EBE8E2):
       소요 시간:    [05:21]
       오류 횟수:    [0회]
       힌트 사용:    [0회]

  4. 버튼 영역 (top margin 24px)
     "결과 공유하기" Secondary 버튼, 전체 너비
     "퍼즐 목록으로" Ghost 버튼, top margin 12px
```

---

### 25.12 프로필 화면 (내 프로필)

```
내비게이션:
  중앙: "프로필" Asta Sans Medium 17px
  우측: gearshape 아이콘 → 설정 화면
  bg: #FAF7F2

콘텐츠:

  1. 프로필 헤더 (padding 20px, bg #FFFFFF)
     아바타: 56×56px
     닉네임: Asta Sans Medium 20px #3D3B38, left margin 16px
     소개글: Asta Sans Regular 14px #6B6860, top margin 4px (없으면 미표시)
     통계 행 (top margin 16px):
       "N편" Asta Sans Medium 16px + "작성한 시" 13px #9E9B94
       "|" 구분
       "N개" + "받은 하트"

  2. 탭 바 (bg #FFFFFF, border-bottom 0.5px #EBE8E2)
     "내 시" | "저장한 시"
     활성 탭 하단 인디케이터: 2px #C8773A

  3. 시 목록 (배경 #FAF7F2)
     시 카드 목록 (padding 16px, gap 12px)
     빈 상태: 일러스트 + "아직 작성한 시가 없어요." Asta Sans 15px #9E9B94
```

---

### 25.13 타인 프로필 화면

```
내비게이션:
  좌측: ← 뒤로
  우측: ··· → (신고 메뉴)

차이점 (내 프로필 대비):
  - 설정 아이콘 없음
  - "저장한 시" 탭 없음 (내 시 목록만)
  - 통계에서 팔로우 버튼 없음 (MVP)
```

---

### 25.14 설정 화면

```
내비게이션: ← 뒤로 + "설정"
배경: #FAF7F2

섹션 리스트:

[앱 설정]  ← 섹션 헤더: Asta Sans Medium 13px #9E9B94, bg #FAF7F2, padding 12px 16px
  다크 모드        → [선택값: 라이트 / 다크 / 시스템] + >
  알림             →

[알림 설정 서브 화면]
  데일리 퍼즐 알림  [토글, 기본 OFF]
  알림 시각         → (토글 ON 시 활성, OFF 시 dim)

[계정]
  계정 정보 수정    →
  비밀번호 변경     → (이메일 가입만 표시)
  로그아웃          (탭 시 확인 모달)
  계정 탈퇴         text #C0392B (탭 시 확인 모달)

[정보]
  버전              [v1.0.0] (우측 정렬, 탭 불가)
  개인정보처리방침  →
  이용약관          →

리스트 행 스타일:
  높이: 52px
  패딩: 수평 16px
  좌: Asta Sans Regular 16px #3D3B38
  우: 값 텍스트 13px #9E9B94 + chevron.right 14px / 토글 / chevron.right
  하단 구분선: 0.5px #EBE8E2 (마지막 항목 제외)
```

---

## 26. 인터랙션 & 애니메이션

### 디자인 원칙

- 애니메이션은 조용해야 합니다. 사용자의 주의를 끌지 않는 방향으로.
- 과한 바운스, 복잡한 전환 없음.
- 기능을 전달하기 위한 최소한의 움직임.
- 모든 인터랙션은 `prefers-reduced-motion` 설정을 존중합니다.

### 화면 전환

| 상황 | 방식 | 시간 | 이징 |
|------|------|------|------|
| 화면 Push (우→좌) | Slide 오른쪽 → 왼쪽 | 280ms | ease-out |
| 화면 Pop (좌→우) | Slide 왼쪽 → 오른쪽 | 240ms | ease-in |
| 모달 / 바텀시트 등장 | 아래 → 위 슬라이드 | 320ms | ease-out |
| 모달 / 바텀시트 닫힘 | 위 → 아래 슬라이드 | 260ms | ease-in |
| 탭 전환 | 페이드 | 200ms | linear |
| 완료 화면 진입 | 페이드 + 스케일 (0.96 → 1.0) | 360ms | ease-out |

### 마이크로 인터랙션

| 컴포넌트 | 인터랙션 | 시간 |
|---------|---------|------|
| 모든 버튼 Press | scale(0.97) | 80ms |
| 하트 버튼 활성화 | heart → heart.fill + 작은 바운스 (scale 1.0 → 1.2 → 1.0) | 160ms + 120ms |
| 하트 버튼 비활성화 | heart.fill → heart | 120ms |
| 북마크 버튼 활성화 | bookmark → bookmark.fill | 160ms |
| 스도쿠 셀 선택 | 배경 페이드인 | 80ms |
| 스도쿠 숫자 입력 | 숫자 페이드인 (opacity 0 → 1) | 120ms |
| 스도쿠 오류 | 색상 변환 #C8773A → #C0392B + shake (±4px, 3회) | 300ms |
| 스도쿠 완료 | 체크 그리기 애니메이션 | 400ms |
| 토스트 등장 | translateY(100%) → 0 + opacity 0 → 1 | 200ms |
| 토스트 사라짐 | opacity 1 → 0 | 150ms |
| 스켈레톤 로딩 | shimmer 없음, 단순 bg #EBE8E2 (정적) | — |

### 로딩 상태

| 상황 | 방식 |
|------|------|
| 피드 초기 로딩 | 스켈레톤 카드 3개 (bg #EBE8E2, shimmer 없음) |
| 피드 추가 로딩 | 원형 스피너 24×24px, stroke #D8D4CC, 중앙 하단 |
| 버튼 로딩 | 버튼 내 흰색 원형 스피너 20×20px |
| 이미지 로딩 | bg #FAF7F2 placeholder |
| 화면 초기 로딩 | 스피너 없음, 스켈레톤 UI 우선 |

---

## 27. 다크 모드

### 원칙

라이트 모드의 따뜻한 톤을 다크 모드에서도 유지합니다. 순수 검정(`#000000`) 배경은 쓰지 않습니다.

### 라이트 ↔ 다크 색상 매핑

| 라이트 | 다크 | 용도 |
|--------|------|------|
| `#FAF7F2` | `#1C1A17` | 앱 배경 |
| `#FFFFFF` | `#28251F` | 카드, 모달 배경 |
| `#FAF7F2` | `#332F28` | 보조 배경 |
| `#3D3B38` | `#F0EDE6` | 주요 텍스트 |
| `#6B6860` | `#B8B4AD` | 보조 텍스트 |
| `#9E9B94` | `#7A7670` | 3차 텍스트 |
| `#D8D4CC` | `#3D3A34` | 기본 테두리 |
| `#EBE8E2` | `#4A4640` | 연한 테두리 |
| `#C8773A` | `#C8773A` | Primary (동일) |

### 시 카드 배경색 다크 모드 매핑

| 라이트 | 다크 |
|--------|------|
| `#FFFFFF` | `#28251F` |
| `#FAF7F2` | `#332F28` |
| `#F5E6D8` | `#3D2A1A` |
| `#EDE8F5` | `#2A2240` |

### 스도쿠 그리드 다크 모드

```
셀 기본 배경:   #28251F
선택된 셀:      rgba(200,119,58,0.15)
같은 숫자 강조: rgba(200,119,58,0.10)
행/열/박스:     rgba(200,119,58,0.06)
그리드 경계선:  #5A5650 (2px), #3D3A34 (0.5px)
```

---

# Part 5. 기술 명세

---

## 28. 기술 스택

> **핵심 스택 요약**: React Native (Expo SDK 51+) · Supabase (Auth + PostgreSQL DB + Edge Functions) · TypeScript
> **Git 리포지토리**: `angelica-expo`  |  **Expo 프로젝트**: `angelica-expo`

### 프론트엔드

| 항목 | 기술 | 버전 | 비고 |
|------|------|------|------|
| 프레임워크 | React Native + Expo | SDK 51+ | iOS/Android 동시 개발 |
| 언어 | TypeScript | 5.x | strict 모드 |
| 상태 관리 | Zustand | 4.x | 경량 우선 |
| 내비게이션 | Expo Router | v3 | 파일 기반 라우팅 |
| 스타일링 | NativeWind | v4 | Tailwind RN (또는 StyleSheet) |
| 로컬 저장 | MMKV | 2.x | 스도쿠 오프라인 저장 |
| 폼 처리 | React Hook Form + Zod | — | 입력값 검증 |
| 이미지 | expo-image | — | 캐싱 성능 최적화 |
| 폰트 | expo-font | — | Asta Sans, Gowun Batang |

### 백엔드 & 인프라

| 항목 | 기술 | 비고 |
|------|------|------|
| BaaS | **Supabase** | PostgreSQL 기반 |
| 인증 | Supabase Auth | Apple ID, Google 소셜 로그인 |
| DB | PostgreSQL (Supabase 관리형) | 관계형, SQL 자유 |
| 파일 저장 | Supabase Storage | MVP: 텍스트 전용 (이미지 v2) |
| 서버리스 함수 | Supabase Edge Functions (Deno) | 스도쿠 생성, 푸시 발송 |
| 스케줄러 | pg_cron (Supabase 내장) | 데일리 퍼즐 생성, 알림 발송 |
| 푸시 알림 | Expo Push Notification Service | APNs/FCM 추상화 |

### 개발 도구

| 항목 | 기술 |
|------|------|
| 빌드 | EAS Build (Expo Application Services) |
| OTA 업데이트 | EAS Update |
| CI/CD | GitHub Actions |
| 린트 | ESLint + Prettier |
| 테스트 | Jest + React Native Testing Library |
| 버전 관리 | Git (GitHub) |
| 시크릿 관리 | EAS Secrets |

### 왜 Supabase인가 (Firebase 대비)

| 항목 | Supabase | Firebase |
|------|---------|---------|
| DB | PostgreSQL (관계형) | Firestore (NoSQL) |
| 관계형 쿼리 | SQL 자유 ✅ | JOIN 없음 ❌ |
| 오프라인 캐시 | 직접 구현 필요 | 내장 ✅ |
| 비용 구조 | 인스턴스 기반 (예측 가능) ✅ | 읽기/쓰기 단위 (예측 어려움) |
| 오픈소스 | 100% ✅ | 클로즈드 ❌ |
| 벤더 종속 | 없음 ✅ | Google 종속 ❌ |
| Claude Code 궁합 | SQL 기반 우수 ✅ | Security Rules DSL 약점 |

> 오프라인 스도쿠는 MMKV 로컬 저장으로 직접 구현하여 Supabase 오프라인 부재를 보완합니다.

---

## 29. 프로젝트 구조

```
angelica-expo/
├── app/                          # Expo Router 파일 기반 라우팅
│   ├── (auth)/                   # 인증 플로우 (탭 바 없음)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx            # 스텝 1 (이메일/비밀번호)
│   │   ├── signup-profile.tsx    # 스텝 2 (닉네임)
│   │   └── reset-password.tsx
│   ├── (tabs)/                   # 메인 탭 앱
│   │   ├── _layout.tsx           # 탭 바 설정
│   │   ├── index.tsx             # 홈
│   │   ├── cafe/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx         # 피드
│   │   │   ├── write.tsx         # 시 작성
│   │   │   ├── [id].tsx          # 시 상세
│   │   │   └── edit/[id].tsx     # 시 수정
│   │   ├── puzzle/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx         # 퍼즐 메인
│   │   │   └── sudoku/
│   │   │       ├── [id].tsx      # 스도쿠 게임
│   │   │       └── complete.tsx  # 완료 화면
│   │   └── profile/
│   │       ├── index.tsx         # 내 프로필
│   │       ├── [userId].tsx      # 타인 프로필
│   │       └── settings.tsx      # 설정
│   ├── onboarding.tsx            # 온보딩
│   └── _layout.tsx               # 루트 레이아웃 (폰트 로드, 인증 체크)
│
├── src/
│   ├── components/
│   │   ├── common/               # 공통 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── cafe/                 # 문학카페 전용
│   │   │   ├── PoemCard.tsx
│   │   │   ├── PoemEditor.tsx
│   │   │   └── FontSelector.tsx
│   │   └── puzzle/               # 퍼즐 전용
│   │       ├── SudokuGrid.tsx
│   │       ├── NumberPad.tsx
│   │       ├── ToolBar.tsx
│   │       └── PuzzleCard.tsx
│   ├── store/                    # Zustand 스토어
│   │   ├── authStore.ts
│   │   ├── cafeStore.ts
│   │   └── puzzleStore.ts
│   ├── hooks/
│   │   ├── usePoems.ts
│   │   ├── useSudoku.ts
│   │   └── useAuth.ts
│   ├── lib/
│   │   ├── supabase.ts           # Supabase 클라이언트
│   │   └── notifications.ts      # Expo 푸시 알림
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   └── types/
│       ├── database.ts           # Supabase 자동 생성 타입
│       └── app.ts                # 앱 전용 타입
│
├── supabase/
│   ├── migrations/               # DB 마이그레이션 SQL 파일
│   └── functions/                # Edge Functions (Deno)
│       ├── generate-sudoku/
│       │   └── index.ts
│       ├── send-push/
│       │   └── index.ts
│       └── daily-puzzle-cron/
│           └── index.ts
│
├── assets/
│   ├── fonts/                    # Asta Sans, Gowun Batang .ttf
│   ├── images/                   # 온보딩 일러스트, 빈 상태 이미지
│   └── icons/                    # 앱 아이콘
│
├── app.json                      # Expo 앱 설정
├── eas.json                      # EAS Build/Update 설정
├── .env                          # 환경 변수 (gitignore)
└── package.json
```

---

## 30. 공통 기능 명세

### 30.1 인증

#### 회원가입 플로우

1. 이메일 + 비밀번호 입력 (최소 8자, 영문+숫자)
2. Supabase Auth로 계정 생성 + 이메일 인증 발송
3. 이메일 인증 완료 확인
4. 닉네임 설정 (필수, 최대 8자, 중복 불가, 실시간 확인)
5. 선택적 소개글 입력 (최대 100자)
6. `users` 테이블에 프로필 레코드 생성
7. 홈으로 이동

#### 소셜 로그인

```typescript
// Apple 로그인
import * as AppleAuthentication from 'expo-apple-authentication';

const signInWithApple = async () => {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken!,
  });
};

// Google 로그인
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: userInfo.idToken!,
  });
};
```

소셜 로그인 시 `users` 테이블에 프로필 레코드가 없으면 닉네임 설정 화면으로 이동.

#### 세션 관리

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
```

### 30.2 탭 구조

| 탭 | 인덱스 | 아이콘 | Active 색상 | 경로 |
|------|--------|--------|------------|------|
| 홈 | 0 | `house` | `#C8773A` | `/` |
| 문학카페 | 1 | `pencil` | `#5C4A8F` | `/cafe` |
| 퍼즐 | 2 | `square.grid.3x3` | `#2E7D6B` | `/puzzle` |
| 프로필 | 3 | `person` | `#C8773A` | `/profile` |

### 30.3 환경 변수

```bash
# .env (gitignore에 포함)
EXPO_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
EXPO_PUBLIC_PROJECT_ID=[expo-eas-project-id]

# EAS Secrets (빌드 시 주입)
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

---

## 31. 문학카페 개발 명세

### 31.1 시 피드

- 정렬: `created_at` 내림차순 (최신순). 알고리즘 없음.
- 페이지네이션: 20개 단위 무한 스크롤
- 표시 조건: `visibility = 'public'`

```typescript
// 피드 조회
const { data } = await supabase
  .from('poems')
  .select(`
    id, title, body, font, bg_color, tags, created_at,
    users!inner(nickname, avatar_url),
    likes(count),
    bookmarks(count)
  `)
  .eq('visibility', 'public')
  .order('created_at', { ascending: false })
  .range(offset, offset + 19);
```

### 31.2 시 작성 에디터

**입력 항목**:
- 제목 (선택, 최대 50자)
- 본문 (필수, 최대 1,000자)
- 서체: `serif` (Gowun Batang) / `sans` (Asta Sans) / `cursive`
- 배경색: `#FFFFFF` / `#FAF7F2` / `#F5E6D8` / `#EDE8F5`
- 해시태그: `#`으로 시작, 최대 5개, 각 최대 20자
- 공개 범위: `public` / `private`

```typescript
// 시 게시
const { data, error } = await supabase
  .from('poems')
  .insert({
    user_id: session.user.id,
    title: title || null,
    body,
    font,       // 'serif' | 'sans' | 'cursive'
    bg_color,   // '#FFFFFF' | '#FAF7F2' | '#F5E6D8' | '#EDE8F5'
    visibility, // 'public' | 'private'
    tags,       // string[] — ['#봄', '#감성']
  })
  .select()
  .single();
```

### 31.3 좋아요 & 저장 (토글)

```typescript
// 좋아요 토글
export async function toggleLike(userId: string, poemId: string) {
  const { data: existing } = await supabase
    .from('likes')
    .select('user_id')
    .eq('user_id', userId)
    .eq('poem_id', poemId)
    .maybeSingle();

  if (existing) {
    await supabase.from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('poem_id', poemId);
    return false; // 좋아요 취소
  } else {
    await supabase.from('likes')
      .insert({ user_id: userId, poem_id: poemId });
    return true; // 좋아요 추가
  }
}
```

### 31.4 데이터베이스 스키마

```sql
-- 사용자
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname    TEXT NOT NULL UNIQUE,
  bio         TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 시
CREATE TABLE poems (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT,                                    -- nullable
  body        TEXT NOT NULL CHECK (length(body) <= 1000),
  font        TEXT NOT NULL DEFAULT 'serif'
                CHECK (font IN ('serif', 'sans', 'cursive')),
  bg_color    TEXT NOT NULL DEFAULT '#FFFFFF'
                CHECK (bg_color IN ('#FFFFFF', '#FAF7F2', '#F5E6D8', '#EDE8F5')),
  visibility  TEXT NOT NULL DEFAULT 'public'
                CHECK (visibility IN ('public', 'private')),
  tags        TEXT[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 좋아요
CREATE TABLE likes (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  poem_id    UUID NOT NULL REFERENCES poems(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, poem_id)
);

-- 저장
CREATE TABLE bookmarks (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  poem_id    UUID NOT NULL REFERENCES poems(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, poem_id)
);

-- 인덱스
CREATE INDEX idx_poems_user_id    ON poems(user_id);
CREATE INDEX idx_poems_created_at ON poems(created_at DESC);
CREATE INDEX idx_poems_visibility ON poems(visibility);
CREATE INDEX idx_poems_tags       ON poems USING GIN(tags);
CREATE INDEX idx_likes_poem_id    ON likes(poem_id);
CREATE INDEX idx_bookmarks_user   ON bookmarks(user_id);
```

### 31.5 RLS 정책

```sql
-- poems 테이블 RLS 활성화
ALTER TABLE poems ENABLE ROW LEVEL SECURITY;

-- 공개 시 조회: 누구나
CREATE POLICY "public poems readable" ON poems
  FOR SELECT USING (visibility = 'public');

-- 본인 시 조회: private 포함
CREATE POLICY "own poems all readable" ON poems
  FOR SELECT USING (auth.uid() = user_id);

-- 시 작성: 인증된 사용자
CREATE POLICY "authenticated can insert poems" ON poems
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 시 수정/삭제: 본인만
CREATE POLICY "own poems update" ON poems
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "own poems delete" ON poems
  FOR DELETE USING (auth.uid() = user_id);

-- likes 테이블
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes readable" ON likes
  FOR SELECT USING (true);

CREATE POLICY "authenticated can like" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own likes deletable" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- bookmarks 테이블
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own bookmarks only" ON bookmarks
  FOR ALL USING (auth.uid() = user_id);
```

---

## 32. 퍼즐게임 개발 명세

### 32.1 스도쿠 규칙

표준 9×9 스도쿠. 1–9 숫자를 각 행, 열, 3×3 박스에 겹치지 않게 배치. 유일해(唯一解) 보장 필수.

### 32.2 난이도 기준

| 난이도 | 빈칸 수 | 예상 시간 | 유일해 |
|--------|---------|---------|--------|
| 쉬움   | 30–35개 | 3–5분   | 필수   |
| 보통   | 40–45개 | 5–10분  | 필수   |
| 어려움 | 50–55개 | 10–20분 | 필수   |

### 32.3 자동 저장 (MMKV)

```typescript
// src/store/puzzleStore.ts
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

interface SudokuState {
  puzzleId: string;
  grid: number[];        // 81칸 현재 상태 (0 = 빈칸)
  memo: number[][];      // 81칸 메모 상태 (각 셀 최대 9개 후보)
  fixedCells: boolean[]; // 원본 숫자 여부
  elapsedSeconds: number;
  errorCount: number;
  hintCount: number;
  history: Array<{ index: number; prev: number }>; // undo 스택
}

export const saveSudokuState = (state: SudokuState): void => {
  storage.set(`sudoku:${state.puzzleId}`, JSON.stringify(state));
};

export const loadSudokuState = (puzzleId: string): SudokuState | null => {
  const saved = storage.getString(`sudoku:${puzzleId}`);
  return saved ? JSON.parse(saved) : null;
};

export const clearSudokuState = (puzzleId: string): void => {
  storage.delete(`sudoku:${puzzleId}`);
};
```

### 32.4 데이터베이스 스키마

```sql
-- 스도쿠 퍼즐 원본
CREATE TABLE puzzles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  difficulty   TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  grid         SMALLINT[] NOT NULL CHECK (array_length(grid, 1) = 81),
  solution     SMALLINT[] NOT NULL CHECK (array_length(solution, 1) = 81),
  puzzle_date  DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(difficulty, puzzle_date)
);

-- 사용자 퍼즐 기록
CREATE TABLE puzzle_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puzzle_id       UUID NOT NULL REFERENCES puzzles(id),
  state           SMALLINT[] NOT NULL,    -- 진행 중 81칸 상태
  memo            JSONB,                  -- {"12": [3,5,7], ...} 형태
  elapsed_seconds INT NOT NULL DEFAULT 0,
  error_count     INT NOT NULL DEFAULT 0,
  hint_count      INT NOT NULL DEFAULT 0,
  completed_at    TIMESTAMPTZ,            -- null이면 미완료
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, puzzle_id)
);

-- 인덱스
CREATE INDEX idx_puzzles_date       ON puzzles(puzzle_date DESC);
CREATE INDEX idx_puzzle_records_user ON puzzle_records(user_id);
CREATE INDEX idx_puzzle_records_date ON puzzle_records(created_at DESC);
```

### 32.5 퍼즐 생성 Edge Function

```typescript
// supabase/functions/generate-sudoku/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Grid = number[];  // 81개 원소 (0 = 빈칸)

function generateComplete(): Grid {
  const grid: Grid = Array(81).fill(0);
  solve(grid);
  return grid;
}

function solve(grid: Grid, pos = 0): boolean {
  if (pos === 81) return true;
  if (grid[pos] !== 0) return solve(grid, pos + 1);
  const nums = shuffle([1,2,3,4,5,6,7,8,9]);
  for (const n of nums) {
    if (isValid(grid, pos, n)) {
      grid[pos] = n;
      if (solve(grid, pos + 1)) return true;
      grid[pos] = 0;
    }
  }
  return false;
}

function hasUniqueSolution(grid: Grid): boolean {
  let count = 0;
  function count_solutions(g: Grid, pos = 0): void {
    if (count > 1) return;
    if (pos === 81) { count++; return; }
    if (g[pos] !== 0) { count_solutions(g, pos + 1); return; }
    for (let n = 1; n <= 9; n++) {
      if (isValid(g, pos, n)) {
        g[pos] = n;
        count_solutions(g, pos + 1);
        g[pos] = 0;
      }
    }
  }
  count_solutions([...grid]);
  return count === 1;
}

function createPuzzle(difficulty: 'easy' | 'medium' | 'hard'): { grid: Grid; solution: Grid } {
  const solution = generateComplete();
  const puzzle = [...solution];
  const blanks = { easy: 32, medium: 43, hard: 52 }[difficulty];
  const positions = shuffle([...Array(81).keys()]);
  let removed = 0;
  for (const pos of positions) {
    if (removed >= blanks) break;
    const backup = puzzle[pos];
    puzzle[pos] = 0;
    if (!hasUniqueSolution(puzzle)) {
      puzzle[pos] = backup;
    } else {
      removed++;
    }
  }
  return { grid: puzzle, solution };
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const results = [];
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const { grid, solution } = createPuzzle(difficulty);
    const { data, error } = await supabase.from('puzzles').upsert({
      difficulty, grid, solution, puzzle_date: dateStr,
    }, { onConflict: 'difficulty,puzzle_date' });
    results.push({ difficulty, success: !error });
  }

  return new Response(JSON.stringify({ date: dateStr, results }));
});
```

**pg_cron 스케줄 (매일 KST 23:00 = UTC 14:00에 다음날 퍼즐 생성)**:

```sql
-- Supabase 대시보드 > Database > Extensions에서 pg_cron 활성화 후
SELECT cron.schedule(
  'generate-daily-puzzle',
  '0 14 * * *',
  $$
  SELECT net.http_post(
    url    := 'https://[project-ref].supabase.co/functions/v1/generate-sudoku',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

---

## 33. 백엔드 & 데이터베이스

### 33.1 전체 DB 스키마 요약

```
users          — 사용자 계정 정보 (Supabase Auth 연동)
poems          — 시 본문 및 스타일 정보
likes          — 좋아요 관계 (user_id + poem_id 복합 PK)
bookmarks      — 저장 관계 (user_id + poem_id 복합 PK)
puzzles        — 스도쿠 퍼즐 원본 (데일리, 유일해 보장)
puzzle_records — 사용자별 퍼즐 진행 기록 및 완료 이력
push_tokens    — 사용자별 Expo 푸시 알림 토큰
```

### 33.2 push_tokens 테이블

```sql
CREATE TABLE push_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  platform    TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  preferred_hour INT CHECK (preferred_hour BETWEEN 0 AND 23), -- 알림 시각 (KST)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tokens only" ON push_tokens
  FOR ALL USING (auth.uid() = user_id);
```

---

## 34. 푸시 알림

### 34.1 전체 구조

```
사용자 기기 (Expo Push Token 발급)
        ↓ 토큰 저장 (Supabase push_tokens)
        
[이벤트 발생: pg_cron 스케줄]
        ↓
[Supabase Edge Function: send-push]
        ↓
[Expo Push API: exp.host/--/api/v2/push/send]
        ↓
[APNs (iOS)] 또는 [FCM (Android)]
        ↓
[사용자 기기 알림 수신]
```

### 34.2 클라이언트 토큰 등록

```typescript
// src/lib/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false, // 조용한 앱 원칙
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('에뮬레이터에서는 푸시 알림을 사용할 수 없습니다.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data: tokenData } = await Notifications.getExpoPushTokenAsync({ projectId });

  await supabase.from('push_tokens').upsert({
    user_id: userId,
    token: tokenData,
    platform: Platform.OS,
  }, { onConflict: 'token' });

  return tokenData;
}
```

### 34.3 서버 발송 Edge Function

```typescript
// supabase/functions/send-push/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default' | null;
  badge?: number;
}

async function sendBatch(messages: PushMessage[]) {
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(messages),
  });
  return res.json();
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 현재 시각(KST) 기준 알림 시각이 맞는 사용자 토큰 조회
  const kstHour = new Date(Date.now() + 9 * 3600 * 1000).getUTCHours();

  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('notifications_enabled', true)
    .eq('preferred_hour', kstHour);

  if (!tokens?.length) {
    return new Response(JSON.stringify({ sent: 0 }));
  }

  const messages: PushMessage[] = tokens.map(({ token }) => ({
    to: token,
    title: '안젤리카',
    body: '오늘의 스도쿠가 도착했습니다.',
    data: { screen: 'puzzle', type: 'daily' },
    sound: null, // 조용한 알림
  }));

  // 100개씩 배치 발송
  const results = [];
  for (let i = 0; i < messages.length; i += 100) {
    const result = await sendBatch(messages.slice(i, i + 100));
    results.push(result);
  }

  return new Response(JSON.stringify({ sent: messages.length, results }));
});
```

**pg_cron으로 매시간 실행 (preferred_hour와 매칭)**:

```sql
SELECT cron.schedule(
  'send-daily-puzzle-push',
  '0 * * * *',  -- 매시간 정각
  $$
  SELECT net.http_post(
    url    := 'https://[project-ref].supabase.co/functions/v1/send-push',
    headers := '{"Authorization": "Bearer [service-role-key]"}'::jsonb
  );
  $$
);
```

### 34.4 알림 수신 처리

```typescript
// app/_layout.tsx
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // 알림 탭으로 화면 이동
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, string>;
        if (data?.screen === 'puzzle') router.push('/(tabs)/puzzle');
        if (data?.screen === 'cafe')   router.push('/(tabs)/cafe');
      }
    );
    return () => responseSub.remove();
  }, []);

  // ... 나머지 레이아웃 코드
}
```

### 34.5 MVP 알림 목록

| 알림 종류 | 트리거 | 기본값 | 비고 |
|---------|--------|--------|------|
| 데일리 퍼즐 도착 | pg_cron (사용자 선택 시각) | **OFF** | 설정에서 ON 가능 |
| 좋아요 알림 | 실시간 (v2 이후) | OFF | MVP 제외 |
| 팔로우 알림 | 팔로우 이벤트 (v2 이후) | OFF | MVP 제외 |

---

## 35. 비기능 요구사항

### 광고 & 추적 금지 (절대 원칙)

- 서드파티 광고 SDK 일체 포함 금지 (AdMob, Meta Audience Network, Unity Ads 등)
- 사용자 행동 데이터를 외부 광고 네트워크에 전송 금지
- 분석 도구 사용 시 익명화 필수, 개인 식별 정보(PII) 수집 금지
- Firebase Analytics 익명 집계 허용 (단, 광고 ID 비활성화)
- 앱스토어 심사 시 개인정보처리방침에 데이터 수집 최소화 명시

### 성능 기준

| 항목 | 기준 |
|------|------|
| 피드 첫 로딩 | 2초 이내 (LCP) |
| 스도쿠 숫자 입력 응답 | 즉시 (16ms 이내, 60fps 유지) |
| 오프라인 스도쿠 | 진행 중인 게임 계속 가능 (MMKV) |
| 앱 번들 크기 | 초기 다운로드 50MB 이하 |
| 앱 콜드 스타트 | 3초 이내 |

### 접근성

- iOS Dynamic Type 지원 / Android 텍스트 크기 조절 지원
- 색상 대비 WCAG AA 기준 충족 (4.5:1 이상)
- 스크린 리더 기본 지원 (중요 버튼/이미지에 `accessibilityLabel` 필수)
- 터치 타겟 최소 44×44px

### 보안

- 모든 API 통신 HTTPS/TLS
- Supabase RLS 전 테이블 적용 필수 (빠짐 없이)
- 민감 정보(비밀번호, 시크릿 키) 클라이언트 저장 금지
- 앱 소스에 시크릿 키 하드코딩 금지 → EAS Secrets 사용
- JWT 토큰 만료 시 자동 갱신 처리

---

## 36. MVP 개발 우선순위

### 스프린트 계획

| 스프린트 | 기간 | 목표 | 완료 기준 |
|---------|------|------|---------|
| S1 | 1–2주 | 프로젝트 세팅, Supabase 연동, 인증 (이메일/소셜), 기본 탭 내비게이션, 폰트 로드 | 로그인 후 4개 탭 진입 가능 |
| S2 | 3–4주 | 시 작성 에디터, 피드 조회, 좋아요/저장, 기본 프로필 | 시 작성 → 피드에서 확인 가능 |
| S3 | 5–6주 | 스도쿠 그리드 UI, 숫자 입력, 메모/힌트/undo, MMKV 자동 저장, 데일리 퍼즐 API | 스도쿠 완주 가능 |
| S4 | 7–8주 | 홈 탭 통합, 다크 모드, 푸시 알림 인프라, UI 폴리싱, 버그 수정 | 베타 빌드 EAS 배포 |
| S5 | 9–10주 | 앱스토어 심사 준비, 개인정보처리방침, 전체 테스트 | v1.0 스토어 출시 |

### MVP 제외 항목 (v2 이후)

- 팔로우 / 팔로워 시스템
- 댓글
- 고전시 아카이브
- AI 시 도우미 (운율, 어휘 제안)
- 블록 라인클리어 게임
- 크로스워드 게임
- 퍼즐 무제한 구독 (인앱 결제)
- 콘텐츠 팩 구매 (인앱 결제)
- PDF 시집 내보내기
- 이미지 첨부 (시 카드)
- 글로벌 다국어 (일본어/영어)
- 좋아요 알림 (실시간)
- 팔로우 알림

---

# Part 6. 에셋 & 산출물

---

## 37. 에셋 체크리스트

### 37.1 앱 아이콘

```
아이콘 디자인 방향:
  배경: #C8773A (오렌지) 또는 #FAF7F2 (아이보리)
  심벌: 안젤리카 허브 잎 실루엣 또는 'A' 이니셜 + 작은 잎 조합
  스타일: 평면적, 선 없이 면으로만

iOS 필요 사이즈:
  1024×1024px   — App Store 제출용
  180×180px     — @3x (iPhone)
  120×120px     — @2x (iPhone)
  167×167px     — @2x (iPad Pro)
  152×152px     — @2x (iPad)
  76×76px       — @1x (iPad)
  60×60px       — @1x (iPhone 알림)

Android 필요 사이즈:
  512×512px     — Play Store 제출용
  192×192px     — xxxhdpi (포어그라운드 레이어)
  144×144px     — xxhdpi
  96×96px       — xhdpi
  72×72px       — hdpi
  48×48px       — mdpi
  포어그라운드 레이어 + 배경 레이어 별도 (Adaptive Icon)
  배경 레이어: #C8773A 단색 또는 패턴
```

### 37.2 스플래시 스크린

```
배경: #FAF7F2
중앙: 앱 아이콘 심벌 80×80px
iOS: Launch Screen (Storyboard, bg #FAF7F2)
Android: splash_screen.xml (bg #FAF7F2, 중앙 심벌)
Expo: app.json의 splash 설정 사용
```

### 37.3 온보딩 일러스트

```
3종 필요 (슬라이드 1, 2, 3용)
규격: 280×280px, SVG 형식
스타일: 벡터, 단순한 선과 면 구성 (복잡한 일러스트 지양)
색상: 안젤리카 컬러 시스템 내에서만 사용

슬라이드 1: 따뜻한 빛이 들어오는 카페 창문
  주요 색상: #FAF7F2, #C8773A, #F5E6D8

슬라이드 2: 시 카드 2–3개 겹쳐진 스택
  주요 색상: #EDE8F5, #5C4A8F, #FAF7F2

슬라이드 3: 스도쿠 그리드 일부 + 완성된 숫자들
  주요 색상: #E2F0EC, #2E7D6B, #FAF7F2
```

### 37.4 빈 상태 일러스트 (Empty State)

```
3종 필요
규격: 160×160px, SVG
색상: #D8D4CC 계열 (연하고 조용하게)

1. 피드 빈 상태
   내용: 빈 카드 + 연필 아이콘
   문구: "아직 시가 없어요.\n첫 번째 시를 써보세요."

2. 저장 빈 상태
   내용: 빈 북마크 아이콘
   문구: "저장한 시가 없어요."

3. 퍼즐 전체 완료
   내용: 체크 아이콘 + 별
   문구: "오늘의 퍼즐을 모두 완료했어요!"
```

### 37.5 폰트 파일

```
Google Fonts에서 다운로드:
  Asta Sans:
    AstaSans-Regular.ttf    (400)
    AstaSans-Medium.ttf     (500)
    AstaSans-Bold.ttf       (700)

  Gowun Batang:
    GowunBatang-Regular.ttf (400)
    GowunBatang-Bold.ttf    (700)

저장 경로: assets/fonts/
```

---

## 38. 피그마 파일 구조

```
📁 angelica-expo (Figma 프로젝트)
│
├── 📄 00_디자인 시스템
│   ├── 🎨 Colors — 라이트/다크 모드 전체 토큰
│   │   ├── Primary 팔레트
│   │   ├── Accent 팔레트 (Cafe / Puzzle)
│   │   ├── Neutral 팔레트
│   │   ├── Semantic 팔레트
│   │   └── Dark Mode 매핑
│   ├── 🔤 Typography — 타입 스케일 전체
│   │   ├── Asta Sans 샘플 (Regular / Medium / Bold)
│   │   ├── Gowun Batang 샘플 (Regular / Bold)
│   │   └── 타입 스케일 표 (display ~ caption)
│   ├── 📏 Spacing & Grid — 간격 토큰 및 그리드
│   │   ├── 8px 베이스 간격 토큰 시각화
│   │   └── 390×844 모바일 그리드 (4컬럼, 16px 여백)
│   ├── 🔵 Radius & Shadow — 모서리/그림자 토큰
│   └── 🔣 Icons — 사용 아이콘 목록 및 크기 가이드
│
├── 📄 01_컴포넌트
│   ├── Buttons (Primary / Secondary / Ghost / Icon)
│   │   각 상태별 배리언트: Default / Pressed / Disabled / Loading
│   ├── Inputs (Text / Textarea / Search)
│   │   각 상태별: Default / Focus / Error / Disabled
│   ├── Cards (Poem Card / Daily Puzzle Card)
│   │   Poem Card: 배경 4종 × 서체 3종 조합
│   ├── Navigation (Top Bar / Bottom Tab Bar)
│   ├── Badges & Tags (난이도 3종 / 해시태그 / 상태)
│   ├── Avatar (32 / 40 / 56px, 이미지 있음/없음)
│   ├── Bottom Sheet (4종: 더보기/서체/배경/공개범위)
│   ├── Toast & Snackbar (성공 / 에러 / 일반)
│   └── Sudoku Grid
│       ├── 셀 상태별 (기본/선택/하이라이트/오류/완성)
│       ├── 숫자 패드
│       └── 도구 버튼 행
│
├── 📄 02_화면_라이트모드
│   ├── 온보딩 (4개 화면)
│   │   Splash / Onboarding 1-3 / Onboarding 4 CTA
│   ├── 인증 (5개 화면)
│   │   Login / Signup Step1 / Signup Step2 / Social / Reset PW
│   ├── 홈 (1개 화면)
│   ├── 문학카페 (4개 화면)
│   │   Feed / Poem Detail / Write / Edit
│   ├── 퍼즐 (3개 화면)
│   │   Puzzle Main / Sudoku Game / Sudoku Complete
│   └── 프로필 & 설정 (5개 화면)
│       My Profile / Other Profile / Settings / Alarm Settings / Change PW
│
├── 📄 03_화면_다크모드
│   └── 라이트모드 전체 미러링 + 다크 컬러 교체
│       (18개 화면 동일 구성)
│
├── 📄 04_바텀시트 & 모달
│   ├── 시 더보기 옵션 시트
│   ├── 서체 선택 시트
│   ├── 배경 선택 시트
│   ├── 공개 범위 시트
│   ├── 뒤로가기 확인 모달 (스도쿠)
│   ├── 로그아웃 확인 모달
│   └── 계정 탈퇴 확인 모달
│
├── 📄 05_프로토타입
│   주요 사용자 플로우 인터랙티브 연결:
│   ├── 플로우 A: 신규 회원가입 → 온보딩 → 첫 시 작성
│   ├── 플로우 B: 피드 탐색 → 시 상세 → 프로필 방문
│   ├── 플로우 C: 스도쿠 시작 → 진행 → 완료
│   └── 플로우 D: 설정 → 다크 모드 전환
│
└── 📄 06_에셋
    ├── 앱 아이콘 (플랫폼별 사이즈)
    ├── 온보딩 일러스트 (3종)
    ├── 빈 상태 일러스트 (3종)
    └── 스플래시 스크린
```

---

## 39. 문서 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|---------|
| v0.1 | 2026-04-09 | — | 초안 작성 (브랜드/디자인/개발 통합) |
| v0.2 | 2026-04-10 | — | 파일명 cafe-angelica-masterplan, 깃 리포 angelica-expo 로 변경. 기술 스택 Expo + Supabase 확정 명시 |

---

> **안젤리카** — 지적인 휴식 공간  
> 프로젝트: `angelica-expo`  
> 문서 버전: v0.1
