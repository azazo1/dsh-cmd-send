/**
 * dsh-cmd-send host 插件: 声明发送快捷键模式的 volatile Config, 由插件页的卡片配置编辑.
 * 客户端半部 (./client) 由 web server 以 /plugins/dsh-cmd-send/client.js 提供,
 * 负责 Lexical composer 键盘拦截与配置卡片 UI.
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
/** Cordis 插件名 (Loader 入口与 client bundle id). */
export declare const name = "dsh-cmd-send";
/** dsh-cmd-send 设置 schema: 发送快捷键模式, 默认保持内置键位. */
export declare const Config: z<Schemastery.ObjectS<NoInfer<{
    sendMode: z<"enter" | "cmd-enter", "enter" | "cmd-enter", "volatile-defined">;
}>>, Schemastery.ObjectT<NoInfer<{
    sendMode: z<"enter" | "cmd-enter", "enter" | "cmd-enter", "volatile-defined">;
}>>, "plain">;
/**
 * Host 半区无运行时副作用, 设置由 Config 投影.
 * @param ctx - host cordis context.
 */
export declare function apply(_ctx: Context): void;
