/** 设置命名空间与发送模式常量, Host 与 Client 共享. */

/** 设置命名空间: 与插件短名一致, 由 Host settings 服务持久化. */
export const SETTINGS_NAMESPACE = 'dsh-cmd-send'

/** 设置字段名: 发送快捷键模式. */
export const SEND_MODE_FIELD = 'sendMode'

/**
 * 发送模式:
 * - enter: 保持 dsh 内置键位 (Enter 发送, Shift+Enter 换行, Cmd/Ctrl+Enter 插话);
 * - cmd-enter: Cmd+Enter 发送, Shift+Cmd+Enter 插话, Enter 只换行.
 */
export const SEND_MODES = ['enter', 'cmd-enter'] as const

/** 发送模式联合类型. */
export type SendMode = (typeof SEND_MODES)[number]

/** 默认发送模式: 保持 dsh 内置行为, 插件安装后不改变默认键位. */
export const DEFAULT_SEND_MODE: SendMode = 'enter'

/** 设置文档的 wire 结构 (与 Host schema 对齐). */
export interface CmdSendSettings {
  sendMode: SendMode
}
