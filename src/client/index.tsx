/**
 * dsh-cmd-send client 插件: 浏览器半部.
 * - 在常规设置注册 "发送快捷键" 行 (settings.general.item);
 * - 在 composer 输入区挂载隐身键盘控制器 (conversation.input.dock),
 *   实现 Cmd+Enter 发送 / Shift+Cmd+Enter 插话 / Enter 换行的键位映射.
 * 发送模式偏好经 settingsScope 与 Host 设置文档同步.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// 类型: 加载 slots 的 slot map, locale 与 settingsScope 的 Context merge.
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { SETTINGS_NAMESPACE } from '../shared.ts'
import { NS, en, zh } from './locales.ts'
import { KeymapController } from './controller.tsx'
import { SendModeRow } from './settings-row.tsx'
import { adoptStyles } from './styles.ts'
import { decodeCmdSend } from './settings.ts'

/** 所需服务: slots 注册, sessions 会话解析, locale 字典, settingsScope 偏好. */
export const inject = ['slots', 'sessions', 'locale', 'settingsScope']

/**
 * 组装键盘控制器与设置行.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  adoptStyles()
  const scope = ctx.settingsScope.bind({
    namespace: SETTINGS_NAMESPACE,
    decode: decodeCmdSend,
  })
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-cmd-send: dictionaries')

  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'dsh-cmd-send',
    order: 25,
    locale: NS,
    inject: () => ({ scope }),
  }, SendModeRow))

  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'dsh-cmd-send-keymap',
    order: 999,
  }, (props) => (
    <KeymapController {...props} sessions={ctx.sessions} scope={scope} />
  )))
}
