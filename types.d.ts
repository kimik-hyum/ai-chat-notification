export type SiteId = "chatgpt" | "gemini" | "claude" | "unknown";

export type NotifyMessage = {
  type: "AI_ANSWER_COMPLETE";
  site: SiteId;
  siteName?: string;
  url?: string;
  pageTitle?: string;
};


