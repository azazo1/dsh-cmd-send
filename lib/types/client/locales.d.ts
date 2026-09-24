/** `dsh-cmd-send` 插件页配置卡片的文案. */
import type { SettingsFormLabels } from '@deepseek-ai/dsh-client-ui-primitives';
/** 本插件字典的命名空间, 与包名一致. */
export declare const NS = "dsh-cmd-send";
/** 本插件用到的文案键. */
export type CmdSendKey = 'description' | 'sendMode' | 'sendModeHint' | 'enter' | 'cmdEnter' | 'overridden' | 'reset' | 'readOnly' | 'unavailable' | 'save' | 'saving' | 'saveFailed';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** 本插件配置卡片的文案. */
        'dsh-cmd-send': CmdSendKey;
    }
}
/** English copy. */
export declare const en: Record<CmdSendKey, string>;
/** Simplified Chinese copy. */
export declare const zh: Record<CmdSendKey, string>;
/**
 * 表单框架要的文案, 从本插件字典取.
 * @param t - 本插件字典的读取函数.
 * @returns 共享设置表单渲染的标签.
 */
export declare function formLabels(t: (key: CmdSendKey) => string): SettingsFormLabels;
