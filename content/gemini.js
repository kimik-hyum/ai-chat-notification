(() => {
  // service worker에서 스크립트를 재주입할 수 있어, 중복 초기화를 막는다.
  // eslint-disable-next-line no-undef
  if (self.__AI_ANSWER_NOTIFIER_GEMINI_INIT__ === true) return;
  // eslint-disable-next-line no-undef
  self.__AI_ANSWER_NOTIFIER_GEMINI_INIT__ = true;

  /** @type {{ createCompletionWatcher?: (cfg: unknown) => void }} */
  // eslint-disable-next-line no-undef
  const api = self.AIAnswerNotifier || {};
  if (typeof api.createCompletionWatcher !== "function") return;

  const STOP_BUTTON_SELECTORS = [
    // 최신 Gemini UI(사용자 제공 DOM): send 버튼이 stop 상태로 바뀜
    "button.send-button.stop",
    'button.send-button.stop[aria-label*="생성"]',
    'button.send-button.stop[aria-label*="중지"]',
    'button[aria-label*="대답 생성 중지"]',
    'button[aria-label*="생성 중지"]',
    'button[aria-label*="Stop"]',
    'button[aria-label*="중지"]',
    'button[aria-label*="중단"]',
    'button[title*="Stop"]',
    'button[title*="중지"]'
  ];

  /**
   * @param {Element | null} el
   * @returns {el is Element}
   */
  function isVisible(el) {
    if (!el) return false;
    // display:none/visibility:hidden 등은 offsetParent가 null이 될 수 있음(단, position:fixed 예외가 있어 rect도 체크)
    if (/** @type {HTMLElement} */ (el).offsetParent !== null) return true;
    return el.getClientRects().length > 0;
  }

  /**
   * @returns {{ isStop: boolean; reason?: string }}
   */
  function detectStopSignal() {
    for (const sel of STOP_BUTTON_SELECTORS) {
      const el = document.querySelector(sel);
      if (isVisible(el)) return { isStop: true, reason: `selector:${sel}` };
    }

    // mat-icon 기반 추가 fallback: stop 아이콘이 보이는 경우(버튼 텍스트가 없을 때)
    const icon = document.querySelector('mat-icon[data-mat-icon-name="stop"], mat-icon[fonticon="stop"]');
    if (isVisible(icon) && icon.closest("button")) return { isStop: true, reason: "mat-icon:stop" };

    return { isStop: false };
  }

  function hasStopButton() {
    const stop = detectStopSignal();
    if (stop.isStop) return true;

    const buttons = Array.from(document.querySelectorAll("button"));
    return buttons.some((b) => {
      const t = (b.innerText || "").trim();
      if (!t) return false;
      return t.includes("Stop") || t.includes("중지") || t.includes("중단");
    });
  }

  /** @type {"idle" | "generating" | null} */
  function isGenerating() {
    const stop = detectStopSignal();
    return stop.isStop;
  }

  /**
   * @param {() => void} notify
   * @returns {() => void}
   */
  function observeGenerating(notify) {
    const mo = new MutationObserver(() => notify());
    const root = document.documentElement;
    mo.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "aria-label", "title", "data-testid", "aria-disabled", "hidden"]
    });
    notify();
    return () => mo.disconnect();
  }

  api.createCompletionWatcher({
    site: "gemini",
    siteName: "Gemini",
    isGenerating,
    observe: observeGenerating
  });
})();


