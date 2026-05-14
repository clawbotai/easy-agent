export function renderClientHtml(initialCwd: string): string {
  return String.raw`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MOSS 协作控制台</title>
  <style>
    :root {
      --bg: #080910;
      --sidebar: #11121a;
      --panel: #151722;
      --panel-2: #1a1d29;
      --line: rgba(160, 166, 190, 0.18);
      --line-strong: rgba(160, 166, 190, 0.34);
      --text: #f2f5fb;
      --muted: #8c92a8;
      --quiet: #5e657b;
      --violet: #8b5cf6;
      --cyan: #22d3ee;
      --green: #19d39b;
      --amber: #f0a83b;
      --red: #ff6b68;
      --shadow: 0 22px 70px rgba(0, 0, 0, 0.45);
      --mono: "SFMono-Regular", "Cascadia Mono", "Menlo", monospace;
      --sans: "Avenir Next", "PingFang SC", "Segoe UI", sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      background:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px),
        var(--bg);
      background-size: 36px 36px;
      font-family: var(--sans);
      font-size: 14px;
      overflow: hidden;
    }

    button, input, textarea, select {
      font: inherit;
    }

    button {
      border: 1px solid var(--line-strong);
      background: var(--panel-2);
      color: var(--text);
      min-height: 34px;
      padding: 0 12px;
      border-radius: 8px;
      cursor: pointer;
    }

    button.primary {
      min-width: 56px;
      padding: 0 16px;
      border-color: rgba(139, 92, 246, 0.75);
      background: linear-gradient(135deg, #7138e8, #9b5cff);
      box-shadow: 0 12px 34px rgba(139, 92, 246, 0.32);
      white-space: nowrap;
    }

    button.ghost {
      background: transparent;
      color: var(--muted);
    }

    button.danger {
      border-color: rgba(255, 107, 104, 0.54);
      background: rgba(255, 107, 104, 0.12);
      color: #ffb6b4;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.45;
      box-shadow: none;
    }

    input, textarea, select {
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.045);
      color: var(--text);
      outline: none;
      border-radius: 8px;
    }

    input:focus, textarea:focus, select:focus {
      border-color: rgba(139, 92, 246, 0.82);
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.16);
    }

    .app {
      display: grid;
      grid-template-columns: 296px minmax(0, 1fr);
      grid-template-rows: 52px minmax(0, 1fr);
      height: 100vh;
    }

    .topbar {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: 296px minmax(0, 1fr) 296px;
      align-items: center;
      border-bottom: 1px solid var(--line);
      background: rgba(11, 12, 19, 0.88);
      backdrop-filter: blur(14px);
      z-index: 5;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 100%;
      padding: 0 14px;
      border-right: 1px solid var(--line);
    }

    .logo {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #5a36f4, #a855f7);
      box-shadow: 0 10px 30px rgba(139, 92, 246, 0.38);
      color: white;
      font-weight: 800;
      letter-spacing: 0;
    }

    .brand b {
      font-size: 15px;
      letter-spacing: 0;
    }

    .status-pill {
      justify-self: center;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 30px;
      padding: 0 16px;
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.05);
      color: var(--muted);
      font-size: 13px;
    }

    .status-pill i {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 16px rgba(25, 211, 155, 0.78);
    }

    .top-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding-right: 14px;
      color: var(--quiet);
      font-family: var(--mono);
    }

    .sidebar {
      min-height: 0;
      border-right: 1px solid var(--line);
      background: rgba(17, 18, 26, 0.92);
      display: grid;
      grid-template-rows: auto auto auto minmax(0, 1fr);
      gap: 12px;
      padding: 14px 12px;
    }

    .workspace-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 34px;
      gap: 8px;
    }

    .workspace-row input,
    .search input {
      width: 100%;
      height: 34px;
      padding: 0 10px;
      color: #d9ddec;
      font-family: var(--mono);
      font-size: 12px;
    }

    .agents {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .agent {
      min-width: 0;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 9px;
      background: rgba(255, 255, 255, 0.035);
    }

    .agent strong {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 12px;
      text-transform: uppercase;
    }

    .agent code {
      display: block;
      margin-top: 6px;
      color: var(--quiet);
      font-family: var(--mono);
      font-size: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .agent-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--red);
    }

    .agent-dot.ok {
      background: var(--green);
      box-shadow: 0 0 14px rgba(25, 211, 155, 0.72);
    }

    .session-list {
      min-height: 0;
      overflow: auto;
      padding-right: 2px;
    }

    .day-label {
      margin: 14px 4px 8px;
      color: var(--quiet);
      font-size: 12px;
    }

    .session {
      width: 100%;
      display: grid;
      grid-template-columns: 4px minmax(0, 1fr);
      gap: 10px;
      min-height: 58px;
      margin-bottom: 8px;
      padding: 0;
      border: 0;
      background: transparent;
      text-align: left;
    }

    .session-bar {
      align-self: stretch;
      border-radius: 999px;
      background: transparent;
    }

    .session-body {
      min-width: 0;
      border-radius: 8px;
      padding: 10px 12px;
      background: transparent;
      color: var(--muted);
    }

    .session.active .session-body {
      background: rgba(139, 92, 246, 0.18);
      color: var(--text);
    }

    .session.active .session-bar {
      background: var(--violet);
      box-shadow: 0 0 18px rgba(139, 92, 246, 0.72);
    }

    .session-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 14px;
    }

    .session-meta {
      margin-top: 7px;
      color: var(--quiet);
      font-size: 12px;
      font-family: var(--mono);
    }

    .main {
      min-width: 0;
      min-height: 0;
      display: grid;
      grid-template-rows: minmax(0, 1fr) auto;
    }

    .conversation {
      min-width: 0;
      min-height: 0;
      overflow: auto;
      padding: 26px 24px 28px;
      scroll-behavior: smooth;
    }

    .center {
      width: min(800px, calc(100vw - 360px));
      margin: 0 auto;
    }

    .landing {
      min-height: calc(100vh - 210px);
      display: grid;
      place-items: center;
      text-align: center;
    }

    .hero-logo {
      width: 72px;
      height: 72px;
      margin: 0 auto 24px;
      border-radius: 18px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #5a36f4, #a855f7);
      box-shadow: 0 18px 60px rgba(139, 92, 246, 0.38);
      font-size: 26px;
      font-weight: 800;
    }

    .landing h1 {
      margin: 0 0 10px;
      font-size: 34px;
      letter-spacing: 0;
      color: #f4f1ff;
    }

    .landing p {
      max-width: 520px;
      margin: 0 auto 28px;
      color: var(--muted);
      line-height: 1.7;
    }

    .starter-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      text-align: left;
    }

    .starter {
      border: 1px solid var(--line-strong);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.045);
      padding: 16px;
      cursor: pointer;
    }

    .starter b {
      display: block;
      margin-bottom: 6px;
      color: var(--text);
    }

    .starter span {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
    }

    .thread {
      display: grid;
      gap: 18px;
      padding-bottom: 12px;
    }

    .run-banner {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
      border: 1px solid var(--line-strong);
      border-left: 4px solid var(--green);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.04);
      padding: 10px 14px;
      color: var(--muted);
      font-size: 13px;
    }

    .run-banner b {
      display: block;
      color: var(--text);
      margin-bottom: 4px;
      font-size: 14px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 23px;
      padding: 0 10px;
      border-radius: 999px;
      border: 1px solid rgba(25, 211, 155, 0.34);
      background: rgba(25, 211, 155, 0.12);
      color: #82f2cf;
      font-family: var(--mono);
      font-size: 11px;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .badge.waiting {
      border-color: rgba(240, 168, 59, 0.45);
      background: rgba(240, 168, 59, 0.13);
      color: #ffd89b;
    }

    .badge.failed {
      border-color: rgba(255, 107, 104, 0.45);
      background: rgba(255, 107, 104, 0.13);
      color: #ffb4b2;
    }

    .message {
      display: grid;
      grid-template-columns: 38px minmax(0, 1fr);
      gap: 14px;
    }

    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      background: rgba(139, 92, 246, 0.22);
      color: #cbb8ff;
      font-weight: 800;
      flex: 0 0 auto;
    }

    .message-head {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      color: var(--muted);
      font-size: 12px;
    }

    .message-head b {
      color: var(--text);
      font-size: 14px;
    }

    .message-text {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      line-height: 1.7;
      color: #e6e9f4;
    }

    .final-message .avatar {
      background: rgba(34, 211, 238, 0.16);
      color: #90f0ff;
      box-shadow: 0 0 24px rgba(34, 211, 238, 0.16);
    }

    details.tool-card {
      border: 1px solid var(--line-strong);
      border-left: 4px solid var(--green);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.035);
      overflow: hidden;
    }

    details.tool-card[open] {
      background: rgba(255, 255, 255, 0.052);
      box-shadow: var(--shadow);
    }

    .tool-card.failed {
      border-left-color: var(--red);
    }

    .tool-card.running {
      border-left-color: var(--cyan);
    }

    .tool-card summary {
      min-height: 44px;
      display: grid;
      grid-template-columns: 36px minmax(130px, 180px) minmax(0, 1fr) auto 24px;
      align-items: center;
      gap: 12px;
      padding: 0 14px;
      cursor: pointer;
      list-style: none;
    }

    .tool-card summary::-webkit-details-marker { display: none; }

    .tool-icon {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: grid;
      place-items: center;
      background: rgba(25, 211, 155, 0.13);
      color: var(--green);
      font-family: var(--mono);
      font-size: 12px;
      font-weight: 700;
    }

    .tool-name {
      color: var(--text);
      font-weight: 700;
      font-size: 13px;
    }

    .tool-path {
      min-width: 0;
      color: var(--quiet);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: var(--mono);
      font-size: 12px;
      text-decoration: underline;
      text-decoration-style: dotted;
      text-underline-offset: 4px;
    }

    .chevron {
      color: var(--quiet);
      font-family: var(--mono);
    }

    details[open] .chevron {
      transform: rotate(90deg);
    }

    .tool-detail {
      border-top: 1px solid var(--line);
      padding: 14px;
      display: grid;
      gap: 12px;
    }

    .kv {
      display: grid;
      grid-template-columns: 100px minmax(0, 1fr);
      gap: 12px;
      color: var(--muted);
      font-size: 12px;
    }

    .kv b {
      color: var(--quiet);
      font-family: var(--mono);
      font-weight: 500;
      text-transform: uppercase;
    }

    pre {
      margin: 0;
      max-height: 420px;
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #090b12;
      color: #dfe6f5;
      padding: 12px;
      font-family: var(--mono);
      font-size: 12px;
      line-height: 1.6;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .approval {
      border: 1px solid rgba(240, 168, 59, 0.5);
      border-left: 4px solid var(--amber);
      border-radius: 8px;
      background: rgba(240, 168, 59, 0.1);
      padding: 14px;
      display: grid;
      gap: 12px;
    }

    .approval p {
      margin: 0;
      color: #ffe0ad;
      line-height: 1.6;
    }

    .approval-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .result-card {
      border: 1px solid rgba(34, 211, 238, 0.34);
      border-left: 4px solid var(--cyan);
      border-radius: 8px;
      background: rgba(34, 211, 238, 0.07);
      overflow: hidden;
    }

    .result-card.completed {
      border-color: rgba(25, 211, 155, 0.38);
      border-left-color: var(--green);
      background: rgba(25, 211, 155, 0.07);
    }

    .result-card.failed,
    .result-card.cancelled {
      border-color: rgba(255, 107, 104, 0.42);
      border-left-color: var(--red);
      background: rgba(255, 107, 104, 0.08);
    }

    .result-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 13px 14px;
      border-bottom: 1px solid var(--line);
    }

    .result-head b {
      font-size: 15px;
    }

    .result-body {
      padding: 14px;
    }

    .composer-wrap {
      border-top: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(8, 9, 16, 0), rgba(8, 9, 16, 0.96) 24%);
      padding: 10px 24px 14px;
    }

    .composer {
      width: min(800px, calc(100vw - 360px));
      margin: 0 auto;
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .control-pill {
      height: 34px;
      padding: 0 12px;
      border-radius: 999px;
      color: var(--muted);
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid var(--line-strong);
      font-size: 12px;
    }

    .input-box {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
      gap: 10px;
      border: 1px solid var(--line-strong);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.055);
      box-shadow: 0 18px 60px rgba(0, 0, 0, 0.38);
      padding: 12px;
    }

    textarea {
      width: 100%;
      min-height: 46px;
      max-height: 160px;
      resize: vertical;
      border: 0;
      background: transparent;
      padding: 8px 4px;
      line-height: 1.55;
      color: var(--text);
    }

    textarea:focus {
      box-shadow: none;
    }

    .empty-note {
      color: var(--quiet);
      text-align: center;
      padding: 18px;
    }

    @media (max-width: 980px) {
      body {
        overflow: auto;
      }

      .app {
        grid-template-columns: 1fr;
        grid-template-rows: 52px auto minmax(0, 1fr);
        height: auto;
        min-height: 100vh;
      }

      .topbar {
        grid-template-columns: 1fr auto;
      }

      .status-pill {
        display: none;
      }

      .top-actions {
        grid-column: 2;
      }

      .sidebar {
        border-right: 0;
        border-bottom: 1px solid var(--line);
        max-height: 340px;
      }

      .center,
      .composer {
        width: 100%;
      }

      .starter-grid {
        grid-template-columns: 1fr;
      }

      .tool-card summary {
        grid-template-columns: 30px minmax(90px, 1fr) auto 18px;
      }

      .tool-path {
        display: none;
      }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand">
        <div class="logo">M</div>
        <b>MOSS</b>
      </div>
      <div class="status-pill" id="global-status"><i></i><span>就绪</span></div>
      <div class="top-actions">
        <button id="new-run" class="ghost">新任务</button>
        <button id="refresh" class="ghost">刷新</button>
        <button id="cancel" class="danger" disabled>取消</button>
      </div>
    </header>

    <aside class="sidebar">
      <div class="workspace-row">
        <input id="workspace" autocomplete="off" title="工作区" />
        <button id="workspace-refresh" class="ghost">↻</button>
      </div>
      <div class="agents" id="agents"></div>
      <div class="search">
        <input id="session-search" autocomplete="off" placeholder="搜索任务..." />
      </div>
      <div class="session-list" id="recent"></div>
    </aside>

    <section class="main">
      <div class="conversation" id="conversation"></div>
      <div class="composer-wrap">
        <div class="composer">
          <div class="controls">
            <select id="workflow" class="control-pill">
              <option value="claude_plan_codex_execute_claude_review">Claude 规划 · Codex 执行 · Claude 审查</option>
              <option value="claude_execute_codex_review">Claude 执行 · Codex 审查</option>
              <option value="claude_direct_execute">Claude Code 直接执行</option>
              <option value="codex_direct_execute">Codex 直接执行</option>
            </select>
            <span class="control-pill">代码任务</span>
          </div>
          <div class="input-box">
            <textarea id="task" placeholder="输入任务，例如：修复登录接口 500 问题，保留现有 API，并补充测试。"></textarea>
            <button id="start" class="primary">发送</button>
          </div>
        </div>
      </div>
    </section>
  </main>

  <script>
    window.__MOSS__ = { cwd: ${JSON.stringify(initialCwd)} };

    const state = {
      run: null,
      runs: [],
      source: null,
      query: ""
    };

    const statusLabels = {
      created: "已创建",
      planning: "规划中",
      awaiting_plan_approval: "等待审批",
      executing: "执行中",
      reviewing: "审查中",
      awaiting_rework_approval: "等待返工审批",
      reworking: "返工中",
      completed: "完成",
      failed: "失败",
      cancelled: "取消"
    };

    const activeStatuses = [
      "created",
      "planning",
      "awaiting_plan_approval",
      "executing",
      "reviewing",
      "awaiting_rework_approval",
      "reworking"
    ];

    const phaseLabels = {
      plan: "规划",
      execute: "编辑",
      review: "审查",
      approval: "审批",
      rework: "返工"
    };

    const actorLabels = {
      claude: "Claude Code",
      codex: "Codex",
      system: "MOSS",
      user: "用户"
    };

    const workflowLabels = {
      claude_plan_codex_execute_claude_review: "规划执行审查",
      claude_execute_codex_review: "执行审查修正",
      claude_direct_execute: "Claude Code 直接执行",
      codex_direct_execute: "Codex 直接执行"
    };

    function qs(id) {
      return document.getElementById(id);
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    function shortTime(value) {
      if (!value) return "";
      return new Date(value).toLocaleTimeString("zh-CN", { hour12: false });
    }

    async function api(path, options) {
      const res = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...options
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) {
        throw new Error(data && data.error ? data.error : "请求失败");
      }
      return data;
    }

    function badgeClass(status) {
      if (status === "failed" || status === "cancelled") return "badge failed";
      if (String(status).includes("awaiting")) return "badge waiting";
      return "badge";
    }

    function canContinueCurrentRun() {
      return Boolean(state.run) && !activeStatuses.includes(state.run.status) && !state.run.pendingApproval;
    }

    function updateComposerMode() {
      const continuing = canContinueCurrentRun();
      qs("start").textContent = continuing ? "继续" : "发送";
      qs("task").placeholder = continuing
        ? "继续当前任务，例如：用 Codex 直接修复上面审查提到的问题。"
        : "输入任务，例如：修复登录接口 500 问题，保留现有 API，并补充测试。";
    }

    function setGlobalStatus(run) {
      const label = run ? (statusLabels[run.status] || run.status) : "就绪";
      qs("global-status").innerHTML = "<i></i><span>" + escapeHtml(label) + "</span>";
      qs("cancel").disabled = !run || ["completed", "failed", "cancelled"].includes(run.status);
      updateComposerMode();
    }

    async function refreshAgents() {
      const target = qs("agents");
      target.innerHTML = '<div class="agent"><strong>检测中<span class="agent-dot"></span></strong><code>...</code></div>';
      try {
        const data = await api("/api/agents?workspace=" + encodeURIComponent(qs("workspace").value.trim()));
        target.innerHTML = data.agents.map(function(agent) {
          return '<div class="agent">' +
            '<strong>' + escapeHtml(agent.role) + '<span class="agent-dot ' + (agent.available ? "ok" : "") + '"></span></strong>' +
            '<code title="' + escapeHtml(agent.detail || agent.command) + '">' + escapeHtml(agent.command) + '</code>' +
          '</div>';
        }).join("");
      } catch (error) {
        target.innerHTML = '<div class="agent"><strong>错误<span class="agent-dot"></span></strong><code>' + escapeHtml(error.message) + '</code></div>';
      }
    }

    async function refreshRuns() {
      try {
        const data = await api("/api/runs");
        state.runs = data.runs;
        renderRuns();
      } catch (error) {
        qs("recent").innerHTML = '<div class="empty-note">' + escapeHtml(error.message) + '</div>';
      }
    }

    function renderRuns() {
      const query = state.query.trim().toLowerCase();
      const runs = state.runs.filter(function(run) {
        return !query || run.task.toLowerCase().includes(query) || run.status.toLowerCase().includes(query);
      });
      if (!runs.length) {
        qs("recent").innerHTML = '<div class="empty-note">暂无任务</div>';
        return;
      }
      qs("recent").innerHTML =
        '<div class="day-label">最近</div>' +
        runs.slice(0, 30).map(function(run) {
          const active = state.run && state.run.id === run.id ? " active" : "";
          return '<button class="session' + active + '" data-run="' + escapeHtml(run.id) + '">' +
            '<span class="session-bar"></span>' +
            '<span class="session-body">' +
              '<span class="session-title">' + escapeHtml(run.task || run.id) + '</span>' +
              '<span class="session-meta">' + escapeHtml(statusLabels[run.status] || run.status) + ' · ' + escapeHtml(shortTime(run.updatedAt)) + '</span>' +
            '</span>' +
          '</button>';
        }).join("");
      qs("recent").querySelectorAll("button[data-run]").forEach(function(button) {
        button.addEventListener("click", function() {
          loadRun(button.getAttribute("data-run"));
        });
      });
    }

    function landingHtml() {
      return '<div class="center landing">' +
        '<div>' +
          '<div class="hero-logo">M</div>' +
          '<h1>MOSS</h1>' +
          '<p>选择工作区，输入任务，由 Claude Code 与 Codex 按审批流程协作完成。</p>' +
          '<div class="starter-grid">' +
            starter("探索代码库", "阅读关键模块，整理结构和风险。") +
            starter("规划功能", "先生成实施计划，再审批执行。") +
            starter("修复 Bug", "定位问题，修改代码并交叉审查。") +
            starter("审查变更", "复核实现结果，输出最终结论。") +
          '</div>' +
        '</div>' +
      '</div>';
    }

    function starter(title, desc) {
      return '<div class="starter" data-template="' + escapeHtml(title) + '">' +
        '<b>' + escapeHtml(title) + '</b><span>' + escapeHtml(desc) + '</span>' +
      '</div>';
    }

    function renderLanding() {
      qs("conversation").innerHTML = landingHtml();
      qs("conversation").querySelectorAll(".starter").forEach(function(card) {
        card.addEventListener("click", function() {
          qs("task").value = card.getAttribute("data-template") || "";
          qs("task").focus();
        });
      });
      setGlobalStatus(null);
    }

    function getStepEvents(run, stepId) {
      return run.events.filter(function(event) {
        return event.data && typeof event.data === "object" && event.data.stepId === stepId;
      });
    }

    function stepTitle(step) {
      return (phaseLabels[step.phase] || step.phase) + " · " + (actorLabels[step.actor] || step.actor);
    }

    function stepFiles(step) {
      return step.files && step.files.length ? step.files.join(", ") : "无文件列表";
    }

    function stepCard(run, step, index) {
      const events = getStepEvents(run, step.id);
      const shouldOpen = step.status === "running" || step.status === "failed" || index === run.steps.length - 1;
      const eventLines = events.length
        ? events.map(function(event) {
          return shortTime(event.timestamp) + " " + (event.actor || event.type) + "  " + event.message;
        }).join("\n")
        : "暂无日志";
      const output = step.output || step.error || "等待输出";
      return '<details class="tool-card ' + escapeHtml(step.status) + '"' + (shouldOpen ? " open" : "") + '>' +
        '<summary>' +
          '<span class="tool-icon">&lt;&gt;</span>' +
          '<span class="tool-name">' + escapeHtml(stepTitle(step)) + '</span>' +
          '<span class="tool-path">' + escapeHtml(stepFiles(step)) + '</span>' +
          '<span class="' + badgeClass(step.status) + '">' + escapeHtml(step.status === "completed" ? "DONE" : step.status) + '</span>' +
          '<span class="chevron">&gt;</span>' +
        '</summary>' +
        '<div class="tool-detail">' +
          '<div class="kv"><b>开始</b><span>' + escapeHtml(shortTime(step.startedAt)) + '</span></div>' +
          '<div class="kv"><b>结束</b><span>' + escapeHtml(shortTime(step.endedAt) || "运行中") + '</span></div>' +
          '<div class="kv"><b>文件</b><span>' + escapeHtml(stepFiles(step)) + '</span></div>' +
          '<div><div class="message-head"><b>日志</b></div><pre>' + escapeHtml(eventLines) + '</pre></div>' +
          '<div><div class="message-head"><b>输出</b></div><pre>' + escapeHtml(output) + '</pre></div>' +
        '</div>' +
      '</details>';
    }

    function approvalCard(run) {
      if (!run.pendingApproval) return "";
      return '<section class="approval">' +
        '<div class="message-head"><b>等待审批</b><span>' + escapeHtml(shortTime(run.pendingApproval.createdAt)) + '</span></div>' +
        '<p>' + escapeHtml(run.pendingApproval.prompt) + '</p>' +
        '<div class="approval-actions">' +
          '<button id="approve">批准继续</button>' +
          '<button id="reject" class="ghost">拒绝并取消</button>' +
        '</div>' +
      '</section>';
    }

    function resultCard(run) {
      if (!run.finalResult) return "";
      const resultTitle = run.status === "completed" ? "MOSS 最终结论" : "MOSS 结束结果";
      return '<section class="message final-message">' +
        '<div class="avatar">M</div>' +
        '<div>' +
          '<div class="message-head"><b>MOSS</b><span>' + escapeHtml(shortTime(run.updatedAt)) + '</span></div>' +
          '<section class="result-card ' + escapeHtml(run.status) + '">' +
            '<div class="result-head"><b>' + escapeHtml(resultTitle) + '</b><button id="copy-result" class="ghost">复制</button></div>' +
            '<div class="result-body"><pre id="final-result">' + escapeHtml(run.finalResult) + '</pre></div>' +
          '</section>' +
        '</div>' +
      '</section>';
    }

    function userMessage(run) {
      return '<section class="message">' +
        '<div class="avatar">你</div>' +
        '<div>' +
          '<div class="message-head"><b>用户</b><span>' + escapeHtml(shortTime(run.createdAt)) + '</span></div>' +
          '<div class="message-text">' + escapeHtml(run.task) + '</div>' +
        '</div>' +
      '</section>';
    }

    function continuationMessages(run) {
      return (run.continuations || []).map(function(item) {
        return '<section class="message">' +
          '<div class="avatar">你</div>' +
          '<div>' +
            '<div class="message-head"><b>用户</b><span>继续 · ' + escapeHtml(shortTime(item.createdAt)) + '</span></div>' +
            '<div class="message-text">' + escapeHtml(item.task) + '</div>' +
          '</div>' +
        '</section>';
      }).join("");
    }

    function renderRun(run) {
      state.run = run;
      setGlobalStatus(run);
      renderRuns();

      const html = '<div class="center thread">' +
        '<div class="run-banner">' +
          '<div class="avatar">M</div>' +
          '<div><b>' + escapeHtml(workflowLabels[run.workflow] || run.workflow) + '</b>' +
          '<span>' + escapeHtml(run.workspace) + '</span></div>' +
          '<span class="' + badgeClass(run.status) + '">' + escapeHtml(statusLabels[run.status] || run.status) + '</span>' +
        '</div>' +
        userMessage(run) +
        continuationMessages(run) +
        run.steps.map(function(step, index) { return stepCard(run, step, index); }).join("") +
        approvalCard(run) +
        resultCard(run) +
      '</div>';

      qs("conversation").innerHTML = html;

      const approve = qs("approve");
      if (approve) approve.addEventListener("click", function() { approveRun(true); });
      const reject = qs("reject");
      if (reject) reject.addEventListener("click", function() { approveRun(false); });
      const copy = qs("copy-result");
      if (copy) copy.addEventListener("click", copyResult);

      qs("conversation").scrollTop = qs("conversation").scrollHeight;
    }

    async function loadRun(id) {
      const data = await api("/api/runs/" + encodeURIComponent(id));
      connectEvents(data.run.id);
      renderRun(data.run);
    }

    function connectEvents(runId) {
      if (state.source) {
        state.source.close();
      }
      const source = new EventSource("/api/runs/" + encodeURIComponent(runId) + "/events");
      state.source = source;
      source.addEventListener("snapshot", function(event) {
        renderRun(JSON.parse(event.data).run);
      });
      source.addEventListener("event", function(event) {
        renderRun(JSON.parse(event.data).run);
        refreshRuns();
      });
      source.onerror = function() {
        source.close();
      };
    }

    async function startRun() {
      const task = qs("task").value.trim();
      if (!task) {
        qs("task").focus();
        return;
      }
      const continuing = canContinueCurrentRun();
      if (state.run && !continuing) {
        alert("当前任务仍在运行或等待审批，请先完成、取消或刷新状态后再继续。");
        return;
      }
      qs("start").disabled = true;
      try {
        const path = continuing
          ? "/api/runs/" + encodeURIComponent(state.run.id) + "/continue"
          : "/api/runs";
        const payload = continuing
          ? {
            task,
            workflow: qs("workflow").value,
            mode: "code"
          }
          : {
            workspace: qs("workspace").value.trim(),
            task,
            workflow: qs("workflow").value,
            mode: "code"
          };
        const data = await api(path, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        qs("task").value = "";
        connectEvents(data.run.id);
        renderRun(data.run);
        refreshRuns();
      } catch (error) {
        alert(error.message);
      } finally {
        qs("start").disabled = false;
      }
    }

    function startNewTask() {
      if (state.source) {
        state.source.close();
        state.source = null;
      }
      state.run = null;
      renderLanding();
      renderRuns();
      qs("task").value = "";
      qs("task").focus();
    }

    async function approveRun(approved) {
      if (!state.run) return;
      try {
        const data = await api("/api/runs/" + encodeURIComponent(state.run.id) + "/approve", {
          method: "POST",
          body: JSON.stringify({ approved })
        });
        renderRun(data.run);
      } catch (error) {
        alert(error.message);
      }
    }

    async function cancelRun() {
      if (!state.run) return;
      try {
        const data = await api("/api/runs/" + encodeURIComponent(state.run.id) + "/cancel", {
          method: "POST",
          body: JSON.stringify({})
        });
        renderRun(data.run);
        refreshRuns();
      } catch (error) {
        alert(error.message);
      }
    }

    async function copyResult() {
      const text = qs("final-result") ? qs("final-result").innerText : "";
      if (!text) return;
      await navigator.clipboard.writeText(text).catch(function() {});
    }

    qs("workspace").value = window.__MOSS__.cwd;
    qs("start").addEventListener("click", startRun);
    qs("task").addEventListener("keydown", function(event) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        startRun();
      }
    });
    qs("refresh").addEventListener("click", function() {
      refreshAgents();
      refreshRuns();
      if (state.run) loadRun(state.run.id);
    });
    qs("new-run").addEventListener("click", startNewTask);
    qs("workspace-refresh").addEventListener("click", refreshAgents);
    qs("workspace").addEventListener("change", refreshAgents);
    qs("cancel").addEventListener("click", cancelRun);
    qs("session-search").addEventListener("input", function(event) {
      state.query = event.target.value;
      renderRuns();
    });

    renderLanding();
    refreshAgents();
    refreshRuns();
  </script>
</body>
</html>`;
}
