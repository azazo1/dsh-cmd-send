/**
 * dsh-cmd-send host 插件: 注册 dsh-cmd-send 设置命名空间, 持久化发送快捷键
 * 偏好 (发送模式选择). 客户端半部 (./client) 由 web server 以
 * /plugins/dsh-cmd-send/client.js 提供, 负责键盘拦截与设置行 UI.
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
/** Cordis 插件名 (Loader 入口与 client bundle id). */
export declare const name = "dsh-cmd-send";
/** dsh-cmd-send 设置 schema: 发送快捷键模式, 默认保持内置键位. */
export declare const CmdSendSettingsSchema: z<Schemastery.ObjectS<{
    sendMode: z<"enter" | "cmd-enter", "enter" | "cmd-enter">;
}>, Schemastery.ObjectT<{
    sendMode: z<"enter" | "cmd-enter", "enter" | "cmd-enter">;
}>>;
/**
 * 注册 dsh-cmd-send 设置命名空间.
 * @param ctx - host cordis context.
 */
export declare function apply(ctx: Context): void;
