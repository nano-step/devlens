import K, { useSyncExternalStore as A, useRef as Z, useEffect as E, useState as C, useCallback as L, createElement as ee } from "react";
import { jsxs as c, jsx as n, Fragment as ne } from "react/jsx-runtime";
const se = /* @__PURE__ */ new Set([
  "devlens:ready",
  "devlens:issue",
  "devlens:sync",
  "devlens:clear",
  "devlens:ping",
  "devlens:pong"
]);
function te(e) {
  if (typeof e != "object" || e === null) return !1;
  const s = e;
  return typeof s.type == "string" && se.has(s.type) && typeof s.sessionId == "string";
}
function ie(e) {
  if (typeof BroadcastChannel > "u") return null;
  try {
    return new BroadcastChannel(`devlens-${e}`);
  } catch {
    return null;
  }
}
function ae(e, s) {
  let t = null, l = null;
  function i(h) {
    if (t)
      try {
        t.postMessage(h);
        return;
      } catch {
      }
    window.opener && window.opener.postMessage(h, "*");
  }
  function a(h) {
    if (!(!te(h) || h.sessionId !== e))
      switch (h.type) {
        case "devlens:issue":
          s.onConnected(!0), s.onIssue(h.payload);
          break;
        case "devlens:sync":
          s.onConnected(!0), s.onSync(h.payload);
          break;
        case "devlens:clear":
          s.onClear();
          break;
        case "devlens:ping":
          i({ type: "devlens:pong", sessionId: e });
          break;
        case "devlens:ready":
          s.onConnected(!0);
          break;
      }
  }
  function r() {
    t = ie(e), t && (t.onmessage = (h) => a(h.data)), l = (h) => a(h.data), window.addEventListener("message", l), i({ type: "devlens:ready", sessionId: e });
  }
  function o() {
    t && (t.close(), t = null), l && (window.removeEventListener("message", l), l = null), s.onConnected(!1);
  }
  function m() {
    i({ type: "devlens:clear", sessionId: e });
  }
  return { start: r, stop: o, send: i, sendClear: m };
}
const R = 2e3;
function le() {
  const e = new URLSearchParams(window.location.search);
  return e.get("session") ?? e.get("s") ?? "default";
}
function re() {
  let e = {
    issues: [],
    activeTab: "issues",
    severityFilter: "all",
    categoryFilter: "all",
    searchQuery: "",
    expandedIssueId: null,
    connected: !1,
    sessionId: le()
  }, s = {
    loading: !1,
    error: null,
    result: null,
    model: "gemini-2.5-flash-lite"
  }, t = {};
  const l = /* @__PURE__ */ new Set();
  function i() {
    for (const u of l)
      u();
  }
  function a(u) {
    return l.add(u), () => l.delete(u);
  }
  function r() {
    return e;
  }
  function o() {
    return s;
  }
  function m() {
    return t;
  }
  function h(u) {
    e = { ...e, ...u }, i();
  }
  function d(u) {
    s = { ...s, ...u }, i();
  }
  function p(u, b) {
    const q = t[u] ?? { loading: !1, error: null, result: null };
    t = { ...t, [u]: { ...q, ...b } }, i();
  }
  function w(u) {
    const b = [...e.issues, u];
    b.length > R && b.splice(0, b.length - R), e = { ...e, issues: b }, i();
  }
  function N(u) {
    e = { ...e, issues: [...u] }, i();
  }
  function J() {
    e = { ...e, issues: [], expandedIssueId: null }, s = { ...s, result: null, error: null }, t = {}, i();
  }
  function B(u) {
    e = { ...e, activeTab: u, expandedIssueId: null }, i();
  }
  function H(u) {
    e = { ...e, severityFilter: u }, i();
  }
  function Y(u) {
    e = { ...e, categoryFilter: u }, i();
  }
  function Q(u) {
    e = { ...e, searchQuery: u }, i();
  }
  function W(u) {
    e = {
      ...e,
      expandedIssueId: e.expandedIssueId === u ? null : u
    }, i();
  }
  function X(u) {
    e = { ...e, connected: u }, i();
  }
  return {
    subscribe: a,
    getState: r,
    getAIState: o,
    getIssueAIMap: m,
    setState: h,
    setAIState: d,
    setIssueAI: p,
    addIssue: w,
    syncIssues: N,
    clearIssues: J,
    setTab: B,
    setSeverityFilter: H,
    setCategoryFilter: Y,
    setSearchQuery: Q,
    toggleExpandedIssue: W,
    setConnected: X
  };
}
const f = re();
let v = null;
function y() {
  const e = A(f.subscribe, f.getState), s = A(f.subscribe, f.getAIState), t = A(f.subscribe, f.getIssueAIMap);
  return { ...e, ai: s, issueAI: t };
}
function I() {
  return {
    setTab: f.setTab,
    setSeverityFilter: f.setSeverityFilter,
    setCategoryFilter: f.setCategoryFilter,
    setSearchQuery: f.setSearchQuery,
    toggleExpandedIssue: f.toggleExpandedIssue,
    clearIssues: f.clearIssues,
    setAIState: f.setAIState,
    setIssueAI: f.setIssueAI,
    addIssue: f.addIssue
  };
}
function j(e) {
  v && v.stop(), v = ae(e, {
    onIssue: f.addIssue,
    onSync: f.syncIssues,
    onClear: f.clearIssues,
    onConnected: f.setConnected
  }), v.start();
}
function F() {
  v && (v.stop(), v = null);
}
function M() {
  v == null || v.sendClear(), f.clearIssues();
}
const ce = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none"><circle cx="14" cy="14" r="10" stroke="#6366f1" stroke-width="2.5"/><line x1="21.5" y1="21.5" x2="32" y2="32" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/><text x="9" y="18" font-family="monospace" font-size="10" font-weight="bold" fill="#6366f1">{}</text></svg>', oe = [
  { id: "issues", label: "Issues", dotClass: "issues" },
  { id: "timeline", label: "Timeline", dotClass: "timeline" },
  { id: "ai", label: "AI Analysis", dotClass: "ai" },
  { id: "settings", label: "Settings", dotClass: "settings" }
];
function de() {
  const { activeTab: e, issues: s, connected: t, sessionId: l } = y(), { setTab: i } = I();
  return /* @__PURE__ */ c("div", { className: "sidebar", children: [
    /* @__PURE__ */ c("div", { className: "sidebar-header", children: [
      /* @__PURE__ */ n(
        "div",
        {
          className: "sidebar-logo",
          dangerouslySetInnerHTML: { __html: ce }
        }
      ),
      /* @__PURE__ */ c("div", { children: [
        /* @__PURE__ */ n("div", { className: "sidebar-title", children: "DevLens" }),
        /* @__PURE__ */ n("div", { className: "sidebar-subtitle", children: "Dashboard" })
      ] })
    ] }),
    /* @__PURE__ */ n("div", { className: "sidebar-nav", children: oe.map((a) => /* @__PURE__ */ c(
      "div",
      {
        className: `nav-item${e === a.id ? " active" : ""}`,
        onClick: () => i(a.id),
        children: [
          /* @__PURE__ */ n("div", { className: `nav-dot ${a.dotClass}` }),
          /* @__PURE__ */ n("span", { children: a.label }),
          a.id === "issues" && s.length > 0 && /* @__PURE__ */ n("span", { className: "nav-count", children: s.length })
        ]
      },
      a.id
    )) }),
    /* @__PURE__ */ c("div", { className: "sidebar-footer", children: [
      /* @__PURE__ */ c("div", { className: "conn-status", children: [
        /* @__PURE__ */ n("div", { className: `conn-dot ${t ? "on" : "wait"}` }),
        /* @__PURE__ */ n("span", { children: t ? "Connected" : "Waiting…" })
      ] }),
      /* @__PURE__ */ n("div", { className: "session-id mono", children: l })
    ] })
  ] });
}
const ue = {
  issues: "Issues",
  timeline: "Timeline",
  ai: "AI Analysis",
  settings: "Settings"
}, he = [
  { label: "All", value: "all", activeClass: "active" },
  { label: "Error", value: "error", activeClass: "active-error" },
  { label: "Warn", value: "warn", activeClass: "active-warn" },
  { label: "Info", value: "info", activeClass: "active-info" }
];
function me() {
  const { activeTab: e, severityFilter: s, searchQuery: t } = y(), { setSeverityFilter: l, setSearchQuery: i } = I(), a = e === "issues" || e === "timeline";
  return /* @__PURE__ */ c("div", { className: "topbar", children: [
    /* @__PURE__ */ n("div", { className: "topbar-title", children: ue[e] ?? "" }),
    a && /* @__PURE__ */ c("div", { className: "topbar-controls", children: [
      he.map((r) => /* @__PURE__ */ n(
        "button",
        {
          className: `sev-btn${s === r.value ? ` ${r.activeClass}` : ""}`,
          onClick: () => l(r.value),
          children: r.label
        },
        r.value
      )),
      /* @__PURE__ */ n(
        "input",
        {
          className: "search-input",
          type: "text",
          placeholder: "Search issues…",
          value: t,
          onChange: (r) => i(r.target.value)
        }
      )
    ] })
  ] });
}
function U(e) {
  const s = Date.now() - e;
  return s < 1e3 ? "now" : s < 6e4 ? `${Math.floor(s / 1e3)}s ago` : s < 36e5 ? `${Math.floor(s / 6e4)}m ago` : `${Math.floor(s / 36e5)}h ago`;
}
function V(e, s, t, l) {
  return e.filter((i) => {
    var a, r;
    if (s !== "all" && i.severity !== s || t !== "all" && i.category !== t) return !1;
    if (l) {
      const o = l.toLowerCase();
      if (!(i.message.toLowerCase().includes(o) || (((a = i.path) == null ? void 0 : a.toLowerCase().includes(o)) ?? !1) || (((r = i.source) == null ? void 0 : r.toLowerCase().includes(o)) ?? !1) || i.category.toLowerCase().includes(o))) return !1;
    }
    return !0;
  });
}
function fe(e) {
  const s = {};
  for (const t of e)
    s[t.category] = (s[t.category] ?? 0) + 1;
  return s;
}
function pe(e) {
  return JSON.stringify(e, null, 2);
}
function ge(e) {
  const s = "id,timestamp,severity,category,message,path,source,suggestion", t = e.map((l) => [
    l.id,
    new Date(l.timestamp).toISOString(),
    l.severity,
    l.category,
    `"${String(l.message || "").replace(/"/g, '""')}"`,
    l.path || "",
    l.source || "",
    `"${String(l.suggestion || "").replace(/"/g, '""')}"`
  ].join(","));
  return `${s}
${t.join(`
`)}`;
}
function P(e, s, t) {
  const l = new Blob([e], { type: t }), i = document.createElement("a");
  i.href = URL.createObjectURL(l), i.download = s, i.click(), URL.revokeObjectURL(i.href);
}
const T = {
  network: "NET",
  "null-access": "NULL",
  "undefined-data": "UNDEF",
  "render-data": "RENDER",
  "unhandled-error": "ERR",
  "unhandled-rejection": "REJ",
  "type-mismatch": "TYPE",
  "api-contract": "CONTRACT"
}, ve = {
  network: "net",
  "null-access": "null",
  "undefined-data": "undef",
  "render-data": "render",
  "unhandled-error": "err",
  "unhandled-rejection": "rej",
  "type-mismatch": "type",
  "api-contract": "contract"
}, z = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
  "claude-sonnet-4-6",
  "gpt-5",
  "gpt-5.1-codex-mini"
];
function ye() {
  const { issues: e, categoryFilter: s } = y(), { setCategoryFilter: t } = I(), l = fe(e);
  return /* @__PURE__ */ c("div", { className: "statusbar", children: [
    /* @__PURE__ */ n("div", { className: "status-badges", children: Object.entries(l).map(([i, a]) => {
      const r = ve[i] ?? "", o = s === i;
      return /* @__PURE__ */ c(
        "span",
        {
          className: `cat-badge ${r}${o ? " active" : ""}`,
          onClick: () => t(o ? "all" : i),
          children: [
            T[i] ?? i,
            " ",
            a
          ]
        },
        i
      );
    }) }),
    /* @__PURE__ */ c("div", { className: "status-actions", children: [
      /* @__PURE__ */ n(
        "button",
        {
          className: "status-btn",
          onClick: () => {
            const i = pe(e);
            P(i, `devlens-issues-${Date.now()}.json`, "application/json");
          },
          children: "JSON"
        }
      ),
      /* @__PURE__ */ n(
        "button",
        {
          className: "status-btn",
          onClick: () => {
            const i = ge(e);
            P(i, `devlens-issues-${Date.now()}.csv`, "text/csv");
          },
          children: "CSV"
        }
      ),
      /* @__PURE__ */ n("button", { className: "status-btn", onClick: M, children: "CLR" })
    ] })
  ] });
}
const x = /* @__PURE__ */ new Map(), Ne = /(?:at\s+(?:[\w$.]+\s+)?\(?(https?:\/\/[^)]+)\)?|^\s*(https?:\/\/\S+))/, be = /^(https?:\/\/[^:?#]+(?:\.[^:?#]+)*)(?:\?[^:]*)?:(\d+)(?::(\d+))?/;
function Ie(e) {
  const s = [], t = e.split(`
`);
  for (const l of t) {
    if (s.length >= 3) break;
    const i = l.match(Ne);
    if (!i) continue;
    const a = i[1] || i[2];
    if (!a || a.includes("node_modules") || a.includes("__devlens__") || a.includes("chrome-extension")) continue;
    const r = a.match(be);
    if (!r) continue;
    const o = r[1], m = parseInt(r[2], 10), h = r[3] ? parseInt(r[3], 10) : void 0;
    try {
      const p = new URL(o).pathname.replace(/^\//, "");
      if (!p) continue;
      s.push({
        url: o,
        file: p,
        line: m,
        column: h
      });
    } catch {
      continue;
    }
  }
  return s;
}
async function we(e) {
  if (x.has(e))
    return x.get(e) ?? null;
  try {
    const s = new AbortController(), t = setTimeout(() => s.abort(), 3e3), l = await fetch(e, {
      signal: s.signal,
      headers: { Accept: "text/plain" }
    });
    if (clearTimeout(t), !l.ok)
      return x.set(e, null), null;
    const i = await l.text();
    return x.set(e, i), i;
  } catch {
    return x.set(e, null), null;
  }
}
async function xe(e, s = 5) {
  const t = [];
  for (const l of e.slice(0, 2)) {
    const i = await we(l.url);
    if (!i) continue;
    const a = i.split(`
`), r = Math.max(0, l.line - s - 1), o = Math.min(a.length, l.line + s), m = a.slice(r, o).map((h, d) => {
      const p = r + d + 1, w = p === l.line ? ">" : " ", N = String(p).padStart(4);
      return `${w} ${N} | ${h}`;
    }).join(`
`);
    t.push({
      file: l.file,
      line: l.line,
      column: l.column,
      contextLines: m
    });
  }
  return t;
}
async function _(e) {
  var s;
  try {
    let t = [];
    if (e.stack && (t = Ie(e.stack)), t.length === 0 && ((s = e.details) != null && s.filename) && typeof e.details.filename == "string") {
      const i = e.details.filename, a = typeof e.details.lineno == "number" ? e.details.lineno : 1, r = typeof e.details.colno == "number" ? e.details.colno : void 0;
      try {
        const o = new URL(i);
        t.push({
          url: i,
          file: o.pathname.replace(/^\//, ""),
          line: a,
          column: r
        });
      } catch {
      }
    }
    if (t.length === 0) return "";
    const l = await xe(t);
    return l.length === 0 ? "" : l.map(
      (i) => `Source code at ${i.file} (line ${i.line}):
\`\`\`tsx
${i.contextLines}
\`\`\``
    ).join(`

`);
  } catch {
    return "";
  }
}
const Se = "https://proxy.hoainho.info/v1/chat/completions", Ce = "Bearer hoainho", Ae = `You are DevLens AI - a JavaScript/TypeScript runtime error analyst.
Analyze the detected runtime issues and provide structured analysis.

RESPOND IN VALID JSON:
{
  "summary": "1-2 sentences. App health overview.",
  "criticalIssues": [{"title": "...", "severity": "critical|warning|info", "description": "...", "rootCause": "...", "fix": "...", "affectedPath": "..."}],
  "patterns": [{"title": "...", "description": "...", "relatedIssues": ["id"]}],
  "suggestions": [{"title": "...", "priority": "high|medium|low", "description": "...", "codeExample": "..."}]
}

RULES:
- Use markdown in text fields: **bold**, \`inline code\`, \`\`\`code blocks\`\`\`
- Each description/rootCause/fix: max 80 words
- Reference exact file paths, line numbers, variable names from source code when provided
- Group related issues into patterns instead of repeating
- No filler phrases ("It appears that", "This issue occurs because")
- Go straight to the analysis`;
function ke(e, s) {
  return e.map((t, l) => {
    const i = [
      `Issue ${l + 1}:`,
      `  Severity: ${t.severity}`,
      `  Category: ${t.category}`,
      `  Message: ${t.message}`
    ];
    return t.path && i.push(`  Path: ${t.path}`), t.foundValue !== void 0 && i.push(
      `  Value: ${t.foundValue === null ? "null" : String(t.foundValue)}`
    ), t.source && i.push(`  Source: ${t.source}`), t.suggestion && i.push(`  Suggestion: ${t.suggestion}`), t.stack && i.push(
      `  Stack: ${t.stack.split(`
`).slice(0, 3).join(" | ")}`
    ), s[l] && i.push(`  ${s[l]}`), i.join(`
`);
  }).join(`

`);
}
async function O(e, s, t, l) {
  var m, h, d, p;
  const i = await fetch(Se, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: Ce
    },
    body: JSON.stringify({
      model: e,
      messages: [
        { role: "system", content: s },
        { role: "user", content: t }
      ],
      max_tokens: l,
      temperature: 0.3
    })
  });
  if (!i.ok)
    throw new Error(`API error: ${i.status} ${i.statusText}`);
  const a = await i.json(), r = (d = (h = (m = a.choices) == null ? void 0 : m[0]) == null ? void 0 : h.message) == null ? void 0 : d.content;
  if (!r)
    throw new Error("Empty response from AI");
  let o = r.trim();
  if (o.startsWith("```")) {
    const w = o.indexOf(`
`);
    o = o.slice(w + 1);
    const N = o.lastIndexOf("```");
    N > 0 && (o = o.slice(0, N));
  }
  return { text: o.trim(), tokens: ((p = a.usage) == null ? void 0 : p.total_tokens) ?? 0 };
}
async function $e(e, s) {
  const t = [];
  for (let o = 0; o < Math.min(e.length, 3); o++)
    try {
      t[o] = await _(e[o]);
    } catch {
      t[o] = "";
    }
  const l = `Detected ${e.length} runtime issues:

${ke(e, t)}`, { text: i, tokens: a } = await O(s, Ae, l, 2048);
  let r;
  try {
    r = JSON.parse(i);
  } catch {
    r = {
      summary: i.slice(0, 500),
      criticalIssues: [],
      patterns: [],
      suggestions: [
        {
          title: "Raw Analysis",
          priority: "info",
          description: i.slice(0, 2e3)
        }
      ]
    };
  }
  return r._model = s, r._tokens = a, r;
}
const Le = `You are DevLens AI - a JavaScript/TypeScript code fixer.
Given a runtime issue and source code, generate a minimal unified diff patch that fixes the issue.

RESPOND IN VALID JSON:
{
  "file": "path/to/file.ts",
  "diff": "--- a/file.ts\\n+++ b/file.ts\\n@@ -10,3 +10,5 @@\\n context\\n-old line\\n+new line\\n context",
  "explanation": "1 sentence why this fix works."
}

RULES:
- diff MUST be valid unified diff format
- Only change the minimum lines needed
- Include 3 lines of context around changes
- file path should be relative (from source code context)
- If no source code is available, set diff to empty string and explain in explanation`;
async function Ee(e, s) {
  let t = "";
  try {
    t = await _(e);
  } catch {
  }
  const l = `Fix this runtime issue:

${G(e, t)}`, { text: i, tokens: a } = await O(s, Le, l, 1024);
  let r;
  try {
    r = JSON.parse(i);
  } catch {
    r = {
      file: "",
      diff: "",
      explanation: i.slice(0, 500)
    };
  }
  return r._model = s, r._tokens = a, r;
}
const Te = `You are DevLens AI - a JavaScript/TypeScript runtime error analyst.
Analyze the single runtime issue below. Source code from the user's application is provided when available.

RESPOND IN VALID JSON:
{
  "rootCause": "1-2 sentences. What exactly caused this error.",
  "fix": "Concise fix with code. Use markdown: **bold**, \`code\`, \`\`\`code blocks\`\`\`.",
  "codeExample": "// minimal fix code only",
  "impact": "1 sentence. What breaks if unfixed.",
  "prevention": "1 sentence. How to prevent this class of error."
}

RULES:
- Reference EXACT file paths, line numbers, and variable names from the source code
- Each field: max 100 words
- codeExample: only the fix, not the entire file
- Use markdown: **bold**, \`inline code\`, \`\`\`code blocks\`\`\`
- No filler phrases - go straight to analysis
- Point to the exact line in source code where the fix should be applied`;
function G(e, s) {
  const t = [
    `Severity: ${e.severity}`,
    `Category: ${e.category}`,
    `Message: ${e.message}`
  ];
  if (e.path && t.push(`Path: ${e.path}`), e.foundValue !== void 0 && t.push(
    `Value: ${e.foundValue === null ? "null" : String(e.foundValue)}`
  ), e.source && t.push(`Source: ${e.source}`), e.suggestion && t.push(`Existing suggestion: ${e.suggestion}`), e.details)
    for (const [l, i] of Object.entries(e.details))
      t.push(
        `${l}: ${typeof i == "string" ? i : JSON.stringify(i)}`
      );
  return e.stack && t.push(`Stack trace:
${e.stack.split(`
`).slice(0, 5).join(`
`)}`), s && t.push(`
${s}`), t.join(`
`);
}
async function _e(e, s) {
  let t = "";
  try {
    t = await _(e);
  } catch {
  }
  const l = `Analyze this runtime issue:

${G(e, t)}`, { text: i, tokens: a } = await O(
    s,
    Te,
    l,
    1024
  );
  let r;
  try {
    r = JSON.parse(i);
  } catch {
    r = {
      rootCause: i.slice(0, 500),
      fix: "See raw analysis above."
    };
  }
  return r._model = s, r._tokens = a, r;
}
function S(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function k(e) {
  const s = [], t = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let l = 0, i, a = 0;
  for (; (i = t.exec(e)) !== null; )
    i.index > l && s.push(S(e.slice(l, i.index))), i[2] ? s.push(/* @__PURE__ */ n("strong", { children: S(i[2]) }, a++)) : i[3] && s.push(
      /* @__PURE__ */ n("code", { className: "md-inline-code", children: S(i[3]) }, a++)
    ), l = i.index + i[0].length;
  return l < e.length && s.push(S(e.slice(l))), s.length > 0 ? s : [S(e)];
}
function Oe(e, s) {
  const t = e.trim();
  if (!t) return null;
  const l = t.split(`
`), i = l.every((r) => /^\s*[-*]\s/.test(r)), a = l.every((r) => /^\s*\d+\.\s/.test(r));
  return i ? /* @__PURE__ */ n("ul", { children: l.map((r, o) => /* @__PURE__ */ n("li", { children: k(r.replace(/^\s*[-*]\s+/, "")) }, o)) }, s) : a ? /* @__PURE__ */ n("ol", { children: l.map((r, o) => /* @__PURE__ */ n("li", { children: k(r.replace(/^\s*\d+\.\s+/, "")) }, o)) }, s) : /* @__PURE__ */ n("p", { children: l.map((r, o) => /* @__PURE__ */ c(K.Fragment, { children: [
    o > 0 && /* @__PURE__ */ n("br", {}),
    k(r)
  ] }, o)) }, s);
}
function g({
  content: e,
  className: s
}) {
  if (!e) return null;
  const t = [];
  let l = 0;
  const i = e.split(/(```[\s\S]*?```)/g);
  for (const a of i)
    if (a.startsWith("```") && a.endsWith("```")) {
      const r = a.slice(3, -3), o = r.indexOf(`
`), h = o > 0 && o < 20 && !/\s/.test(r.slice(0, o)) ? r.slice(o + 1) : r;
      t.push(
        /* @__PURE__ */ n("pre", { className: "md-code-block", children: /* @__PURE__ */ n("code", { children: h }) }, l++)
      );
    } else {
      const r = a.split(/\n{2,}/);
      for (const o of r) {
        const m = Oe(o, l++);
        m && t.push(m);
      }
    }
  return /* @__PURE__ */ n("div", { className: `md-content${s ? ` ${s}` : ""}`, children: t });
}
function Re({ aiState: e }) {
  if (e.loading)
    return /* @__PURE__ */ n("div", { className: "inline-ai", children: /* @__PURE__ */ c("div", { className: "inline-ai-header", children: [
      /* @__PURE__ */ n("div", { className: "inline-ai-spinner" }),
      /* @__PURE__ */ n("span", { children: "Analyzing..." })
    ] }) });
  if (e.error)
    return /* @__PURE__ */ n("div", { className: "inline-ai", children: /* @__PURE__ */ c("div", { className: "inline-ai-header error", children: [
      /* @__PURE__ */ n("span", { className: "inline-ai-dot error" }),
      /* @__PURE__ */ n("span", { children: e.error })
    ] }) });
  if (!e.result) return null;
  const { result: s } = e;
  return /* @__PURE__ */ c("div", { className: "inline-ai", children: [
    /* @__PURE__ */ c("div", { className: "inline-ai-header", children: [
      /* @__PURE__ */ n("span", { className: "inline-ai-label", children: "AI Analysis" }),
      s._model && /* @__PURE__ */ n("span", { className: "inline-ai-meta", children: s._model }),
      s._tokens ? /* @__PURE__ */ c("span", { className: "inline-ai-meta", children: [
        s._tokens,
        " tokens"
      ] }) : null
    ] }),
    /* @__PURE__ */ c("div", { className: "inline-ai-section", children: [
      /* @__PURE__ */ n("div", { className: "inline-ai-section-label", children: "Root Cause" }),
      /* @__PURE__ */ n(g, { content: s.rootCause })
    ] }),
    /* @__PURE__ */ c("div", { className: "inline-ai-section", children: [
      /* @__PURE__ */ n("div", { className: "inline-ai-section-label", children: "Fix" }),
      /* @__PURE__ */ n(g, { content: s.fix })
    ] }),
    s.codeExample && /* @__PURE__ */ c("div", { className: "inline-ai-section", children: [
      /* @__PURE__ */ n("div", { className: "inline-ai-section-label", children: "Code" }),
      /* @__PURE__ */ n(g, { content: "```\n" + s.codeExample + "\n```" })
    ] }),
    s.impact && /* @__PURE__ */ c("div", { className: "inline-ai-section", children: [
      /* @__PURE__ */ n("div", { className: "inline-ai-section-label", children: "Impact" }),
      /* @__PURE__ */ n(g, { content: s.impact })
    ] }),
    s.prevention && /* @__PURE__ */ c("div", { className: "inline-ai-section", children: [
      /* @__PURE__ */ n("div", { className: "inline-ai-section-label", children: "Prevention" }),
      /* @__PURE__ */ n(g, { content: s.prevention })
    ] })
  ] });
}
function Pe({ issue: e }) {
  const { issueAI: s } = y(), { setIssueAI: t } = I(), [l, i] = C("gemini-2.5-flash-lite"), [a, r] = C(null), o = s[e.id], m = L(async () => {
    if (!(o != null && o.loading)) {
      t(e.id, { loading: !0, error: null, result: null });
      try {
        const d = await _e(e, l);
        t(e.id, { loading: !1, result: d, error: null });
      } catch (d) {
        t(e.id, {
          loading: !1,
          error: d instanceof Error ? d.message : "Analysis failed"
        });
      }
    }
  }, [o == null ? void 0 : o.loading, e, l, t]), h = L(async () => {
    if (!(a != null && a.loading)) {
      r({ loading: !0, result: null, error: null });
      try {
        const d = await Ee(e, l);
        r({ loading: !1, result: d, error: null });
      } catch (d) {
        r({
          loading: !1,
          result: null,
          error: d instanceof Error ? d.message : "Patch generation failed"
        });
      }
    }
  }, [a == null ? void 0 : a.loading, e, l]);
  return /* @__PURE__ */ c("div", { className: "issue-detail visible", children: [
    e.path && /* @__PURE__ */ c("div", { className: "detail-row", children: [
      /* @__PURE__ */ n("span", { className: "detail-label", children: "Path" }),
      /* @__PURE__ */ n("span", { className: "detail-value mono", children: e.path })
    ] }),
    e.foundValue !== void 0 && /* @__PURE__ */ c("div", { className: "detail-row", children: [
      /* @__PURE__ */ n("span", { className: "detail-label", children: "Value" }),
      /* @__PURE__ */ n("span", { className: "detail-value mono", children: e.foundValue === null ? "null" : String(e.foundValue) })
    ] }),
    e.source && /* @__PURE__ */ c("div", { className: "detail-row", children: [
      /* @__PURE__ */ n("span", { className: "detail-label", children: "Source" }),
      /* @__PURE__ */ n("span", { className: "detail-value", children: e.source })
    ] }),
    e.details && Object.entries(e.details).map(([d, p]) => /* @__PURE__ */ c("div", { className: "detail-row", children: [
      /* @__PURE__ */ n("span", { className: "detail-label", children: d }),
      /* @__PURE__ */ n("span", { className: "detail-value", children: typeof p == "string" ? p : JSON.stringify(p) })
    ] }, d)),
    e.suggestion && /* @__PURE__ */ n("div", { className: "detail-suggestion", children: e.suggestion }),
    e.stack && /* @__PURE__ */ n("div", { className: "detail-stack", children: e.stack.split(`
`).slice(0, 5).join(`
`) }),
    /* @__PURE__ */ c("div", { className: "detail-actions", children: [
      /* @__PURE__ */ n(
        "select",
        {
          className: "inline-ai-select",
          value: l,
          onChange: (d) => {
            d.stopPropagation(), i(d.target.value);
          },
          onClick: (d) => d.stopPropagation(),
          children: z.map((d) => /* @__PURE__ */ n("option", { value: d, children: d }, d))
        }
      ),
      /* @__PURE__ */ n(
        "button",
        {
          className: "btn btn-brand",
          disabled: o == null ? void 0 : o.loading,
          onClick: (d) => {
            d.stopPropagation(), m();
          },
          children: o != null && o.loading ? "Analyzing..." : o != null && o.result ? "Re-analyze" : "Analyze with AI"
        }
      ),
      /* @__PURE__ */ n(
        "button",
        {
          className: "btn btn-brand",
          disabled: a == null ? void 0 : a.loading,
          onClick: (d) => {
            d.stopPropagation(), h();
          },
          children: a != null && a.loading ? "Generating..." : a != null && a.result ? "Re-generate Fix" : "Generate Fix"
        }
      )
    ] }),
    o && /* @__PURE__ */ n(Re, { aiState: o }),
    (a == null ? void 0 : a.error) && /* @__PURE__ */ n("div", { className: "inline-ai", children: /* @__PURE__ */ c("div", { className: "inline-ai-header error", children: [
      /* @__PURE__ */ n("span", { className: "inline-ai-dot error" }),
      /* @__PURE__ */ n("span", { children: a.error })
    ] }) }),
    (a == null ? void 0 : a.result) && /* @__PURE__ */ c("div", { className: "inline-ai", children: [
      /* @__PURE__ */ c("div", { className: "inline-ai-header", children: [
        /* @__PURE__ */ n("span", { className: "inline-ai-label", children: "AI Fix" }),
        a.result.file && /* @__PURE__ */ n("span", { className: "inline-ai-meta", children: a.result.file }),
        a.result._model && /* @__PURE__ */ n("span", { className: "inline-ai-meta", children: a.result._model })
      ] }),
      a.result.explanation && /* @__PURE__ */ c("div", { className: "inline-ai-section", children: [
        /* @__PURE__ */ n("div", { className: "inline-ai-section-label", children: "Explanation" }),
        /* @__PURE__ */ n(g, { content: a.result.explanation })
      ] }),
      a.result.diff && /* @__PURE__ */ c("div", { className: "inline-ai-section", children: [
        /* @__PURE__ */ c("div", { className: "inline-ai-section-label", style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
          "Patch",
          /* @__PURE__ */ n(
            "button",
            {
              className: "btn btn-brand",
              style: { fontSize: "10px", padding: "2px 8px" },
              onClick: (d) => {
                var p;
                d.stopPropagation(), navigator.clipboard.writeText(((p = a.result) == null ? void 0 : p.diff) ?? "");
              },
              children: "Copy"
            }
          )
        ] }),
        /* @__PURE__ */ n("pre", { className: "detail-stack", style: { maxHeight: "200px" }, children: a.result.diff })
      ] })
    ] })
  ] });
}
function De({
  issue: e,
  isExpanded: s,
  onToggle: t
}) {
  return /* @__PURE__ */ c(ne, { children: [
    /* @__PURE__ */ c(
      "div",
      {
        className: `issue-row${s ? " expanded" : ""}`,
        onClick: t,
        children: [
          /* @__PURE__ */ n("div", { className: `issue-sev-bar ${e.severity}` }),
          /* @__PURE__ */ n("span", { className: `issue-badge ${e.severity}`, children: T[e.category] ?? "DL" }),
          /* @__PURE__ */ c("div", { className: "issue-body", children: [
            /* @__PURE__ */ n("div", { className: "issue-msg", title: e.message, children: e.message }),
            /* @__PURE__ */ c("div", { className: "issue-meta", children: [
              e.source && /* @__PURE__ */ n("span", { className: "issue-source", children: e.source }),
              /* @__PURE__ */ n("span", { children: e.category }),
              /* @__PURE__ */ n("span", { className: "issue-time", children: U(e.timestamp) })
            ] })
          ] })
        ]
      }
    ),
    s && /* @__PURE__ */ n(Pe, { issue: e })
  ] });
}
const je = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none"><circle cx="14" cy="14" r="10" stroke="#6366f1" stroke-width="2.5"/><line x1="21.5" y1="21.5" x2="32" y2="32" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/><text x="9" y="18" font-family="monospace" font-size="10" font-weight="bold" fill="#6366f1">{}</text></svg>';
function D() {
  const { issues: e, severityFilter: s, categoryFilter: t, searchQuery: l, expandedIssueId: i } = y(), { toggleExpandedIssue: a } = I(), r = Z(null), o = V(e, s, t, l);
  return E(() => {
    r.current && (r.current.scrollTop = r.current.scrollHeight);
  }, [e.length]), o.length === 0 ? /* @__PURE__ */ n("div", { className: "content", ref: r, children: /* @__PURE__ */ c("div", { className: "empty-state", children: [
    /* @__PURE__ */ n("div", { className: "empty-logo", dangerouslySetInnerHTML: { __html: je } }),
    /* @__PURE__ */ n("div", { className: "empty-title", children: "No issues detected yet" }),
    /* @__PURE__ */ n("div", { className: "empty-sub", children: e.length > 0 ? "Try adjusting your filters" : "DevLens is watching your application for runtime errors, null access, API failures, and more." })
  ] }) }) : /* @__PURE__ */ n("div", { className: "content", ref: r, children: o.map((m) => /* @__PURE__ */ n(
    De,
    {
      issue: m,
      isExpanded: i === m.id,
      onToggle: () => a(m.id)
    },
    m.id
  )) });
}
const Fe = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none"><circle cx="14" cy="14" r="10" stroke="#6366f1" stroke-width="2.5"/><line x1="21.5" y1="21.5" x2="32" y2="32" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/><text x="9" y="18" font-family="monospace" font-size="10" font-weight="bold" fill="#6366f1">{}</text></svg>';
function Me() {
  const { issues: e, severityFilter: s, categoryFilter: t, searchQuery: l } = y(), i = V(e, s, t, l);
  return i.length === 0 ? /* @__PURE__ */ n("div", { className: "content", children: /* @__PURE__ */ c("div", { className: "empty-state", children: [
    /* @__PURE__ */ n("div", { className: "empty-logo", dangerouslySetInnerHTML: { __html: Fe } }),
    /* @__PURE__ */ n("div", { className: "empty-title", children: "No issues to display" }),
    /* @__PURE__ */ n("div", { className: "empty-sub", children: "Adjust your filters or wait for issues." })
  ] }) }) : /* @__PURE__ */ n("div", { className: "content", children: i.map((a) => /* @__PURE__ */ c("div", { className: "tl-item", children: [
    /* @__PURE__ */ n("div", { className: "tl-line" }),
    /* @__PURE__ */ n("div", { className: `tl-dot ${a.severity}` }),
    /* @__PURE__ */ c("div", { className: "tl-content", children: [
      /* @__PURE__ */ n("div", { className: "tl-time", children: U(a.timestamp) }),
      /* @__PURE__ */ n("div", { className: "tl-msg", children: a.message }),
      /* @__PURE__ */ c("div", { className: "tl-cat", children: [
        /* @__PURE__ */ n("span", { className: `issue-badge ${a.severity}`, children: T[a.category] ?? "DL" }),
        " ",
        a.category
      ] })
    ] })
  ] }, a.id)) });
}
const Ue = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none"><circle cx="14" cy="14" r="10" stroke="#6366f1" stroke-width="2.5"/><line x1="21.5" y1="21.5" x2="32" y2="32" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/><text x="9" y="18" font-family="monospace" font-size="10" font-weight="bold" fill="#6366f1">{}</text></svg>';
function $({
  item: e
}) {
  const [s, t] = C(!1), l = e.severity ?? e.priority ?? "info";
  return /* @__PURE__ */ c(
    "div",
    {
      className: `ai-item${s ? " expanded" : ""}`,
      onClick: () => t(!s),
      children: [
        /* @__PURE__ */ c("div", { className: "ai-item-title", children: [
          /* @__PURE__ */ n("span", { className: `ai-item-sev ${l}`, children: l }),
          e.title ?? ""
        ] }),
        /* @__PURE__ */ c("div", { className: "ai-item-body", children: [
          e.description && /* @__PURE__ */ n(g, { content: e.description }),
          e.rootCause && /* @__PURE__ */ c("div", { className: "ai-item-field", children: [
            /* @__PURE__ */ n("div", { className: "ai-item-field-label", children: "Root Cause" }),
            /* @__PURE__ */ n(g, { content: e.rootCause })
          ] }),
          e.fix && /* @__PURE__ */ c("div", { className: "ai-item-field", children: [
            /* @__PURE__ */ n("div", { className: "ai-item-field-label", children: "Fix" }),
            /* @__PURE__ */ n(g, { content: e.fix })
          ] }),
          e.codeExample && /* @__PURE__ */ n(g, { content: "```\n" + e.codeExample + "\n```" }),
          e.affectedPath && /* @__PURE__ */ c("div", { className: "ai-item-field", children: [
            /* @__PURE__ */ n("div", { className: "ai-item-field-label", children: "Affected Path" }),
            /* @__PURE__ */ n("span", { className: "mono", children: e.affectedPath })
          ] }),
          e.relatedIssues && e.relatedIssues.length > 0 && /* @__PURE__ */ c("div", { className: "ai-item-field", children: [
            /* @__PURE__ */ n("div", { className: "ai-item-field-label", children: "Related Issues" }),
            e.relatedIssues.join(", ")
          ] })
        ] })
      ]
    }
  );
}
function Ve({ result: e }) {
  return /* @__PURE__ */ c("div", { className: "ai-results", children: [
    /* @__PURE__ */ c("div", { className: "ai-summary", children: [
      /* @__PURE__ */ n("div", { className: "ai-summary-title", children: "Summary" }),
      e._model && /* @__PURE__ */ c("div", { className: "ai-summary-meta", children: [
        /* @__PURE__ */ n("span", { children: e._model }),
        e._tokens ? /* @__PURE__ */ c("span", { children: [
          e._tokens,
          " tokens"
        ] }) : null
      ] }),
      /* @__PURE__ */ n(g, { content: e.summary ?? "" })
    ] }),
    e.criticalIssues && e.criticalIssues.length > 0 && /* @__PURE__ */ c("div", { className: "ai-section critical", children: [
      /* @__PURE__ */ c("div", { className: "ai-section-header", children: [
        "Critical Issues",
        /* @__PURE__ */ n("span", { className: "count", children: e.criticalIssues.length })
      ] }),
      e.criticalIssues.map((s, t) => /* @__PURE__ */ n($, { item: s }, `ci-${t}`))
    ] }),
    e.patterns && e.patterns.length > 0 && /* @__PURE__ */ c("div", { className: "ai-section patterns", children: [
      /* @__PURE__ */ c("div", { className: "ai-section-header", children: [
        "Patterns Detected",
        /* @__PURE__ */ n("span", { className: "count", children: e.patterns.length })
      ] }),
      e.patterns.map((s, t) => /* @__PURE__ */ n($, { item: s }, `pa-${t}`))
    ] }),
    e.suggestions && e.suggestions.length > 0 && /* @__PURE__ */ c("div", { className: "ai-section suggestions", children: [
      /* @__PURE__ */ c("div", { className: "ai-section-header", children: [
        "Suggestions",
        /* @__PURE__ */ n("span", { className: "count", children: e.suggestions.length })
      ] }),
      e.suggestions.map((s, t) => /* @__PURE__ */ n($, { item: s }, `su-${t}`))
    ] }),
    /* @__PURE__ */ n("div", { className: "ai-disclaimer", children: "AI analysis may contain inaccuracies. Always verify suggestions before implementing." })
  ] });
}
function ze() {
  const { issues: e, ai: s } = y(), { setAIState: t } = I(), [l, i] = C("gemini-2.5-flash-lite"), a = L(async () => {
    if (!(s.loading || e.length === 0)) {
      t({ loading: !0, error: null, result: null });
      try {
        const r = await $e(e, l);
        t({ loading: !1, result: r, error: null });
      } catch (r) {
        t({
          loading: !1,
          error: r instanceof Error ? r.message : "Unknown error"
        });
      }
    }
  }, [s.loading, e, l, t]);
  return /* @__PURE__ */ n("div", { className: "content", children: /* @__PURE__ */ c("div", { className: "ai-panel", children: [
    /* @__PURE__ */ c("div", { className: "ai-controls", children: [
      /* @__PURE__ */ n(
        "select",
        {
          className: "ai-select",
          value: l,
          onChange: (r) => i(r.target.value),
          children: z.map((r) => /* @__PURE__ */ n("option", { value: r, children: r }, r))
        }
      ),
      /* @__PURE__ */ c(
        "button",
        {
          className: "ai-analyze-btn",
          disabled: s.loading || e.length === 0,
          onClick: a,
          children: [
            "Analyze All Issues (",
            e.length,
            ")"
          ]
        }
      )
    ] }),
    s.loading && /* @__PURE__ */ c("div", { className: "ai-loading", children: [
      /* @__PURE__ */ n("div", { className: "ai-spinner" }),
      /* @__PURE__ */ c("div", { className: "ai-loading-text", children: [
        "Analyzing with ",
        l,
        "…"
      ] })
    ] }),
    s.error && /* @__PURE__ */ c("div", { className: "ai-error", children: [
      /* @__PURE__ */ n("div", { className: "ai-error-dot" }),
      s.error,
      /* @__PURE__ */ n(
        "button",
        {
          className: "btn btn-ghost",
          style: { marginLeft: "auto" },
          onClick: a,
          children: "Retry"
        }
      )
    ] }),
    s.result && !s.loading && /* @__PURE__ */ n(Ve, { result: s.result }),
    !s.result && !s.loading && !s.error && /* @__PURE__ */ c("div", { className: "empty-state", children: [
      /* @__PURE__ */ n("div", { className: "empty-logo", dangerouslySetInnerHTML: { __html: Ue } }),
      /* @__PURE__ */ n("div", { className: "empty-title", children: "AI-Powered Analysis" }),
      /* @__PURE__ */ n("div", { className: "empty-sub", children: 'Click "Analyze All Issues" to get AI-powered insights: root cause detection, pattern analysis, and actionable fix suggestions.' })
    ] })
  ] }) });
}
function Ge() {
  const { issues: e, sessionId: s } = y();
  return /* @__PURE__ */ n("div", { className: "content", children: /* @__PURE__ */ c("div", { className: "settings-panel", children: [
    /* @__PURE__ */ c("div", { className: "settings-group", children: [
      /* @__PURE__ */ n("div", { className: "settings-label", children: "Session ID" }),
      /* @__PURE__ */ n("div", { className: "settings-value mono", children: s })
    ] }),
    /* @__PURE__ */ c("div", { className: "settings-group", children: [
      /* @__PURE__ */ n("div", { className: "settings-label", children: "Dashboard URL" }),
      /* @__PURE__ */ c("div", { className: "settings-value mono", children: [
        window.location.origin,
        "?session=",
        s
      ] })
    ] }),
    /* @__PURE__ */ c("div", { className: "settings-group", children: [
      /* @__PURE__ */ n("div", { className: "settings-label", children: "Total Issues" }),
      /* @__PURE__ */ n("div", { className: "settings-value", children: e.length })
    ] }),
    /* @__PURE__ */ n("div", { className: "settings-group", children: /* @__PURE__ */ n("button", { className: "btn btn-ghost", onClick: M, children: "Clear All Issues" }) }),
    /* @__PURE__ */ c("div", { className: "settings-group", children: [
      /* @__PURE__ */ n("div", { className: "settings-label", children: "Version" }),
      /* @__PURE__ */ n("div", { className: "settings-value", children: "DevLens Dashboard v0.1.0" })
    ] })
  ] }) });
}
function Je() {
  const { activeTab: e } = y();
  switch (e) {
    case "issues":
      return /* @__PURE__ */ n(D, {});
    case "timeline":
      return /* @__PURE__ */ n(Me, {});
    case "ai":
      return /* @__PURE__ */ n(ze, {});
    case "settings":
      return /* @__PURE__ */ n(Ge, {});
    default:
      return /* @__PURE__ */ n(D, {});
  }
}
function Be() {
  const { sessionId: e } = y();
  return E(() => (j(e), () => F()), [e]), /* @__PURE__ */ c("div", { className: "app", children: [
    /* @__PURE__ */ n(de, {}),
    /* @__PURE__ */ c("div", { className: "main", children: [
      /* @__PURE__ */ n(me, {}),
      /* @__PURE__ */ n(Je, {}),
      /* @__PURE__ */ n(ye, {})
    ] })
  ] });
}
function He() {
  if (typeof window > "u") return "default";
  const e = new URLSearchParams(window.location.search);
  return e.get("session") ?? e.get("s") ?? "default";
}
function We({ sessionId: e }) {
  const s = e ?? He();
  return E(() => (j(s), () => F()), [s]), ee(Be);
}
export {
  We as DevLensDashboard,
  j as connectDashboard,
  F as disconnectDashboard,
  M as sendClearToApp,
  I as useDashboardActions,
  y as useDashboardStore
};
//# sourceMappingURL=index.js.map
