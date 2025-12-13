# AI Answer Notifier (Chrome Extension)

ChatGPT / Gemini / Claude 웹에서 **답변 생성이 완료되면** 시스템 알림(Chrome Notifications)을 띄워주는 크롬 확장프로그램입니다.

## 지원 환경

- Chrome (Manifest V3)
- macOS / Windows (OS 알림 설정에 따라 표시 방식은 달라질 수 있습니다)

## 지원 사이트

- ChatGPT: `chat.openai.com`, `chatgpt.com`
- Gemini: `gemini.google.com`
- Claude: `claude.ai`

## 설치 방법

### 1) (스토어 설치)

- Chrome Web Store에서 설치 (출시 후 링크 추가 예정)

### 2) (개발용 / Unpacked 설치)

1. 크롬에서 `chrome://extensions` 이동
2. 우측 상단 **개발자 모드** ON
3. **압축해제된 확장 프로그램을 로드** 클릭
4. 프로젝트 루트 폴더(`chrome-ai-notifier/`) 선택

> 코드를 수정했다면: `chrome://extensions`에서 확장프로그램 카드의 **리로드(⟳)** 를 누른 뒤, 대상 웹페이지도 새로고침하세요.

## 사용 방법

1. 지원 사이트(예: Gemini / ChatGPT / Claude)에서 대화를 시작합니다.
2. 질문을 전송합니다.
3. 답변 생성이 완료되면 **“OOO 답변 완료”** 알림이 표시됩니다.

## 옵션(설정)

확장프로그램 옵션 페이지에서 아래를 켜고 끌 수 있습니다.

- 전체 활성화 on/off
- 사이트별 on/off (ChatGPT / Gemini / Claude)

## 알림이 안 뜰 때(문제 해결)

### 1) OS/Chrome 알림 설정 확인 (가장 흔함)

- macOS: **시스템 설정 → 알림 → Google Chrome**에서 알림 허용/표시 스타일(배너/알림/없음) 확인
- Windows: **설정 → 시스템 → 알림**에서 Chrome 알림이 차단되지 않았는지 확인

### 2) 집중 모드/방해금지/화면 공유 영향

- macOS에서 **집중 모드(방해금지)**, 회의 앱, **Sidecar(아이패드 연결)**, 화면 공유 상태에서는 배너가 억제되거나 알림센터에만 쌓일 수 있습니다.

### 3) 연속 질문 시 알림이 안 뜨는 경우(쿨다운)

- 같은 탭/URL에서 너무 자주 알림이 뜨지 않도록 기본 **쿨다운이 적용**됩니다(기본 5초).

## 개인정보/데이터

- 이 확장프로그램은 **AI 답변 내용을 수집/저장/외부로 전송하지 않습니다.**
- “답변 생성 완료 여부(Stop 버튼 상태 변화)”만 감지해 알림을 표시합니다.

## 권한

- `notifications`: 시스템 알림 표시
- `storage`: 옵션(사이트별 on/off) 저장


