export function renderClientHtml(initialCwd: string): string {
  return String.raw`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Easy Agent 协作控制台</title>
  <style>
    :root {
      --ink: #111417;
      --muted: #64707d;
      --line: #d8dde2;
      --paper: #f7f4ed;
      --panel: #ffffff;
      --teal: #147d7f;
      --amber: #c97820;
      --red: #b2413b;
      --blue: #315f91;
      --shadow: 0 18px 45px rgba(26, 31, 38, 0.12);
      --mono: "SFMono-Regular", "Cascadia Mono", "Menlo", monospace;
      --sans: "Avenir Next", "Gill Sans", "Segoe UI", sans-serif;
      --display: "DIN Condensed", "Avenir Next Condensed", "Bahnschrift", sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      background:
        linear-gradient(90deg, rgba(17, 20, 23, 0.04) 1px, transparent 1px),
        linear-gradient(rgba(17, 20, 23, 0.035) 1px, transparent 1px),
        var(--paper);
      background-size: 28px 28px;
      font-family: var(--sans);
      font-size: 15px;
    }

    button, input, textarea, select {
      font: inherit;
    }

    button {
      border: 1px solid var(--ink);
      background: var(--ink);
      color: white;
      min-height: 38px;
      padding: 0 14px;
      border-radius: 6px;
      cursor: pointer;
    }

    button.secondary {
      background: var(--panel);
      color: var(--ink);
      border-color: var(--line);
    }

    button.danger {
      background: var(--red);
      border-color: var(--red);
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.52;
    }

    .app {
      display: grid;
      grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
      min-height: 100vh;
    }

    .control {
      border-right: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.72);
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .brand {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      padding-bottom: 14px;
      border-bottom: 2px solid var(--ink);
    }

    .brand h1 {
      margin: 0;
      font-family: var(--display);
      font-size: 38px;
      line-height: 0.95;
      font-weight: 800;
    }

    .brand p {
      margin: 8px 0 0;
      color: var(--muted);
      line-height: 1.45;
    }

    .stamp {
      min-width: 82px;
      border: 1px solid var(--ink);
      padding: 8px;
      text-align: center;
      font-family: var(--mono);
      font-size: 11px;
      background: #f1e4c8;
    }

    .field {
      display: grid;
      gap: 8px;
    }

    .field label {
      font-size: 12px;
      color: var(--muted);
      text-transform: uppercase;
      font-family: var(--mono);
    }

    input, textarea {
      width: 100%;
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--ink);
      border-radius: 6px;
      padding: 11px 12px;
      outline: none;
    }

    textarea {
      min-height: 156px;
      resize: vertical;
      line-height: 1.55;
    }

    input:focus, textarea:focus {
      border-color: var(--teal);
      box-shadow: 0 0 0 3px rgba(20, 125, 127, 0.14);
    }

    .workflow {
      display: grid;
      gap: 8px;
    }

    .workflow-option {
      display: grid;
      grid-template-columns: 20px minmax(0, 1fr);
      gap: 10px;
      align-items: start;
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 6px;
      padding: 12px;
      cursor: pointer;
    }

    .workflow-option input {
      width: auto;
      margin-top: 3px;
    }

    .workflow-option strong {
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
    }

    .workflow-option span {
      display: block;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.45;
    }

    .agents {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .agent-chip {
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 6px;
      padding: 10px;
      min-width: 0;
    }

    .agent-chip b {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-size: 13px;
    }

    .agent-chip code {
      display: block;
      margin-top: 8px;
      color: var(--muted);
      font-family: var(--mono);
      font-size: 11px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--red);
      margin-top: 4px;
      flex: 0 0 auto;
    }

    .dot.ok { background: var(--teal); }

    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .stage {
      padding: 22px;
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      gap: 18px;
      min-width: 0;
    }

    .run-head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 16px;
      align-items: center;
      border-bottom: 1px solid var(--line);
      padding-bottom: 16px;
    }

    .run-head h2 {
      margin: 0;
      font-size: 24px;
      line-height: 1.2;
    }

    .status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 30px;
      padding: 0 10px;
      border-radius: 999px;
      background: #e7ecef;
      color: var(--ink);
      font-family: var(--mono);
      font-size: 12px;
      white-space: nowrap;
    }

    .status.running { background: #d6ece7; color: #0e6061; }
    .status.waiting { background: #f4dfb9; color: #7b4a13; }
    .status.failed { background: #f1d2ce; color: #842821; }
    .status.done { background: #d9e5f4; color: #234e7b; }

    .approval {
      display: none;
      border: 2px solid var(--amber);
      background: #fff8e8;
      border-radius: 8px;
      padding: 14px;
      box-shadow: var(--shadow);
    }

    .approval.visible {
      display: grid;
      gap: 12px;
    }

    .approval strong {
      font-size: 15px;
    }

    .approval p {
      margin: 0;
      color: #6a4514;
      line-height: 1.5;
    }

    .columns {
      display: grid;
      grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
      gap: 18px;
      min-height: 0;
    }

    .panel {
      background: rgba(255, 255, 255, 0.86);
      border: 1px solid var(--line);
      border-radius: 8px;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }

    .panel-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      background: rgba(17, 20, 23, 0.035);
      font-family: var(--mono);
      font-size: 12px;
      color: var(--muted);
      text-transform: uppercase;
    }

    .steps {
      padding: 8px 0;
      overflow: auto;
      max-height: calc(100vh - 245px);
    }

    .step {
      display: grid;
      grid-template-columns: 22px minmax(0, 1fr);
      gap: 10px;
      padding: 12px 14px;
      border-bottom: 1px solid rgba(216, 221, 226, 0.72);
    }

    .step:last-child { border-bottom: none; }

    .step-mark {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid var(--line);
      margin-top: 3px;
    }

    .step.running .step-mark { border-color: var(--teal); background: var(--teal); }
    .step.completed .step-mark { border-color: var(--blue); background: var(--blue); }
    .step.failed .step-mark { border-color: var(--red); background: var(--red); }

    .step b {
      display: block;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .step span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      font-family: var(--mono);
      overflow-wrap: anywhere;
    }

    .log {
      height: calc(100vh - 245px);
      overflow: auto;
      padding: 0;
      background: #101417;
      color: #dce7ea;
      font-family: var(--mono);
      font-size: 12px;
      line-height: 1.55;
    }

    .log-line {
      display: grid;
      grid-template-columns: 86px 74px minmax(0, 1fr);
      gap: 10px;
      padding: 7px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .log-line time { color: #7f8d96; }
    .log-line .actor { color: #efc16f; }
    .log-line .msg { overflow-wrap: anywhere; white-space: pre-wrap; }

    .empty {
      display: grid;
      place-items: center;
      min-height: 360px;
      border: 1px dashed var(--line);
      border-radius: 8px;
      color: var(--muted);
      text-align: center;
      padding: 24px;
      background: rgba(255, 255, 255, 0.55);
    }

    .empty b {
      display: block;
      margin-bottom: 8px;
      color: var(--ink);
      font-size: 20px;
    }

    .recent {
      display: grid;
      gap: 8px;
      max-height: 180px;
      overflow: auto;
    }

    .recent button {
      width: 100%;
      min-height: 0;
      text-align: left;
      padding: 9px;
      border: 1px solid var(--line);
      color: var(--ink);
      background: var(--panel);
    }

    .recent small {
      display: block;
      margin-top: 4px;
      color: var(--muted);
      font-family: var(--mono);
    }

    @media (max-width: 980px) {
      .app {
        grid-template-columns: 1fr;
      }

      .control {
        border-right: none;
        border-bottom: 1px solid var(--line);
      }

      .columns {
        grid-template-columns: 1fr;
      }

      .steps,
      .log {
        max-height: 420px;
        height: 420px;
      }
    }
  </style>
</head>
<body>
  <main class="app">
    <aside class="control">
      <section class="brand">
        <div>
          <h1>Easy<br />Agent</h1>
          <p>Claude Code 与 Codex 的本地协作控制台</p>
        </div>
        <div class="stamp">LOCAL<br />RUNNER</div>
      </section>

      <section class="field">
        <label for="workspace">工作区</label>
        <input id="workspace" autocomplete="off" />
      </section>

      <section class="field">
        <label>Agent 状态</label>
        <div class="agents" id="agents"></div>
      </section>

      <section class="field">
        <label for="task">任务</label>
        <textarea id="task" placeholder="例如：修复登录接口 500 问题，保留现有 API，并补充测试。"></textarea>
      </section>

      <section class="field">
        <label>协作流程</label>
        <div class="workflow">
          <label class="workflow-option">
            <input type="radio" name="workflow" value="claude_plan_codex_execute_claude_review" checked />
            <span>
              <strong>Claude 规划，Codex 执行，Claude 审查</strong>
              <span>适合修复、重构、补测试。执行前会先审批计划。</span>
            </span>
          </label>
          <label class="workflow-option">
            <input type="radio" name="workflow" value="claude_execute_codex_review" />
            <span>
              <strong>Claude 执行，Codex 审查，Claude 修正</strong>
              <span>适合让 Claude 主导实现，Codex 提供第二视角。</span>
            </span>
          </label>
        </div>
      </section>

      <div class="actions">
        <button id="start">启动协作</button>
        <button id="refresh" class="secondary">刷新状态</button>
      </div>

      <section class="field">
        <label>最近运行</label>
        <div class="recent" id="recent"></div>
      </section>
    </aside>

    <section class="stage">
      <div class="run-head">
        <div>
          <h2 id="run-title">等待任务</h2>
          <div id="run-meta" class="status">idle</div>
        </div>
        <button id="cancel" class="danger" disabled>取消运行</button>
      </div>

      <section class="approval" id="approval">
        <strong>等待审批</strong>
        <p id="approval-text"></p>
        <div class="actions">
          <button id="approve">批准继续</button>
          <button id="reject" class="secondary">拒绝并取消</button>
        </div>
      </section>

      <section id="workspace-view" class="empty">
        <div>
          <b>输入任务后启动协作</b>
          <span>运行过程中会显示 Agent 步骤、审批节点和实时日志。</span>
        </div>
      </section>
    </section>
  </main>

  <script>
    window.__EASY_AGENT__ = { cwd: ${JSON.stringify(initialCwd)} };

    const state = {
      run: null,
      source: null,
    };

    const statusLabels = {
      created: "已创建",
      planning: "规划中",
      awaiting_plan_approval: "等待审批",
      executing: "执行中",
      reviewing: "审查中",
      awaiting_rework_approval: "等待返工审批",
      reworking: "返工中",
      completed: "已完成",
      failed: "失败",
      cancelled: "已取消"
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

    async function api(path, options) {
      const res = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) {
        throw new Error(data && data.error ? data.error : "请求失败");
      }
      return data;
    }

    function statusClass(status) {
      if (status === "completed") return "status done";
      if (status === "failed" || status === "cancelled") return "status failed";
      if (String(status).includes("awaiting")) return "status waiting";
      if (status && status !== "created") return "status running";
      return "status";
    }

    function shortTime(value) {
      if (!value) return "";
      const date = new Date(value);
      return date.toLocaleTimeString("zh-CN", { hour12: false });
    }

    async function refreshAgents() {
      const workspace = qs("workspace").value.trim();
      const agents = qs("agents");
      agents.innerHTML = '<div class="agent-chip"><b>检测中</b><code>...</code></div>';
      try {
        const data = await api("/api/agents?workspace=" + encodeURIComponent(workspace));
        agents.innerHTML = data.agents.map(function(agent) {
          return '<div class="agent-chip">' +
            '<b>' + escapeHtml(agent.role) + '<i class="dot ' + (agent.available ? "ok" : "") + '"></i></b>' +
            '<code title="' + escapeHtml(agent.detail || agent.command) + '">' + escapeHtml(agent.command) + '</code>' +
          '</div>';
        }).join("");
      } catch (error) {
        agents.innerHTML = '<div class="agent-chip"><b>检测失败</b><code>' + escapeHtml(error.message) + '</code></div>';
      }
    }

    async function refreshRuns() {
      const recent = qs("recent");
      try {
        const data = await api("/api/runs");
        if (!data.runs.length) {
          recent.innerHTML = '<span style="color: var(--muted); font-size: 13px;">暂无运行记录</span>';
          return;
        }
        recent.innerHTML = data.runs.slice(0, 8).map(function(run) {
          return '<button data-run="' + escapeHtml(run.id) + '">' +
            escapeHtml(run.task.slice(0, 46) || run.id) +
            '<small>' + escapeHtml(statusLabels[run.status] || run.status) + ' · ' + escapeHtml(shortTime(run.updatedAt)) + '</small>' +
          '</button>';
        }).join("");
        recent.querySelectorAll("button[data-run]").forEach(function(btn) {
          btn.addEventListener("click", function() {
            loadRun(btn.getAttribute("data-run"));
          });
        });
      } catch (error) {
        recent.innerHTML = '<span style="color: var(--red); font-size: 13px;">' + escapeHtml(error.message) + '</span>';
      }
    }

    function renderRun(run) {
      state.run = run;
      qs("run-title").textContent = run.task || run.id;
      qs("run-meta").className = statusClass(run.status);
      qs("run-meta").textContent = (statusLabels[run.status] || run.status) + " · " + (run.currentActor || "system");
      qs("cancel").disabled = ["completed", "failed", "cancelled"].includes(run.status);

      const approval = qs("approval");
      if (run.pendingApproval) {
        approval.classList.add("visible");
        qs("approval-text").textContent = run.pendingApproval.prompt;
      } else {
        approval.classList.remove("visible");
        qs("approval-text").textContent = "";
      }

      const steps = run.steps.length
        ? run.steps.map(function(step) {
          return '<div class="step ' + escapeHtml(step.status) + '">' +
            '<div class="step-mark"></div>' +
            '<div>' +
              '<b>' + escapeHtml(step.actor) + " / " + escapeHtml(step.phase) + '</b>' +
              '<span>' + escapeHtml(step.status) + " · " + escapeHtml(shortTime(step.startedAt)) + '</span>' +
              (step.error ? '<span style="color: var(--red);">' + escapeHtml(step.error) + '</span>' : '') +
            '</div>' +
          '</div>';
        }).join("")
        : '<div class="step"><div class="step-mark"></div><div><b>尚未开始</b><span>等待调度器分配 Agent</span></div></div>';

      const events = run.events.slice(-220).map(function(event) {
        return '<div class="log-line">' +
          '<time>' + escapeHtml(shortTime(event.timestamp)) + '</time>' +
          '<span class="actor">' + escapeHtml(event.actor || event.type) + '</span>' +
          '<span class="msg">' + escapeHtml(event.message) + '</span>' +
        '</div>';
      }).join("");

      qs("workspace-view").className = "columns";
      qs("workspace-view").innerHTML =
        '<section class="panel">' +
          '<div class="panel-title"><span>步骤</span><span>' + escapeHtml(run.steps.length) + '</span></div>' +
          '<div class="steps">' + steps + '</div>' +
        '</section>' +
        '<section class="panel">' +
          '<div class="panel-title"><span>事件日志</span><span>' + escapeHtml(run.id.slice(0, 8)) + '</span></div>' +
          '<div class="log" id="log">' + events + '</div>' +
        '</section>';

      const log = qs("log");
      if (log) log.scrollTop = log.scrollHeight;
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
        alert("请先输入任务。");
        return;
      }
      const workflow = document.querySelector('input[name="workflow"]:checked').value;
      qs("start").disabled = true;
      try {
        const data = await api("/api/runs", {
          method: "POST",
          body: JSON.stringify({
            workspace: qs("workspace").value.trim(),
            task,
            workflow,
            mode: "code"
          })
        });
        connectEvents(data.run.id);
        renderRun(data.run);
        refreshRuns();
      } catch (error) {
        alert(error.message);
      } finally {
        qs("start").disabled = false;
      }
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
      } catch (error) {
        alert(error.message);
      }
    }

    qs("workspace").value = window.__EASY_AGENT__.cwd;
    qs("start").addEventListener("click", startRun);
    qs("refresh").addEventListener("click", function() {
      refreshAgents();
      refreshRuns();
      if (state.run) loadRun(state.run.id);
    });
    qs("approve").addEventListener("click", function() { approveRun(true); });
    qs("reject").addEventListener("click", function() { approveRun(false); });
    qs("cancel").addEventListener("click", cancelRun);
    qs("workspace").addEventListener("change", refreshAgents);

    refreshAgents();
    refreshRuns();
  </script>
</body>
</html>`;
}
