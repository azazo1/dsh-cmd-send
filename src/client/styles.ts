/** 设置行样式: 仅使用 --dsw-alias-* 语义 token, 跟随系统主题. */
const STYLE_ID = 'dsh-cmd-send-styles'

const css = `
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
`

/** 注入设置行样式一次; 重复调用为空操作. */
export function adoptStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = css
  document.head.appendChild(style)
}
