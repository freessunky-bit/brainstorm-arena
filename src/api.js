/**
 * Brainstorm Arena — API Layer
 * ============================
 * callAI, 레이트 리미터, 서킷 브레이커, 토스트, 문서 파싱 유틸.
 */
import { useState, useEffect, useRef } from "react";
import { LOG } from "./logger.js";
import { PROVIDERS, ANTHROPIC_MESSAGES_URL, getProviderName } from "./constants.js";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as XLSX from "xlsx";
import JSZip from "jszip";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

// ─── Global Toast System ───
const _toastListeners = new Set();
let _toastSeq = 0;
export function showAppToast(msg, level = "warn", durationMs = 4000) {
  const entry = { id: `${Date.now()}_${++_toastSeq}`, msg, level, durationMs };
  _toastListeners.forEach((fn) => fn(entry));
}
export function useAppToasts() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Set());

  useEffect(() => {
    const handler = (entry) => {
      setToasts((prev) => [...prev, entry]);
      const tid = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== entry.id));
        timersRef.current.delete(tid);
      }, entry.durationMs);
      timersRef.current.add(tid);
    };
    _toastListeners.add(handler);
    return () => {
      _toastListeners.delete(handler);
      timersRef.current.forEach((tid) => clearTimeout(tid));
      timersRef.current.clear();
    };
  }, []);

  return toasts;
}

// ─── Rate Limiter + Circuit Breaker ───
const _rateLimiter = {
  shortWindow: [], longWindow: [],
  locked: false, lockUntil: 0,
  SHORT_LIMIT: 30, SHORT_WINDOW: 60_000,
  LONG_LIMIT: 300, LONG_WINDOW: 3_600_000,
  LOCK_DURATION: 30_000,
  check() {
    const now = Date.now();
    if (this.locked && now < this.lockUntil) {
      const sec = Math.ceil((this.lockUntil - now) / 1000);
      return { allowed: false, reason: `서킷 브레이커 발동 — ${sec}초 후 재시도 가능` };
    }
    if (this.locked && now >= this.lockUntil) this.locked = false;
    this.shortWindow = this.shortWindow.filter((t) => now - t < this.SHORT_WINDOW);
    this.longWindow = this.longWindow.filter((t) => now - t < this.LONG_WINDOW);
    if (this.shortWindow.length >= this.SHORT_LIMIT) {
      this.locked = true;
      this.lockUntil = now + this.LOCK_DURATION;
      LOG.warn(`Circuit breaker: ${this.SHORT_LIMIT} calls in 60s — locked for 30s`);
      return { allowed: false, reason: "비정상적인 단기 폭주 감지 — 30초간 요청이 차단됩니다" };
    }
    if (this.longWindow.length >= this.LONG_LIMIT) {
      return { allowed: false, reason: "시간당 API 호출 상한(300회)에 도달했습니다. 잠시 후 다시 시도해 주세요" };
    }
    return { allowed: true };
  },
  record() {
    const now = Date.now();
    this.shortWindow.push(now);
    this.longWindow.push(now);
  },
};

// ─── API Call (with retry, backoff, timeout, rate limit) ───
const CALL_AI_TIMEOUT = 120_000;
const CALL_AI_MAX_RETRIES = 2;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeMessageContent(content) {
  if (typeof content === "string") return content;
  try { return JSON.stringify(content); } catch { return String(content ?? ""); }
}

export function safeParseJsonText(raw, { allowObject = true, allowArray = true } = {}) {
  const text = String(raw ?? "").replace(/```json\s*|```/gi, "").trim();
  if (!text) return null;
  const tryParse = (candidate) => {
    try { return JSON.parse(candidate); } catch { return null; }
  };

  let parsed = tryParse(text);
  if (parsed !== null) return parsed;

  const shapes = [];
  if (allowObject) shapes.push(["{", "}"]);
  if (allowArray) shapes.push(["[", "]"]);
  for (const [startToken, endToken] of shapes) {
    const start = text.indexOf(startToken);
    const end = text.lastIndexOf(endToken);
    if (start >= 0 && end > start) {
      parsed = tryParse(text.slice(start, end + 1));
      if (parsed !== null) return parsed;
    }
  }
  return null;
}

