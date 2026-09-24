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
var PLUGIN_ID = "dsh-cmd-send";
var ENTRY_ID = PLUGIN_ID;
var SEND_MODE_FIELD = "sendMode";
var DEFAULT_SEND_MODE = "enter";

// src/client/locales.ts
var NS = "dsh-cmd-send";
var en = {
  description: "Choose whether Enter sends, or Cmd+Enter sends and Enter inserts a newline.",
  sendMode: "Send shortcut",
  sendModeHint: "Cmd+Enter send: Enter inserts a newline, Cmd+Enter queues, Shift+Cmd+Enter steers.",
  enter: "Enter to send",
  cmdEnter: "Cmd+Enter to send",
  overridden: "Overridden",
  reset: "Reset to default",
  readOnly: "This deployment stores settings read-only.",
  unavailable: "This plugin is not loaded, so it cannot be configured right now.",
  save: "Save",
  saving: "Saving...",
  saveFailed: "The deployment did not accept these values; they were left for you to correct."
};
var zh = {
  description: "\u9009\u62E9 Enter \u76F4\u63A5\u53D1\u9001, \u8FD8\u662F Cmd+Enter \u53D1\u9001\u800C Enter \u53EA\u6362\u884C.",
  sendMode: "\u53D1\u9001\u5FEB\u6377\u952E",
  sendModeHint: "Cmd+Enter \u53D1\u9001: Enter \u53EA\u6362\u884C, Cmd+Enter \u6392\u961F\u53D1\u9001, Shift+Cmd+Enter \u63D2\u8BDD\u53D1\u9001.",
  enter: "Enter \u53D1\u9001",
  cmdEnter: "Cmd+Enter \u53D1\u9001",
  overridden: "\u5DF2\u8986\u76D6",
  reset: "\u6062\u590D\u9ED8\u8BA4",
  readOnly: "\u672C\u90E8\u7F72\u7684\u8BBE\u7F6E\u4E3A\u53EA\u8BFB.",
  unavailable: "\u8BE5\u63D2\u4EF6\u5F53\u524D\u672A\u52A0\u8F7D, \u6682\u65F6\u65E0\u6CD5\u914D\u7F6E.",
  save: "\u4FDD\u5B58",
  saving: "\u4FDD\u5B58\u4E2D...",
  saveFailed: "\u672C\u90E8\u7F72\u6CA1\u6709\u63A5\u53D7\u8FD9\u4E9B\u503C, \u5DF2\u4FDD\u7559\u4F9B\u4F60\u4FEE\u6539."
};
function formLabels(t) {
  return {
    unavailable: t("unavailable"),
    readOnly: t("readOnly"),
    saveFailed: t("saveFailed"),
    save: t("save"),
    saving: t("saving")
  };
}

// src/client/controller.tsx
var import_react = require("react");

// src/client/ask-field.ts
var ASK_FRAME_SELECTOR = "[data-question-key]";
function isAskAnswerField(target) {
  return target instanceof HTMLTextAreaElement && target.closest(ASK_FRAME_SELECTOR) !== null;
}
function decideAskAnswerKey(event, mode) {
  if (event.key !== "Enter") return { kind: "pass" };
  if (event.isComposing || event.keyCode === 229) return { kind: "pass" };
  if (mode !== "cmd-enter") return { kind: "pass" };
  if (event.metaKey || event.ctrlKey) return { kind: "submit" };
  if (event.shiftKey || event.altKey) return { kind: "pass" };
  return { kind: "newline" };
}

// src/client/keymap.ts
function hasContent(input) {
  return input.draft.trim() !== "" || input.attachmentIds.length > 0;
}
function decideKey(event, input) {
  if (event.key !== "Enter") return { kind: "pass" };
  if (event.isComposing || event.keyCode === 229) return { kind: "pass" };
  if (input.mode !== "cmd-enter") return { kind: "pass" };
  if (input.phase === "adjudicating" || input.phase === "submitting") return { kind: "pass" };
  const meta = event.metaKey || event.ctrlKey;
  if (meta) {
    if (event.repeat) return { kind: "pass" };
    if (!input.content) return { kind: "pass" };
    return event.shiftKey ? { kind: "steer" } : { kind: "send" };
  }
  if (event.shiftKey || event.altKey) return { kind: "pass" };
  if (input.candidateHighlight) return { kind: "pass" };
  if (input.phase === "claimed") return { kind: "pass" };
  return { kind: "newline" };
}

