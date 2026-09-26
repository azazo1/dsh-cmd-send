/**
 * dsh-cmd-send client 插件: 浏览器半部.
 * - 在插件页卡片配置里编辑发送快捷键模式 (plugins.bundle.config);
 * - 在 composer 输入区挂载隐身键盘控制器 (conversation.input.dock),
 *   实现 Cmd+Enter 发送 / Shift+Cmd+Enter 插话 / Enter 换行的键位映射;
 *   Windows/Linux 另支持 Alt+Enter 发送 / Alt+Shift+Enter 插话.
 * 发送模式偏好经 ctx.configForms 与 Host 的 profile 条目同步.
 */
import type { Context } from '@deepseek-ai/cordis'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import { ENTRY_ID, PLUGIN_ID, type CmdSendSettings } from '../shared.ts'
import { NS, en, zh } from './locales.ts'
import { KeymapController } from './controller.tsx'
import { CmdSendSettingsCard } from './settings-card.tsx'
import { CmdSendSettingsForm } from './settings-form.ts'
import { adoptStyles } from './styles.ts'

/** 所需服务: slots 注册, sessions 会话解析, locale 字典, configForms 偏好. */
export const inject = ['slots', 'sessions', 'locale', 'configForms']

/**
 * 组装键盘控制器与插件页配置卡片.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  adoptStyles()
  const scope = ctx.configForms.get<CmdSendSettings>(ENTRY_ID)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-cmd-send: dictionaries')

  const card = new CmdSendSettingsForm(scope)
  ctx.effect(() => () => { card.dispose() }, 'dsh-cmd-send: settings form')
  ctx.effect(() => ctx.configForms.whileServed([ENTRY_ID], () => ctx.slots.inject(
    'plugins.bundle.config',
    () => ctx.slots.register({
      name: 'plugins.bundle.config',
      key: PLUGIN_ID,
      locale: NS,
      inject: () => card.inject(),
    }, CmdSendSettingsCard),
  )), 'dsh-cmd-send: plugins page card')

  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'dsh-cmd-send-keymap',
    order: 999,
    inject: () => ({ sessions: ctx.sessions, scope }),
  }, KeymapController))
}
