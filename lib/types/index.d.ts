/**
 * dsh-cmd-send host 插件: 声明发送快捷键模式的 volatile Config, 由插件页的卡片配置编辑.
 * 客户端半部 (./client) 由 web server 以 /plugins/dsh-cmd-send/client.js 提供,
 * 负责 Lexical composer 键盘拦截与配置卡片 UI.
 *
 * Host 半部还提供一条同源接口 (见 ./release.ts): 把中断后停住的排队消息当作普通
 * 消息重新送出.
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
 * 注册队列改发的同源接口; 设置由 Config 投影.
 *
 * `webServer` 按需等待 (`ctx.inject` 只在服务就绪时回调), 而不是写成必需 inject:
 * 后者会让整个插件 (含 Config 与 client 半部) 在没有 web server 的组合里完全不
 * 加载, 而队列改发只是 Host 侧的一项附加能力.
 * @param ctx - host cordis context.
 */
export declare function apply(ctx: Context): void;
