/**
 * dsh-cmd-send client 插件: 浏览器半部.
 * - 在常规设置注册 "发送快捷键" 行 (settings.general.item);
 * - 在 composer 输入区挂载隐身键盘控制器 (conversation.input.dock),
 *   实现 Cmd+Enter 发送 / Shift+Cmd+Enter 插话 / Enter 换行的键位映射.
 * 发送模式偏好经 settingsScope 与 Host 设置文档同步.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** 所需服务: slots 注册, sessions 会话解析, locale 字典, settingsScope 偏好. */
export declare const inject: string[];
/**
 * 组装键盘控制器与设置行.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
