/**
 * dsh-cmd-send host 插件: 注册 dsh-cmd-send 设置命名空间, 持久化发送快捷键
 * 偏好 (发送模式选择). 客户端半部 (./client) 由 web server 以
 * /plugins/dsh-cmd-send/client.js 提供, 负责键盘拦截与设置行 UI.
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import {
  DEFAULT_SEND_MODE,
  SEND_MODE_FIELD,
  SEND_MODES,
  SETTINGS_NAMESPACE,
} from './shared.ts'

/** Cordis 插件名 (Loader 入口与 client bundle id). */
export const name = 'dsh-cmd-send'

/** dsh-cmd-send 设置 schema: 发送快捷键模式, 默认保持内置键位. */
export const CmdSendSettingsSchema = z.object({
  [SEND_MODE_FIELD]: z.union([...SEND_MODES]).default(DEFAULT_SEND_MODE),
})

/**
 * 注册 dsh-cmd-send 设置命名空间.
 * @param ctx - host cordis context.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(settingsNamespace(SETTINGS_NAMESPACE), CmdSendSettingsSchema)
  })
}
