/**
 * Brainstorm Arena — App Logger
 * 앱 전체에서 사용하는 로그 시스템. 최대 500줄 유지.
 */
const _logs = [];

function safeSerialize(value) {
  if (typeof value === "string") return value;
  try {
    const seen = new WeakSet();
    const json = JSON.stringify(value, (_key, current) => {
      if (typeof current === "bigint") return current.toString();
      if (current instanceof Error) return { name: current.name, message: current.message, stack: current.stack };
      if (typeof current === "function") return `[Function ${current.name || "anonymous"}]`;
      if (typeof current === "object" && current !== null) {
        if (seen.has(current)) return "[Circular]";
        seen.add(current);
      }
      return current;
    });
    return json ?? String(value);
  } catch {
    try { return String(value); } catch { return "[Unserializable]"; }
  }
}

function appLog(level, ...args) {
  const ts = new Date().toISOString().slice(11, 23);
  const msg = args.map((arg) => safeSerialize(arg)).join(" ");
  _logs.push(`[${ts}] ${level} ${msg}`);
  if (_logs.length > 500) _logs.splice(0, _logs.length - 500);
}

export const LOG = {
  info: (...a) => appLog("INFO", ...a),
  warn: (...a) => appLog("WARN", ...a),
  error: (...a) => appLog("ERR ", ...a),
  api: (...a) => appLog("API ", ...a),
  getAll: () => _logs.join("\n"),
  count: () => _logs.length,
};
