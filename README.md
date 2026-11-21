# ✍️ 라이팅 코치 (Writing Coach) — English Writing Feedback Tool

유치원(6세)부터 초·중·고등학교(Grade 1–12), 성인까지 — 연령/학년에 맞춰
학생의 영어 글쓰기를 4가지 카테고리로 분석해주는 정적(static) 웹 앱입니다.

- **Grammar & Conventions** — 문법, 스펠링, 문장부호
- **Vocabulary** — 어휘 수준 진단, 더 나은 단어 제안, 반복/단조로움 지적
- **Sentence Structure** — 문장 구조 진단 및 교정 예시
- **Flow & Organization** — 글의 흐름/구성, 특히 결론부의 근거 부족·주제 이탈 여부 확인

## 주요 기능

- 유치원 ~ Grade 12, 성인까지 개별 버튼으로 연령/학년 선택
- 피드백 언어 선택(6개 언어), 수업 수강/테스트 글 구분에 따라 Flow & Organization 피드백 방향 조정
- 4개 카테고리별 점수 + 구체적 피드백, 종합 점수/총평, 잘한 점, 다음 목표 제시
- 결과 **복사**(클립보드), **저장**(별도 HTML 리포트 파일로 다운로드), **인쇄/PDF 출력** 지원
- 빌드 과정이나 백엔드 서버 없이 정적 파일만으로 동작 (프레임워크 불필요)

## 동작 방식 & 개인정보

이 앱은 **순수 클라이언트(브라우저) 전용**입니다. 사용자가 입력한 API 키와 글은
브라우저에서 **Anthropic API(`api.anthropic.com`)로 직접** 전송되어 채점되며,
이 프로젝트가 운영하는 어떤 서버로도 전송·저장되지 않습니다.

- API 키는 "이 브라우저에 기억하기"를 체크한 경우에만 해당 브라우저의
  `localStorage`에 저장됩니다. 체크하지 않으면 새로고침 시 사라집니다.
- 채점에는 사용자 본인이 발급받은 Anthropic API 키가 필요합니다:
  https://console.anthropic.com/settings/keys 에서 발급받을 수 있습니다.
  (사용량에 따라 Anthropic 요금이 과금될 수 있습니다.)

## 로컬에서 실행하기

빌드 과정이 없으므로 정적 파일 서버로 열기만 하면 됩니다.

```bash
# 방법 1: 아무 정적 서버로 실행
npx serve .

# 방법 2: 파이썬 내장 서버
python3 -m http.server 8080
```

그 후 브라우저에서 `http://localhost:8080` 접속 → 우측 상단 "⚙️ API 설정"에서
Anthropic API 키 입력 → 학년 선택 → 글 입력 → "첨삭 시작하기".

> `index.html`을 파일 시스템에서 바로 더블클릭해 열어도 대부분 동작하지만,
> 일부 브라우저의 보안 정책 때문에 위와 같이 로컬 서버로 여는 것을 권장합니다.

## 배포하기 (누구나 무료로 배포 가능)

정적 파일(`index.html`, `style.css`, `app.js`)만으로 구성되어 있어
아래와 같은 무료 정적 호스팅 서비스에 그대로 올리면 배포가 끝납니다.
별도 서버, 환경변수, 데이터베이스가 전혀 필요 없습니다.

- **GitHub Pages**: 저장소 Settings → Pages → 브랜치를 `main` (또는 배포용 브랜치), 폴더를 `/` (root)로 지정
- **Netlify / Vercel**: 저장소를 연결하고 빌드 명령 없이 "Publish directory: `.`"로 배포
- **Cloudflare Pages**: 빌드 명령 없이 그대로 배포

배포된 사이트를 방문하는 각 사용자는 **자신의 Anthropic API 키**를 직접 입력해서
사용하므로, 배포자가 API 비용을 대신 부담하거나 키를 관리할 필요가 없습니다.

## 라이선스 & 저작권 안내

- 이 프로젝트의 소스 코드·프롬프트·디자인·문서는 **EnL_language(E&Languages)의 저작물**이며,
  개인·수업용으로만 쓸 수 있습니다. 허락 없이 복사·수정·공유·재배포할 수 없습니다. 자세한 내용은 [LICENSE](./LICENSE)를 보세요.
- 폰트는 SIL Open Font License인 Google Fonts(Noto Sans KR, Inter)를 CDN 링크로만 불러오며, 이미지·아이콘은 이모지만 사용합니다.
- 예시 글은 직접 쓴 글이며, 채점 기준은 특정 출판사·시험 기관의 루브릭을 옮긴 것이 아닙니다.
- 본 도구는 **Anthropic 또는 Claude와 공식적으로 제휴되어 있지 않습니다**. "Claude"와 "Anthropic"은 Anthropic PBC의 상표입니다.
- AI가 생성하는 채점 결과는 참고용이며 오류가 있을 수 있습니다. 실제 성적/평가에
  사용하기 전 반드시 교사 또는 보호자의 검토를 거쳐주세요.

## 피드백 언어

설명은 한국어·English·日本語·中文·Español·Tiếng Việt 중 고른 언어로 나오고,
학생 원문 인용과 고친 영어 문장은 영어 그대로 보여 줍니다. 글에 영어가 아닌 부분이 섞여 있으면
그 부분은 채점하지 않고 총평에서 따로 알려 줍니다.

## 기술 스택

순수 HTML / CSS / JavaScript (프레임워크·빌드 도구 없음), Anthropic Messages API.

---

© 2026 EnL_language. All rights reserved. For personal and classroom use only. Do not copy, share, or redistribute without permission.