async function _rawFetch(url, options = {}, timeoutMs = CALL_AI_TIMEOUT) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(tid);
  }
}

async function readResponsePayload(res) {
  const text = await res.text();
  if (!text) return { data: null, text: "" };
  try {
    return { data: JSON.parse(text), text };
  } catch {
    return { data: null, text };
  }
}

function extractErrorMessageFromPayload(data, fallbackText = "") {
  if (!data) return fallbackText;
  if (typeof data === "string") return data;
  if (typeof data.error === "string") return data.error;
  if (typeof data.error?.message === "string") return data.error.message;
  if (typeof data.message === "string") return data.message;
  if (Array.isArray(data.errors) && data.errors.length) {
    const first = data.errors[0];
    if (typeof first === "string") return first;
    if (typeof first?.message === "string") return first.message;
  }
  return fallbackText;
}

function toHttpErrorMessage(provider, status, statusText, data, rawText) {
  const apiMessage = extractErrorMessageFromPayload(data, rawText).trim();
  if (status === 400) return apiMessage || "잘못된 요청입니다. 입력 형식과 모델 설정을 확인해 주세요.";
  if (status === 401 || status === 403) return apiMessage || `${getProviderName(provider)} 인증에 실패했습니다. API 키와 권한을 확인해 주세요.`;
  if (status === 404) return apiMessage || "요청한 모델 또는 엔드포인트를 찾을 수 없습니다.";
  if (status === 408) return apiMessage || "요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.";
  if (status === 429) return apiMessage || "요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.";
  if (status >= 500) return apiMessage || `${getProviderName(provider)} 서버 오류입니다. 잠시 후 다시 시도해 주세요.`;
  return apiMessage || `HTTP ${status}${statusText ? ` ${statusText}` : ""}`;
}

function extractClaudeText(data) {
  const textBlocks = (data?.content || []).filter((chunk) => chunk?.type === "text" && chunk.text);
  return textBlocks.map((chunk) => chunk.text).join("\n").trim();
}

function extractOpenAIText(data) {
  const message = data?.choices?.[0]?.message?.content;
  if (typeof message === "string") return message.trim();
  if (Array.isArray(message)) {
    return message
      .map((part) => (typeof part === "string" ? part : part?.text || ""))
      .join("\n")
      .trim();
  }
  return "";
}

function extractGeminiText(data) {
  return data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("\n").trim() || "";
}

function normalizeFetchError(err) {
  if (!err) return new Error("알 수 없는 오류가 발생했습니다.");
  if (err.name === "AbortError") {
    const timeoutErr = new Error(`API 요청 시간이 초과되었습니다 (${CALL_AI_TIMEOUT / 1000}초)`);
    timeoutErr.retryable = true;
    return timeoutErr;
  }
  if (err instanceof TypeError && /fetch|network|load failed|failed to fetch/i.test(err.message || "")) {
    const networkErr = new Error("네트워크 연결에 실패했습니다. 연결 상태 또는 브라우저 네트워크 정책을 확인해 주세요.");
    networkErr.retryable = true;
    return networkErr;
  }
  return err;
}

