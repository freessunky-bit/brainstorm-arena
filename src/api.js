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
import { Readability } from "@mozilla/readability";

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

// ─── Streaming AI Call ───
export async function callAIStream(persona, messages, systemPrompt, onChunk, { maxTokens, timeoutMs } = {}) {
  const provider = persona?.provider;
  if (!provider || !PROVIDERS[provider]) throw new Error("지원하지 않는 AI 프로바이더입니다.");

  const apiKey = typeof persona?.apiKey === "string" ? persona.apiKey.trim() : "";
  if (!apiKey) throw new Error(`[${getProviderName(provider)}] ${getMissingKeyMessage(provider)}`);
  const model = persona?.model || PROVIDERS[provider].models[0];
  const sys = typeof systemPrompt === "string" ? systemPrompt : (persona?.role || "");
  const normalizedMessages = Array.isArray(messages)
    ? messages.map((m) => ({ role: m?.role || "user", content: normalizeMessageContent(m?.content) }))
    : [];
  if (!normalizedMessages.length) throw new Error("AI에 전달할 메시지가 없습니다.");

  const rl = _rateLimiter.check();
  if (!rl.allowed) { showAppToast(rl.reason, "error", 5000); throw new Error(rl.reason); }
  _rateLimiter.record();

  LOG.api(`stream provider=${provider} model=${model}`);

  const effectiveTimeout = timeoutMs || CALL_AI_TIMEOUT;
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), effectiveTimeout);
  let full = "";

  try {
    if (provider === "claude") {
      const claudeMaxTokens = maxTokens || 4000;
      const res = await fetch(ANTHROPIC_MESSAGES_URL, {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model, max_tokens: claudeMaxTokens, stream: true, system: sys, messages: normalizedMessages }),
      });
      if (!res.ok) { const { data, text } = await readResponsePayload(res); throw new Error(toHttpErrorMessage(provider, res.status, res.statusText, data, text)); }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const ev = JSON.parse(json);
            if (ev.type === "content_block_delta" && ev.delta?.text) { full += ev.delta.text; onChunk(ev.delta.text, full); }
          } catch {}
        }
      }
    } else if (provider === "openai") {
      const m = model || PROVIDERS.openai.models[0];
      const isOSeries = /^o[1-9]/.test(m);
      const isNewModel = isOSeries || /^gpt-(4\.1|5\.)/.test(m);
      const sysRole = isOSeries ? "developer" : "system";
      const tokenParam = isNewModel ? "max_completion_tokens" : "max_tokens";
      const tokenLimit = maxTokens || (isNewModel ? 16000 : 4000);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: m, stream: true, messages: [{ role: sysRole, content: sys }, ...normalizedMessages], [tokenParam]: tokenLimit }),
      });
      if (!res.ok) { const { data, text } = await readResponsePayload(res); throw new Error(toHttpErrorMessage(provider, res.status, res.statusText, data, text)); }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const ev = JSON.parse(json);
            const delta = ev.choices?.[0]?.delta?.content;
            if (delta) { full += delta; onChunk(delta, full); }
          } catch {}
        }
      }
    } else if (provider === "gemini") {
      const m = model || PROVIDERS.gemini.models[0];
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:streamGenerateContent?alt=sse&key=${apiKey}`, {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sys }] },
          contents: normalizedMessages.map((msg) => ({ role: msg.role === "assistant" ? "model" : "user", parts: [{ text: msg.content }] })),
        }),
      });
      if (!res.ok) { const { data, text } = await readResponsePayload(res); throw new Error(toHttpErrorMessage(provider, res.status, res.statusText, data, text)); }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json || json === "[DONE]") continue;
          try {
            const ev = JSON.parse(json);
            const parts = ev.candidates?.[0]?.content?.parts;
            if (parts) { for (const p of parts) { if (p.text) { full += p.text; onChunk(p.text, full); } } }
          } catch {}
        }
      }
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (err) {
    clearTimeout(tid);
    if (full) { LOG.warn(`Stream partial (${full.length} chars) before error: ${err.message}`); return full; }
    throw normalizeFetchError(err);
  }

  clearTimeout(tid);
  if (!full) throw new Error("AI 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.");
  LOG.info(`Stream OK provider=${provider} len=${full.length}`);
  return full;
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

// ─── Web Article Extraction (Jina Reader + Microlink + Readability.js 4단 폴백) ───

/** Google AMP / 캐시 URL 변환 */
function resolveAmpUrl(url) {
  const u = String(url).trim();
  const ampCache = u.match(/https?:\/\/([^/]+)\.cdn\.ampproject\.org\/[cv]\/s\/(.+)/);
  if (ampCache) return `https://${ampCache[2]}`;
  return u;
}