// src/client/steer.ts
function steeringAvailable(subagent) {
  return subagent === null || subagent.address.mode === "continuable";
}
function submitSteer({ sessions, sessionId }) {
  const actx = sessions.scope(sessionId);
  const conversation = actx?.get("conversation");
  if (actx === void 0 || conversation === void 0) return false;
  try {
    conversation.input.for(actx).submit("steer");
    return true;
  } catch (error) {
    console.error("[dsh-cmd-send] steer \u63D0\u4EA4\u4E0D\u53EF\u7528, \u9000\u56DE\u666E\u901A\u63D0\u4EA4", error);
    return false;
  }
}

// src/client/controller.tsx
function isComposerInput(target) {
  return target instanceof HTMLElement && target.closest("[data-composer-input]") !== null;
}
var CANDIDATE_LIST_SELECTOR = '[data-trigger-menu] [role="listbox"][aria-activedescendant]';
function hasHighlightedCandidate(target) {
  if (!(target instanceof Element)) return false;
  const card = target.closest("[data-composer-card]");
  return card !== null && card.querySelector(CANDIDATE_LIST_SELECTOR) !== null;
}
function rewriteShiftKey(event, shiftKey) {
  try {
    Object.defineProperty(event, "shiftKey", {
      configurable: true,
      enumerable: true,
      get: () => shiftKey
    });
    return event.shiftKey === shiftKey;
  } catch {
    return false;
  }
}
function KeymapController({ useSession, useInput, inputActions, sessionId, sessions, scope }) {
  const running = useSession((s) => s.running) ?? false;
  const subagent = useSession((s) => s.subagent) ?? null;
  const input = useInput((s) => s);
  const latest = (0, import_react.useRef)({ running, subagent, input, inputActions, sessionId, sessions });
  latest.current = { running, subagent, input, inputActions, sessionId, sessions };
  (0, import_react.useEffect)(() => {
    const onKeyDown = (event) => {
      const mode = scope.getSnapshot().value?.sendMode ?? DEFAULT_SEND_MODE;
      if (isAskAnswerField(event.target)) {
        const ask = decideAskAnswerKey(event, mode);
        if (ask.kind === "newline") rewriteShiftKey(event, true);
        else if (ask.kind === "submit") rewriteShiftKey(event, false);
        return;
      }
      if (!isComposerInput(event.target)) return;
      const state = latest.current;
      if (state.input === void 0 || state.inputActions === void 0) return;
      const decision = decideKey(event, {
        mode,
        phase: state.input.phase,
        content: hasContent(state.input),
        candidateHighlight: hasHighlightedCandidate(event.target)
      });
      switch (decision.kind) {
        case "pass":
          return;
        case "newline":
          if (!rewriteShiftKey(event, true)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            document.execCommand("insertLineBreak");
          }
          return;
        case "send":
          event.preventDefault();
          event.stopImmediatePropagation();
          state.inputActions.submit();
          return;
        case "steer":
          event.preventDefault();
          event.stopImmediatePropagation();
          if (!state.running || !steeringAvailable(state.subagent) || !submitSteer({ sessions: state.sessions, sessionId: state.sessionId })) {
            state.inputActions.submit();
          }
          return;
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [scope]);
  return null;
}

// src/client/settings-card.tsx
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/fields.tsx
var import_react2 = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime = require("react/jsx-runtime");
function ChoiceField(props) {
  const [open, setOpen] = (0, import_react2.useState)(false);
  const selected = props.options.find((option) => option.value === props.value);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-cmd-send-field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-cmd-send-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-cmd-send-label", id: `${props.id}-label`, children: props.label }),
      props.overridden ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsh-cmd-send-badges", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tag, { tone: "neutral", children: props.overriddenLabel }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: "dsh-cmd-send-reset",
            disabled: props.disabled,
            onClick: props.onReset,
            children: props.resetLabel
          }
        )
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.Menu,
      {
        open,
        onClose: () => {
          setOpen(false);
        },
        items: props.options.map((option) => ({ id: option.value, label: option.label })),
        selectedId: props.value,
        portal: true,
        anchor: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            type: "button",
            className: "dsh-cmd-send-selector",
            "aria-labelledby": `${props.id}-label`,
            "aria-haspopup": "menu",
            "aria-expanded": open,
            disabled: props.disabled,
            onClick: () => {
              setOpen((current) => !current);
            },
            children: [
              selected?.label ?? "",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconChevronDownOutlineMedium, { className: "dsh-cmd-send-chevron" })
            ]
          }
        ),
        onSelect: (id) => {
          setOpen(false);
          const next = props.options.find((option) => option.value === id);
          if (next !== void 0 && next.value !== props.value) props.onSelect(next.value);
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh-cmd-send-hint", children: props.hint })
  ] });
}

