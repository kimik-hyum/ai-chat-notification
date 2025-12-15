const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  sites: {
    chatgpt: true,
    gemini: true,
    claude: true
  },
  cooldownSeconds: 5
});

// Chrome notifications의 `basic` 타입은 iconUrl이 사실상 필수입니다.
// 알림 아이콘으로 앱 아이콘(PNG)을 사용합니다.

const CONTENT_SCRIPT_SETS = [
  {
    matches: ["https://chat.openai.com/*", "https://chatgpt.com/*"],
    files: ["content/common.js", "content/chatgpt.js"]
  },
  {
    matches: ["https://gemini.google.com/*"],
    files: ["content/common.js", "content/gemini.js"]
  },
  {
    matches: ["https://claude.ai/*"],
    files: ["content/common.js", "content/claude.js"]
  }
];

/**
 * 설치/업데이트 후 이미 열려 있던 탭에는 content_scripts가 자동으로 주입되지 않을 수 있어,
 * 대상 사이트 탭에 스크립트를 수동 주입해 “새로고침 없이” 정상 동작하게 만든다.
 */
async function injectIntoExistingAiTabs() {
  for (const set of CONTENT_SCRIPT_SETS) {
    let tabs = [];
    try {
      tabs = await chrome.tabs.query({ url: set.matches });
    } catch {
      continue;
    }
    for (const tab of tabs) {
      if (!tab || typeof tab.id !== "number") continue;
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: set.files
        });
      } catch {
        // 탭 상태(로딩 중), 권한, CSP 등으로 실패할 수 있으나 백업으로 content_scripts가 동작할 수 있음
      }
    }
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void injectIntoExistingAiTabs();
});

chrome.runtime.onStartup.addListener(() => {
  void injectIntoExistingAiTabs();
});

/** @param {unknown} v */
function isObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * @param {unknown} stored
 * @returns {typeof DEFAULT_SETTINGS}
 */
function normalizeSettings(stored) {
  const next = {
    enabled: DEFAULT_SETTINGS.enabled,
    sites: { ...DEFAULT_SETTINGS.sites },
    cooldownSeconds: DEFAULT_SETTINGS.cooldownSeconds
  };

  if (!isObject(stored)) return next;

  if (typeof stored.enabled === "boolean") next.enabled = stored.enabled;
  if (typeof stored.cooldownSeconds === "number" && Number.isFinite(stored.cooldownSeconds)) {
    next.cooldownSeconds = Math.max(0, Math.min(3600, Math.floor(stored.cooldownSeconds)));
  }

  if (isObject(stored.sites)) {
    if (typeof stored.sites.chatgpt === "boolean") next.sites.chatgpt = stored.sites.chatgpt;
    if (typeof stored.sites.gemini === "boolean") next.sites.gemini = stored.sites.gemini;
    if (typeof stored.sites.claude === "boolean") next.sites.claude = stored.sites.claude;
  }

  return next;
}

async function getSettings() {
  const res = await chrome.storage.sync.get(["enabled", "sites", "cooldownSeconds"]);
  return normalizeSettings(res);
}

/** @type {Map<string, number>} */
const lastNotifiedAtByKey = new Map();

/**
 * @param {import("./types").NotifyMessage} msg
 * @param {chrome.runtime.MessageSender} sender
 */
function buildKey(msg, sender) {
  if (sender.tab && typeof sender.tab.id === "number") return `tab:${sender.tab.id}`;
  if (typeof msg.url === "string" && msg.url.length > 0) return `url:${msg.url}`;
  return `site:${msg.site}`;
}

/**
 * @param {import("./types").NotifyMessage} msg
 */
function getNotificationTitle(msg) {
  const site = msg.siteName || msg.site;
  return `${site} 답변 완료`;
}

/**
 * @param {import("./types").NotifyMessage} msg
 */
function getNotificationMessage(msg) {
  void msg;
  return "답변이 완료되었습니다.";
}

chrome.runtime.onMessage.addListener((message, sender) => {
  const msg = /** @type {unknown} */ (message);
  if (!isObject(msg)) return;
  if (msg.type !== "AI_ANSWER_COMPLETE") return;

  /** @type {import("./types").NotifyMessage} */
  const safeMsg = {
    type: "AI_ANSWER_COMPLETE",
    site: typeof msg.site === "string" ? msg.site : "unknown",
    siteName: typeof msg.siteName === "string" ? msg.siteName : undefined,
    url: typeof msg.url === "string" ? msg.url : undefined,
    pageTitle: typeof msg.pageTitle === "string" ? msg.pageTitle : undefined
  };

  void (async () => {
    const settings = await getSettings();
    if (!settings.enabled) return;

    if (safeMsg.site === "chatgpt" && !settings.sites.chatgpt) return;
    if (safeMsg.site === "gemini" && !settings.sites.gemini) return;
    if (safeMsg.site === "claude" && !settings.sites.claude) return;

    const key = buildKey(safeMsg, sender);
    const now = Date.now();
    const last = lastNotifiedAtByKey.get(key) ?? 0;
    const cooldownMs = settings.cooldownSeconds * 1000;
    if (cooldownMs > 0 && now - last < cooldownMs) return;
    lastNotifiedAtByKey.set(key, now);

    const notificationId = `ai-answer-complete:${now}:${Math.random().toString(16).slice(2)}`;
    const title = getNotificationTitle(safeMsg);
    const messageText = getNotificationMessage(safeMsg);

    const notifIconUrl = chrome.runtime.getURL("icons/icon_128.png");
    const iconCandidates = [notifIconUrl];

    let lastErr = null;
    for (const iconUrl of iconCandidates) {
      try {
        await chrome.notifications.create(notificationId, {
          type: "basic",
          iconUrl,
          title,
          message: messageText,
          priority: 1
        });
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    void lastErr;
  })();
});


