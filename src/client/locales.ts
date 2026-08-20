/**
 * `dsh-cmd-send` locale 命名空间: 设置行文案. 中文为基准文案, 英文镜像.
 */

/** 简体中文字典 (key 集合的唯一来源). */
export const zh = {
  'settings.sendMode.title': '发送快捷键',
  'settings.sendMode.description': 'Cmd+Enter 发送: Enter 只换行, Cmd+Enter 排队发送, Shift+Cmd+Enter 插话发送',
  'settings.sendMode.enter': 'Enter 发送',
  'settings.sendMode.cmdEnter': 'Cmd+Enter 发送',
} satisfies Record<string, string>

/** `dsh-cmd-send` 命名空间 key 联合. */
export type CmdSendKey = keyof typeof zh

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** 发送快捷键设置行的文案. */
    'dsh-cmd-send': CmdSendKey
  }
}

/** 英文词典, 与 zh key 集合完全对齐. */
export const en = {
  'settings.sendMode.title': 'Send shortcut',
  'settings.sendMode.description': 'Cmd+Enter send: Enter inserts a newline, Cmd+Enter queues, Shift+Cmd+Enter steers',
  'settings.sendMode.enter': 'Enter to send',
  'settings.sendMode.cmdEnter': 'Cmd+Enter to send',
} satisfies Record<CmdSendKey, string>

/** Locale 命名空间 id, 注册于 ctx.locale. */
export const NS = 'dsh-cmd-send'