function isRedditUrl(url) { return /reddit\.com\//i.test(url); }
function isNotionUrl(url) { return /notion\.(so|site)\//i.test(url); }

const _articleResult = (title, byline, siteName, excerpt, textContent, url, layers) => ({
  title: title || "", byline: byline || "", siteName: siteName || "",
  excerpt: excerpt || "", textContent: (textContent || "").slice(0, 15000),
  length: (textContent || "").length, url, layers,
});

/**
 * 1차: Jina Reader API — 프론트엔드 CORS OK, 무료 20RPM, JS 렌더링 지원
 * 블로그·뉴스·Notion 등 대부분의 페이지에서 최고 품질 추출
 */
async function tryJinaReader(url) {
  try {
    const res = await _rawFetch(`https://r.jina.ai/${url}`, {
      headers: { "Accept": "application/json" },
    }, 25_000);
    if (!res.ok) return null;
    const json = await res.json();
    const d = json.data || json;
    const content = d.content || d.text || "";
    if (content.length < 50) return null;
    LOG.info(`Jina Reader success: ${content.length} chars`);
    return _articleResult(
      d.title, d.author || "", d.siteName || "",
      d.description || "", content, url, ["jina"],
    );
  } catch (err) {
    LOG.warn(`Jina Reader failed: ${err?.message}`);
    return null;
  }
}

/**
 * 2차: Microlink API — 구조화된 메타데이터 + 본문 추출
 */
async function tryMicrolink(url) {
  try {
    const res = await _rawFetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}&filter=title,description,author,publisher,lang,content`,
      {}, 20_000,
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== "success" || !json.data) return null;
    const d = json.data;
    // Microlink content (HTML) → 텍스트 변환
    let text = "";
    if (d.content) {
      const tmpDoc = new DOMParser().parseFromString(d.content, "text/html");
      text = (tmpDoc.body?.innerText || tmpDoc.body?.textContent || "").replace(/\s+/g, " ").trim();
    }
    if (text.length < 50 && (!d.description || d.description.length < 30)) return null;
    LOG.info(`Microlink success: ${text.length} chars`);
    return _articleResult(
      d.title, d.author || "", d.publisher || "",
      d.description || "", text || d.description || "", url, ["microlink"],
    );
  } catch (err) {
    LOG.warn(`Microlink failed: ${err?.message}`);
    return null;
  }
}

/**
 * 3차-a: Reddit JSON trick — Reddit URL에 .json 추가하여 본문 추출
 */
async function tryRedditJson(url) {
  if (!isRedditUrl(url)) return null;
  try {
    const jsonUrl = url.replace(/\/?(\?.*)?$/, ".json$1");
    const res = await _rawFetch(jsonUrl, {
      headers: { "User-Agent": "BrainstormArena/1.0" },
    }, 15_000);
    if (!res.ok) return null;
    const json = await res.json();
    const listing = Array.isArray(json) ? json[0] : json;
    const post = listing?.data?.children?.[0]?.data;
    if (!post) return null;
    const parts = [];
    if (post.title) parts.push(`# ${post.title}`);
    if (post.selftext) parts.push(post.selftext);
    // 댓글 수집 (상위 5개)
    const comments = Array.isArray(json) && json[1]?.data?.children;
    if (comments) {
      const topComments = comments.slice(0, 5).map(c => c?.data?.body).filter(Boolean);
      if (topComments.length) parts.push("\n---\n### 주요 댓글\n" + topComments.join("\n\n"));
    }
    const text = parts.join("\n\n");
    if (text.length < 30) return null;
    LOG.info(`Reddit JSON success: ${text.length} chars`);
    return _articleResult(
      post.title, post.author || "", `r/${post.subreddit || "reddit"}`,
      post.selftext?.slice(0, 200) || "", text, url, ["reddit_json"],
    );
  } catch (err) {
    LOG.warn(`Reddit JSON failed: ${err?.message}`);
    return null;
  }
}

/**
 * 3차-b: CORS 프록시 + Readability.js 폴백
 */
const WEB_EXTRACT_PROXIES = [
  (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];

async function tryProxyReadability(url) {
  let html = "";
  for (const mkProxy of WEB_EXTRACT_PROXIES) {
    try {
      const res = await _rawFetch(mkProxy(url), {}, 20_000);
      if (!res.ok) continue;
      const { data, text } = await readResponsePayload(res);
      if (data && typeof data === "object") {
        html = typeof data.contents === "string" ? data.contents : typeof data.data === "string" ? data.data : "";
      } else {
        html = typeof data === "string" ? data : text || "";
      }
      if (html.length > 200) break;
    } catch (err) {
      LOG.warn(`extractWebArticle proxy failed: ${err?.message}`);
    }
  }
  if (!html || html.length < 200) return null;

  const doc = new DOMParser().parseFromString(html, "text/html");
  try { const base = doc.createElement("base"); base.href = url; doc.head.prepend(base); } catch {}

  // Readability.js 시도
  try {
    const reader = new Readability(doc, { charThreshold: 50, nbTopCandidates: 10 });
    const article = reader.parse();
    if (article?.textContent && article.textContent.trim().length > 100) {
      const cleanText = article.textContent.replace(/\s+/g, " ").trim();
      const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
      const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
      const ogSite = html.match(/<meta\s+property="og:site_name"\s+content="([^"]*)"/i);
      LOG.info(`Readability success: ${cleanText.length} chars`);
      return _articleResult(
        article.title || (ogTitle ? decodeHtmlEntities(ogTitle[1]) : ""),
        article.byline || "",
        article.siteName || (ogSite ? decodeHtmlEntities(ogSite[1]) : ""),
        article.excerpt || (ogDesc ? decodeHtmlEntities(ogDesc[1]) : ""),
        cleanText, url, ["proxy", "readability"],
      );
    }
  } catch (err) { LOG.warn(`Readability parse failed: ${err?.message}`); }

  // 수동 추출 폴백
  doc.querySelectorAll("script,style,nav,footer,header,aside,iframe,noscript,svg,form,button,.ad,.ads,.advertisement,.sidebar,.widget,.comment,.comments,.social,.share,.related,.recommend,#comments,#sidebar,[role=navigation],[role=complementary],[role=banner],[aria-hidden=true]").forEach(el => el.remove());
  const mainEl = doc.querySelector("article") || doc.querySelector("main") || doc.querySelector('[role="main"]') || doc.querySelector(".post-content,.entry-content,.article-content,.article-body,.post-body,.blog-post,.content-body");
  const text = ((mainEl || doc.body)?.innerText || (mainEl || doc.body)?.textContent || "").replace(/\s+/g, " ").trim();
  const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
  const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
  const ogSite = html.match(/<meta\s+property="og:site_name"\s+content="([^"]*)"/i);
  const pgTitle = html.match(/<title>([^<]*)<\/title>/i);
  if (text.length < 50) return null;
  LOG.info(`Manual extract: ${text.length} chars`);
  return _articleResult(
    ogTitle ? decodeHtmlEntities(ogTitle[1]) : (pgTitle ? decodeHtmlEntities(pgTitle[1]) : ""),
    "", ogSite ? decodeHtmlEntities(ogSite[1]) : "",
    ogDesc ? decodeHtmlEntities(ogDesc[1]) : "",
    text, url, ["proxy", "manual"],
  );
}

