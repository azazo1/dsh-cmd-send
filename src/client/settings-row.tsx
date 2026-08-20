/**
 * 常规设置里的发送快捷键行: 在 "Enter 发送" 与 "Cmd+Enter 发送" 之间切换.
 * 偏好经 settingsScope 写入 Host 设置文档, 由设置行与键盘控制器共享.
 */
import { useSyncExternalStore, useState } from 'react'
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import { DEFAULT_SEND_MODE, SEND_MODE_FIELD, type CmdSendSettings, type SendMode } from '../shared.ts'
import type { CmdSendKey } from './locales.ts'

/** 设置行完整 props: locale 座 + 注入的设置 scope. */
export type SendModeRowProps = PropsLocale<'dsh-cmd-send'> & {
  scope: SettingsScope<CmdSendSettings>
}

/** 可选项: id 写入设置, label 为 locale key. */
const OPTIONS: ReadonlyArray<{ id: SendMode; label: CmdSendKey }> = [
  { id: 'enter', label: 'settings.sendMode.enter' },
  { id: 'cmd-enter', label: 'settings.sendMode.cmdEnter' },
]

/** 订阅设置 scope 的当前发送模式. */
function useSendMode(scope: SettingsScope<CmdSendSettings>): SendMode {
  return useSyncExternalStore(
    (onChange) => scope.subscribe(onChange),
    () => scope.getSnapshot().value?.sendMode ?? DEFAULT_SEND_MODE,
  )
}

/**
 * 渲染发送快捷键选择行.
 * @param props - slot props (locale 座 + 设置 scope).
 */
export function SendModeRow({ scope, t }: SendModeRowProps) {
  const mode = useSendMode(scope)
  const [open, setOpen] = useState(false)
  const selectedLabel = mode === 'cmd-enter' ? 'settings.sendMode.cmdEnter' : 'settings.sendMode.enter'
  return (
    <div className="dsh-cmd-send-row">
      <div className="dsh-cmd-send-rowText">
        <div className="dsh-cmd-send-rowTitle">{t('settings.sendMode.title')}</div>
        <div className="dsh-cmd-send-rowDesc">{t('settings.sendMode.description')}</div>
      </div>
      <Menu
        open={open}
        onClose={() => setOpen(false)}
        items={OPTIONS.map((option) => ({ id: option.id, label: t(option.label) }))}
        selectedId={mode}
        onSelect={(id: string) => {
          setOpen(false)
          if (id === 'enter' || id === 'cmd-enter') {
            void scope.set(SEND_MODE_FIELD, id)
          }
        }}
        align="end"
        portal
        anchor={(
          <button
            type="button"
            className="dsh-cmd-send-selector"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {t(selectedLabel)}
            <IconChevronDownOutline14 className="dsh-cmd-send-chevron" />
          </button>
        )}
      />
    </div>
  )
}