async function requestJson(provider, url, options, timeoutMs = CALL_AI_TIMEOUT) {
  const res = await _rawFetch(url, options, timeoutMs);
  LOG.api(`${getProviderName(provider)} res status=${res.status}`);
  const { data, text } = await readResponsePayload(res);
  if (!res.ok) {
    const err = new Error(toHttpErrorMessage(provider, res.status, res.statusText, data, text));
    err.status = res.status;
    err.retryable = RETRYABLE_STATUS.has(res.status);
    throw err;
  }
  const payloadError = extractErrorMessageFromPayload(data);
  if (payloadError) {
    const err = new Error(payloadError);
    err.status = res.status;
    throw err;
  }
  if (!data) throw new Error("API 응답을 해석하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  return data;
}

function getMissingKeyMessage(provider) {
  if (provider === "claude") return "Claude API 키가 없습니다. 설정에서 글로벌 Claude 키 또는 해당 항목의 개별 키를 입력하세요.";
  if (provider === "openai") return "OpenAI API 키가 필요합니다.";
  if (provider === "gemini") return "Gemini API 키가 필요합니다.";
  return "API 키가 필요합니다.";
}

export async function callAI(persona, messages, systemPrompt) {
  const provider = persona?.provider;
  if (!provider || !PROVIDERS[provider]) throw new Error("지원하지 않는 AI 프로바이더입니다.");

  const apiKey = typeof persona?.apiKey === "string" ? persona.apiKey.trim() : "";
  const hasKey = !!apiKey;
  const model = persona?.model || PROVIDERS[provider].models[0];
  const sys = typeof systemPrompt === "string" ? systemPrompt : (persona?.role || "");
  const normalizedMessages = Array.isArray(messages)
    ? messages.map((message) => ({ role: message?.role || "user", content: normalizeMessageContent(message?.content) }))
    : [];

  if (!normalizedMessages.length) throw new Error("AI에 전달할 메시지가 없습니다.");
  if (!hasKey) throw new Error(`[${getProviderName(provider)}] ${getMissingKeyMessage(provider)}`);

  const rl = _rateLimiter.check();
  if (!rl.allowed) {
    showAppToast(rl.reason, "error", 5000);
    throw new Error(rl.reason);
  }

  LOG.api(`call provider=${provider} model=${model} hasKey=${hasKey} msgLen=${normalizedMessages.length}`);

  let lastError = null;
  for (let attempt = 0; attempt <= CALL_AI_MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      LOG.warn(`Retry #${attempt} after ${delay}ms`);
      await sleep(delay);
      const rlRetry = _rateLimiter.check();
      if (!rlRetry.allowed) {
        showAppToast(rlRetry.reason, "error", 5000);
        throw new Error(rlRetry.reason);
      }
    }

    _rateLimiter.record();

    try {
      if (provider === "claude") {
        const data = await requestJson(provider, ANTHROPIC_MESSAGES_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: model || PROVIDERS.claude.models[0],
            max_tokens: 4000,
            system: sys,
            messages: normalizedMessages.map((message) => ({ role: message.role, content: message.content })),
          }),
        });
        const joined = extractClaudeText(data);
        if (!joined && data?.stop_reason === "max_tokens") throw new Error("응답이 너무 길어 잘렸습니다. 아이디어를 짧게 줄이거나 다시 시도해 주세요.");
        if (!joined) throw new Error("AI 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.");
        LOG.info("Claude OK");
        return joined;
      }

      if (provider === "openai") {
        const m = model || PROVIDERS.openai.models[0];
        const isOSeries = /^o[1-9]/.test(m);
        const isNewModel = isOSeries || /^gpt-(4\.1|5\.)/.test(m);
        const sysRole = isOSeries ? "developer" : "system";
        const tokenParam = isNewModel ? "max_completion_tokens" : "max_tokens";
        const tokenLimit = isNewModel ? 16000 : 4000;
        const data = await requestJson(provider, "https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: m,
            messages: [{ role: sysRole, content: sys }, ...normalizedMessages],
            [tokenParam]: tokenLimit,
          }),
        });
        const joined = extractOpenAIText(data);
        if (!joined) throw new Error("AI 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.");
        LOG.info(`OpenAI OK model=${data.model} usage=${JSON.stringify(data.usage || {})}`);
        return joined;
      }

      if (provider === "gemini") {
        const m = model || PROVIDERS.gemini.models[0];
        const data = await requestJson(provider, `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: sys }] },
            contents: normalizedMessages.map((message) => ({
              role: message.role === "assistant" ? "model" : "user",
              parts: [{ text: message.content }],
            })),
          }),
        });
        const joined = extractGeminiText(data);
        if (!joined) throw new Error("AI 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.");
        LOG.info("Gemini OK");
        return joined;
      }

      throw new Error(`Unknown provider: ${provider}`);
    } catch (err) {
      const normalized = normalizeFetchError(err);
      lastError = normalized;
      const retryable = !!normalized?.retryable || RETRYABLE_STATUS.has(normalized?.status);
      if (retryable && attempt < CALL_AI_MAX_RETRIES) continue;
      LOG.error(`callAI failed: [${getProviderName(provider)}] ${normalized.message}`);
      throw new Error(`[${getProviderName(provider)}] ${normalized.message}`);
    }
  }

  LOG.error(`callAI failed after ${CALL_AI_MAX_RETRIES + 1} attempts: ${lastError?.message}`);
  throw new Error(`[재시도 실패] ${lastError?.message || "알 수 없는 오류"}`);
}

// ─── Document Parsing ───
export async function parsePDFFile(file) {
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  const texts = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    texts.push(content.items.map((item) => item.str).join(" "));
  }
  return texts.join("\n").trim();
}
export async function parseExcelFile(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const lines = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name]; const csv = XLSX.utils.sheet_to_csv(sheet);
    if (csv.trim()) lines.push(`[${name}]\n${csv.trim()}`);
  }
  return lines.join("\n\n").trim();
}
export async function parsePPTXFile(file) {
  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);
  const texts = [];
  const slideFiles = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/i.test(f)).sort();
  for (const sf of slideFiles) {
    const xml = await zip.files[sf].async("text");
    const stripped = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (stripped) texts.push(stripped);
  }
  return texts.join("\n").trim();
}
export async function parseDocumentFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return parsePDFFile(file);
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) return parseExcelFile(file);
  if (name.endsWith(".pptx")) return parsePPTXFile(file);
  return file.text();
}
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(",")[1]); reader.onerror = reject; reader.readAsDataURL(file);
  });
}

// ─── Vision (Image) ───
export async function processImageWithVision(file, persona) {
  if (!file) throw new Error("이미지 파일이 필요합니다.");
  const provider = persona?.provider;
  const apiKey = typeof persona?.apiKey === "string" ? persona.apiKey.trim() : "";
  if (!provider || !PROVIDERS[provider]) throw new Error("지원하지 않는 AI 프로바이더");
  if (!apiKey) throw new Error(getMissingKeyMessage(provider));

  const b64 = await fileToBase64(file);
  const mimeType = file.type || "image/png";
  const prompt = "이 이미지에서 비즈니스 아이디어, 컨셉, 핵심 키워드를 추출하여 한국어로 간결하게 요약해 주세요. 아이디어 입력에 바로 사용할 수 있는 형태로.";

  if (provider === "claude") {
    const data = await requestJson(provider, ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: persona.model || PROVIDERS.claude.models[0],
        max_tokens: 2000,
        messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mimeType, data: b64 } }, { type: "text", text: prompt }] }],
      }),
    });
    const joined = extractClaudeText(data);
    if (!joined) throw new Error("이미지에서 텍스트 응답을 받지 못했습니다.");
    return joined;
  }

  if (provider === "openai") {
    const m = persona.model || PROVIDERS.openai.models[0];
    const isOSeries = /^o[1-9]/.test(m);
    const isNewModel = isOSeries || /^gpt-(4\.1|5\.)/.test(m);
    const tokenParam = isNewModel ? "max_completion_tokens" : "max_tokens";
    const data = await requestJson(provider, "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: m,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${b64}` } },
          ],
        }],
        [tokenParam]: isOSeries ? 8000 : 2000,
      }),
    });
    const joined = extractOpenAIText(data);
    if (!joined) throw new Error("이미지에서 텍스트 응답을 받지 못했습니다.");
    return joined;
  }

  if (provider === "gemini") {
    const m = persona.model || PROVIDERS.gemini.models[0];
    const data = await requestJson(provider, `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: b64 } }] }] }),
    });
    const joined = extractGeminiText(data);
    if (!joined) throw new Error("이미지에서 텍스트 응답을 받지 못했습니다.");
    return joined;
  }

  throw new Error("지원하지 않는 AI 프로바이더");
}

// ─── YouTube Video Intelligence ───
export function extractYouTubeVideoId(url) {
  const u = String(url || "").trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) { const m = u.match(p); if (m) return m[1]; }
  return null;
}

const CORS_PROXIES = [
  (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];

export async function fetchViaProxy(url) {
  const target = String(url || "").trim();
  if (!target) throw new Error("유효한 URL이 없습니다.");
  for (const mkProxy of CORS_PROXIES) {
    try {
      const res = await _rawFetch(mkProxy(target), {}, 15_000);
      if (!res.ok) continue;
      const { data, text } = await readResponsePayload(res);
      if (data && typeof data === "object") {
        if (typeof data.contents === "string") return data.contents;
        if (typeof data.data === "string") return data.data;
        return JSON.stringify(data);
      }
      if (typeof data === "string") return data;
      if (text) return text;
    } catch (err) {
      LOG.warn(`fetchViaProxy failed via proxy: ${err?.message || "unknown"}`);
    }
  }
  throw new Error("프록시를 통해 웹 페이지를 가져오지 못했습니다.");
}

export async function extractYouTubeVideoInfo(url) {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) throw new Error("유효한 YouTube/영상 URL이 아닙니다.");
  let title = "", author = "", description = "", captionText = "";
  const layers = [];
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`);
    if (res.ok) { const d = await res.json(); title = d.title || ""; author = d.author_name || ""; layers.push("metadata"); }
  } catch {}
  try {
    const html = await fetchViaProxy(`https://www.youtube.com/watch?v=${videoId}`);
    const descMeta = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
    if (descMeta) { description = descMeta[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"'); layers.push("description"); }
    if (!title) { const titleMeta = html.match(/<meta\s+name="title"\s+content="([^"]*)"/i) || html.match(/<title>([^<]*)<\/title>/i); if (titleMeta) title = titleMeta[1]; }
    const captionMatch = html.match(/"captionTracks":\s*\[(.*?)\]/);
    if (captionMatch) {
      const urlMatch = captionMatch[1].match(/"baseUrl"\s*:\s*"(.*?)"/);
      if (urlMatch) {
        const captionUrl = urlMatch[1].replace(/\\u0026/g, "&").replace(/\\"/g, '"');
        try { const capXml = await fetchViaProxy(captionUrl); captionText = capXml.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim(); if (captionText.length > 50) layers.push("captions"); } catch {}
      }
    }
    if (!captionText) {
      const timedTextMatch = html.match(/"playerCaptionsTracklistRenderer".*?"baseUrl"\s*:\s*"(.*?)"/);
      if (timedTextMatch) {
        const ttUrl = timedTextMatch[1].replace(/\\u0026/g, "&").replace(/\\"/g, '"');
        try { const capXml = await fetchViaProxy(ttUrl); captionText = capXml.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim(); if (captionText.length > 50) layers.push("captions_alt"); } catch {}
      }
    }
  } catch {}
  return { videoId, title, author, description, captionText: captionText.slice(0, 15000), layers };
}

// ─── Report Section Generator ───
import { REPORT_ADDON_PROMPTS } from "./prompts.js";

export async function generateReportSection(persona, sectionType, idea, context, existingReport) {
  const fn = REPORT_ADDON_PROMPTS[sectionType];
  if (!fn) throw new Error(`Unknown section type: ${sectionType}`);
  const content = sectionType === "vc" ? fn(idea, context, existingReport) : fn(idea, context);
  return callAI(persona, [{ role: "user", content }]);
}

// ─── Tournament Slot Fill ───
import { TOURNAMENT_FILL_SYSTEM } from "./prompts.js";
import { withResolvedApiKey } from "./constants.js";

export function parseIdeasLinesFromText(raw, limit) {
  const out = [];
  for (let line of raw.split("\n")) {
    line = line.trim();
    if (!line) continue;
    line = line.replace(/^[-*•‧·]\s*/, "").replace(/^\d+[\.\)、]\s*/, "").replace(/^[①-⑳]\s*/, "");
    line = line.replace(/^\[[ xX]\]\s*/, "").replace(/^["'`\u200B]|["'`\u200B]$/g, "").trim();
    if (/^#{1,6}\s/.test(line) || /^```/.test(line)) continue;
    if (/^(JSON|예시|출력|ideas)/i.test(line) && line.length < 40) continue;
    if (line.length > 2 && line.length < 240) out.push(line);
    if (out.length >= limit + 8) break;
  }
  return [...new Set(out)].slice(0, limit);
}

export function safeParseIdeasJson(text) {
  const t = text.replace(/```json\s*|```/gi, "").trim();
  const tryParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
  let j = tryParse(t);
  if (!j) { const i = t.indexOf("{"); const k = t.lastIndexOf("}"); if (i >= 0 && k > i) j = tryParse(t.slice(i, k + 1)); }
  if (!j) return [];
  const arr = Array.isArray(j.ideas) ? j.ideas : Array.isArray(j.items) ? j.items : Array.isArray(j) ? j : [];
  return arr.map((x) => String(x).trim()).filter((x) => x.length > 2);
}

export async function generateTournamentSlotIdeas(persona, globalKey, ctx, seedIdeas, needCount) {
  if (needCount <= 0) return [];
  const p = withResolvedApiKey(persona, globalKey);
  const seeds = seedIdeas.map((x, i) => `${i + 1}. ${x}`).join("\n");
  const collected = [];
  const seen = new Set(seedIdeas.map((s) => s.trim().toLowerCase()));
  const addUnique = (s) => { const t = String(s).trim(); if (t.length < 3 || t.length > 280) return; const k = t.toLowerCase(); if (seen.has(k)) return; seen.add(k); collected.push(t); };
  const API_BUDGET = 10; let apiCalls = 0;
  const chunk = 8;
  for (let guard = 0; collected.length < needCount && guard < 12 && apiCalls < API_BUDGET; guard++) {
    const n = Math.min(chunk, needCount - collected.length); if (n <= 0) break;
    let batch = [];
    try {
      apiCalls++;
      const u = `컨텍스트: ${ctx || "일반"}\n\n사용자 시드 아이디어:\n${seeds}\n\n위 시드와 **문장이 겹치지 않는** 새 아이디어만 ${n}개. 각각 한국어 한 줄(서비스/제품/기획 컨셉).\n응답은 **JSON 한 덩어리만**: {"ideas":["...","..."]}\n배열 길이는 정확히 ${n}. 코드펜스·설명 금지.\n\n이미 채워진 후보(중복 금지): ${collected.length ? collected.slice(-6).join(" | ") : "(없음)"}`;
      const r = await callAI(p, [{ role: "user", content: u }], TOURNAMENT_FILL_SYSTEM);
      batch = safeParseIdeasJson(r);
    } catch { batch = []; }
    if (batch.length < Math.max(1, Math.floor(n * 0.5)) && apiCalls < API_BUDGET) {
      try {
        apiCalls++;
        const u2 = `컨텍스트: ${ctx || "일반"}\n시드:\n${seeds}\n\n한국어로 **서로 다른** 짧은 아이디어 ${n}개만. 반드시 번호 목록:\n1. ...\n2. ...\n(설명 없이 목록만)`;
        const r2 = await callAI(p, [{ role: "user", content: u2 }], TOURNAMENT_FILL_SYSTEM);
        batch = parseIdeasLinesFromText(r2, n + 4);
      } catch { batch = []; }
    }
    const before = collected.length;
    for (const x of batch) addUnique(x);
    if (collected.length === before) break;
  }
  let pad = 0;
  while (collected.length < needCount && pad < needCount + 5 && apiCalls < API_BUDGET) {
    pad++;
    try {
      apiCalls++;
      const still = needCount - collected.length;
      const u3 = `컨텍스트: ${ctx || "일반"}\n한국어로 **짧은** 스타트업/앱/서비스 아이디어 ${still}개. 줄마다 한 개씩만. 시드와 겹치지 말 것.\n시드 요약: ${seedIdeas[0]?.slice(0, 60) || "없음"}`;
      const r3 = await callAI(p, [{ role: "user", content: u3 }], TOURNAMENT_FILL_SYSTEM);
      parseIdeasLinesFromText(r3, still + 6).forEach(addUnique);
    } catch {
      const hint = (ctx && ctx.trim().slice(0, 24)) || "확장";
      addUnique(`${hint} 변주 ${pad}: 시드 톤을 유지한 새로운 한국어 한 줄 기획`);
    }
  }
  if (apiCalls >= API_BUDGET) LOG.warn(`Tournament slot fill hit API budget (${API_BUDGET}), collected ${collected.length}/${needCount}`);
  return collected.slice(0, needCount);
}