/**
 * 웹 페이지 본문 추출 통합 함수
 * 전략: Jina Reader → Microlink → Reddit JSON → CORS+Readability (4단 폴백)
 * @returns {{ title, byline, siteName, excerpt, textContent, length, url, layers }}
 */
export async function extractWebArticle(url) {
  const resolved = resolveAmpUrl(url);

  // Reddit 전용 빠른 경로
  if (isRedditUrl(resolved)) {
    const reddit = await tryRedditJson(resolved);
    if (reddit) return reddit;
    // Reddit JSON 실패 시 Jina (Reddit가 차단할 수 있음)
  }

  // 1차: Jina Reader (최고 품질, JS 렌더링 지원)
  const jina = await tryJinaReader(resolved);
  if (jina && jina.textContent.length >= 100) return jina;

  // 2차: Microlink (구조화된 메타데이터)
  const micro = await tryMicrolink(resolved);
  if (micro && micro.textContent.length >= 100) return micro;

  // 3차: CORS 프록시 + Readability.js
  const readability = await tryProxyReadability(resolved);
  if (readability) return readability;

  // 전체 실패: 가장 풍부한 부분 결과 합성
  const best = [jina, micro].find(r => r && (r.title || r.textContent));
  if (best) return best;

  return _articleResult("", "", "", "", "", resolved, ["fail"]);
}

