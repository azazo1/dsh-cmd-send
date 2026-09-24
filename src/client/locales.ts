/** `dsh-cmd-send` 插件页配置卡片的文案. */
import type { SettingsFormLabels } from '@deepseek-ai/dsh-client-ui-primitives'

/** 本插件字典的命名空间, 与包名一致. */
export const NS = 'dsh-cmd-send'

/** 本插件用到的文案键. */
export type CmdSendKey =
  | 'description'
  | 'sendMode' | 'sendModeHint' | 'enter' | 'cmdEnter'
  | 'overridden' | 'reset'
  | 'readOnly' | 'unavailable' | 'save' | 'saving' | 'saveFailed'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** 本插件配置卡片的文案. */
    'dsh-cmd-send': CmdSendKey
  }
}

/** English copy. */
export const en: Record<CmdSendKey, string> = {
  description: 'Choose whether Enter sends, or Cmd+Enter sends and Enter inserts a newline.',
  sendMode: 'Send shortcut',
  sendModeHint: 'Cmd+Enter send: Enter inserts a newline, Cmd+Enter queues, Shift+Cmd+Enter steers.',
  enter: 'Enter to send',
  cmdEnter: 'Cmd+Enter to send',
  overridden: 'Overridden',
  reset: 'Reset to default',
  readOnly: 'This deployment stores settings read-only.',
  unavailable: 'This plugin is not loaded, so it cannot be configured right now.',
  save: 'Save',
  saving: 'Saving...',
  saveFailed: 'The deployment did not accept these values; they were left for you to correct.',
}

/** Simplified Chinese copy. */
export const zh: Record<CmdSendKey, string> = {
  description: '选择 Enter 直接发送, 还是 Cmd+Enter 发送而 Enter 只换行.',
  sendMode: '发送快捷键',
  sendModeHint: 'Cmd+Enter 发送: Enter 只换行, Cmd+Enter 排队发送, Shift+Cmd+Enter 插话发送.',
  enter: 'Enter 发送',
  cmdEnter: 'Cmd+Enter 发送',
  overridden: '已覆盖',
  reset: '恢复默认',
  readOnly: '本部署的设置为只读.',
  unavailable: '该插件当前未加载, 暂时无法配置.',
  save: '保存',
  saving: '保存中...',
  saveFailed: '本部署没有接受这些值, 已保留供你修改.',
}

/**
 * 表单框架要的文案, 从本插件字典取.
 * @param t - 本插件字典的读取函数.
 * @returns 共享设置表单渲染的标签.
 */
export function formLabels(t: (key: CmdSendKey) => string): SettingsFormLabels {
  return {
    unavailable: t('unavailable'),
    readOnly: t('readOnly'),
    saveFailed: t('saveFailed'),
    save: t('save'),
    saving: t('saving'),
  }
}
