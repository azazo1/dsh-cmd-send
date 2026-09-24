/**
 * dsh-cmd-send host 插件: 声明发送快捷键模式的 volatile Config, 由插件页的卡片配置编辑.
 * 客户端半部 (./client) 由 web server 以 /plugins/dsh-cmd-send/client.js 提供,
 * 负责 Lexical composer 键盘拦截与配置卡片 UI.
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import {
  DEFAULT_SEND_MODE,
  SEND_MODE_FIELD,
  SEND_MODES,
} from './shared.ts'

/** Cordis 插件名 (Loader 入口与 client bundle id). */
export const name = 'dsh-cmd-send'

/** dsh-cmd-send 设置 schema: 发送快捷键模式, 默认保持内置键位. */
export const Config = z.object({
  [SEND_MODE_FIELD]: z.union([...SEND_MODES]).default(DEFAULT_SEND_MODE).volatile(),
})

/**
 * Host 半区无运行时副作用, 设置由 Config 投影.
 * @param ctx - host cordis context.
 */
export function apply(_ctx: Context): void {}
