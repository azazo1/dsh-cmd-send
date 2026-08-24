/** 设置行样式: 仅使用 --dsw-alias-* 语义 token, 跟随系统主题. */
const STYLE_ID = 'dsh-cmd-send-styles'

const css = `
.dsh-cmd-send-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  margin-bottom: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--dsw-alias-border-l2);
}
.dsh-cmd-send-rowText {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.dsh-cmd-send-rowTitle {
  overflow-wrap: anywhere;
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 22px;
}
.dsh-cmd-send-rowDesc {
  max-width: 560px;
  overflow-wrap: anywhere;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
}
.dsh-cmd-send-selector {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  flex: 0 0 auto;
  min-width: 148px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--dsw-alias-border);
  border-radius: 18px;
  background: var(--dsw-alias-bg-module-platform);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
}
.dsh-cmd-send-selector:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  border-color: var(--dsw-alias-border);
}
.dsh-cmd-send-selector:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
.dsh-cmd-send-chevron {
  flex: none;
  color: var(--dsw-alias-label-tertiary);
}
@media (max-width: 560px) {
  .dsh-cmd-send-row {
    align-items: stretch;
    flex-direction: column;
  }
  .dsh-cmd-send-selector {
    width: 100%;
  }
}
`

/** 注入设置行样式一次; 重复调用为空操作. */
export function adoptStyles(): void {
  if (document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return
  const style = document.createElement('style')
  style.dataset.pluginCss = STYLE_ID
  style.textContent = css
  document.head.appendChild(style)
}
