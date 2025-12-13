# Chrome AI Answer Notifier (Manifest V3)

ChatGPT / Gemini / Claude 웹에서 **답변 생성이 완료되면** macOS **시스템 알림(Chrome Notifications)** 이 뜨도록 하는 크롬 확장프로그램입니다.

## 로드 방법 (개발용 / Unpacked)

1. 크롬에서 `chrome://extensions` 이동
2. 우측 상단 **개발자 모드** ON
3. **압축해제된 확장 프로그램을 로드** 클릭
4. 이 폴더(`chrome-ai-notifier/`)를 선택

## 동작 방식(요약)

- 각 사이트에 `content script`가 주입됩니다.
- “생성 중(Stop 버튼/스트리밍 상태)”을 감지했다가, **생성이 끝나는 순간** `service worker`로 메시지를 보내 알림을 띄웁니다.

## 권한

- `notifications`: 시스템 알림 표시
- `storage`: 옵션(사이트별 on/off) 저장

## 지원 사이트(초기 세팅)

- ChatGPT: `chat.openai.com`, `chatgpt.com`
- Gemini: `gemini.google.com`
- Claude: `claude.ai`

> 주의: 각 사이트 UI/DOM이 자주 바뀌므로, 감지 로직(특히 “Stop 버튼” selector)은 추후 튜닝이 필요할 수 있습니다.


