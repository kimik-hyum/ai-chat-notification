/**
 * @typedef {Object} WatcherConfig
 * @property {"chatgpt"|"gemini"|"claude"} site
 * @property {string} siteName
 * @property {() => boolean} isGenerating
 * @property {(() => string | null)=} getLatestAnswerText
 * @property {((notify: () => void) => (() => void))=} observe
 */

/**
 * @param {unknown} v
 * @returns {v is Record<string, unknown>}
 */
function isObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  sites: {
    chatgpt: true,
    gemini: true,
    claude: true
  }
});

/** @returns {Promise<typeof DEFAULT_SETTINGS>} */
async function getSettings() {
  const res = await chrome.storage.sync.get(["enabled", "sites"]);
  const next = {
    enabled: DEFAULT_SETTINGS.enabled,
    sites: { ...DEFAULT_SETTINGS.sites }
  };

  if (typeof res.enabled === "boolean") next.enabled = res.enabled;
  if (isObject(res.sites)) {
    if (typeof res.sites.chatgpt === "boolean") next.sites.chatgpt = res.sites.chatgpt;
    if (typeof res.sites.gemini === "boolean") next.sites.gemini = res.sites.gemini;
    if (typeof res.sites.claude === "boolean") next.sites.claude = res.sites.claude;
  }

  return next;
}

/**
 * @param {WatcherConfig} cfg
 */
function createCompletionWatcher(cfg) {
  /** @type {{ enabled: boolean; sites: { chatgpt: boolean; gemini: boolean; claude: boolean } }} */
  let settings = { enabled: true, sites: { chatgpt: true, gemini: true, claude: true } };
  let generatingPrev = false;
  let inCycle = false;
  let startedAt = 0;
  let endedAt = 0;
  let pendingCompletion = false;
  let notifiedForCycle = false;

  let scheduled = false;
  /** @type {number | null} */
  let scheduledTimerId = null;
  /** @type {(() => void) | null} */
  let cleanupObserver = null;

  const scheduleTick = () => {
    if (scheduled) return;
    scheduled = true;
    scheduledTimerId = window.setTimeout(() => {
      scheduled = false;
      scheduledTimerId = null;
      void tick();
    }, 80);
  };

  const tick = async () => {
    if (!settings.enabled) return;
    if (cfg.site === "chatgpt" && !settings.sites.chatgpt) return;
    if (cfg.site === "gemini" && !settings.sites.gemini) return;
    if (cfg.site === "claude" && !settings.sites.claude) return;

    const generating = cfg.isGenerating();

    // "생성 시작"은 generating이 false -> true로 바뀌는 순간(상승 에지)으로 잡는다.
    // 이렇게 하면 이전 사이클이 끝났어도 다음 질문에서 항상 새 사이클로 리셋된다.
    if (!generatingPrev && generating) {
      inCycle = true;
      startedAt = Date.now();
      endedAt = 0;
      pendingCompletion = false;
      notifiedForCycle = false;
    }

    // 생성 상태가 true -> false로 바뀌는 순간을 "생성 종료"로 기록하고,
    // 텍스트 안정화 조건이 만족될 때까지 이후 tick에서도 완료 판정을 재시도한다.
    if (inCycle && generatingPrev && !generating) {
      endedAt = Date.now();
      pendingCompletion = true;
    }

    if (inCycle && pendingCompletion && !generating && !notifiedForCycle) {
      const now = Date.now();
      const ranLongEnough = now - startedAt >= 1500;
      // 텍스트 추출 없이도 과도한 오탐을 막기 위해 "생성 종료 후 일정 시간"을 기다린다.
      const endedSettled = endedAt > 0 ? now - endedAt >= 900 : false;

      if (ranLongEnough && endedSettled) {
        notifiedForCycle = true;
        pendingCompletion = false;
        inCycle = false;

        /** @type {import("../types").NotifyMessage} */
        const msg = {
          type: "AI_ANSWER_COMPLETE",
          site: cfg.site,
          siteName: cfg.siteName,
          url: location.href,
          pageTitle: document.title
        };

        try {
          await chrome.runtime.sendMessage(msg);
        } catch {
          // service worker가 깨어나지 못했거나 메시지 실패해도 페이지 동작은 유지
        }
      }
    }

    generatingPrev = generating;
  };

  // 초기 설정 로드 + 변경 감지
  void (async () => {
    settings = await getSettings();
    // 1) MutationObserver 기반 감지(우선)
    if (typeof cfg.observe === "function") {
      try {
        cleanupObserver = cfg.observe(scheduleTick);
      } catch {
        cleanupObserver = null;
      }
    }

    // 2) 백업 폴링(Observer가 놓치거나 DOM이 특이한 경우 대비)
    // 기존 700ms보다 느리게 돌려 비용을 줄인다.
    setInterval(() => scheduleTick(), 2000);

    // 첫 번째 tick 즉시 실행
    scheduleTick();
  })();

  window.addEventListener(
    "pagehide",
    () => {
      try {
        if (cleanupObserver) cleanupObserver();
      } catch {
        // ignore
      }
      cleanupObserver = null;
      if (scheduledTimerId !== null) {
        clearTimeout(scheduledTimerId);
        scheduledTimerId = null;
        scheduled = false;
      }
    },
    { once: true }
  );

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") return;
    const next = { ...settings, sites: { ...settings.sites } };
    if (changes.enabled && typeof changes.enabled.newValue === "boolean") next.enabled = changes.enabled.newValue;
    if (changes.sites && isObject(changes.sites.newValue)) {
      const s = changes.sites.newValue;
      if (typeof s.chatgpt === "boolean") next.sites.chatgpt = s.chatgpt;
      if (typeof s.gemini === "boolean") next.sites.gemini = s.gemini;
      if (typeof s.claude === "boolean") next.sites.claude = s.claude;
    }
    settings = next;
  });
}

// 다른 content script에서 사용할 수 있게 전역으로 노출
// eslint-disable-next-line no-undef
self.AIAnswerNotifier = { createCompletionWatcher };