// src/client/settings-card.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function CmdSendSettingsCard(props) {
  const { t } = props;
  const state = props.useCmdSendCard((snapshot) => snapshot);
  if (props.view === "summary") return t("description");
  const mode = state.sendMode.text === "cmd-enter" ? "cmd-enter" : "enter";
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.SettingsForm, { labels: formLabels(t), state, onSave: props.save, onDiscard: props.discard, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    ChoiceField,
    {
      id: "plugin-config-cmd-send-mode",
      label: t("sendMode"),
      hint: t("sendModeHint"),
      value: mode,
      options: [
        { value: "enter", label: t("enter") },
        { value: "cmd-enter", label: t("cmdEnter") }
      ],
      overridden: state.sendMode.overridden,
      overriddenLabel: t("overridden"),
      resetLabel: t("reset"),
      disabled: !state.writable,
      onSelect: (next) => {
        props.edit(SEND_MODE_FIELD, next);
      },
      onReset: () => {
        props.resetField(SEND_MODE_FIELD);
      }
    }
  ) });
}

// src/client/settings-form.ts
var import_dsh_client_ui_primitives3 = require("@deepseek-ai/dsh-client-ui-primitives");
var CmdSendSettingsForm = class {
  form;
  store;
  /**
   * @param scope - 本插件 profile 条目的共享配置表单 (ctx.configForms.get).
   */
  constructor(scope) {
    this.form = new import_dsh_client_ui_primitives3.SettingsFormModel(scope, [(0, import_dsh_client_ui_primitives3.settingsTextField)(SEND_MODE_FIELD)]);
    this.store = this.form.bind(() => ({
      ...this.form.shell(),
      sendMode: this.form.field(SEND_MODE_FIELD)
    }));
  }
  /**
   * 构造 slot 注册要注入的面.
   * @returns 快照 hook 与表单动作.
   */
  inject() {
    return { hooks: { cmdSendCard: this.store }, ...this.form.actions() };
  }
  /** 释放对配置表单的订阅. */
  dispose() {
    this.form.dispose();
  }
};

// src/client/styles.ts
var STYLE_ID = "dsh-cmd-send-styles";
var css = `
.dsh-cmd-send-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 0;
}
.dsh-cmd-send-field + .dsh-cmd-send-field {
  border-top: 0.5px solid var(--dsw-alias-border-l2);
}
.dsh-cmd-send-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dsh-cmd-send-label {
  flex: 1;
  min-width: 0;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
}
.dsh-cmd-send-badges {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.dsh-cmd-send-reset {
  padding: 0;
  border: none;
  background: none;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  line-height: 1.5;
  cursor: pointer;
}
.dsh-cmd-send-reset:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary);
}
.dsh-cmd-send-reset:disabled {
  cursor: default;
}
.dsh-cmd-send-selector {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  align-self: flex-start;
  min-width: 180px;
  height: 34px;
  padding: 0 12px;
  border: 0.5px solid var(--dsw-alias-border-l4);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-3);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 1.5;
  cursor: pointer;
}
.dsh-cmd-send-selector:hover:not(:disabled) {
  border-color: var(--dsw-alias-border-l2);
  background: var(--dsw-alias-interactive-bg-hover);
}
.dsh-cmd-send-selector:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 1px;
}
.dsh-cmd-send-selector:disabled {
  color: var(--dsw-alias-label-tertiary);
  cursor: default;
}
.dsh-cmd-send-chevron {
  flex: none;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-cmd-send-hint {
  margin: 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 1.5;
}
`;
function adoptStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return;
  const style = document.createElement("style");
  style.dataset.pluginCss = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
}

// src/client/index.tsx
var inject = ["slots", "sessions", "locale", "configForms"];
function apply(ctx) {
  adoptStyles();
  const scope = ctx.configForms.get(ENTRY_ID);
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-cmd-send: dictionaries");
  const card = new CmdSendSettingsForm(scope);
  ctx.effect(() => () => {
    card.dispose();
  }, "dsh-cmd-send: settings form");
  ctx.effect(() => ctx.configForms.whileServed([ENTRY_ID], () => ctx.slots.inject(
    "plugins.bundle.config",
    () => ctx.slots.register({
      name: "plugins.bundle.config",
      key: PLUGIN_ID,
      locale: NS,
      inject: () => card.inject()
    }, CmdSendSettingsCard)
  )), "dsh-cmd-send: plugins page card");
  ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
    name: "conversation.input.dock",
    id: "dsh-cmd-send-keymap",
    order: 999,
    inject: () => ({ sessions: ctx.sessions, scope })
  }, KeymapController));
}
return module.exports; } });
//# sourceMappingURL=client.js.map
