(() => {
  /** @type {{ createCompletionWatcher?: (cfg: unknown) => void }} */
  // eslint-disable-next-line no-undef
  const api = self.AIAnswerNotifier || {};
  if (typeof api.createCompletionWatcher !== "function") return;

  const STOP_BUTTON_SELECTORS = [
    'button[data-testid="stop-button"]',
    'button[aria-label="Stop generating"]',
    'button[aria-label*="Stop"]',
    'button[aria-label*="중지"]'
  ];

  function hasStopButton() {
    for (const sel of STOP_BUTTON_SELECTORS) {
      if (document.querySelector(sel)) return true;
    }

    // 텍스트 기반 fallback (UI 변경 대비)
    const buttons = Array.from(document.querySelectorAll("button"));
    return buttons.some((b) => {
      const t = (b.innerText || "").trim();
      if (!t) return false;
      return t === "Stop" || t.includes("Stop") || t.includes("중지") || t.includes("중단");
    });
  }

  /**
   * Stop 버튼의 등장/사라짐을 MutationObserver로 감지하고,
   * DOM 변화를 놓칠 경우를 대비해 common.js 쪽에 백업 폴링이 함께 존재합니다.
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
    // 초기 상태 반영
    notify();
    return () => mo.disconnect();
  }

  api.createCompletionWatcher({
    site: "chatgpt",
    siteName: "ChatGPT",
    isGenerating: hasStopButton,
    observe: observeGenerating
  });
})();