// ─── Invidious / Piped 공개 인스턴스 (자막 + 메타데이터) ───
const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://invidious.jing.rocks",
  "https://iv.datura.network",
  "https://invidious.protokols.io",
];

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://api.piped.projectsegfault.com",
];

function decodeHtmlEntities(s) {
  return String(s || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#x2F;/g, "/").replace(/\\n/g, "\n");
}

function cleanCaptionXml(xml) {
  return String(xml || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

/** Invidious API: 영상 메타데이터 + 자막 텍스트 추출 */
async function tryInvidiousExtract(videoId) {
  for (const inst of INVIDIOUS_INSTANCES) {
    try {
      const res = await _rawFetch(`${inst}/api/v1/videos/${videoId}?fields=title,author,description,descriptionHtml,keywords,lengthSeconds,captions`, {}, 12_000);
      if (!res.ok) continue;
      const d = await res.json();
      const info = {
        title: d.title || "",
        author: d.author || "",
        description: decodeHtmlEntities(d.description || d.descriptionHtml || ""),
        keywords: Array.isArray(d.keywords) ? d.keywords.join(", ") : "",
        captionText: "",
        layers: ["invidious"],
      };
      // 자막 추출 시도
      const captions = d.captions || [];
      const koTrack = captions.find(c => /^ko/i.test(c.language_code || c.languageCode || ""));
      const defaultTrack = captions.find(c => /^(ko|en|ja)/i.test(c.language_code || c.languageCode || "")) || captions[0];
      const captionTrack = koTrack || defaultTrack;
      if (captionTrack) {
        const capLabel = captionTrack.label || captionTrack.language_code || "";
        const capUrl = captionTrack.url || captionTrack.baseUrl || "";
        if (capUrl) {
          try {
            const fullUrl = capUrl.startsWith("http") ? capUrl : `${inst}${capUrl}`;
            const capRes = await _rawFetch(fullUrl, {}, 10_000);
            if (capRes.ok) {
              const capText = cleanCaptionXml(await capRes.text());
              if (capText.length > 50) { info.captionText = capText; info.layers.push("captions"); }
            }
          } catch {}
        }
      }
      if (info.title) return info;
    } catch (err) { LOG.warn(`Invidious ${inst} failed: ${err?.message}`); }
  }
  return null;
}

/** Piped API: 영상 메타데이터 + 자막 추출 */
async function tryPipedExtract(videoId) {
  for (const inst of PIPED_INSTANCES) {
    try {
      const res = await _rawFetch(`${inst}/streams/${videoId}`, {}, 12_000);
      if (!res.ok) continue;
      const d = await res.json();
      const info = {
        title: d.title || "",
        author: d.uploader || d.uploaderName || "",
        description: decodeHtmlEntities(d.description || ""),
        keywords: "",
        captionText: "",
        layers: ["piped"],
      };
      // Piped 자막
      const subs = d.subtitles || [];
      const koSub = subs.find(s => /^ko/i.test(s.code || ""));
      const defaultSub = subs.find(s => /^(ko|en|ja)/i.test(s.code || "")) || subs[0];
      const sub = koSub || defaultSub;
      if (sub?.url) {
        try {
          const capRes = await _rawFetch(sub.url, {}, 10_000);
          if (capRes.ok) {
            const raw = await capRes.text();
            // VTT 또는 XML 파싱
            const capText = raw.includes("WEBVTT")
              ? raw.replace(/WEBVTT[\s\S]*?\n\n/, "").replace(/\d{2}:\d{2}[\d:.→\->]+\n/g, "").replace(/<[^>]+>/g, "").replace(/\n+/g, " ").trim()
              : cleanCaptionXml(raw);
            if (capText.length > 50) { info.captionText = capText; info.layers.push("captions"); }
          }
        } catch {}
      }
      if (info.title) return info;
    } catch (err) { LOG.warn(`Piped ${inst} failed: ${err?.message}`); }
  }
  return null;
}

/** YouTube HTML에서 초기 데이터 JSON (ytInitialData / ytInitialPlayerResponse) 추출 */
function extractYtInitialData(html) {
  const result = { title: "", author: "", description: "", captionText: "", layers: [] };
  try {
    // ytInitialPlayerResponse에서 제목·설명·자막 URL 추출
    const playerMatch = html.match(/var\s+ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\});\s*(?:var|<\/script)/);
    if (playerMatch) {
      try {
        const p = JSON.parse(playerMatch[1]);
        const vd = p?.videoDetails || {};
        result.title = vd.title || "";
        result.author = vd.author || "";
        result.description = vd.shortDescription || "";
        if (result.title) result.layers.push("ytPlayer");
        // 자막 트랙
        const tracks = p?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
        const koTrack = tracks.find(t => /^ko/i.test(t.languageCode || ""));
        const pick = koTrack || tracks.find(t => /^(en|ja)/i.test(t.languageCode || "")) || tracks[0];
        if (pick?.baseUrl) {
          result._captionUrl = pick.baseUrl.replace(/\\u0026/g, "&").replace(/\\"/g, '"');
        }
      } catch {}
    }
    // ytInitialData에서 description 보완
    if (!result.description) {
      const dataMatch = html.match(/var\s+ytInitialData\s*=\s*(\{[\s\S]*?\});\s*(?:var|<\/script)/);
      if (dataMatch) {
        try {
          const d = JSON.parse(dataMatch[1]);
          const desc = JSON.stringify(d).match(/"description":\{"simpleText":"((?:[^"\\]|\\.)*)"/);
          if (desc) result.description = decodeHtmlEntities(desc[1]);
        } catch {}
      }
    }
    // og:description 폴백
    if (!result.description) {
      const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i)
        || html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
      if (ogDesc) result.description = decodeHtmlEntities(ogDesc[1]);
    }
    if (!result.title) {
      const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i)
        || html.match(/<title>([^<]*)<\/title>/i);
      if (ogTitle) result.title = decodeHtmlEntities(ogTitle[1]);
    }
  } catch {}
  return result;
}

