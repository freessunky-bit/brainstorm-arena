/**
 * Brainstorm Arena — App Logger
 * 앱 전체에서 사용하는 로그 시스템. 최대 500줄 유지.
 */
const _logs = [];
function appLog(level, ...args) {
  const ts = new Date().toISOString().slice(11, 23);
  const msg = args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ");
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
