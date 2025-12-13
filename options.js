const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  sites: {
    chatgpt: true,
    gemini: true,
    claude: true
  }
});

/** @param {unknown} v */
function isObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function $(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element not found: ${id}`);
  return el;
}

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

function setStatus(text) {
  /** @type {HTMLElement} */ (/** @type {unknown} */ ($("status"))).textContent = text;
}

async function init() {
  /** @type {HTMLInputElement} */ (/** @type {unknown} */ ($("enabled"))).checked = DEFAULT_SETTINGS.enabled;
  /** @type {HTMLInputElement} */ (/** @type {unknown} */ ($("site-chatgpt"))).checked = DEFAULT_SETTINGS.sites.chatgpt;
  /** @type {HTMLInputElement} */ (/** @type {unknown} */ ($("site-gemini"))).checked = DEFAULT_SETTINGS.sites.gemini;
  /** @type {HTMLInputElement} */ (/** @type {unknown} */ ($("site-claude"))).checked = DEFAULT_SETTINGS.sites.claude;

  const settings = await getSettings();
  /** @type {HTMLInputElement} */ (/** @type {unknown} */ ($("enabled"))).checked = settings.enabled;
  /** @type {HTMLInputElement} */ (/** @type {unknown} */ ($("site-chatgpt"))).checked = settings.sites.chatgpt;
  /** @type {HTMLInputElement} */ (/** @type {unknown} */ ($("site-gemini"))).checked = settings.sites.gemini;
  /** @type {HTMLInputElement} */ (/** @type {unknown} */ ($("site-claude"))).checked = settings.sites.claude;

  const save = async () => {
    const enabled = /** @type {HTMLInputElement} */ (/** @type {unknown} */ ($("enabled"))).checked;
    const sites = {
      chatgpt: /** @type {HTMLInputElement} */ (/** @type {unknown} */ ($("site-chatgpt"))).checked,
      gemini: /** @type {HTMLInputElement} */ (/** @type {unknown} */ ($("site-gemini"))).checked,
      claude: /** @type {HTMLInputElement} */ (/** @type {unknown} */ ($("site-claude"))).checked
    };
    await chrome.storage.sync.set({ enabled, sites });
    setStatus("저장됨");
    window.setTimeout(() => setStatus(""), 1200);
  };

  for (const id of ["enabled", "site-chatgpt", "site-gemini", "site-claude"]) {
    /** @type {HTMLInputElement} */ (/** @type {unknown} */ ($(id))).addEventListener("change", () => {
      void save();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  void init();
});


