/**
 * dsh-cmd-send client 插件: 浏览器半部.
 * - 在插件页卡片配置里编辑发送快捷键模式 (plugins.bundle.config);
 * - 在 composer 输入区挂载隐身键盘控制器 (conversation.input.dock),
 *   实现 Cmd+Enter 发送 / Shift+Cmd+Enter 插话 / Enter 换行的键位映射;
 *   Windows/Linux 另支持 Alt+Enter 发送 / Alt+Shift+Enter 插话.
 * 发送模式偏好经 ctx.configForms 与 Host 的 profile 条目同步.
 */
import type { Context } from '@deepseek-ai/cordis';
/** 所需服务: slots 注册, sessions 会话解析, locale 字典, configForms 偏好. */
export declare const inject: string[];
/**
 * 组装键盘控制器与插件页配置卡片.
 * @param ctx - client root context.
 */
export declare function apply(ctx: Context): void;
