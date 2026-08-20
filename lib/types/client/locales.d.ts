/**
 * `dsh-cmd-send` locale 命名空间: 设置行文案. 中文为基准文案, 英文镜像.
 */
/** 简体中文字典 (key 集合的唯一来源). */
export declare const zh: {
    'settings.sendMode.title': string;
    'settings.sendMode.description': string;
    'settings.sendMode.enter': string;
    'settings.sendMode.cmdEnter': string;
};
/** `dsh-cmd-send` 命名空间 key 联合. */
export type CmdSendKey = keyof typeof zh;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** 发送快捷键设置行的文案. */
        'dsh-cmd-send': CmdSendKey;
    }
}
/** 英文词典, 与 zh key 集合完全对齐. */
export declare const en: {
    'settings.sendMode.title': string;
    'settings.sendMode.description': string;
    'settings.sendMode.enter': string;
    'settings.sendMode.cmdEnter': string;
};
/** Locale 命名空间 id, 注册于 ctx.locale. */
export declare const NS = "dsh-cmd-send";
