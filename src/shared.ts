/** 插件标识与发送模式常量, Host 与 Client 共享. */

/** 插件包名: Client loader 注册 id 与插件页槽位的键共用. */
export const PLUGIN_ID = 'dsh-cmd-send'

/** profile 条目 id: configForms 表单按它寻址, 与包名一致. */
export const ENTRY_ID = PLUGIN_ID

/** 配置字段名: 发送快捷键模式. */
export const SEND_MODE_FIELD = 'sendMode'

/**
 * 发送模式:
 * - enter: 保持 dsh 内置键位 (Enter 发送, Shift+Enter 换行, Cmd/Ctrl+Enter 插话);
 * - cmd-enter: Cmd+Enter 发送, Shift+Cmd+Enter 插话, Enter 只换行;
 *   Windows/Linux 另支持 Alt+Enter 发送, Alt+Shift+Enter 插话.
 */
export const SEND_MODES = ['enter', 'cmd-enter'] as const

/** 发送模式联合类型. */
export type SendMode = (typeof SEND_MODES)[number]

/** 默认发送模式: 保持 dsh 内置行为, 插件安装后不改变默认键位. */
export const DEFAULT_SEND_MODE: SendMode = 'enter'

/** 本插件暴露的配置字段. */
export interface CmdSendSettings {
  sendMode: SendMode
}
