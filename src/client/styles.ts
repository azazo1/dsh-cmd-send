/**
 * 配置卡片里字段行的样式.
 *
 * 官方 SettingsForm 的字段只覆盖文本与数字, 选择字段由本插件的 ChoiceField 自绘,
 * 尺寸与间距对齐官方 fields.module.css, 颜色只用 --dsw-alias-* 语义 token.
 */
const STYLE_ID = 'dsh-cmd-send-styles'

const css = `
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
`

/** 注入卡片字段样式一次; 重复调用为空操作. */
export function adoptStyles(): void {
  if (typeof document === 'undefined') return
  if (document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return
  const style = document.createElement('style')
  style.dataset.pluginCss = STYLE_ID
  style.textContent = css
  document.head.appendChild(style)
}
