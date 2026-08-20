window.__ModuleLoader__.load({ id: 'dsh-cmd-send', factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/shared.ts
var SETTINGS_NAMESPACE = "dsh-cmd-send";
var SEND_MODE_FIELD = "sendMode";
var SEND_MODES = ["enter", "cmd-enter"];
var DEFAULT_SEND_MODE = "enter";

// src/client/locales.ts
var zh = {
  "settings.sendMode.title": "\u53D1\u9001\u5FEB\u6377\u952E",
  "settings.sendMode.description": "Cmd+Enter \u53D1\u9001: Enter \u53EA\u6362\u884C, Cmd+Enter \u6392\u961F\u53D1\u9001, Shift+Cmd+Enter \u63D2\u8BDD\u53D1\u9001",
  "settings.sendMode.enter": "Enter \u53D1\u9001",
  "settings.sendMode.cmdEnter": "Cmd+Enter \u53D1\u9001"
};
var en = {
  "settings.sendMode.title": "Send shortcut",
  "settings.sendMode.description": "Cmd+Enter send: Enter inserts a newline, Cmd+Enter queues, Shift+Cmd+Enter steers",
  "settings.sendMode.enter": "Enter to send",
  "settings.sendMode.cmdEnter": "Cmd+Enter to send"
};
var NS = "dsh-cmd-send";

// src/client/controller.tsx
var import_react = require("react");

// src/client/keymap.ts
function decideKey(event, input) {
  if (event.key !== "Enter") return { kind: "pass" };
  if (event.isComposing || event.keyCode === 229) return { kind: "pass" };
  if (input.mode !== "cmd-enter") return { kind: "pass" };
  if (input.phase === "adjudicating" || input.phase === "submitting") return { kind: "pass" };
  const meta = event.metaKey || event.ctrlKey;
  if (meta) {
    return event.shiftKey ? { kind: "steer" } : { kind: "send" };
  }
  if (event.shiftKey || event.altKey) return { kind: "pass" };
  if (input.phase === "claimed") return { kind: "pass" };
  return { kind: "newline" };
}

// src/client/controller.tsx
async function steerSend(context) {
  const { input, actions } = context;
  if (input.draft.trim() === "" && input.imageIds.length === 0) return;
  if (!context.running || input.imageIds.length > 0) {
    actions.submit();
    return;
  }
  const session = context.sessions.binding(context.sessionId)?.session;
  if (session === void 0) {
    actions.submit();
    return;
  }
  const text = input.draft;
  actions.setDraft("");
  const result = await session.prompt([{ type: "text", text }], "steer");
  if (!result.ok) {
    actions.setDraft(text);
  }
}
function KeymapController({ useSession, useInput, inputActions, sessionId, sessions, scope }) {
  const running = useSession((s) => s.running) ?? false;
  const input = useInput((s) => s);
  const latest = (0, import_react.useRef)({ running, input, inputActions, sessionId, sessions });
  latest.current = { running, input, inputActions, sessionId, sessions };
  (0, import_react.useEffect)(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLTextAreaElement)) return;
      if (target.closest("[data-input-scroll]") === null) return;
      const state = latest.current;
      if (state.input === void 0 || state.inputActions === void 0) return;
      const mode = scope.getSnapshot().value?.sendMode ?? DEFAULT_SEND_MODE;
      const decision = decideKey(event, { mode, phase: state.input.phase });
      switch (decision.kind) {
        case "pass":
          return;
        case "newline":
          event.stopImmediatePropagation();
          return;
        case "send":
          event.preventDefault();
          event.stopImmediatePropagation();
          state.inputActions.submit();
          return;
        case "steer":
          event.preventDefault();
          event.stopImmediatePropagation();
          void steerSend({
            sessionId: state.sessionId,
            running: state.running,
            input: state.input,
            actions: state.inputActions,
            sessions: state.sessions
          });
          return;
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [scope]);
  return null;
}

// src/client/settings-row.tsx
var import_react2 = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime = require("react/jsx-runtime");
var OPTIONS = [
  { id: "enter", label: "settings.sendMode.enter" },
  { id: "cmd-enter", label: "settings.sendMode.cmdEnter" }
];
function useSendMode(scope) {
  return (0, import_react2.useSyncExternalStore)(
    (onChange) => scope.subscribe(onChange),
    () => scope.getSnapshot().value?.sendMode ?? DEFAULT_SEND_MODE
  );
}
function SendModeRow({ scope, t }) {
  const mode = useSendMode(scope);
  const [open, setOpen] = (0, import_react2.useState)(false);
  const selectedLabel = mode === "cmd-enter" ? "settings.sendMode.cmdEnter" : "settings.sendMode.enter";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-cmd-send-row", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-cmd-send-rowText", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-cmd-send-rowTitle", children: t("settings.sendMode.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-cmd-send-rowDesc", children: t("settings.sendMode.description") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.Menu,
      {
        open,
        onClose: () => setOpen(false),
        items: OPTIONS.map((option) => ({ id: option.id, label: t(option.label) })),
        selectedId: mode,
        onSelect: (id) => {
          setOpen(false);
          if (id === "enter" || id === "cmd-enter") {
            void scope.set(SEND_MODE_FIELD, id);
          }
        },
        align: "end",
        portal: true,
        anchor: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            type: "button",
            className: "dsh-cmd-send-selector",
            "aria-haspopup": "menu",
            "aria-expanded": open,
            onClick: () => setOpen((value) => !value),
            children: [
              t(selectedLabel),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconChevronDownOutline14, { className: "dsh-cmd-send-chevron" })
            ]
          }
        )
      }
    )
  ] });
}

// src/client/styles.ts
var STYLE_ID = "dsh-cmd-send-styles";
var css = `
.dsh-cmd-send-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 40px;
}
.dsh-cmd-send-rowText {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.dsh-cmd-send-rowTitle {
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 22px;
}
.dsh-cmd-send-rowDesc {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
}
.dsh-cmd-send-selector {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--dsw-alias-border);
  border-radius: 8px;
  background: var(--dsw-alias-interactive-bg);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
}
.dsh-cmd-send-selector:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}
.dsh-cmd-send-selector:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: -2px;
}
.dsh-cmd-send-chevron {
  color: var(--dsw-alias-label-tertiary);
}
`;
function adoptStyles() {
  if (document.getElementById(STYLE_ID) !== null) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
}

// src/client/settings.ts
function decodeCmdSend(section) {
  if (typeof section !== "object" || section === null) return void 0;
  const value = section.sendMode;
  return typeof value === "string" && SEND_MODES.includes(value) ? { sendMode: value } : void 0;
}

// src/client/index.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var inject = ["slots", "sessions", "locale", "settingsScope"];
function apply(ctx) {
  adoptStyles();
  const scope = ctx.settingsScope.bind({
    namespace: SETTINGS_NAMESPACE,
    decode: decodeCmdSend
  });
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-cmd-send: dictionaries");
  ctx.slots.inject("settings.general.item", () => ctx.slots.register({
    name: "settings.general.item",
    id: "dsh-cmd-send",
    order: 25,
    locale: NS,
    inject: () => ({ scope })
  }, SendModeRow));
  ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
    name: "conversation.input.dock",
    id: "dsh-cmd-send-keymap",
    order: 999
  }, (props) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KeymapController, { ...props, sessions: ctx.sessions, scope })));
}
return module.exports; } });
//# sourceMappingURL=client.js.map
