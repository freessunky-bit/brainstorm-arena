/**
 * Brainstorm Arena — Styles
 * =========================
 * Toss-Style CSS. 모든 컴포넌트의 스타일이 이 파일에 정의됩니다.
 * 수정 시 GUI 외형/밸런스가 변형되지 않도록 주의하세요.
 *
 * [BUG FIX #12] 믹스업 룰렛 중앙 슬롯 텍스트 가시성 개선
 * [BUG FIX #13] 히스토리/아카이브 상세 팝업 상하 확대
 */
export const STYLES = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');
  :root {
    --bg-deepest: #f8f9fb; --bg-surface-1: #ffffff; --bg-surface-2: #f4f5f7; --bg-surface-3: #ebedf0; --bg-hover: #f0f1f4;
    --glass-border: rgba(0,0,0,0.05); --glass-border-active: rgba(0,0,0,0.1);
    --text-primary: #0f172a; --text-secondary: #475569; --text-muted: #94a3b8; --text-on-accent: #ffffff;
    --accent-primary: #2563eb; --accent-primary-hover: #1d4ed8; --accent-primary-glow: rgba(37,99,235,0.07);
    --accent-success: #059669; --accent-warning: #d97706; --accent-error: #dc2626;
    --shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
    --font-sans: 'Pretendard Variable', Pretendard, Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    --font-heading: Inter, 'Pretendard Variable', Pretendard, -apple-system, sans-serif;
    --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 20px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body, html, #root {
    width: 100%; min-height: 100vh;
    font-family: var(--font-sans); font-size: 15px; line-height: 1.65; letter-spacing: -0.012em;
    -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
    background: var(--bg-deepest); color: var(--text-primary);
    font-feature-settings: 'ss01', 'ss02';
  }
  .app-shell {
    max-width: 860px; margin: 0 auto; padding: 0 16px; min-height: 100vh;
    background: var(--bg-surface-1); border: none;
  }
  @media (min-width: 640px) { .app-shell { padding: 0 24px; border-left: 1px solid var(--glass-border); border-right: 1px solid var(--glass-border); } }

  .app-bg {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 50% at 50% -25%, rgba(37,99,235,0.1), transparent 60%),
      radial-gradient(ellipse 40% 35% at 100% 10%, rgba(99,102,241,0.06), transparent),
      var(--bg-deepest);
  }
  .app-shell.app-shell-enhanced { box-shadow: 0 0 0 1px rgba(0,0,0,0.03), 0 16px 56px rgba(15,23,42,0.06); }

  .top-toolbar {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 12px 4px 14px; position: sticky; top: 0; z-index: 90;
    background: rgba(255,255,255,0.82);
    backdrop-filter: saturate(180%) blur(16px); -webkit-backdrop-filter: saturate(180%) blur(16px);
    border-bottom: 1px solid rgba(0,0,0,0.04);
  }
  .brand-group { display: flex; align-items: center; gap: 10px; min-width: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .brand-mark {
    width: 36px; height: 36px; flex-shrink: 0; border-radius: 10px;
    background: linear-gradient(145deg, #2563eb 0%, #1d4ed8 60%, #6366f1 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(37,99,235,0.25);
    position: relative; overflow: hidden; transition: transform 0.2s ease;
  }
  .brand-group:hover .brand-mark { transform: scale(1.04); }
  .brand-mark::after {
    content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
    background: conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.12) 10%, transparent 20%);
    animation: brandShimmer 5s linear infinite;
  }
  @keyframes brandShimmer { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .brand-lines { min-width: 0; line-height: 1.15; }
  .brand-lines strong {
    display: block; font-size: 15.5px; font-weight: 800; letter-spacing: -0.035em;
    color: var(--text-primary); line-height: 1.15; font-family: var(--font-heading);
  }
  .brand-lines span {
    display: inline; font-size: 10px; color: var(--accent-primary);
    font-weight: 600; letter-spacing: 0.02em; margin-left: 3px; opacity: 0.55;
    text-transform: uppercase;
  }
  .toolbar-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .icon-tool-btn {
    width: 36px; height: 36px; border-radius: var(--radius-sm); background: transparent;
    border: 1px solid transparent;
    color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s cubic-bezier(0.33,1,0.68,1); position: relative;
  }
  .icon-tool-btn:hover { background: var(--bg-surface-2); color: var(--text-primary); border-color: var(--glass-border); }
  .icon-tool-btn:active { transform: scale(0.94); }
  .icon-tool-btn .notif-dot {
    position: absolute; top: 7px; right: 7px; width: 6px; height: 6px; border-radius: 50%;
    background: #ef4444; border: 1.5px solid #fff;
  }

  .hero { padding: 28px 4px 20px; animation: fiu 0.6s cubic-bezier(0.33,1,0.68,1); }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px;
    background: rgba(37,99,235,0.06); border: 1px solid rgba(37,99,235,0.08);
    border-radius: 20px; font-size: 11px; font-weight: 700; color: var(--accent-primary); margin-bottom: 16px;
    letter-spacing: 0.01em;
  }
  .hero h1 {
    font-size: 32px; font-weight: 900; letter-spacing: -0.045em; line-height: 1.22;
    margin-bottom: 8px; font-family: var(--font-heading); color: var(--text-primary);
  }
  .hero p { font-size: 15px; color: var(--text-muted); line-height: 1.55; font-weight: 400; letter-spacing: -0.01em; }

  .home-cat-bar {
    display: flex; align-items: center; gap: 4px;
    padding: 0 4px; margin-bottom: 14px;
  }
  .home-cat-tab {
    padding: 7px 16px; border-radius: 8px; border: none;
    background: transparent; color: var(--text-muted);
    font-size: 13px; font-weight: 600; font-family: var(--font-sans);
    cursor: pointer; transition: all 0.18s ease; letter-spacing: -0.01em;
    white-space: nowrap;
  }
  .home-cat-tab:hover { color: var(--text-secondary); background: var(--bg-surface-2); }
  .home-cat-tab.active {
    color: var(--accent-primary); background: rgba(37,99,235,0.07);
    position: relative;
  }
  .home-cat-tab.active::after {
    content: ''; position: absolute; bottom: 0; left: 20%; right: 20%;
    height: 2px; border-radius: 1px; background: var(--accent-primary);
    animation: catTabSlide 0.2s ease-out;
  }
  @keyframes catTabSlide { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  .mode-grid { display: flex; flex-direction: column; gap: 6px; padding-bottom: 32px; }
  .mode-card {
    display: flex; align-items: center; gap: 14px; padding: 16px 18px;
    background: var(--bg-surface-1);
    border-radius: var(--radius-lg); cursor: pointer;
    transition: all 0.22s cubic-bezier(0.33,1,0.68,1);
    border: 1px solid var(--glass-border); position: relative;
    animation: modeCardIn 0.35s cubic-bezier(0.33,1,0.68,1) both;
    box-shadow: var(--shadow-xs);
  }
  @keyframes modeCardIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .mode-card:hover {
    transform: translateY(-2px) scale(1.005);
    box-shadow: var(--shadow-lg);
    border-color: rgba(37,99,235,0.12);
    background: var(--bg-surface-1);
  }
  .mode-card:active { transform: scale(0.985); box-shadow: var(--shadow-sm); }
  .mc-icon {
    width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
    background: var(--bg-surface-2); border-radius: var(--radius-md); font-size: 21px; flex-shrink: 0;
    transition: transform 0.25s cubic-bezier(0.33,1,0.68,1);
  }
  .mode-card:hover .mc-icon { transform: scale(1.08) rotate(-2deg); }
  .mc-text { flex: 1; min-width: 0; }
  .mc-name {
    font-size: 15px; font-weight: 700; color: var(--text-primary);
    letter-spacing: -0.025em; font-family: var(--font-heading); line-height: 1.3;
  }
  .mc-desc {
    font-size: 13px; color: var(--text-muted); margin-top: 3px;
    line-height: 1.5; font-weight: 400; letter-spacing: -0.01em;
  }
  .mc-arrow {
    color: var(--text-muted); font-size: 18px; flex-shrink: 0; opacity: 0.25;
    transition: opacity 0.2s, transform 0.2s, color 0.2s;
  }
  .mode-card:hover .mc-arrow { opacity: 0.5; transform: translateX(3px); color: var(--accent-primary); }

  .back-btn {
    display: inline-flex; align-items: center; gap: 4px; padding: 10px 0; font-size: 15px; font-weight: 500;
    color: var(--text-secondary); background: none; border: none; cursor: pointer; font-family: var(--font-sans);
    letter-spacing: -0.02em; transition: color 0.2s;
  }
  .back-btn:hover { color: var(--text-primary); }
  .back-btn svg { width: 14px; height: 14px; }

  .breadcrumb-nav {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 0 4px; margin-bottom: 2px;
  }
  .breadcrumb-item {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 13px; font-weight: 500; color: var(--text-muted);
    background: none; border: none; cursor: pointer; font-family: var(--font-sans);
    padding: 4px 2px; transition: color 0.15s; letter-spacing: -0.01em;
  }
  .breadcrumb-item:hover { color: var(--accent-primary); }
  .breadcrumb-sep { font-size: 12px; color: var(--text-muted); opacity: 0.4; user-select: none; }
  .breadcrumb-current {
    font-size: 13px; font-weight: 600; color: var(--text-primary);
    letter-spacing: -0.01em;
  }

  .mode-title { font-size: 21px; font-weight: 800; letter-spacing: -0.04em; color: var(--text-primary); margin: 4px 0 6px; line-height: 1.3; animation: modeFadeIn 0.3s ease both; }
  @keyframes modeFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  .mode-tagline {
    font-size: 12px; line-height: 1.55; color: #374151; margin-bottom: 14px; padding: 10px 14px;
    background: rgba(248,250,252,0.8);
    border-left: 3px solid var(--accent-primary); border-radius: 0 8px 8px 0;
    letter-spacing: -0.01em; font-weight: 500;
  }
  .s-label {
    font-size: 12px; font-weight: 600; color: var(--text-muted);
    margin-bottom: 8px; letter-spacing: 0.02em; text-transform: uppercase;
  }

  input[type="text"], input[type="password"], textarea, select {
    width: 100%; padding: 12px 14px; background: var(--bg-surface-2); border: 1px solid var(--glass-border);
    border-radius: 8px; font-family: var(--font-sans); font-size: 15px; letter-spacing: -0.02em;
    color: var(--text-primary); outline: none; transition: border-color 0.2s, box-shadow 0.2s; -webkit-appearance: none;
  }
  input:focus, textarea:focus, select:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 3px var(--accent-primary-glow); }
  input::placeholder, textarea::placeholder { color: #6b7280; font-weight: 400; }
  textarea { resize: vertical; min-height: 110px; line-height: 1.6; }

  .btn-cta {
    display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px 24px; min-height: 50px;
    background: var(--accent-primary); color: var(--text-on-accent); border: none; border-radius: 8px;
    font-family: var(--font-sans); font-size: 15px; font-weight: 700; letter-spacing: -0.02em; cursor: pointer;
    transition: all 0.2s cubic-bezier(0.33,1,0.68,1); box-shadow: 0 2px 12px var(--accent-primary-glow), var(--shadow-sm);
  }
  .btn-cta:hover { background: var(--accent-primary-hover); transform: translateY(-1px); box-shadow: 0 4px 16px var(--accent-primary-glow), var(--shadow-sm); }
  .btn-cta:active { transform: scale(0.97) translateY(0); }
  .btn-cta:disabled { opacity: 0.3; cursor: default; transform: none; box-shadow: none; }
  .btn-cta.tot-cta {
    background: linear-gradient(135deg, #059669, #0d9488);
    box-shadow: 0 2px 12px rgba(5,150,105,0.25), var(--shadow-sm);
  }
  .btn-cta.tot-cta:hover {
    background: linear-gradient(135deg, #047857, #0f766e);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(5,150,105,0.3), var(--shadow-sm);
  }

  .btn-ghost {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 18px;
    background: transparent; color: var(--text-secondary); border: 1px solid var(--glass-border); border-radius: 8px;
    font-family: var(--font-sans); font-size: 14px; font-weight: 600; letter-spacing: -0.02em; cursor: pointer; transition: all 0.2s;
  }
  .btn-ghost:hover { background: var(--bg-surface-2); color: var(--text-primary); }
  .btn-ghost:active { transform: scale(0.97); }

  .chip {
    display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;
    cursor: pointer; border: 1px solid var(--glass-border); background: var(--bg-surface-2); color: var(--text-secondary);
    transition: all 0.2s; letter-spacing: -0.01em; white-space: nowrap;
  }
  .chip:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
  .chip:active { transform: scale(0.95); }
  .chip.active { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }

  .r-card {
    background: var(--bg-surface-1); border: 1px solid var(--glass-border); border-radius: 10px; padding: 20px;
    margin-bottom: 12px; box-shadow: var(--shadow-xs); animation: fiu 0.5s cubic-bezier(0.33,1,0.68,1);
  }
  .r-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--glass-border); }
  .r-card-icon { font-size: 20px; }
  .r-card-title { font-size: 15px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; }
  .r-card-badge { margin-left: auto; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }

  .synth-card {
    background: rgba(49,130,246,0.04); border: 1px solid rgba(49,130,246,0.12); border-radius: 10px; padding: 22px; margin-top: 20px;
  }
  .synth-card h3 { font-size: 15px; font-weight: 800; color: var(--accent-primary); margin-bottom: 14px; display: flex; align-items: center; gap: 6px; letter-spacing: -0.02em; }

  .prog-bar-bg { width: 100%; height: 3px; background: var(--bg-surface-3); border-radius: 2px; overflow: hidden; margin: 16px 0 10px; position: relative; }
  .prog-bar-fill { height: 100%; background: var(--accent-primary); border-radius: 2px; transition: width 0.5s cubic-bezier(0.33,1,0.68,1); }
  .prog-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
  .prog-chip { font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 20px; display: flex; align-items: center; gap: 5px; }
  .prog-chip.pending { background: var(--bg-surface-2); color: var(--text-muted); }
  .prog-chip.loading { background: var(--accent-primary-glow); color: var(--accent-primary); }
  .prog-chip.done { background: rgba(5,150,105,0.08); color: var(--accent-success); }
  .prog-chip.error { background: rgba(220,38,38,0.08); color: var(--accent-error); }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width: 14px; height: 14px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }

  .bracket-scroll { overflow-x: auto; padding: 16px 0; display: flex; gap: 20px; }
  .bracket-round { min-width: 200px; flex-shrink: 0; }
  .bracket-round-title { font-size: 11px; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; text-align: center; }
  .bracket-match { background: var(--bg-surface-2); border-radius: 8px; padding: 8px 12px; margin-bottom: 6px; border: 1px solid var(--glass-border); }
  .bracket-entry { font-size: 12px; padding: 3px 0; color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center; }
  .bracket-entry.won { color: var(--accent-success); font-weight: 700; }
  .bracket-sep { height: 1px; background: var(--glass-border); margin: 2px 0; }
  .bracket-reason { font-size: 10px; color: var(--text-muted); margin-top: 4px; font-style: italic; line-height: 1.4; }

  .scamper-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px; }
  .scamper-card { background: var(--bg-surface-1); border: 1px solid var(--glass-border); border-radius: 10px; padding: 18px; box-shadow: var(--shadow-xs); animation: fiu 0.4s cubic-bezier(0.33,1,0.68,1); }
  .scamper-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-bottom: 10px; background: var(--accent-primary-glow); color: var(--accent-primary); }

  .idea-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 6px; margin: 12px 0; }
  .idea-slot { display: flex; align-items: center; gap: 8px; background: var(--bg-surface-2); border: 1px solid var(--glass-border); border-radius: 8px; padding: 4px 12px; }
  .idea-slot .slot-num { font-size: 11px; font-weight: 700; color: var(--text-muted); min-width: 28px; font-variant-numeric: tabular-nums; }
  .idea-slot input { border: none !important; background: transparent !important; padding: 10px 0; flex: 1; font-size: 14px; box-shadow: none !important; }
  .idea-slot.ai-filled { border-color: rgba(124,58,237,0.2); border-style: dashed; }
  .idea-slot.ai-filled .slot-num { color: #7c3aed; }

  .tournament-slot-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 8px; margin: 12px 0 10px;
  }
  @media (max-width: 580px) { .tournament-slot-grid { grid-template-columns: 1fr; } }
  .tournament-slot-card {
    display: flex; flex-direction: column; gap: 6px;
    background: var(--bg-surface-1); border: 1px solid var(--glass-border);
    border-radius: var(--radius-md); padding: 10px 12px;
    transition: border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .tournament-slot-card:focus-within {
    border-color: rgba(37,99,235,0.3);
    box-shadow: 0 2px 12px rgba(37,99,235,0.06);
  }
  .tournament-slot-card.has-value {
    border-color: rgba(5,150,105,0.22);
  }
  .tournament-slot-card.has-value:focus-within {
    border-color: rgba(37,99,235,0.3);
  }
  .tournament-slot-badge {
    display: inline-flex; align-items: center; justify-content: center;
    flex-shrink: 0; min-width: 30px; padding: 0;
    font-size: 11px; font-weight: 700; letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums; color: var(--text-muted);
  }
  .tournament-slot-card.has-value .tournament-slot-badge {
    color: var(--accent-success);
  }
  .tournament-slot-textarea {
    display: block; width: 100%;
    min-height: 60px; max-height: 160px;
    padding: 8px 10px; border-radius: 8px;
    border: 1px solid var(--glass-border); background: var(--bg-surface-2);
    font-family: var(--font-sans); font-size: 13.5px; line-height: 1.6;
    letter-spacing: -0.01em; color: var(--text-primary);
    resize: vertical; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    -webkit-appearance: none;
  }
  .tournament-slot-textarea::placeholder { color: var(--text-muted); font-weight: 400; }
  .tournament-slot-textarea:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(37,99,235,0.06);
    background: var(--bg-surface-1);
  }

  .t-mode-card {
    flex: 1; min-width: 80px; padding: 12px 10px; border-radius: var(--radius-md);
    border: 1.5px solid var(--glass-border); background: var(--bg-surface-1);
    cursor: pointer; font-family: var(--font-sans); text-align: center;
    transition: all 0.2s cubic-bezier(0.33,1,0.68,1);
  }
  .t-mode-card:hover { border-color: rgba(37,99,235,0.18); transform: translateY(-1px); }
  .t-mode-card.active {
    border-color: var(--accent-primary); background: rgba(37,99,235,0.04);
    box-shadow: 0 0 0 2px rgba(37,99,235,0.08);
  }
  .t-info-tip {
    display: inline-flex; align-items: center; justify-content: center;
    width: 16px; height: 16px; border-radius: 50%;
    background: var(--bg-surface-2); border: 1px solid var(--glass-border);
    font-size: 10px; color: var(--text-muted); cursor: help;
    margin-left: 4px; vertical-align: middle;
    position: relative;
  }
  .t-info-tip:hover::after {
    content: attr(data-tip);
    position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
    background: var(--text-primary); color: #fff;
    font-size: 11px; font-weight: 500; white-space: nowrap;
    padding: 5px 10px; border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10; pointer-events: none;
    letter-spacing: -0.01em;
  }
  .idea-stack-btn { display: inline-flex; align-items: center; justify-content: center; padding: 4px 8px; border-radius: 8px; border: 1px solid var(--glass-border); background: var(--bg-surface-2); cursor: pointer; font-size: 11px; font-weight: 600; color: var(--accent-primary); font-family: var(--font-sans); transition: all 0.2s ease; white-space: nowrap; gap: 3px; flex-shrink: 0; }
  .idea-stack-btn:hover { background: var(--accent-primary-glow); border-color: rgba(49,130,246,0.3); }
  .idea-stack-popover {
    position: absolute; top: 100%; right: 0; margin-top: 8px; z-index: 120;
    width: min(400px, 94vw); max-height: min(88vh, 600px);
    background: var(--bg-surface-1); border: 1px solid var(--glass-border);
    border-radius: 16px; box-shadow: 0 16px 48px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.03);
    overflow: hidden; animation: fiu 0.22s ease-out; display: flex; flex-direction: column;
  }
  .isp-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px 0; flex-shrink: 0;
  }
  .isp-header-title {
    font-size: 15px; font-weight: 800; color: var(--text-primary);
    letter-spacing: -0.025em;
  }
  .isp-header-badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 22px; height: 20px; padding: 0 7px;
    border-radius: 6px; background: rgba(37,99,235,0.08);
    font-size: 11px; font-weight: 700; color: var(--accent-primary);
    font-variant-numeric: tabular-nums; letter-spacing: -0.01em;
  }
  .idea-stack-search {
    width: 100%; padding: 10px 14px; margin: 10px 0 0; border: 1px solid var(--glass-border);
    border-radius: 10px; background: var(--bg-surface-2); font-family: var(--font-sans);
    font-size: 13.5px; color: var(--text-primary); outline: none; flex-shrink: 0;
    box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;
    margin-left: 16px; margin-right: 16px; width: calc(100% - 32px);
  }
  .idea-stack-search:focus { border-color: rgba(37,99,235,0.3); box-shadow: 0 0 0 3px rgba(37,99,235,0.05); }
  .idea-stack-search::placeholder { color: var(--text-muted); font-weight: 400; }
  .idea-stack-list {
    overflow-y: auto; max-height: 200px; padding: 6px 8px; margin-top: 6px;
    flex-shrink: 0;
  }
  .idea-stack-item {
    display: flex; align-items: flex-start; gap: 10px; padding: 10px 10px;
    cursor: pointer; font-size: 13px; color: var(--text-primary); line-height: 1.5;
    border-radius: 10px; transition: all 0.18s ease; margin-bottom: 2px;
  }
  .idea-stack-item:hover {
    background: rgba(37,99,235,0.04);
    box-shadow: 0 2px 8px rgba(37,99,235,0.06);
    transform: scale(1.008);
  }
  .idea-stack-item-del {
    flex-shrink: 0; padding: 4px; border-radius: 6px; border: none;
    background: transparent; color: var(--text-muted); cursor: pointer;
    transition: all 0.18s; display: flex; align-items: center; justify-content: center;
    width: 26px; height: 26px; margin-top: 1px;
  }
  .idea-stack-item-del:hover { background: rgba(220,38,38,0.08); color: var(--accent-error); }
  .idea-stack-item-del svg { display: block; }
  .idea-stack-empty { padding: 28px 16px; text-align: center; font-size: 13px; color: var(--text-muted); }
  .idea-stack-toolbar { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
  .idea-input-wrap { border: 1px solid var(--glass-border); border-radius: 14px; background: var(--bg-surface-1); overflow: visible; box-shadow: var(--shadow-xs); transition: border-color 0.2s, box-shadow 0.2s; }
  .idea-input-wrap:focus-within { border-color: rgba(49,130,246,0.35); box-shadow: 0 0 0 3px var(--accent-primary-glow); }
  .idea-input-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px 8px 12px; border-bottom: 1px solid var(--glass-border); background: linear-gradient(180deg, var(--bg-surface-2), var(--bg-surface-1)); border-radius: 13px 13px 0 0; }
  .idea-input-toolbar-meta { font-size: 11px; font-weight: 600; color: var(--text-muted); letter-spacing: -0.02em; }
  .idea-input-load-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 10px; border: 1px solid rgba(49,130,246,0.22); background: linear-gradient(180deg, rgba(49,130,246,0.12), rgba(49,130,246,0.06)); color: var(--accent-primary); font-size: 12px; font-weight: 700; font-family: var(--font-sans); cursor: pointer; transition: all 0.18s ease; -webkit-tap-highlight-color: transparent; }
  .idea-input-load-btn:hover { background: linear-gradient(180deg, rgba(49,130,246,0.18), rgba(49,130,246,0.1)); border-color: rgba(49,130,246,0.35); transform: translateY(-0.5px); }
  .idea-input-load-btn:active { transform: scale(0.98); }
  .idea-input-load-count { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 8px; background: var(--accent-primary); color: #fff; font-size: 10px; font-weight: 800; font-variant-numeric: tabular-nums; }
  textarea.idea-input-field { display: block; width: 100%; border: none; border-radius: 0 0 13px 13px; padding: 12px 14px; font-family: var(--font-sans); font-size: 15px; line-height: 1.55; color: var(--text-primary); background: var(--bg-surface-1); resize: vertical; outline: none; min-height: 88px; -webkit-appearance: none; box-sizing: border-box; }
  .idea-input-field::placeholder { color: var(--text-muted); }
  .brand-title-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; min-width: 0; }
  .brand-title-row .brand-lines { flex: 1; min-width: 0; }
  .plan-badges { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
  .plan-pill {
    display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px;
    border-radius: 6px; font-size: 10px; font-weight: 700;
    letter-spacing: 0.03em; font-family: var(--font-sans); line-height: 1.4;
    border: none; white-space: nowrap;
  }
  .plan-pill-premium { background: rgba(37,99,235,0.08); color: var(--accent-primary); }
  .plan-pill-live { background: rgba(5,150,105,0.08); color: #059669; }
  .plan-pill-live .plan-dot { width: 5px; height: 5px; border-radius: 50%; background: #059669; animation: planPulse 2s ease-in-out infinite; }
  @keyframes planPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.75; transform: scale(0.92); } }
  .archive-save-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 200; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; animation: fdIn 0.15s ease; }
  .archive-save-panel { background: var(--bg-surface-1); border: 1px solid var(--glass-border); border-radius: 18px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); width: min(380px, 92vw); padding: 24px; animation: fiu 0.25s ease-out; }
  .archive-filter-block { margin-bottom: 16px; }
  .archive-top-bar {
    display: flex; align-items: center; gap: 8px;
  }
  .archive-select-row { display: flex; gap: 6px; align-items: stretch; flex: 1; min-width: 0; }
  .archive-select {
    flex: 1; min-width: 0; padding: 9px 32px 9px 12px; font-size: 13px; font-weight: 600; font-family: var(--font-sans);
    color: var(--text-primary); background-color: var(--bg-surface-2); border: 1px solid var(--glass-border); border-radius: 10px; cursor: pointer;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    -webkit-appearance: none; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center; background-size: 10px;
  }
  .archive-select:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
  .archive-del-group-btn {
    padding: 7px 12px; border-radius: 8px; border: 1px solid rgba(220,38,38,0.2); background: transparent;
    color: #dc2626; font-size: 11px; font-weight: 600; font-family: var(--font-sans); cursor: pointer; white-space: nowrap;
    transition: all 0.15s;
  }
  .archive-del-group-btn:hover { background: rgba(220,38,38,0.06); border-color: rgba(220,38,38,0.35); }
  .archive-new-group-btn {
    padding: 7px 12px; border-radius: 8px; border: 1px dashed var(--glass-border); background: transparent;
    color: var(--text-muted); font-size: 12px; font-weight: 500; font-family: var(--font-sans); cursor: pointer;
    white-space: nowrap; transition: all 0.15s; display: flex; align-items: center; gap: 3px; flex-shrink: 0;
  }
  .archive-new-group-btn:hover { border-color: var(--accent-primary); color: var(--accent-primary); background: rgba(37,99,235,0.03); }
  .archive-new-group-inline {
    display: flex; gap: 6px; margin-top: 10px; align-items: center;
    animation: archGrpIn 0.2s ease-out;
  }
  @keyframes archGrpIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  .archive-new-group-inline input {
    flex: 1; min-width: 80px; padding: 8px 12px; font-size: 13px; font-weight: 500;
    border: 1px solid var(--glass-border); border-radius: 8px; background: var(--bg-surface-1); color: var(--text-primary);
    font-family: var(--font-sans); outline: none; transition: border-color 0.2s;
  }
  .archive-new-group-inline input:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
  .archive-new-group-inline button {
    padding: 8px 14px; border-radius: 8px; border: none; background: var(--accent-primary); color: #fff;
    font-size: 12px; font-weight: 600; font-family: var(--font-sans); cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .archive-new-group-inline button:hover { background: var(--accent-primary-hover); }
  .archive-tab-row {
    display: flex; gap: 5px; overflow-x: auto; padding-bottom: 2px;
    scrollbar-width: none; -ms-overflow-style: none; position: relative;
  }
  .archive-tab-row::-webkit-scrollbar { display: none; }
  .archive-tab-wrapper { position: relative; margin-bottom: 14px; }
  .archive-tab-fade-l, .archive-tab-fade-r {
    position: absolute; top: 0; bottom: 2px; width: 24px; z-index: 2; pointer-events: none;
  }
  .archive-tab-fade-l { left: 0; background: linear-gradient(to right, var(--bg-surface-1), transparent); }
  .archive-tab-fade-r { right: 0; background: linear-gradient(to left, var(--bg-surface-1), transparent); }
  .archive-tab {
    padding: 6px 14px; border-radius: 18px; border: 1px solid var(--glass-border); background: transparent;
    font-size: 11px; font-weight: 500; color: var(--text-muted); cursor: pointer; font-family: var(--font-sans);
    transition: all 0.15s; white-space: nowrap;
  }
  .archive-tab:hover { border-color: #cbd5e1; color: var(--text-secondary); }
  .archive-tab.active { background: var(--accent-primary); color: #fff; border-color: var(--accent-primary); font-weight: 600; }
  .archive-group-mgr { display: flex; gap: 6px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
  .archive-item {
    display: flex; flex-direction: column; gap: 0;
    padding: 0; border: 1px solid var(--glass-border);
    border-radius: 14px; background: var(--bg-surface-1); margin-bottom: 10px; transition: all 0.2s;
    overflow: hidden;
  }
  .archive-item:hover { border-color: rgba(37,99,235,0.18); box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
  .archive-item-body {
    display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px 10px;
  }
  .archive-item-meta { flex: 1; min-width: 0; }
  .archive-item-title {
    font-weight: 700; font-size: 14px; color: var(--text-primary); letter-spacing: -0.02em;
    line-height: 1.45; word-break: break-word; margin-bottom: 6px;
  }
  .archive-item-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 6px; }
  .archive-item-date { font-size: 11px; color: var(--text-muted); }
  .archive-item-bottom {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 16px 10px; gap: 8px;
  }
  .archive-actions { display: flex; gap: 3px; flex-shrink: 0; }
  .archive-actions button {
    width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--glass-border); background: var(--bg-surface-1);
    cursor: pointer; font-size: 12px; font-family: var(--font-sans); color: var(--text-muted); transition: all 0.15s;
    display: flex; align-items: center; justify-content: center; padding: 0;
  }
  .archive-actions button:hover { background: var(--bg-surface-2); color: var(--text-secondary); border-color: #cbd5e1; }
  .archive-actions button.del:hover { background: rgba(220,38,38,0.04); color: #dc2626; border-color: rgba(220,38,38,0.25); }
  .archive-proto-btn {
    display: flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 8px;
    border: none; background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff;
    font-size: 11.5px; font-weight: 600; font-family: var(--font-sans); cursor: pointer;
    transition: all 0.2s; white-space: nowrap; flex-shrink: 0;
  }
  .archive-proto-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
  .archive-proto-btn.archive-proto-done { background: linear-gradient(135deg, #059669, #10b981); }
  .archive-proto-running {
    display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 8px;
    background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.15);
    color: #6366f1; font-size: 11px; font-weight: 600; font-family: var(--font-sans);
    cursor: pointer; white-space: nowrap; flex-shrink: 0; animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
  .archive-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 60px 24px; text-align: center;
  }
  .archive-empty-icon { width: 72px; height: 72px; margin-bottom: 18px; opacity: 0.5; }
  .archive-empty h4 {
    font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px; letter-spacing: -0.02em;
  }
  .archive-empty p {
    font-size: 13px; color: var(--text-muted); margin: 0 0 18px; line-height: 1.5;
  }
  .archive-empty-cta {
    padding: 10px 22px; border-radius: 10px; border: 1px solid var(--glass-border); background: var(--bg-surface-1);
    font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; font-family: var(--font-sans);
    transition: all 0.15s; display: flex; align-items: center; gap: 6px;
  }
  .archive-empty-cta:hover { border-color: var(--accent-primary); color: var(--accent-primary); background: rgba(37,99,235,0.02); }
  .archive-item-badge {
    display: inline-flex; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; letter-spacing: -0.01em;
  }

  .target-bar { display: flex; gap: 6px; margin-bottom: 18px; flex-wrap: wrap; align-items: center; }
  .target-chip-group { display: flex; align-items: center; gap: 0; background: var(--bg-surface-2); border: 1px solid var(--glass-border); border-radius: 10px; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; scrollbar-width: none; max-width: 100%; flex-shrink: 1; }
  .target-chip-group::-webkit-scrollbar { display: none; }
  .target-chip-label { font-size: 10px; font-weight: 700; color: var(--text-muted); padding: 6px 10px; text-transform: uppercase; letter-spacing: 0.04em; border-right: 1px solid var(--glass-border); user-select: none; white-space: nowrap; }
  .target-chip { padding: 6px 12px; font-size: 12px; font-weight: 600; color: var(--text-secondary); cursor: pointer; border: none; background: transparent; font-family: var(--font-sans); transition: all 0.15s ease; white-space: nowrap; }
  .target-chip:hover { background: rgba(49,130,246,0.06); color: var(--text-primary); }
  .target-chip.active { background: var(--accent-primary); color: #fff; }
  .target-chip + .target-chip { border-left: 1px solid var(--glass-border); }
  .target-chip.active + .target-chip { border-left-color: transparent; }
  .target-age-sel { padding: 6px 10px; font-size: 12px; font-weight: 600; color: var(--text-primary); background: var(--bg-surface-2); border: 1px solid var(--glass-border); border-radius: 10px; font-family: var(--font-sans); cursor: pointer; outline: none; -webkit-appearance: none; appearance: none; padding-right: 26px; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; background-size: 10px; }
  .target-age-sel:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 2px var(--accent-primary-glow); }

  .final-rank {
    display: flex; align-items: flex-start; gap: 16px; padding: 20px; background: var(--bg-surface-1);
    border: 1px solid var(--glass-border); border-radius: 10px; box-shadow: var(--shadow-xs);
    animation: fiu 0.5s cubic-bezier(0.33,1,0.68,1); margin-bottom: 10px;
  }
  .final-rank:first-child { border-color: rgba(245,158,11,0.3); background: rgba(245,158,11,0.04); }
  .rank-medal { font-size: 36px; flex-shrink: 0; }
  .rank-title { font-size: 16px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.03em; }

  .pipe-step { display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }

  .err-msg { background: rgba(220,38,38,0.05); border: 1px solid rgba(220,38,38,0.12); border-radius: 8px; padding: 12px 14px; color: var(--accent-error); font-size: 13px; }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
  .modal-sheet {
    background: var(--bg-surface-1); border-top-left-radius: 14px; border-top-right-radius: 14px;
    width: 100%; max-width: 860px; max-height: 85vh; overflow-y: auto; padding: 0 24px 24px; animation: su 0.4s cubic-bezier(0.33,1,0.68,1);
  }
  .modal-handle { display: flex; justify-content: center; padding: 12px 0 8px; }
  .modal-handle div { width: 32px; height: 3px; background: var(--bg-surface-3); border-radius: 2px; }
  .modal-title { font-size: 18px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.03em; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }
  .modal-close { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: transparent; border: none; color: var(--text-muted); font-size: 16px; cursor: pointer; }
  .modal-close:hover { background: var(--bg-surface-2); }

  .persona-cfg { background: var(--bg-surface-2); border-radius: 10px; padding: 14px; margin-bottom: 10px; }
  .persona-cfg-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .persona-cfg-icon { font-size: 22px; }
  .persona-cfg-name { font-size: 14px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; }
  .persona-cfg-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
  .persona-cfg-row select, .persona-cfg-row input { flex: 1; min-width: 120px; padding: 10px 12px; font-size: 13px; }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 2px; }

  @keyframes fiu { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes su { from { transform: translateY(100%); } to { transform: translateY(0); } }
  /* transform 제거: both로 남는 transform이 fixed 자손의 기준 박스를 이 래퍼로 만듦 */
  @keyframes pageEnter {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .page-enter { animation: pageEnter 0.35s cubic-bezier(0.33,1,0.68,1) both; }
  @keyframes homeFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .home-enter { animation: homeFadeIn 0.25s ease both; }

  /* Splash screen */
  .splash-overlay {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
    background: #ffffff;
    transition: opacity 0.3s ease, visibility 0.3s ease;
  }
  .splash-overlay.splash-out { opacity: 0; visibility: hidden; pointer-events: none; }
  .splash-logo {
    width: 64px; height: 64px; border-radius: 18px;
    background: linear-gradient(145deg, #3182f6 0%, #2563eb 50%, #7c3aed 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 24px rgba(49,130,246,0.18);
    animation: splashPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  @keyframes splashPop {
    0% { transform: scale(0.5); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  .splash-title {
    font-size: 20px; font-weight: 800; letter-spacing: -0.04em; color: #191f28;
    opacity: 0; animation: splashFadeUp 0.35s 0.2s cubic-bezier(0.33,1,0.68,1) forwards;
  }
  .splash-sub {
    font-size: 12px; color: #adb5bd; font-weight: 500;
    opacity: 0; animation: splashFadeUp 0.35s 0.35s cubic-bezier(0.33,1,0.68,1) forwards;
  }
  @keyframes splashFadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes dotBounce {
    0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
    40% { opacity: 1; transform: translateY(-3px); }
  }
  .rolling-dots span { display: inline-block; animation: dotBounce 1.2s ease-in-out infinite; font-weight: 900; }
  .rolling-dots span:nth-child(2) { animation-delay: 0.15s; }
  .rolling-dots span:nth-child(3) { animation-delay: 0.3s; }
  @keyframes totPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
  @keyframes totGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes totFadeUp { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

  /* ToT Stepper */
  .tot-stepper { display: flex; align-items: center; gap: 0; margin: 20px 0 24px; }
  .tot-step {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative;
  }
  .tot-step-dot {
    width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 16px; border: 2px solid var(--glass-border); background: var(--bg-surface-1);
    transition: all 0.4s cubic-bezier(0.33,1,0.68,1); position: relative; z-index: 2;
  }
  .tot-step.active .tot-step-dot {
    border-color: var(--accent-primary); background: var(--accent-primary-glow);
    box-shadow: 0 0 20px rgba(49,130,246,0.2), 0 0 40px rgba(49,130,246,0.08);
    animation: totPulse 2s ease-in-out infinite;
  }
  .tot-step.done .tot-step-dot {
    border-color: var(--accent-success); background: rgba(5,150,105,0.08);
    color: var(--accent-success); animation: none;
  }
  .tot-step-label {
    font-size: 11px; font-weight: 600; color: var(--text-muted);
    transition: color 0.3s ease; letter-spacing: -0.01em; text-align: center;
  }
  .tot-step.active .tot-step-label { color: var(--accent-primary); font-weight: 700; }
  .tot-step.done .tot-step-label { color: var(--accent-success); }
  .tot-step-line {
    position: absolute; top: 18px; left: calc(50% + 20px); right: calc(-50% + 20px);
    height: 2px; background: var(--glass-border); z-index: 1;
  }
  .tot-step-line-fill {
    height: 100%; background: var(--accent-success); border-radius: 2px;
    transform-origin: left; transform: scaleX(0);
  }
  .tot-step.done .tot-step-line-fill {
    transform: scaleX(1); transition: transform 0.6s cubic-bezier(0.33,1,0.68,1);
  }

  /* ToT Branch Cards */
  .tot-branches { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
  @media (max-width: 700px) { .tot-branches { grid-template-columns: 1fr; } }
  .tot-branch {
    background: var(--bg-surface-1); border: 1px solid var(--glass-border); border-radius: 14px;
    padding: 18px 16px; position: relative; overflow: hidden;
    transition: all 0.4s cubic-bezier(0.33,1,0.68,1);
    animation: totFadeUp 0.5s cubic-bezier(0.33,1,0.68,1) both;
  }
  .tot-branch::before {
    content: ''; position: absolute; inset: 0; border-radius: 14px; opacity: 0;
    background: linear-gradient(135deg, rgba(49,130,246,0.04), rgba(124,58,237,0.03));
    transition: opacity 0.3s ease;
  }
  .tot-branch:hover::before { opacity: 1; }
  .tot-branch.tot-winner {
    border-color: rgba(5,150,105,0.3);
    background: linear-gradient(135deg, rgba(5,150,105,0.03), rgba(49,130,246,0.02));
    box-shadow: 0 8px 32px rgba(5,150,105,0.08), var(--shadow-sm);
  }
  .tot-branch.tot-pruned { opacity: 0.55; }
  .tot-branch-num {
    display: inline-flex; align-items: center; justify-content: center;
    width: 24px; height: 24px; border-radius: 8px; font-size: 11px; font-weight: 800;
    background: var(--bg-surface-2); color: var(--text-muted); margin-bottom: 10px;
  }
  .tot-branch.tot-winner .tot-branch-num {
    background: rgba(5,150,105,0.12); color: var(--accent-success);
  }
  .tot-branch-title {
    font-size: 14px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.03em;
    margin-bottom: 4px; line-height: 1.35;
  }
  .tot-branch-angle {
    font-size: 12px; color: var(--accent-primary); font-weight: 600; margin-bottom: 8px;
  }
  .tot-branch-body { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

  /* ToT Score Bar */
  .tot-scores { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 12px; }
  .tot-score-pill {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;
    background: var(--bg-surface-2); color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }
  .tot-branch.tot-winner .tot-score-pill {
    background: rgba(5,150,105,0.08); color: var(--accent-success);
  }

  /* ToT Main Solution — Glassmorphism */
  .tot-solution {
    position: relative; border-radius: 18px; padding: 28px 24px;
    background: linear-gradient(135deg,
      rgba(255,255,255,0.85) 0%,
      rgba(255,255,255,0.6) 100%);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.4);
    box-shadow:
      0 20px 60px rgba(49,130,246,0.08),
      0 8px 24px rgba(0,0,0,0.04),
      inset 0 1px 0 rgba(255,255,255,0.6);
    animation: totFadeUp 0.6s cubic-bezier(0.33,1,0.68,1) both;
    overflow: hidden;
  }
  .tot-solution::before {
    content: ''; position: absolute; top: -40%; right: -20%; width: 260px; height: 260px;
    background: radial-gradient(circle, rgba(49,130,246,0.06) 0%, transparent 70%);
    pointer-events: none;
  }
  .tot-solution-badge {
    display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px;
    border-radius: 20px; font-size: 11px; font-weight: 700;
    background: rgba(5,150,105,0.08); color: var(--accent-success);
    border: 1px solid rgba(5,150,105,0.15); margin-bottom: 14px;
  }

  /* ToT Accordion */
  .tot-accordion-trigger {
    display: flex; align-items: center; justify-content: space-between; width: 100%;
    padding: 14px 16px; background: var(--bg-surface-2); border: 1px solid var(--glass-border);
    border-radius: 12px; cursor: pointer; font-family: var(--font-sans);
    transition: all 0.25s cubic-bezier(0.33,1,0.68,1);
  }
  .tot-accordion-trigger:hover {
    background: var(--bg-hover); border-color: var(--glass-border-active);
  }
  .tot-accordion-body {
    overflow: hidden; transition: max-height 0.45s cubic-bezier(0.33,1,0.68,1), opacity 0.3s ease;
  }
  .tot-accordion-body.closed { max-height: 0; opacity: 0; }
  .tot-accordion-body.open { max-height: 2000px; opacity: 1; }
  .tot-pruned-reason {
    padding: 14px 16px; margin-top: 8px;
    background: var(--bg-surface-2); border-radius: 10px; border-left: 3px solid var(--accent-warning);
    font-size: 13px; color: var(--text-muted); line-height: 1.6; font-style: italic;
  }

  /* ToT Status Text */
  .tot-status-text {
    font-size: 14px; font-weight: 600; color: var(--text-secondary); text-align: center;
    animation: totFadeUp 0.4s cubic-bezier(0.33,1,0.68,1) both;
    letter-spacing: -0.02em;
  }

  /* Skeleton loader */
  .tot-skeleton {
    height: 120px; border-radius: 14px; background: linear-gradient(90deg,
      var(--bg-surface-2) 25%, var(--bg-surface-3) 50%, var(--bg-surface-2) 75%);
    background-size: 200% 100%; animation: totSkeleton 1.5s ease-in-out infinite;
  }
  @keyframes totSkeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  .history-overlay {
    position: fixed; inset: 0; background: rgba(15,23,42,0.42); backdrop-filter: blur(10px); z-index: 210;
    animation: fiu 0.25s ease-out;
  }
  .history-drawer {
    position: fixed; top: 0; right: 0; width: min(100vw, 400px); height: 100%; max-height: 100dvh;
    background: var(--bg-surface-1); box-shadow: -16px 0 48px rgba(0,0,0,0.1); z-index: 211;
    display: flex; flex-direction: column; animation: histIn 0.38s cubic-bezier(0.33,1,0.68,1);
    border-left: 1px solid var(--glass-border);
  }
  @keyframes histIn { from { transform: translateX(100%); opacity: 0.9; } to { transform: translateX(0); opacity: 1; } }
  .history-drawer-head {
    padding: 20px 20px 14px; border-bottom: 1px solid var(--glass-border);
    display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-shrink: 0;
  }
  .history-drawer-head h2 { font-size: 18px; font-weight: 800; letter-spacing: -0.03em; }
  .history-drawer-head p { font-size: 12px; color: var(--text-muted); margin-top: 4px; line-height: 1.45; }
  .history-drawer-actions { display: flex; gap: 6px; flex-shrink: 0; }
  .history-list-wrap { flex: 1; overflow-y: scroll; padding: 12px 16px 24px; scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.18) transparent; }
  .history-list-wrap::-webkit-scrollbar { width: 5px; }
  .history-list-wrap::-webkit-scrollbar-track { background: transparent; }
  .history-list-wrap::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 99px; }
  .history-list-wrap::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.32); }
  .history-empty {
    text-align: center; padding: 48px 20px; color: var(--text-muted); font-size: 14px; line-height: 1.6;
  }
  .history-row {
    display: flex; align-items: flex-start; gap: 12px; padding: 14px 14px;
    background: var(--bg-surface-2); border-radius: 12px; border: 1px solid var(--glass-border); cursor: pointer;
    transition: all 0.2s cubic-bezier(0.33,1,0.68,1); text-align: left; width: 100%;
    font-family: var(--font-sans);
  }
  .history-row:hover { border-color: rgba(49,130,246,0.2); box-shadow: var(--shadow-sm); transform: translateY(-1px); }
  .history-row-icon { font-size: 24px; flex-shrink: 0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--bg-surface-1); border-radius: 10px; }
  .history-row-body { flex: 1; min-width: 0; }
  .history-row-title { font-size: 14px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .history-row-meta { font-size: 11px; color: var(--text-muted); margin-top: 6px; font-weight: 500; }
  .history-row-del {
    flex-shrink: 0; width: 28px; min-width: 28px; height: 28px; border: 1px solid var(--glass-border); border-radius: 8px; background: var(--bg-surface-1);
    color: #9ca3af; cursor: pointer; font-size: 16px; font-weight: 600; line-height: 1;
    display: flex; align-items: center; justify-content: center; align-self: center;
    transition: all 0.15s; font-family: var(--font-sans);
  }
  .history-row-del:hover { background: rgba(220,38,38,0.08); color: var(--accent-error); border-color: rgba(220,38,38,0.2); }

  .history-detail-overlay {
    position: fixed; inset: 0; z-index: 220; background: rgba(15,23,42,0.5); backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center; padding: 16px; animation: fiu 0.2s ease-out;
  }
  .history-detail-panel {
    width: 100%; max-width: 720px; max-height: min(94vh, 1100px); overflow: hidden; display: flex; flex-direction: column;
    background: var(--bg-surface-1); border-radius: 16px; box-shadow: 0 24px 64px rgba(0,0,0,0.18); border: 1px solid var(--glass-border);
    animation: fiu 0.35s cubic-bezier(0.33,1,0.68,1);
  }
  .history-detail-head {
    padding: 18px 20px; border-bottom: 1px solid var(--glass-border); display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-shrink: 0;
  }
  .history-detail-head h3 { font-size: 17px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.3; }
  .history-detail-scroll {
    flex: 1; min-height: 200px; overflow-y: scroll; padding: 20px;
    scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.15) transparent;
  }
  .history-detail-scroll::-webkit-scrollbar { width: 5px; }
  .history-detail-scroll::-webkit-scrollbar-track { background: transparent; }
  .history-detail-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 99px; }
  .history-detail-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.28); }
  .history-detail-footer {
    flex-shrink: 0; border-top: 1px solid var(--glass-border);
    background: var(--bg-surface-2); border-radius: 0 0 16px 16px;
    overflow-y: auto; max-height: 45%;
    scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.15) transparent;
  }
  .history-detail-footer::-webkit-scrollbar { width: 4px; }
  .history-detail-footer::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 99px; }
  .history-detail-footer-inner { padding: 12px 20px 16px; }

  .footer { text-align: center; padding: 20px 0 16px; border-top: 1px solid var(--glass-border); margin-top: 20px; }
  .footer span { font-size: 11px; color: var(--text-muted); letter-spacing: 0.5px; font-weight: 500; }

  /* ── 9:16 Mobile (max-width: 480px) ── */
  @media (max-width: 480px) {
    .app-shell { padding: 0 12px; }
    .top-toolbar { padding: 8px 0 8px; gap: 6px; }
    .brand-mark { width: 34px; height: 34px; border-radius: 9px; }
    .brand-mark svg { width: 16px; height: 16px; }
    .brand-lines strong { font-size: 13px; }
    .brand-lines span { font-size: 9.5px; }
    .brand-title-row { flex-direction: column; align-items: flex-start; gap: 4px; }
    .plan-badges { width: 100%; }
    .plan-pill { font-size: 9px; padding: 2px 7px; }
    .idea-input-toolbar { padding: 6px 8px; flex-wrap: wrap; }
    .idea-input-load-btn { padding: 5px 10px; font-size: 11px; }
    .icon-tool-btn { width: 32px; height: 32px; }
    .hero { padding: 20px 0 14px; }
    .hero-badge { padding: 3px 8px; font-size: 10px; margin-bottom: 10px; }
    .hero h1 { font-size: 26px; margin-bottom: 4px; }
    .hero p { font-size: 13.5px; }
    .home-cat-bar { margin-bottom: 10px; gap: 2px; }
    .home-cat-tab { padding: 6px 12px; font-size: 12px; }
    .mode-grid { gap: 6px; padding-bottom: 20px; }
    .mode-card { padding: 14px 14px; gap: 12px; border-radius: var(--radius-md); }
    .mc-icon { width: 40px; height: 40px; border-radius: 10px; font-size: 19px; }
    .mc-name { font-size: 14px; }
    .mc-desc { font-size: 12px; }
    .s-label { font-size: 10px; margin-bottom: 6px; }
    .mode-title { font-size: 18px; margin: 4px 0 12px; }
    input[type="text"], input[type="password"], textarea, select { padding: 10px 12px; font-size: 14px; }
    .btn-cta { padding: 13px; font-size: 14px; }
    .r-card { padding: 12px; }
    .r-card-header { gap: 8px; flex-wrap: wrap; }
    .r-card-title { font-size: 13px; }
    .synth-card { padding: 14px; }
    .synth-card h3 { font-size: 14px; }
    .tot-branches { grid-template-columns: 1fr; gap: 8px; }
    .tot-solution { padding: 16px 14px; border-radius: 12px; }
    .tot-stepper { gap: 0; }
    .tot-step-dot { width: 28px; height: 28px; font-size: 12px; }
    .tot-step-label { font-size: 9.5px; }
    .tournament-slot-grid { gap: 6px; }
    .tournament-slot-textarea { min-height: 56px; font-size: 13px; padding: 8px 10px; }
    .final-rank { padding: 12px; gap: 10px; }
    .rank-medal { font-size: 26px; }
    .rank-title { font-size: 13px; }
    .bracket-scroll { gap: 6px; }
    .bracket-round-title { font-size: 11px; }
    .bracket-match { padding: 7px 9px; }
    .history-drawer { width: 100vw; }
    .history-detail-panel { width: 100vw; max-height: 96vh; }
    .modal-sheet { max-height: 92vh; }
    .scamper-grid { grid-template-columns: 1fr; }
    .footer { padding: 14px 0 12px; margin-top: 14px; }
    .footer span { font-size: 9.5px; }
  }

  /* ── Desktop scale-up (min-width: 640px) ── */
  @media (min-width: 640px) {
    .top-toolbar { padding: 14px 4px 16px; gap: 12px; }
    .brand-mark { width: 42px; height: 42px; border-radius: 12px; }
    .brand-lines strong { font-size: 16px; }
    .icon-tool-btn { width: 38px; height: 38px; }
    .hero { padding: 40px 4px 28px; }
    .hero-badge { padding: 5px 14px; font-size: 11.5px; margin-bottom: 16px; }
    .hero h1 { font-size: 36px; margin-bottom: 10px; letter-spacing: -0.05em; }
    .hero p { font-size: 16px; }
    .mode-grid { gap: 8px; padding-bottom: 40px; }
    .mode-card { padding: 18px 22px; gap: 16px; }
    .mc-icon { width: 48px; height: 48px; font-size: 23px; border-radius: 14px; }
    .mc-name { font-size: 16px; }
    .mc-desc { font-size: 13.5px; }
    .s-label { font-size: 13px; margin-bottom: 8px; }
    .mode-title { font-size: 22px; margin: 8px 0 20px; }
    .footer { padding: 32px 0 20px; margin-top: 32px; }
  }

  /* ── Mini Stack Popover (상황 보강 / 피드백 방향 히스토리) ── */
  .mini-stack-wrap { position: relative; display: inline-flex; }
  .mini-stack-btn {
    padding: 3px 9px; border-radius: 8px; font-size: 11px; font-weight: 600;
    border: 1px solid var(--glass-border); background: var(--bg-surface-2);
    color: var(--text-muted); cursor: pointer; font-family: var(--font-sans);
    transition: all 0.15s; white-space: nowrap; display: flex; align-items: center; gap: 4px;
  }
  .mini-stack-btn:hover { border-color: var(--accent-primary); color: var(--accent-primary); background: rgba(49,130,246,0.04); }
  .mini-stack-popover {
    position: absolute; top: calc(100% + 6px); right: 0; z-index: 130; width: min(280px, 88vw);
    background: var(--bg-surface-1); border: 1px solid var(--glass-border); border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12); overflow: hidden; animation: fiu 0.18s ease-out;
  }
  .mini-stack-list { max-height: 180px; overflow-y: auto; padding: 4px 0; scrollbar-width: thin; }
  .mini-stack-list::-webkit-scrollbar { width: 4px; }
  .mini-stack-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 99px; }
  .mini-stack-item {
    display: flex; align-items: flex-start; gap: 8px; padding: 8px 12px;
    cursor: pointer; transition: background 0.12s;
  }
  .mini-stack-item:hover { background: var(--bg-surface-2); }
  .mini-stack-item span { flex: 1; font-size: 12px; color: var(--text-primary); line-height: 1.45; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .mini-stack-item button { border: none; background: none; cursor: pointer; color: var(--text-muted); font-size: 13px; padding: 0 2px; flex-shrink: 0; }
  .mini-stack-item button:hover { color: var(--accent-error); }
  .mini-stack-empty { padding: 12px; font-size: 12px; color: var(--text-muted); text-align: center; }
  .feedback-field-wrap { position: relative; }
  .feedback-field-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 6px;
  }
  .feedback-field-header .s-label { margin: 0; }

  /* ── Context Editor & Upload ── */
  .idea-context-toggle {
    display: flex; align-items: center; gap: 6px; padding: 6px 0; cursor: pointer;
    font-size: 12.5px; font-weight: 600; color: var(--text-muted); border: none;
    background: none; font-family: var(--font-sans); transition: color 0.15s;
    letter-spacing: -0.01em;
  }
  .idea-context-toggle svg { flex-shrink: 0; opacity: 0.6; }
  .idea-context-toggle:hover { color: var(--text-secondary); }
  .idea-context-toggle:hover svg { opacity: 1; }
  .idea-context-toggle .toggle-arrow {
    font-size: 10px; transition: transform 0.2s ease; display: inline-block;
  }
  .idea-context-toggle .toggle-arrow.open { transform: rotate(90deg); }
  .idea-context-field {
    width: 100%; padding: 10px 12px; font-size: 13px;
    border: 1px solid var(--glass-border); border-radius: 10px;
    background: linear-gradient(135deg, rgba(49,130,246,0.02), rgba(124,58,237,0.02));
    color: var(--text-primary); font-family: var(--font-sans);
    resize: vertical; min-height: 40px; line-height: 1.5;
    transition: border-color 0.2s, box-shadow 0.2s;
    margin-top: 4px;
  }
  .idea-context-field:focus {
    outline: none; border-color: rgba(124,58,237,0.3);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.06);
  }
  .idea-context-field::placeholder { color: var(--text-muted); font-size: 12px; }
  .upload-section {
    border-top: 1px solid var(--glass-border); padding: 14px 16px 10px; margin-top: 4px;
  }
  .upload-section-title {
    font-size: 12px; font-weight: 700; color: var(--text-secondary);
    letter-spacing: -0.01em; margin-bottom: 10px;
    display: flex; align-items: center; gap: 6px;
  }
  .upload-section-title svg { flex-shrink: 0; opacity: 0.55; }
  .upload-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .upload-chip {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 10px; font-size: 12px; font-weight: 600;
    border: 1px solid var(--glass-border); background: var(--bg-surface-1);
    color: var(--text-secondary); cursor: pointer; font-family: var(--font-sans);
    transition: all 0.15s; position: relative; overflow: hidden;
  }
  .upload-chip:hover {
    border-color: rgba(37,99,235,0.25); color: var(--accent-primary);
    background: rgba(37,99,235,0.04); transform: translateY(-0.5px);
    box-shadow: 0 2px 8px rgba(37,99,235,0.06);
  }
  .upload-chip:active { transform: scale(0.97); }
  .upload-chip input[type="file"] {
    position: absolute; inset: 0; opacity: 0; cursor: pointer; font-size: 0;
  }
  .upload-chip.processing { pointer-events: none; opacity: 0.6; }
  .upload-chip-icon {
    display: flex; align-items: center; justify-content: center;
    width: 20px; height: 20px; border-radius: 5px; flex-shrink: 0;
  }
  .upload-chip-icon svg { display: block; }
  .upload-progress {
    display: flex; align-items: center; gap: 8px; padding: 8px 12px; margin-top: 8px;
    background: rgba(37,99,235,0.04); border: 1px solid rgba(37,99,235,0.08);
    border-radius: 10px; font-size: 12px;
    color: var(--text-secondary); animation: fiu 0.3s ease-out;
  }
  .video-link-row {
    display: flex; gap: 6px; margin-top: 8px;
  }
  .video-link-input {
    flex: 1; padding: 9px 12px; font-size: 13px; border: 1px solid var(--glass-border);
    border-radius: 10px; background: var(--bg-surface-2); color: var(--text-primary);
    font-family: var(--font-sans); transition: border-color 0.2s, box-shadow 0.2s;
  }
  .video-link-input:focus { outline: none; border-color: rgba(37,99,235,0.3); box-shadow: 0 0 0 3px rgba(37,99,235,0.05); }
  .video-link-input::placeholder { color: var(--text-muted); }
  .video-link-btn {
    padding: 9px 16px; border-radius: 10px; font-size: 12.5px; font-weight: 700;
    border: none; background: var(--accent-primary); letter-spacing: -0.01em;
    color: #fff; cursor: pointer; font-family: var(--font-sans);
    transition: all 0.18s ease; white-space: nowrap;
  }
  .video-link-btn:hover { background: #1d4ed8; transform: translateY(-0.5px); box-shadow: 0 2px 8px rgba(37,99,235,0.2); }
  .video-link-btn:active { transform: scale(0.97); }
  .video-link-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

  /* ── Task Runner Badge ── */
  .task-running-badge {
    position: absolute; top: 6px; right: 6px; width: 10px; height: 10px; border-radius: 50%;
    background: #f59e0b; border: 2px solid var(--bg-surface-1);
    animation: taskPulse 1.5s ease-in-out infinite; z-index: 5;
  }
  @keyframes taskPulse {
    0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); }
  }
  .task-done-badge {
    position: absolute; top: 6px; right: 6px; width: 10px; height: 10px; border-radius: 50%;
    background: var(--accent-success); border: 2px solid var(--bg-surface-1); z-index: 5;
  }
  .toast-alert {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    padding: 14px 24px; border-radius: 14px; z-index: 300;
    background: var(--text-primary); color: var(--bg-surface-1);
    font-size: 14px; font-weight: 600; font-family: var(--font-sans);
    box-shadow: 0 12px 40px rgba(0,0,0,0.25); cursor: pointer;
    display: flex; align-items: center; gap: 10px;
    animation: toastIn 0.4s cubic-bezier(0.33,1,0.68,1);
  }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

  .app-toast-stack { position: fixed; inset: 0; pointer-events: none; z-index: 10000; }
  .app-toast {
    position: fixed; left: 50%; transform: translateX(-50%);
    padding: 12px 22px; border-radius: 14px;
    font-size: 13.5px; font-weight: 600; font-family: var(--font-sans);
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 8px 28px rgba(0,0,0,0.18);
    animation: toastIn 0.4s cubic-bezier(0.33,1,0.68,1);
    pointer-events: auto; max-width: min(420px, calc(100vw - 32px));
    word-break: keep-all; line-height: 1.45;
  }
  .app-toast-error { background: #fef2f2; color: #991b1b; border: 1px solid rgba(239,68,68,0.3); }
  .app-toast-warn  { background: #fffbeb; color: #92400e; border: 1px solid rgba(245,158,11,0.3); }
  .app-toast-info  { background: #eff6ff; color: #1e40af; border: 1px solid rgba(59,130,246,0.3); }
  .app-toast-icon  { font-size: 16px; flex-shrink: 0; }

  /* ── Deep Analysis Panel ── */
  .deep-analysis-panel {
    margin-top: 20px; border-radius: 16px;
    border: 1px solid var(--glass-border);
    background: var(--bg-surface-1); overflow: hidden;
  }
  .deep-analysis-toggle {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px; border: none;
    background: linear-gradient(135deg, rgba(49,130,246,0.04), rgba(124,58,237,0.03));
    cursor: pointer; font-family: var(--font-sans); transition: background 0.2s;
  }
  .deep-analysis-toggle:hover {
    background: linear-gradient(135deg, rgba(49,130,246,0.07), rgba(124,58,237,0.05));
  }
  .deep-analysis-toggle-left { display: flex; align-items: center; gap: 12px; }
  .deep-analysis-toggle-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #3182f6, #7c3aed);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0; color: #fff; font-weight: 800;
  }
  .deep-analysis-toggle-title {
    font-size: 14px; font-weight: 800; color: var(--text-primary);
    letter-spacing: -0.02em; text-align: left;
  }
  .deep-analysis-toggle-desc {
    font-size: 11px; color: var(--text-muted); margin-top: 1px; text-align: left;
  }
  .deep-analysis-arrow {
    font-size: 13px; color: var(--text-muted);
    transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
  }
  .deep-analysis-arrow[data-open="true"] { transform: rotate(180deg); }
  .deep-analysis-body { padding: 4px 16px 16px; border-top: 1px solid var(--glass-border); }
  .deep-analysis-cat-label {
    display: flex; align-items: center; gap: 6px;
    margin: 16px 0 8px 2px; font-size: 11px; font-weight: 700;
    color: var(--text-muted); letter-spacing: 0.02em;
  }
  .deep-analysis-cat-label:first-child { margin-top: 12px; }
  .deep-analysis-cat-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

  /* ── Report Addon Sections ── */
  .report-addon-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  }
  @media (max-width: 420px) { .report-addon-grid { grid-template-columns: 1fr; } }
  .report-addon-btn {
    display: flex; flex-direction: column; align-items: flex-start; gap: 3px;
    padding: 12px 14px; border-radius: 12px; font-size: 13px; font-weight: 700;
    border: 1px solid var(--glass-border); background: var(--bg-surface-2);
    color: var(--text-primary); cursor: pointer; font-family: var(--font-sans);
    transition: all 0.2s; text-align: left; min-height: 52px;
  }
  .report-addon-btn .addon-icon-label {
    display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700;
  }
  .report-addon-btn .addon-desc {
    font-size: 11px; font-weight: 400; color: var(--text-muted); line-height: 1.3;
  }
  .report-addon-btn:hover:not(:disabled) {
    border-color: var(--accent-primary); background: rgba(49,130,246,0.04);
    box-shadow: 0 2px 8px rgba(49,130,246,0.08); transform: translateY(-1px);
  }
  .report-addon-btn:active:not(:disabled) { transform: translateY(0); }
  .report-addon-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .report-addon-btn.active {
    border-color: var(--accent-primary);
    background: linear-gradient(135deg, rgba(49,130,246,0.08), rgba(124,58,237,0.04));
    box-shadow: 0 2px 8px rgba(49,130,246,0.1);
  }
  /* standalone addon button (map, investor, expert) inside panel */
  .report-addon-btn.full-width {
    flex-direction: row; align-items: center; gap: 8px;
    min-height: 44px; justify-content: flex-start;
  }
  .report-addon-btn.full-width .addon-desc { margin-left: auto; font-weight: 500; }
  .report-export-bar {
    display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap;
  }
  .report-export-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 700;
    border: 1px solid var(--glass-border); background: var(--bg-surface-1);
    color: var(--text-primary); cursor: pointer; font-family: var(--font-sans);
    transition: all 0.2s; flex: 1; justify-content: center;
  }
  .report-export-btn:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-sm); }

  /* ── Brand & Viral Section ── */
  .brand-viral-bar {
    display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap;
  }
  .brand-viral-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 11px 16px; border-radius: 12px; font-size: 13px; font-weight: 700;
    border: none; cursor: pointer; font-family: var(--font-sans); flex: 1;
    justify-content: center; transition: all 0.2s; letter-spacing: -0.01em;
  }
  .brand-viral-btn.branding {
    background: linear-gradient(135deg, rgba(124,58,237,0.08), rgba(49,130,246,0.06));
    color: #7c3aed; border: 1px solid rgba(124,58,237,0.2);
  }
  .brand-viral-btn.branding:hover:not(:disabled) { background: linear-gradient(135deg, rgba(124,58,237,0.14), rgba(49,130,246,0.1)); box-shadow: 0 4px 16px rgba(124,58,237,0.15); }
  .brand-viral-btn.viral {
    background: linear-gradient(135deg, rgba(236,72,153,0.08), rgba(245,158,11,0.06));
    color: #ec4899; border: 1px solid rgba(236,72,153,0.2);
  }
  .brand-viral-btn.viral:hover:not(:disabled) { background: linear-gradient(135deg, rgba(236,72,153,0.14), rgba(245,158,11,0.1)); box-shadow: 0 4px 16px rgba(236,72,153,0.15); }
  .brand-viral-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .brand-viral-result {
    margin-top: 8px; border-radius: 14px; overflow: hidden;
    border: 1px solid var(--glass-border); animation: fiu 0.3s ease-out;
  }
  .brand-viral-result-head { padding: 11px 14px; display: flex; align-items: center; gap: 10px; justify-content: space-between; cursor: pointer; }
  .brand-viral-result-head h4 { font-size: 13px; font-weight: 800; letter-spacing: -0.02em; margin: 0; }
  .brand-viral-result-body { padding: 0 14px 14px; }

  .report-scroll-box {
    max-height: min(75vh, 800px); overflow-y: auto; padding-right: 4px;
    scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.12) transparent;
  }
  @media (max-width: 768px) { .report-scroll-box { max-height: min(65vh, 600px); } }
  .report-scroll-box::-webkit-scrollbar { width: 5px; }
  .report-scroll-box::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 99px; }
  .addon-result-header {
    cursor: pointer; display: flex; align-items: center; padding: 12px 14px;
    border-radius: 10px; transition: background 0.15s;
  }
  .addon-result-header:hover { background: rgba(0,0,0,0.02); }
  .addon-result-collapse {
    margin-left: auto; border: none; background: none; cursor: pointer;
    font-size: 12px; color: var(--text-muted); transition: transform 0.2s;
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  }
  .addon-result-collapse:hover { background: rgba(0,0,0,0.04); }
  .addon-result-collapse[data-open="true"] { transform: rotate(180deg); }

  .loading-dots::after {
    content: ''; display: inline-block; width: 1.2em; text-align: left;
    animation: loadDots 1.4s steps(4, end) infinite;
  }
  @keyframes loadDots {
    0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; }
  }

  /* ── Report scroll + sticky actions ── */
  .report-scroll-area {
    overflow-y: auto; padding-right: 4px;
    scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.18) transparent;
  }
  .report-scroll-area::-webkit-scrollbar { width: 5px; }
  .report-scroll-area::-webkit-scrollbar-track { background: transparent; }
  .report-scroll-area::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 99px; }
  .report-scroll-area::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
  .report-sticky-actions {
    position: relative; z-index: 2; margin-top: 16px;
    padding: 0;
  }
  .report-sticky-actions > * { pointer-events: auto; }
  .report-sticky-inner {
    background: var(--bg-surface-1); border: 1px solid var(--glass-border);
    border-radius: 14px; padding: 12px 14px;
    box-shadow: 0 -4px 24px rgba(0,0,0,0.06);
  }

  /* ── Quantum Simulator ── */
  .quantum-sim-cta {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 14px 20px; margin-top: 16px;
    border-radius: 14px; font-size: 14px; font-weight: 800;
    border: none; cursor: pointer; font-family: var(--font-sans);
    background: linear-gradient(135deg, #3182f6 0%, #7c3aed 50%, #ec4899 100%);
    color: #fff; letter-spacing: -0.02em;
    box-shadow: 0 4px 20px rgba(49,130,246,0.25), 0 0 0 1px rgba(255,255,255,0.1) inset;
    transition: all 0.3s cubic-bezier(0.33,1,0.68,1);
    position: relative; overflow: hidden;
  }
  .quantum-sim-cta::before {
    content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
    background: conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.12) 10%, transparent 20%);
    animation: brandShimmer 3s linear infinite;
  }
  .quantum-sim-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(49,130,246,0.35); }
  .quantum-sim-cta:active { transform: scale(0.98); }

  .quantum-sim-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    animation: qsFadeIn 0.2s ease-out;
  }
  @keyframes qsFadeIn { from { opacity: 0; } to { opacity: 1; } }

  .quantum-sim-panel {
    width: min(94vw, 720px); max-height: 92vh;
    background: var(--bg-surface-1); border-radius: 20px;
    border: 1px solid var(--glass-border);
    box-shadow: 0 24px 80px rgba(0,0,0,0.2);
    display: flex; flex-direction: column;
    animation: fiu 0.4s cubic-bezier(0.33,1,0.68,1);
    overflow: hidden;
  }
  .qs-header {
    flex-shrink: 0; padding: 20px 24px 16px;
    border-bottom: 1px solid var(--glass-border);
    display: flex; align-items: flex-start; justify-content: space-between;
  }
  .qs-header-text h2 { font-size: 20px; font-weight: 800; letter-spacing: -0.03em; color: var(--text-primary); margin: 0 0 4px; }
  .qs-header-text p { font-size: 12px; color: var(--text-muted); margin: 0; }
  .qs-body {
    flex: 1; overflow-y: auto; padding: 20px 24px;
    scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.15) transparent;
  }
  .qs-body::-webkit-scrollbar { width: 5px; }
  .qs-body::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 99px; }

  .qs-settings-card {
    background: var(--bg-surface-2); border-radius: 16px;
    padding: 28px; border: 1px solid var(--glass-border);
  }
  .qs-week-control {
    display: flex; align-items: center; justify-content: center; gap: 20px;
    margin: 20px 0 28px;
  }
  .qs-week-btn {
    width: 40px; height: 40px; border-radius: 12px;
    background: var(--bg-surface-1); border: 1px solid var(--glass-border);
    color: var(--text-primary); font-size: 20px; font-weight: 700;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; font-family: var(--font-sans);
  }
  .qs-week-btn:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
  .qs-week-btn:active { transform: scale(0.92); }
  .qs-week-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .qs-week-display {
    font-size: 36px; font-weight: 800; letter-spacing: -0.06em;
    color: var(--text-primary); min-width: 100px; text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .qs-week-display span { font-size: 16px; font-weight: 600; color: var(--text-muted); letter-spacing: 0; }

  .qs-slider-wrap { position: relative; height: 20px; margin: 8px 0 28px; }
  .qs-slider-track {
    position: absolute; top: 7px; left: 0; right: 0; height: 6px; border-radius: 3px;
    background: var(--bg-surface-3);
  }
  .qs-slider-fill {
    position: absolute; top: 7px; left: 0; height: 6px; border-radius: 3px;
    background: linear-gradient(90deg, #3182f6, #7c3aed);
    transition: width 0.15s;
  }
  .qs-slider-input {
    position: absolute; top: 0; left: 0; width: 100%; height: 20px;
    -webkit-appearance: none; appearance: none; background: transparent;
    margin: 0; cursor: pointer; z-index: 2;
  }
  .qs-slider-input::-webkit-slider-thumb {
    -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%;
    background: #fff; border: 2px solid var(--accent-primary);
    box-shadow: 0 2px 8px rgba(49,130,246,0.3); cursor: pointer;
  }

  .qs-segment {
    display: flex; gap: 4px; background: var(--bg-surface-3);
    border-radius: 12px; padding: 5px;
  }
  .qs-segment-btn {
    flex: 1; padding: 12px 14px; border-radius: 10px;
    font-size: 13px; font-weight: 700; border: none;
    cursor: pointer; font-family: var(--font-sans);
    background: transparent; color: var(--text-muted);
    transition: all 0.2s; letter-spacing: -0.02em;
  }
  .qs-segment-btn.active {
    background: var(--bg-surface-1); color: var(--text-primary);
    box-shadow: var(--shadow-sm);
  }
  .qs-segment-btn.optimistic.active { color: #059669; }
  .qs-segment-btn.neutral.active { color: #3182f6; }
  .qs-segment-btn.pessimistic.active { color: #dc2626; }

  .qs-run-btn {
    width: 100%; padding: 14px; margin-top: 24px;
    border-radius: 14px; font-size: 15px; font-weight: 800;
    border: none; cursor: pointer; font-family: var(--font-sans);
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff; letter-spacing: -0.02em;
    box-shadow: 0 4px 16px rgba(99,102,241,0.28); transition: all 0.2s;
  }
  .qs-run-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(99,102,241,0.38); }
  .qs-run-btn:active { transform: scale(0.98); }
  .qs-run-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .qs-callout {
    padding: 16px 18px; border-radius: 12px;
    background: rgba(49,130,246,0.04); border-left: 3px solid var(--accent-primary);
    margin-bottom: 20px;
  }
  .qs-callout p { font-size: 14px; color: var(--text-secondary); line-height: 1.7; margin: 0; }

  .qs-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
  .qs-stat-card {
    padding: 16px; border-radius: 14px;
    background: var(--bg-surface-2); border: 1px solid var(--glass-border); text-align: center;
  }
  .qs-stat-value { font-size: 28px; font-weight: 900; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; }
  .qs-stat-label { font-size: 11px; font-weight: 600; color: var(--text-muted); margin-top: 4px; }

  .qs-gauge-wrap {
    width: 100%; height: 8px; border-radius: 4px;
    background: var(--bg-surface-3); margin-top: 8px; overflow: hidden;
  }
  .qs-gauge-fill { height: 100%; border-radius: 4px; transition: width 0.8s cubic-bezier(0.33,1,0.68,1); }

  .qs-timeline { position: relative; padding-left: 24px; }
  .qs-timeline::before {
    content: ''; position: absolute; left: 8px; top: 0; bottom: 0;
    width: 2px; background: linear-gradient(to bottom, var(--accent-primary), #7c3aed, #ec4899);
    border-radius: 1px;
  }
  .qs-week-item { position: relative; margin-bottom: 8px; }
  .qs-week-dot {
    position: absolute; left: -20px; top: 14px;
    width: 12px; height: 12px; border-radius: 50%;
    background: var(--bg-surface-1); border: 2px solid var(--accent-primary); z-index: 1;
  }
  .qs-week-header {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border-radius: 12px;
    background: var(--bg-surface-2); border: 1px solid var(--glass-border);
    cursor: pointer; transition: all 0.2s; user-select: none;
  }
  .qs-week-header:hover { border-color: rgba(49,130,246,0.2); background: rgba(49,130,246,0.03); }
  .qs-week-header.expanded {
    border-radius: 12px 12px 0 0; border-bottom-color: transparent;
    background: rgba(49,130,246,0.04); border-color: rgba(49,130,246,0.15);
  }
  .qs-week-badge {
    display: inline-flex; padding: 3px 10px; border-radius: 8px;
    font-size: 11px; font-weight: 800; color: #fff;
    background: var(--accent-primary); white-space: nowrap; flex-shrink: 0;
  }
  .qs-week-phase {
    font-size: 10px; font-weight: 600; color: var(--text-muted);
    padding: 2px 8px; border-radius: 6px; background: var(--bg-surface-3); white-space: nowrap;
  }
  .qs-week-goal {
    flex: 1; font-size: 13px; font-weight: 600; color: var(--text-primary);
    letter-spacing: -0.02em; min-width: 0; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap;
  }
  .qs-week-arrow {
    font-size: 12px; color: var(--text-muted); transition: transform 0.2s; flex-shrink: 0;
  }
  .qs-week-arrow.expanded { transform: rotate(180deg); }
  .qs-week-body {
    padding: 16px; border-radius: 0 0 12px 12px;
    border: 1px solid rgba(49,130,246,0.15); border-top: none;
    background: var(--bg-surface-1);
    animation: qsSlide 0.25s ease-out;
  }
  @keyframes qsSlide { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

  .qs-section-title {
    font-size: 11px; font-weight: 800; color: var(--accent-primary);
    letter-spacing: 0.03em; margin-bottom: 8px; margin-top: 14px;
  }
  .qs-section-title:first-child { margin-top: 0; }

  .qs-checklist { list-style: none; padding: 0; margin: 0; }
  .qs-checklist li {
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 13px; color: var(--text-secondary); line-height: 1.6; padding: 4px 0;
  }
  .qs-checklist li::before { content: '☐'; flex-shrink: 0; color: var(--accent-primary); font-size: 14px; }

  .qs-scenario-block {
    padding: 12px 14px; border-radius: 10px;
    background: rgba(245,158,11,0.04); border: 1px solid rgba(245,158,11,0.12);
    font-size: 12px; color: var(--text-secondary); line-height: 1.7;
  }
  .qs-risk-card {
    padding: 12px 14px; border-radius: 10px;
    background: rgba(220,38,38,0.03); border: 1px solid rgba(220,38,38,0.1);
  }
  .qs-risk-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
  .qs-risk-prob, .qs-risk-impact {
    font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px;
  }
  .qs-resource-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .qs-resource-item {
    padding: 10px; border-radius: 10px;
    background: var(--bg-surface-2); border: 1px solid var(--glass-border);
  }
  .qs-resource-item .qs-res-label { font-size: 10px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px; }
  .qs-resource-item .qs-res-value { font-size: 12px; font-weight: 600; color: var(--text-primary); line-height: 1.4; }

  .qs-progress-bar { width: 100%; height: 4px; border-radius: 2px; background: var(--bg-surface-3); margin-top: 12px; overflow: hidden; }
  .qs-progress-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #3182f6, #7c3aed); transition: width 0.6s ease-out; }

  .qs-controls { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .qs-control-btn {
    font-size: 12px; font-weight: 600; color: var(--accent-primary);
    background: none; border: none; cursor: pointer; font-family: var(--font-sans); padding: 4px 0;
  }
  .qs-control-btn:hover { text-decoration: underline; }

  @media (max-width: 480px) {
    .quantum-sim-panel { width: 100%; height: 100vh; max-height: 100vh; border-radius: 0; }
    .qs-stats-grid { grid-template-columns: 1fr; }
    .qs-resource-grid { grid-template-columns: 1fr; }
    .qs-week-header { padding: 10px 12px; gap: 6px; }
    .qs-week-goal { font-size: 12px; }
    .qs-header { padding: 16px 16px 12px; }
    .qs-body { padding: 16px; }
    .qs-settings-card { padding: 16px; }
    .qs-week-display { font-size: 34px; }
  }

  /* ── Fact-Check Radar ── */
  .fc-radar-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 13px 20px; margin-top: 14px;
    border-radius: 14px; font-size: 13px; font-weight: 800;
    border: none; cursor: pointer; font-family: var(--font-sans);
    background: linear-gradient(135deg, #059669, #3182f6);
    color: #fff; letter-spacing: -0.01em;
    box-shadow: 0 0 18px rgba(5,150,105,0.2);
    transition: all 0.3s; position: relative; overflow: hidden;
    animation: fcGlow 2s ease-in-out infinite alternate;
  }
  @keyframes fcGlow {
    from { box-shadow: 0 0 12px rgba(5,150,105,0.2); }
    to { box-shadow: 0 0 28px rgba(5,150,105,0.4), 0 0 8px rgba(49,130,246,0.2); }
  }
  .fc-radar-btn:hover { transform: translateY(-2px); }
  .fc-radar-btn:active { transform: scale(0.97); }
  .fc-radar-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; animation: none; }

  .fc-scan-overlay {
    position: fixed; inset: 0; z-index: 10000; pointer-events: none;
    background: rgba(5,150,105,0.03);
    animation: fcScanBg 1.8s ease-out forwards;
  }
  @keyframes fcScanBg { 0% { opacity: 1; } 100% { opacity: 0; } }
  .fc-scan-line {
    position: absolute; left: 0; width: 100%; height: 3px;
    background: linear-gradient(90deg, transparent, rgba(5,150,105,0.6), rgba(49,130,246,0.6), transparent);
    box-shadow: 0 0 24px rgba(5,150,105,0.5), 0 0 80px rgba(49,130,246,0.3);
    animation: fcSweep 1.5s ease-in-out;
  }
  @keyframes fcSweep { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }

  .fc-stats-bar { display: flex; gap: 12px; margin-bottom: 16px; }
  .fc-stat-pill {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;
  }
  .fc-item {
    padding: 14px 16px; border-radius: 12px; margin-bottom: 8px;
    transition: all 0.2s;
  }
  .fc-item:hover { transform: translateX(2px); }
  .fc-item-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .fc-status-badge { font-size: 11px; font-weight: 800; letter-spacing: 0.02em; }
  .fc-quote {
    font-size: 14px; font-weight: 600; color: var(--text-primary);
    line-height: 1.6; margin-bottom: 6px; font-style: italic;
    padding-left: 12px; border-left: 2px solid rgba(0,0,0,0.1);
  }
  .fc-reason { font-size: 12px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 4px; }
  .fc-source {
    font-size: 11px; color: var(--accent-primary); font-weight: 600;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* ── Refine Copilot ── */
  .rc-fab {
    position: fixed; bottom: 24px; right: 24px; z-index: 100;
    width: 48px; height: 48px; border-radius: 50%;
    background: #ffffff;
    border: none; cursor: pointer; padding: 0;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04);
    transition: all 0.3s cubic-bezier(0.33,1,0.68,1);
  }
  .rc-fab:hover {
    transform: translateY(-3px) scale(1.06);
    box-shadow: 0 8px 28px rgba(99,102,241,0.2), 0 0 0 1px rgba(99,102,241,0.1);
  }
  .rc-fab:active { transform: scale(0.93); }
  .rc-fab-inner {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
    display: flex; align-items: center; justify-content: center;
    box-shadow: inset 0 1px 2px rgba(255,255,255,0.3);
  }
  .rc-fab-inner svg { filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1)); }

  .rc-toolbar {
    position: fixed; z-index: 10001; transform: translate(-50%, -100%);
    display: flex; gap: 3px; padding: 5px;
    background: #ffffff;
    border: 1px solid rgba(0,0,0,0.06);
    border-radius: 14px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.03);
    animation: rcToolbarIn 0.2s cubic-bezier(0.33,1,0.68,1);
  }
  @keyframes rcToolbarIn {
    from { opacity: 0; transform: translate(-50%, -92%) scale(0.95); }
    to { opacity: 1; transform: translate(-50%, -100%) scale(1); }
  }
  .rc-toolbar button {
    padding: 8px 14px; border: none; background: transparent; border-radius: 10px;
    font-size: 12px; font-weight: 700; color: #6b7280;
    cursor: pointer; font-family: var(--font-sans); white-space: nowrap;
    transition: all 0.15s; display: flex; align-items: center; gap: 4px;
  }
  .rc-toolbar button:hover { background: #f3f4f6; color: #1f2937; }
  .rc-toolbar button:first-child:hover { background: rgba(99,102,241,0.06); color: #6366f1; }
  .rc-toolbar::after {
    content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%);
    border-left: 6px solid transparent; border-right: 6px solid transparent;
    border-top: 6px solid #ffffff;
    filter: drop-shadow(0 1px 1px rgba(0,0,0,0.04));
  }

  .rc-panel-overlay {
    position: fixed; inset: 0; z-index: 9998;
    background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
    animation: qsFadeIn 0.2s ease-out;
  }
  .rc-panel {
    position: fixed; top: 0; right: 0; bottom: 0; width: min(420px, 92vw);
    background: var(--bg-surface-1); border-left: 1px solid var(--glass-border);
    box-shadow: -8px 0 40px rgba(0,0,0,0.12);
    display: flex; flex-direction: column;
    animation: rcSlideIn 0.3s cubic-bezier(0.33,1,0.68,1);
  }
  @keyframes rcSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .rc-panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; border-bottom: 1px solid var(--glass-border); flex-shrink: 0;
  }
  .rc-panel-header h3 { font-size: 16px; font-weight: 800; letter-spacing: -0.03em; margin: 0; }
  .rc-context-bar {
    padding: 12px 16px; background: rgba(124,58,237,0.04);
    border-bottom: 1px solid var(--glass-border); flex-shrink: 0;
    font-size: 12px; color: var(--text-muted); max-height: 80px;
    overflow-y: auto; line-height: 1.5;
  }
  .rc-messages {
    flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;
    scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.12) transparent;
  }
  .rc-messages::-webkit-scrollbar { width: 4px; }
  .rc-messages::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 99px; }
  .rc-msg { max-width: 92%; animation: fiu 0.3s ease-out; }
  .rc-msg-user { align-self: flex-end; }
  .rc-msg-user .rc-msg-bubble {
    padding: 10px 14px; border-radius: 14px 14px 4px 14px;
    background: var(--accent-primary); color: #fff; font-size: 13px; line-height: 1.6;
  }
  .rc-msg-assistant { align-self: flex-start; }
  .rc-msg-assistant .rc-msg-bubble {
    padding: 10px 14px; border-radius: 14px 14px 14px 4px;
    background: var(--bg-surface-2); color: var(--text-primary);
    font-size: 13px; line-height: 1.6; border: 1px solid var(--glass-border);
  }
  .rc-msg-system { align-self: center; }
  .rc-msg-system .rc-msg-bubble {
    padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 600;
    color: var(--text-muted); background: var(--bg-surface-2);
  }

  .rc-diff-wrap {
    margin-top: 10px; padding: 14px; border-radius: 12px;
    background: var(--bg-surface-1); border: 1px solid var(--glass-border);
  }
  .rc-diff-label { font-size: 10px; font-weight: 800; color: var(--text-muted); margin-bottom: 8px; letter-spacing: 0.04em; }
  .rc-diff-view {
    font-size: 13px; line-height: 1.8; color: var(--text-primary);
    white-space: pre-wrap; word-break: break-word;
  }
  .rc-diff-del {
    background: rgba(220,38,38,0.1); color: #dc2626; text-decoration: line-through;
    padding: 1px 3px; border-radius: 3px;
  }
  .rc-diff-add {
    background: rgba(5,150,105,0.1); color: #059669;
    padding: 1px 3px; border-radius: 3px; font-weight: 600;
  }
  .rc-diff-actions { display: flex; gap: 8px; margin-top: 12px; }
  .rc-accept-btn {
    flex: 1; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 800;
    border: none; cursor: pointer; font-family: var(--font-sans);
    background: var(--accent-success); color: #fff; transition: all 0.2s;
  }
  .rc-accept-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(5,150,105,0.3); }
  .rc-reject-btn {
    flex: 1; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 800;
    border: 1px solid var(--glass-border); cursor: pointer; font-family: var(--font-sans);
    background: var(--bg-surface-2); color: var(--text-secondary); transition: all 0.2s;
  }
  .rc-reject-btn:hover { border-color: #dc2626; color: #dc2626; }

  .rc-input-bar {
    display: flex; gap: 8px; padding: 12px 16px;
    border-top: 1px solid var(--glass-border); flex-shrink: 0;
    background: var(--bg-surface-2);
  }
  .rc-input-bar input {
    flex: 1; padding: 10px 14px; border-radius: 10px; font-size: 13px;
    background: var(--bg-surface-1); border: 1px solid var(--glass-border);
    font-family: var(--font-sans); color: var(--text-primary); outline: none;
  }
  .rc-input-bar input:focus { border-color: var(--accent-primary); }
  .rc-input-bar button {
    padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 700;
    border: none; cursor: pointer; font-family: var(--font-sans);
    background: var(--accent-primary); color: #fff; transition: all 0.2s; flex-shrink: 0;
  }
  .rc-input-bar button:hover { background: var(--accent-primary-hover); }
  .rc-input-bar button:disabled { opacity: 0.4; cursor: not-allowed; }

  @media (max-width: 768px) {
    .rc-panel-overlay { background: rgba(0,0,0,0.25); backdrop-filter: none; }
    .rc-panel {
      position: fixed; top: auto; right: 0; bottom: 0; left: 0;
      width: 100%; height: 45vh; min-height: 260px; max-height: 70vh;
      border-left: none; border-top: 1px solid var(--glass-border);
      border-radius: 18px 18px 0 0;
      box-shadow: 0 -8px 40px rgba(0,0,0,0.12);
      animation: rcSlideUp 0.35s cubic-bezier(0.33,1,0.68,1);
    }
    @keyframes rcSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .rc-panel-header {
      padding: 8px 16px 10px; position: relative;
    }
    .rc-panel-header::before {
      content: ''; position: absolute; top: 6px; left: 50%; transform: translateX(-50%);
      width: 36px; height: 4px; border-radius: 2px; background: rgba(0,0,0,0.12);
    }
    .rc-panel-header h3 { font-size: 14px; }
    .rc-context-bar { padding: 8px 14px; max-height: 48px; font-size: 11px; }
    .rc-messages { padding: 10px 14px; gap: 8px; }
    .rc-msg-user .rc-msg-bubble, .rc-msg-assistant .rc-msg-bubble { font-size: 12px; padding: 8px 12px; }
    .rc-input-bar { padding: 8px 12px; gap: 6px; padding-bottom: max(8px, env(safe-area-inset-bottom)); }
    .rc-input-bar input { padding: 8px 12px; font-size: 13px; }
    .rc-input-bar button { padding: 8px 14px; font-size: 12px; }
    .rc-fab { bottom: 16px; right: 16px; width: 44px; height: 44px; }
    .rc-fab-inner { width: 30px; height: 30px; }
  }

  /* ── FBO Badge ── */
  .fbo-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700;
    letter-spacing: 0.02em; margin-bottom: 8px;
  }
  .fbo-hit { background: rgba(5,150,105,0.08); color: var(--accent-success); border: 1px solid rgba(5,150,105,0.2); }
  .fbo-miss { background: rgba(245,158,11,0.08); color: #d97706; border: 1px solid rgba(245,158,11,0.2); }

  /* ── Report Chat ── */
  .report-chat-fab {
    position: fixed; right: 20px; bottom: 80px; z-index: 250;
    width: 52px; height: 52px; border-radius: 50%; border: none; cursor: pointer;
    background: linear-gradient(135deg, #3182f6, #7c3aed);
    box-shadow: 0 6px 24px rgba(49,130,246,0.38); display: flex; align-items: center; justify-content: center;
    font-size: 22px; transition: transform 0.2s, box-shadow 0.2s;
  }
  .report-chat-fab:hover { transform: scale(1.08); box-shadow: 0 8px 32px rgba(49,130,246,0.5); }
  .report-chat-fab .notif-dot { position: absolute; top: 4px; right: 4px; width: 10px; height: 10px; border-radius: 50%; background: #ef4444; border: 2px solid #fff; }
  .report-chat-panel {
    position: fixed; right: 16px; bottom: 144px; z-index: 260;
    width: min(380px, calc(100vw - 32px)); max-height: min(70vh, 560px);
    background: var(--bg-surface-1); border-radius: 20px;
    box-shadow: 0 16px 60px rgba(0,0,0,0.18); border: 1px solid var(--glass-border);
    display: flex; flex-direction: column; overflow: hidden;
    animation: chatSlideIn 0.3s cubic-bezier(0.33,1,0.68,1);
  }
  @keyframes chatSlideIn {
    from { opacity: 0; transform: translateY(20px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .report-chat-header {
    padding: 14px 16px; border-bottom: 1px solid var(--glass-border);
    display: flex; align-items: center; gap: 10px; flex-shrink: 0;
    background: linear-gradient(135deg, rgba(49,130,246,0.04), rgba(124,58,237,0.03));
  }
  .report-chat-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, #3182f6, #7c3aed);
    display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;
  }
  .report-chat-title { font-size: 14px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; }
  .report-chat-sub { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
  .report-chat-close { margin-left: auto; border: none; background: none; cursor: pointer; font-size: 18px; color: var(--text-muted); width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  .report-chat-close:hover { background: var(--bg-surface-2); }
  .report-chat-msgs {
    flex: 1; overflow-y: auto; padding: 14px 14px 8px; display: flex; flex-direction: column; gap: 10px;
  }
  .chat-msg { display: flex; gap: 8px; animation: fiu 0.25s ease-out; }
  .chat-msg.user { flex-direction: row-reverse; }
  .chat-bubble {
    max-width: 82%; padding: 10px 14px; border-radius: 16px; font-size: 13px; line-height: 1.6; word-break: keep-all;
  }
  .chat-msg.user .chat-bubble {
    background: var(--accent-primary); color: #fff; border-bottom-right-radius: 4px;
  }
  .chat-msg.ai .chat-bubble {
    background: var(--bg-surface-2); color: var(--text-primary); border-bottom-left-radius: 4px; border: 1px solid var(--glass-border);
  }
  .chat-avatar-sm {
    width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; margin-top: 2px;
    background: linear-gradient(135deg, #3182f6, #7c3aed);
    display: flex; align-items: center; justify-content: center; font-size: 13px;
  }
  .report-chat-quick {
    padding: 6px 12px 4px; display: flex; gap: 5px; flex-wrap: wrap; flex-shrink: 0; border-top: 1px solid var(--glass-border);
    background: var(--bg-surface-2);
  }
  .chat-quick-btn {
    padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
    border: 1px solid var(--glass-border); background: var(--bg-surface-1);
    color: var(--text-secondary); cursor: pointer; font-family: var(--font-sans);
    transition: all 0.15s; white-space: nowrap;
  }
  .chat-quick-btn:hover { border-color: var(--accent-primary); color: var(--accent-primary); background: rgba(49,130,246,0.04); }
  .report-chat-input-row {
    padding: 10px 12px 12px; display: flex; gap: 8px; flex-shrink: 0; align-items: flex-end;
  }
  .report-chat-input {
    flex: 1; padding: 9px 12px; border-radius: 12px; font-size: 13px;
    border: 1px solid var(--glass-border); background: var(--bg-surface-2);
    color: var(--text-primary); font-family: var(--font-sans); resize: none; max-height: 80px; min-height: 36px;
    line-height: 1.5;
  }
  .report-chat-input:focus { outline: none; border-color: var(--accent-primary); }
  .report-chat-send {
    width: 36px; height: 36px; border-radius: 12px; border: none; cursor: pointer;
    background: var(--accent-primary); color: #fff; font-size: 16px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s;
  }
  .report-chat-send:disabled { background: var(--bg-surface-3); cursor: not-allowed; }
  .report-chat-send:not(:disabled):hover { background: var(--accent-primary-hover); }

  /* ── Mix-up Roulette ── */
  .mix-wheel-area {
    display: flex; align-items: flex-start; justify-content: center; gap: 48px; margin: 0 0 20px;
    position: relative;
  }
  .mix-wheel-col { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; }
  .mix-wheel-label {
    font-size: 13px; font-weight: 700; color: #374151; letter-spacing: 0.04em; text-transform: uppercase;
    margin-bottom: 10px;
  }
  .mix-wheel {
    position: relative; width: 100%; height: 340px; overflow: hidden;
    border-radius: 20px; border: 1px solid rgba(255,255,255,0.6);
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%);
    box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8);
    user-select: none;
    display: flex; flex-direction: column;
  }
  .mix-wheel-nav {
    display: flex; align-items: center; justify-content: center;
    width: 100%; height: 36px; min-height: 36px; border: none; background: transparent;
    color: #94a3b8; cursor: pointer; transition: all 0.2s;
    flex-shrink: 0; z-index: 6; position: relative;
  }
  .mix-wheel-nav:hover:not(:disabled) { color: #2563eb; background: rgba(37,99,235,0.05); border-radius: 10px; }
  .mix-wheel-nav:disabled { opacity: 0.15; cursor: default; }
  .mix-wheel-scroll {
    flex: 1; min-height: 0; overflow-y: auto; scroll-snap-type: y mandatory;
    -webkit-overflow-scrolling: touch; scrollbar-width: none;
    padding: 130px 0;
  }
  .mix-wheel-scroll::-webkit-scrollbar { display: none; }
  .mix-wheel-slot {
    height: 72px; display: flex; align-items: center; justify-content: center;
    scroll-snap-align: center; padding: 0 16px;
    transition: opacity 0.25s ease, transform 0.25s ease, filter 0.25s ease;
  }
  .mix-wheel-slot:not(.mix-wheel-slot--active) {
    opacity: 0.25; transform: scale(0.78); filter: blur(0.5px);
  }
  .mix-wheel-slot--active {
    opacity: 1; transform: scale(1.08); z-index: 4; position: relative; filter: none;
  }
  .mix-wheel-highlight {
    position: absolute; left: 8px; right: 8px; top: 50%; transform: translateY(-50%);
    height: 78px; border-radius: 14px;
    background: rgba(255,255,255,0.7);
    border: 1.5px solid rgba(37,99,235,0.18);
    box-shadow: 0 2px 12px rgba(37,99,235,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
    pointer-events: none; z-index: 3;
    backdrop-filter: blur(2px);
  }
  .mix-wheel-mask {
    position: absolute; left: 0; right: 0; pointer-events: none; z-index: 2;
  }
  .mix-wheel-mask-top {
    top: 0; height: 38%;
    background: linear-gradient(to bottom,
      rgba(248,250,252,0.97) 0%,
      rgba(248,250,252,0.7) 50%,
      rgba(248,250,252,0) 100%
    );
  }
  .mix-wheel-mask-bottom {
    bottom: 0; height: 38%;
    background: linear-gradient(to top,
      rgba(248,250,252,0.97) 0%,
      rgba(248,250,252,0.7) 50%,
      rgba(248,250,252,0) 100%
    );
  }
  .mix-wheel-empty {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-size: 13px; color: #94a3b8; text-align: center; padding: 24px;
    line-height: 1.6; z-index: 6;
  }
  .mix-wheel-input {
    width: 100%; padding: 10px 12px; font-size: 12px; font-weight: 500;
    border: 1px solid transparent; border-radius: 10px;
    background: transparent; color: #6b7280;
    font-family: var(--font-sans); text-align: center;
    transition: all 0.25s ease;
  }
  .mix-wheel-slot:not(.mix-wheel-slot--active) .mix-wheel-input {
    pointer-events: none;
  }
  .mix-wheel-slot--active .mix-wheel-input {
    font-size: 15px; font-weight: 700;
    background: transparent; color: #0f172a;
    border: 1px solid transparent;
    border-radius: 10px;
  }
  .mix-wheel-input:focus {
    outline: none; border-color: rgba(37,99,235,0.25);
    box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
    background: rgba(255,255,255,0.6);
  }
  .mix-wheel-input::placeholder { color: #9ca3af; font-weight: 500; font-size: 12px; }
  .mix-wheel-slot--active .mix-wheel-input::placeholder { color: #6b7280; font-size: 13px; }
  .mix-wheel-text {
    font-size: 11px; font-weight: 500; color: #9ca3af;
    text-align: center; line-height: 1.4; word-break: keep-all;
    overflow: hidden; text-overflow: ellipsis;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    padding: 0 4px;
    transition: all 0.25s ease;
  }
  .mix-wheel-slot--active .mix-wheel-text {
    font-size: 14px; font-weight: 700; color: #0f172a;
    background: transparent; border-radius: 10px; padding: 6px 14px;
    border: none;
    -webkit-line-clamp: 3;
  }
  .mix-slot-controls {
    display: flex; align-items: center; gap: 2px; margin-top: 16px;
    background: #f1f5f9; border: 1px solid #e2e8f0;
    border-radius: 10px; padding: 3px;
  }
  .mix-slot-btn {
    width: 32px; height: 32px; border: none;
    border-radius: 8px; background: transparent; cursor: pointer;
    font-size: 16px; font-weight: 600; color: #6b7280;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; font-family: var(--font-sans); line-height: 1;
  }
  .mix-slot-btn:hover:not(:disabled) { color: #1d4ed8; background: rgba(37,99,235,0.06); }
  .mix-slot-btn:active:not(:disabled) { transform: scale(0.9); }
  .mix-slot-btn:disabled { opacity: 0.25; cursor: not-allowed; }
  .mix-slot-count {
    font-size: 12px; font-weight: 600; color: #4b5563;
    min-width: 56px; text-align: center; letter-spacing: -0.01em;
    font-variant-numeric: tabular-nums;
  }
  .mix-center-indicator {
    position: absolute; left: 50%; z-index: 10;
    top: calc(50% - 16px);
    transform: translate(-50%, -50%);
    display: flex; align-items: center; justify-content: center;
    pointer-events: none;
  }
  .mix-center-icon {
    width: 52px; height: 52px; border-radius: 50%;
    background: linear-gradient(135deg, #fff 0%, #f0f4ff 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(37,99,235,0.15), 0 0 0 2px rgba(37,99,235,0.08), 0 8px 32px rgba(0,0,0,0.06);
    animation: mixCenterPulse 3s ease-in-out infinite;
    border: none;
    transition: box-shadow 0.3s ease;
  }
  .mix-center-icon svg { display: block; }
  @keyframes mixCenterPulse {
    0%, 100% { box-shadow: 0 4px 20px rgba(37,99,235,0.15), 0 0 0 2px rgba(37,99,235,0.08), 0 8px 32px rgba(0,0,0,0.06); transform: scale(1); }
    50% { box-shadow: 0 6px 28px rgba(37,99,235,0.22), 0 0 0 3px rgba(37,99,235,0.12), 0 12px 40px rgba(0,0,0,0.08); transform: scale(1.06); }
  }
  .mix-match-display {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 14px 16px; margin: 8px 0;
    background: linear-gradient(135deg, rgba(245,158,11,0.04), rgba(239,68,68,0.03));
    border: 1px solid rgba(245,158,11,0.12); border-radius: 12px;
    flex-wrap: wrap;
  }
  .mix-match-left, .mix-match-right {
    font-size: 14px; font-weight: 700; color: var(--text-primary);
    letter-spacing: -0.02em; padding: 6px 14px; border-radius: 10px;
    max-width: 44%; text-align: center; word-break: keep-all;
  }
  .mix-match-left { background: rgba(49,130,246,0.08); border: 1px solid rgba(49,130,246,0.15); }
  .mix-match-right { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15); }
  .mix-match-x { font-size: 18px; font-weight: 800; color: var(--accent-error); flex-shrink: 0; }
  @media (max-width: 480px) {
    .mix-wheel-area { gap: 28px; }
    .mix-wheel { height: 300px; border-radius: 16px; }
    .mix-wheel-scroll { padding: 110px 0; }
    .mix-wheel-slot { height: 72px; }
    .mix-wheel-highlight { height: 78px; left: 6px; right: 6px; border-radius: 12px; }
    .mix-center-icon { width: 42px; height: 42px; }
    .mix-center-icon svg { width: 16px; height: 16px; }
    .mix-match-left, .mix-match-right { max-width: 100%; font-size: 13px; }
  }

  /* ── Onboarding Toast Overlay ── */
  .ob-toast-backdrop {
    position: fixed; inset: 0; z-index: 9998;
    background: transparent; pointer-events: auto;
    animation: obBackdropIn 0.3s ease forwards;
  }
  .ob-toast-backdrop.ob-out { animation: obBackdropOut 0.35s ease forwards; }
  @keyframes obBackdropIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes obBackdropOut { from { opacity: 1; } to { opacity: 0; } }

  .ob-toast {
    position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
    z-index: 9999;
    display: flex; align-items: flex-start; gap: 10px;
    padding: 14px 18px; padding-right: 36px;
    max-width: min(440px, calc(100vw - 32px));
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(20px) saturate(1.4); -webkit-backdrop-filter: blur(20px) saturate(1.4);
    border-radius: 16px;
    border: 1px solid rgba(59,130,246,0.18);
    box-shadow: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(59,130,246,0.08);
    cursor: pointer;
    animation: obToastIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
    will-change: opacity, transform;
  }
  .ob-toast.ob-out {
    animation: obToastOut 0.4s cubic-bezier(0.4,0,1,1) forwards;
    pointer-events: none;
  }
  @keyframes obToastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.96); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }
  @keyframes obToastOut {
    from { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
    to   { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.97); }
  }
  .ob-toast-icon {
    flex-shrink: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
    margin-top: 1px;
    opacity: 0; animation: obIconIn 0.35s 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards;
  }
  @keyframes obIconIn {
    from { opacity: 0; transform: scale(0.5); }
    to   { opacity: 1; transform: scale(1); }
  }
  .ob-toast-text {
    font-size: 13.5px; font-weight: 450; color: #334155; letter-spacing: -0.01em;
    line-height: 1.6; word-break: keep-all; flex: 1;
  }
  .ob-toast-close {
    position: absolute; top: 10px; right: 10px;
    background: none; border: none; cursor: pointer;
    font-size: 12px; color: #94a3b8; padding: 2px 4px; line-height: 1;
    transition: color 0.15s;
  }
  .ob-toast-close:hover { color: #475569; }
  .ob-word {
    display: inline-block; opacity: 0; transform: translateY(6px);
    animation: obWordUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards;
    will-change: opacity, transform;
  }
  @keyframes obWordUp {
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Safe area (notch/home indicator) ── */
  @supports (padding: env(safe-area-inset-top)) {
    .top-toolbar { padding-top: max(10px, env(safe-area-inset-top)); }
    .footer { padding-bottom: max(24px, env(safe-area-inset-bottom)); }
    .modal-sheet { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
    .history-drawer { padding-bottom: env(safe-area-inset-bottom); }
  }

  /* ── Credit System ── */
  .credit-badge {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 10px 5px 7px; border-radius: var(--radius-sm); border: none; cursor: pointer;
    background: var(--bg-surface-2); border: 1px solid var(--glass-border);
    transition: all 0.2s; font-family: inherit;
  }
  .credit-badge:hover {
    background: var(--bg-hover); border-color: var(--glass-border-active);
  }
  .credit-diamond { flex-shrink: 0; opacity: 0.8; }
  .credit-count {
    font-size: 12px; font-weight: 700; letter-spacing: -0.02em;
    color: var(--text-primary);
  }

  .credit-cost-tag {
    display: inline-flex; align-items: center; gap: 2px;
    font-size: 10px; font-weight: 800; color: #fff;
    margin-left: 6px;
    background: rgba(255,255,255,0.2);
    padding: 2px 7px; border-radius: 6px;
    backdrop-filter: blur(4px);
    letter-spacing: 0.01em;
    text-shadow: 0 1px 2px rgba(0,0,0,0.15);
  }

  .credit-modal-overlay {
    position: fixed; inset: 0; z-index: 700;
    background: rgba(15,23,42,0.4);
    backdrop-filter: saturate(150%) blur(24px); -webkit-backdrop-filter: saturate(150%) blur(24px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    animation: cmFadeIn 0.2s ease;
  }
  @keyframes cmFadeIn { from { opacity: 0; } to { opacity: 1; } }

  .credit-modal {
    background: #ffffff; border-radius: var(--radius-xl);
    width: 100%; max-width: 480px; max-height: 88vh; overflow-y: auto;
    box-shadow: 0 24px 80px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.03);
    animation: cmSlideUp 0.35s cubic-bezier(0.16,1,0.3,1);
    color: var(--text-primary);
  }
  @keyframes cmSlideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .credit-modal::-webkit-scrollbar { width: 3px; }
  .credit-modal::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.06); border-radius: 4px; }

  .cm-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 24px 24px 0;
  }
  .cm-head-title {
    font-size: 18px; font-weight: 800; letter-spacing: -0.03em;
    color: var(--text-primary); font-family: var(--font-heading);
  }
  .cm-head-close {
    width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer;
    background: transparent; color: var(--text-muted); font-size: 14px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .cm-head-close:hover { background: var(--bg-surface-2); color: var(--text-primary); }

  .cm-balance {
    margin: 20px 24px 8px; padding: 24px;
    background: var(--bg-surface-2);
    border-radius: var(--radius-lg); display: flex; align-items: center; gap: 16px;
    position: relative; overflow: hidden; border: 1px solid var(--glass-border);
  }
  .cm-bal-diamond {
    width: 48px; height: 48px; border-radius: var(--radius-md);
    background: linear-gradient(135deg, #2563eb, #6366f1);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-shadow: 0 2px 8px rgba(37,99,235,0.2);
  }
  .cm-bal-info { flex: 1; position: relative; z-index: 1; }
  .cm-bal-label {
    font-size: 11px; font-weight: 600; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .cm-bal-amount {
    font-size: 34px; font-weight: 800; color: #334155;
    letter-spacing: -0.04em; line-height: 1.1; margin-top: 2px;
    font-variant-numeric: tabular-nums; font-family: var(--font-heading);
  }
  .cm-bal-usd {
    font-size: 12px; color: var(--text-muted); font-weight: 500; margin-top: 3px;
  }

  .cm-section-title {
    padding: 16px 24px 8px; font-size: 12px; font-weight: 600;
    color: var(--text-muted); letter-spacing: 0.04em; text-transform: uppercase;
  }

  .cm-grid {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 8px; padding: 0 24px 16px;
  }
  .cm-card {
    position: relative; padding: 20px 16px 16px;
    background: var(--bg-surface-1); border-radius: var(--radius-md);
    border: 1px solid var(--glass-border);
    transition: all 0.22s cubic-bezier(0.33,1,0.68,1);
    cursor: default;
    display: flex; flex-direction: column;
  }
  .cm-card:hover {
    border-color: rgba(37,99,235,0.2);
    box-shadow: 0 4px 16px rgba(37,99,235,0.06);
    transform: translateY(-2px);
  }
  .cm-card.hot { border-color: rgba(37,99,235,0.15); background: rgba(37,99,235,0.02); }
  .cm-card.charged { border-color: rgba(5,150,105,0.3); background: rgba(5,150,105,0.03); }
  .cm-card.charged .cm-card-buy { background: #059669; color: #fff; border-color: #059669; }

  .cm-card-hot-tag {
    position: absolute; top: 10px; right: 10px;
    padding: 2px 7px; border-radius: 4px; font-size: 9px; font-weight: 800;
    background: var(--accent-primary); color: #fff;
    letter-spacing: 0.04em; line-height: 1.5;
  }
  .cm-card-diamond {
    display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
  }
  .cm-card-diamond svg { flex-shrink: 0; opacity: 0.7; }
  .cm-card-credits {
    font-size: 28px; font-weight: 800; letter-spacing: -0.04em; color: #334155;
    line-height: 1; font-variant-numeric: tabular-nums; font-family: var(--font-heading);
  }
  .cm-card-bonus {
    font-size: 11px; color: var(--accent-success); font-weight: 600;
    margin: 4px 0 12px; line-height: 1.3;
  }
  .cm-card-bottom {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: auto; padding-top: 4px;
  }
  .cm-card-price {
    font-size: 15px; font-weight: 700; color: #475569;
    letter-spacing: -0.02em; font-family: var(--font-heading);
  }
  .cm-card-buy {
    padding: 8px 16px; border-radius: var(--radius-sm);
    border: 1px solid var(--glass-border); background: var(--bg-surface-2);
    font-size: 12px; font-weight: 700; color: var(--text-secondary);
    cursor: pointer; transition: all 0.2s;
    font-family: inherit; letter-spacing: -0.01em;
  }
  .cm-card-buy:hover {
    background: var(--accent-primary); color: #fff;
    border-color: var(--accent-primary);
    box-shadow: 0 2px 8px rgba(37,99,235,0.18);
  }
  .cm-card-buy:active { transform: scale(0.96); }

  .cm-footer-bar {
    padding: 16px 24px 22px; text-align: center;
    border-top: 1px solid var(--glass-border);
  }
  .cm-footer-txt {
    font-size: 12px; color: var(--text-muted); line-height: 1.5; font-weight: 400;
  }

  @media (max-width: 480px) {
    .credit-modal { max-width: 100%; border-radius: 16px; }
    .cm-head { padding: 20px 20px 0; }
    .cm-grid { gap: 6px; padding: 0 20px 12px; }
    .cm-card { padding: 16px 14px 14px; }
    .cm-card-credits { font-size: 24px; }
    .cm-balance { margin: 16px 20px 8px; padding: 20px; }
    .cm-bal-amount { font-size: 28px; }
    .cm-bal-diamond { width: 42px; height: 42px; border-radius: 10px; }
    .cm-section-title { padding: 12px 20px 6px; }
    .credit-badge { padding: 4px 8px 4px 6px; }
    .credit-count { font-size: 11px; }
    .credit-diamond { width: 14px; height: 14px; }
  }

  /* ── Background Task Guide ── */
  .bg-task-guide {
    display: grid;
    grid-template-columns: 40px 1fr;
    align-items: center;
    gap: 0;
    margin: 12px 0 4px; padding: 13px 16px;
    background: linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(168,85,247,0.04) 100%);
    border: 1px solid rgba(99,102,241,0.12);
    border-radius: 14px;
    animation: bgGuideIn 0.5s cubic-bezier(0.33,1,0.68,1);
  }
  @keyframes bgGuideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .bg-task-guide-icon-wrap {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 10px;
    background: rgba(99,102,241,0.1);
    flex-shrink: 0;
  }
  .bg-task-guide-icon {
    font-size: 16px; line-height: 1; display: block;
  }
  .bg-task-guide-title {
    font-size: 13px; font-weight: 700; color: var(--text-primary);
    letter-spacing: -0.02em; margin-bottom: 2px;
    display: flex; align-items: center; gap: 6px;
  }
  .bg-task-pulse {
    display: inline-block; width: 6px; height: 6px; border-radius: 50%;
    background: #6366f1; flex-shrink: 0;
    animation: bgPulse 1.6s ease-in-out infinite;
  }
  @keyframes bgPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.75); }
  }
  .bg-task-guide-desc {
    font-size: 11.5px; color: var(--text-muted); line-height: 1.5;
    letter-spacing: -0.01em;
  }

  /* ── Web App Prototyper ── */
  .proto-cta {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 14px 20px; margin-top: 12px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
    color: #fff; border: none; border-radius: 14px; cursor: pointer;
    font-size: 14px; font-weight: 800; letter-spacing: -0.02em;
    box-shadow: 0 4px 20px rgba(99,102,241,0.35);
    transition: all 0.25s cubic-bezier(0.33,1,0.68,1);
    position: relative; overflow: hidden;
  }
  .proto-cta::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: translateX(-100%);
    animation: protoShimmer 3s infinite;
  }
  @keyframes protoShimmer { 0% { transform: translateX(-100%); } 40%,100% { transform: translateX(100%); } }
  .proto-cta:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(99,102,241,0.5); }
  .proto-cta:active { transform: scale(0.98); }

  .proto-overlay {
    position: fixed; top: 0; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 860px; z-index: 600;
    background: linear-gradient(165deg, var(--bg-deepest) 0%, var(--bg-surface-1) 48%, var(--bg-deepest) 100%);
    display: flex; flex-direction: column;
    animation: protoFadeIn 0.35s cubic-bezier(0.33,1,0.68,1);
  }
  @keyframes protoFadeIn { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  @keyframes protoFadeOut { from { opacity: 1; transform: translateX(-50%) translateY(0); } to { opacity: 0; transform: translateX(-50%) translateY(20px); } }

  .proto-header.proto-header-premium {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
    padding: 12px 18px 14px; border-bottom: 1px solid var(--glass-border);
    flex-shrink: 0;
    background: color-mix(in srgb, var(--bg-surface-1) 88%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .proto-header-inner { min-width: 0; flex: 1; }
  .proto-header-eyebrow {
    display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--text-muted); margin-bottom: 2px;
  }
  .proto-header-premium h2 {
    font-size: 15px; font-weight: 700; letter-spacing: -0.03em; margin: 0; line-height: 1.25;
    color: var(--text-primary);
  }
  .proto-header-context {
    margin: 6px 0 0; font-size: 12px; color: var(--text-muted); line-height: 1.45;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .proto-close {
    width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--glass-border); cursor: pointer;
    background: var(--bg-surface-2); font-size: 14px; display: flex; align-items: center;
    justify-content: center; transition: background 0.15s, border-color 0.15s; flex-shrink: 0;
    color: var(--text-secondary);
  }
  .proto-close:hover { background: var(--bg-surface-3); border-color: var(--glass-border); }

  .proto-body {
    flex: 1; overflow-y: auto; display: flex; flex-direction: column;
    align-items: center; justify-content: flex-start; padding: 24px 20px 32px;
  }

  /* Phase 1: Q&A Stepper */
  .proto-qa-container {
    width: 100%; max-width: 600px; text-align: center;
  }
  .proto-qa-step-badge {
    display: inline-block; padding: 4px 12px; border-radius: 20px;
    background: rgba(99,102,241,0.08); color: #6366f1;
    font-size: 12px; font-weight: 700; margin-bottom: 20px;
  }
  .proto-qa-question {
    font-size: 20px; font-weight: 800; line-height: 1.5; letter-spacing: -0.03em;
    color: var(--text-primary); margin-bottom: 28px;
    animation: protoQaIn 0.45s cubic-bezier(0.33,1,0.68,1);
  }
  @keyframes protoQaIn {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .proto-qa-input-wrap {
    position: relative; width: 100%;
  }
  .proto-qa-input {
    width: 100%; padding: 16px 56px 16px 18px; font-size: 15px;
    border: 2px solid var(--glass-border); border-radius: 14px;
    background: var(--bg-surface-1); color: var(--text-primary);
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    line-height: 1.5; resize: none; min-height: 52px; max-height: 160px;
    font-family: inherit;
  }
  .proto-qa-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
  }
  .proto-qa-submit {
    position: absolute; right: 8px; bottom: 8px;
    width: 38px; height: 38px; border-radius: 10px; border: none; cursor: pointer;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: #fff; font-size: 16px; display: flex; align-items: center; justify-content: center;
    transition: transform 0.15s, opacity 0.15s;
  }
  .proto-qa-submit:hover { transform: scale(1.05); }
  .proto-qa-submit:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }
  .proto-qa-skip {
    margin-top: 16px; font-size: 12px; color: var(--text-muted);
    background: none; border: none; cursor: pointer; text-decoration: underline;
    text-underline-offset: 3px;
  }
  .proto-qa-skip:hover { color: var(--text-secondary); }

  .proto-loading-phase {
    display: flex; flex-direction: column; align-items: center; gap: 14px;
    padding: 32px 16px;
  }
  .proto-loading-title {
    font-size: 14px; font-weight: 700; color: var(--text-secondary); letter-spacing: -0.02em;
  }
  .proto-loading-sub {
    font-size: 12px; color: var(--text-muted); text-align: center; max-width: 280px; line-height: 1.5;
  }
  .proto-spinner {
    width: 48px; height: 48px; border-radius: 50%;
    border: 3px solid var(--bg-surface-2); border-top-color: #6366f1;
    animation: spin 0.8s linear infinite;
  }
  .proto-bg-btn {
    margin-top: 10px; padding: 10px 22px; border-radius: 12px;
    border: 1px solid var(--glass-border); background: var(--bg-surface-2);
    color: var(--text-secondary); font-size: 13px; font-weight: 600;
    cursor: pointer; transition: background 0.15s, border-color 0.15s, transform 0.1s;
    font-family: var(--font-sans); letter-spacing: -0.01em;
  }
  .proto-bg-btn:hover { background: var(--bg-surface-3); border-color: var(--accent-primary); transform: scale(1.02); }
  .proto-bg-btn:active { transform: scale(0.98); }

  /* Phase 2: Skin Casting */
  .proto-skin-container {
    width: 100%; max-width: 720px;
  }
  .proto-skin-title {
    text-align: center; font-size: 20px; font-weight: 800;
    letter-spacing: -0.03em; margin-bottom: 6px;
  }
  .proto-skin-sub {
    text-align: center; font-size: 13px; color: var(--text-muted);
    margin-bottom: 22px; line-height: 1.5;
  }
  .proto-skin-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(188px, 1fr));
    gap: 18px 16px;
  }
  .proto-skin-card {
    position: relative; border-radius: 16px; overflow: hidden;
    border: 2px solid var(--glass-border); cursor: pointer;
    transition: all 0.3s cubic-bezier(0.33,1,0.68,1);
    background: var(--bg-surface-1);
  }
  .proto-skin-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  }
  .proto-skin-card.selected {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.2), 0 8px 32px rgba(99,102,241,0.15);
  }
  .proto-skin-card.selected::after {
    content: '✓'; position: absolute; top: 10px; right: 10px;
    width: 24px; height: 24px; border-radius: 50%;
    background: #6366f1; color: #fff; display: flex;
    align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
  }
  .proto-skin-preview {
    height: 100px; display: flex; align-items: center; justify-content: center;
    font-size: 36px;
  }
  .proto-skin-info {
    padding: 14px 16px 16px;
  }
  .proto-skin-name {
    font-size: 14px; font-weight: 800; letter-spacing: -0.02em;
    margin-bottom: 2px;
  }
  .proto-skin-desc {
    font-size: 11px; color: var(--text-muted); line-height: 1.4;
  }
  .proto-skin-sub-label {
    font-size: 10px; color: var(--text-muted); opacity: 0.7;
    margin-top: 4px;
  }
  .proto-skin-confirm {
    display: block; margin: 24px auto 0; padding: 14px 40px;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: #fff; border: none; border-radius: 12px; cursor: pointer;
    font-size: 15px; font-weight: 800; letter-spacing: -0.02em;
    transition: all 0.2s; box-shadow: 0 4px 16px rgba(99,102,241,0.3);
  }
  .proto-skin-confirm:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(99,102,241,0.45); }
  .proto-skin-confirm:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* Phase 3: Result */
  .proto-result-container {
    width: 100%; max-width: 820px; position: relative;
  }
  .proto-result-header {
    text-align: center; margin-bottom: 16px;
  }
  .proto-result-header h3 {
    font-size: 18px; font-weight: 800; letter-spacing: -0.03em;
    margin: 0 0 10px;
    color: var(--text-primary);
  }
  .proto-result-meta {
    display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap;
    margin-bottom: 8px;
  }
  .proto-result-hint {
    margin: 0 auto; max-width: 420px; font-size: 11px; color: var(--text-muted);
    line-height: 1.5;
  }
  .proto-result-tag {
    display: inline-flex; padding: 4px 11px; border-radius: 999px;
    font-size: 11px; font-weight: 600;
    background: rgba(99,102,241,0.08); color: #6366f1;
    border: 1px solid rgba(99,102,241,0.12);
  }
  .proto-code-block {
    position: relative; border-radius: 16px; overflow: hidden;
    border: 1px solid var(--glass-border);
    background: #1e1e2e; color: #cdd6f4;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  }
  .proto-code-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 16px; background: rgba(0,0,0,0.3);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .proto-code-label {
    font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5);
    display: flex; align-items: center; gap: 6px;
  }
  .proto-code-copy {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7);
    font-size: 11px; font-weight: 600; cursor: pointer;
    transition: all 0.15s;
  }
  .proto-code-copy:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .proto-code-copy.copied { background: rgba(99,102,241,0.3); color: #a5b4fc; border-color: rgba(99,102,241,0.4); }
  .proto-code-content {
    padding: 16px 18px 20px; font-family: 'JetBrains Mono', 'Fira Code', 'Menlo', monospace;
    font-size: 12.5px; line-height: 1.65; white-space: pre-wrap;
    word-break: break-word; max-height: min(58vh, 520px); overflow-y: auto;
    color: #cdd6f4;
  }
  .proto-code-content::-webkit-scrollbar { width: 6px; }
  .proto-code-content::-webkit-scrollbar-track { background: transparent; }
  .proto-code-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }

  .proto-result-actions {
    display: flex; gap: 8px; margin-top: 18px; justify-content: center; flex-wrap: wrap;
  }
  .proto-result-btn {
    padding: 10px 20px; border-radius: 10px; border: 1px solid var(--glass-border);
    background: var(--bg-surface-1); font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 6px;
  }
  .proto-result-btn:hover { background: var(--bg-surface-2); transform: translateY(-1px); }
  .proto-result-btn.primary {
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: #fff; border-color: transparent;
  }
  .proto-result-btn.primary:hover { box-shadow: 0 4px 16px rgba(99,102,241,0.3); }

  .proto-view-toggle {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 8px; border: 1px solid var(--glass-border);
    background: var(--bg-surface-2); color: var(--text-secondary);
    font-size: 11.5px; font-weight: 600; cursor: pointer;
    transition: all 0.15s; font-family: var(--font-sans);
  }
  .proto-view-toggle:hover { background: var(--bg-surface-3); color: var(--text-primary); }
  .proto-view-toggle.active { background: #1e1e2e; color: #cdd6f4; border-color: rgba(255,255,255,0.1); }

  .proto-rendered-block {
    width: 100%; border-radius: 16px; overflow: hidden;
    border: 1px solid var(--glass-border);
    background: var(--bg-surface-1);
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    padding: 24px 22px 28px;
    max-height: min(62vh, 600px); overflow-y: auto;
  }
  .proto-rendered-block::-webkit-scrollbar { width: 6px; }
  .proto-rendered-block::-webkit-scrollbar-track { background: transparent; }
  .proto-rendered-block::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }

  @media (max-width: 480px) {
    .proto-skin-grid { grid-template-columns: repeat(2, 1fr); gap: 12px 10px; }
    .proto-skin-preview { height: 84px; font-size: 28px; }
    .proto-code-content { font-size: 11px; padding: 12px 14px; max-height: 50vh; }
    .proto-rendered-block { padding: 16px 14px 20px; max-height: 50vh; }
    .proto-header-premium { padding: 10px 14px 12px; }
    .proto-body { padding: 18px 14px 28px; }
  }
`;
