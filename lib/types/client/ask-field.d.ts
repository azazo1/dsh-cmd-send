/**
 * ask 提问卡片 (ask_user_question) 回答框的键位适配.
 *
 * 提问卡片弹出时接管的是 composer 座位 (conversation.composer 链的 overlay),
 * 主 composer 只是被隐藏 (display:none) 而仍然挂载, 所以控制器的捕获监听器
 * 一直都在, 只是回答框不是 [data-composer-input], 那里的 Enter 走卡片自己的
 * 处理器: 裸 Enter 继续/提交, Shift+Enter 换行. 本模块让回答框跟随插件的
 * 发送模式, 与主 composer 保持一致.
 *
 * 与主 composer 的差异: 回答框只有 "继续/提交" 一个动作, 没有插话通道, 因此
 * Cmd/Ctrl+Enter 系列一律是继续/提交 (Shift 不再区分), Windows/Linux 的
 * Alt+Enter 同样继续/提交, 而不带修饰的 Enter 在 cmd-enter 模式下改成换行.
 */
import type { SendMode } from '../shared.ts';
import type { KeyEventLike } from './keymap.ts';
/** 回答框上一次 Enter 的处理结果. */
export type AskAnswerDecision = {
    kind: 'pass';
} | {
    kind: 'newline';
} | {
    kind: 'submit';
};
/**
 * 判断这次按键是否落在 ask 提问卡片的回答框上.
 * @param target - 按键事件的目标节点.
 * @returns 是否是卡片内的 textarea.
 */
export declare function isAskAnswerField(target: EventTarget | null): boolean;
/**
 * 决定回答框上的一次 Enter 应如何处理.
 * 只在 cmd-enter 模式下改动键位; enter 模式一律放行卡片自带逻辑.
 * @param event - 按键事件 (最小视图).
 * @param mode - 当前发送模式.
 * @param altAsSend - Windows/Linux 为 true 时把 Alt 当成发送修饰键.
 * @returns 处理结果.
 */
export declare function decideAskAnswerKey(event: KeyEventLike, mode: SendMode, altAsSend?: boolean): AskAnswerDecision;