/** YouTube HTML + CORS 프록시 전략 (기존 방식 강화) */
async function tryYouTubeHtmlExtract(videoId) {
  try {
    const html = await fetchViaProxy(`https://www.youtube.com/watch?v=${videoId}`);
    if (!html || html.length < 500) return null;
    const info = extractYtInitialData(html);
    // 자막 URL이 추출되었으면 프록시로 가져오기
    if (info._captionUrl) {
      try {
        const capXml = await fetchViaProxy(info._captionUrl);
        const capText = cleanCaptionXml(capXml);
        if (capText.length > 50) { info.captionText = capText; info.layers.push("captions"); }
      } catch {}
    }
    // _captionUrl 필드를 지우고 반환
    delete info._captionUrl;
    if (info.title || info.description) {
      if (!info.layers.includes("ytPlayer")) info.layers.push("ytHtml");
      return info;
    }
  } catch (err) { LOG.warn(`YouTube HTML extract failed: ${err?.message}`); }
  return null;
}

/** noembed 기본 메타데이터 (최소 폴백) */
async function tryNoembedExtract(videoId) {
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`);
    if (!res.ok) return null;
    const d = await res.json();
    if (d.title) return { title: d.title || "", author: d.author_name || "", description: "", keywords: "", captionText: "", layers: ["noembed"] };
  } catch {}
  return null;
}

/**
 * YouTube 영상 정보 + 자막 통합 추출
 * 전략: Invidious → Piped → YouTube HTML → noembed (다중 폴백)
 */
export async function extractYouTubeVideoInfo(url) {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) throw new Error("유효한 YouTube/영상 URL이 아닙니다.");

  // 1차: Invidious (가장 풍부한 데이터 + 자막)
  const inv = await tryInvidiousExtract(videoId);
  if (inv && (inv.captionText || inv.description)) {
    LOG.info(`YouTube extract via Invidious: layers=${inv.layers.join(",")}`);
    return { videoId, ...inv, captionText: (inv.captionText || "").slice(0, 15000) };
  }

  // 2차: Piped (대체 프론트엔드)
  const piped = await tryPipedExtract(videoId);
  if (piped && (piped.captionText || piped.description)) {
    LOG.info(`YouTube extract via Piped: layers=${piped.layers.join(",")}`);
    return { videoId, ...piped, captionText: (piped.captionText || "").slice(0, 15000) };
  }

  // 3차: YouTube HTML 직접 파싱 (CORS 프록시)
  const yt = await tryYouTubeHtmlExtract(videoId);
  if (yt && (yt.captionText || yt.description)) {
    LOG.info(`YouTube extract via HTML: layers=${yt.layers.join(",")}`);
    return { videoId, ...yt, captionText: (yt.captionText || "").slice(0, 15000) };
  }

  // 4차: noembed 최소 메타
  const noembed = await tryNoembedExtract(videoId);

  // 가장 풍부한 결과 합성
  const merged = { videoId, title: "", author: "", description: "", keywords: "", captionText: "", layers: [] };
  for (const src of [inv, piped, yt, noembed]) {
    if (!src) continue;
    if (!merged.title && src.title) merged.title = src.title;
    if (!merged.author && src.author) merged.author = src.author;
    if (!merged.description && src.description) merged.description = src.description;
    if (!merged.keywords && src.keywords) merged.keywords = src.keywords;
    if (!merged.captionText && src.captionText) merged.captionText = src.captionText;
    merged.layers.push(...(src.layers || []));
  }
  merged.captionText = merged.captionText.slice(0, 15000);
  LOG.info(`YouTube extract merged: layers=${merged.layers.join(",")}, title=${!!merged.title}, desc=${!!merged.description}, cap=${merged.captionText.length}`);
  return merged;
}

// ─── Report Section Generator ───
import { REPORT_ADDON_PROMPTS } from "./prompts.js";

export async function generateReportSection(persona, sectionType, idea, context, existingReport) {
  const fn = REPORT_ADDON_PROMPTS[sectionType];
  if (!fn) throw new Error(`Unknown section type: ${sectionType}`);
  const content = sectionType === "vc" ? fn(idea, context, existingReport) : fn(idea, context);
  return callAI(persona, [{ role: "user", content }]);
}

export async function generateReportSectionStream(persona, sectionType, idea, context, existingReport, onChunk) {
  const fn = REPORT_ADDON_PROMPTS[sectionType];
  if (!fn) throw new Error(`Unknown section type: ${sectionType}`);
  const content = sectionType === "vc" ? fn(idea, context, existingReport) : fn(idea, context);
  return callAIStream(persona, [{ role: "user", content }], undefined, onChunk);
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
