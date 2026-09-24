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
 * Cmd/Ctrl+Enter 系列一律是继续/提交 (Shift 不再区分), 而不带修饰的 Enter 在
 * cmd-enter 模式下改成换行.
 */
import type { SendMode } from '../shared.ts'
import type { KeyEventLike } from './keymap.ts'

/** 提问卡片根节点标记 (dsh 的 e2e 也依赖它): 卡片内唯一的 textarea 就是回答框. */
const ASK_FRAME_SELECTOR = '[data-question-key]'

/** 回答框上一次 Enter 的处理结果. */
export type AskAnswerDecision =
  | { kind: 'pass' } // 放行卡片自带的处理器 (继续/提交, Shift+Enter 换行, IME 组合等)
  | { kind: 'newline' } // 裸 Enter: 伪装成 Shift+Enter, 由浏览器原生插入换行
  | { kind: 'submit' } // Cmd/Ctrl+Enter: 抹掉 Shift 后放行, 由卡片处理器继续/提交

/**
 * 判断这次按键是否落在 ask 提问卡片的回答框上.
 * @param target - 按键事件的目标节点.
 * @returns 是否是卡片内的 textarea.
 */
export function isAskAnswerField(target: EventTarget | null): boolean {
  return target instanceof HTMLTextAreaElement && target.closest(ASK_FRAME_SELECTOR) !== null
}

/**
 * 决定回答框上的一次 Enter 应如何处理.
 * 只在 cmd-enter 模式下改动键位; enter 模式一律放行卡片自带逻辑.
 * @param event - 按键事件 (最小视图).
 * @param mode - 当前发送模式.
 * @returns 处理结果.
 */
export function decideAskAnswerKey(event: KeyEventLike, mode: SendMode): AskAnswerDecision {
  if (event.key !== 'Enter') return { kind: 'pass' }
  // IME 组合输入 (中文输入法确认候选词) 必须放行.
  if (event.isComposing || event.keyCode === 229) return { kind: 'pass' }
  if (mode !== 'cmd-enter') return { kind: 'pass' }
  // Cmd/Ctrl+Enter 系列都是继续/提交: 回答框没有插话通道, 带 Shift 时也退回
  // 继续/提交 (与主 composer 里插话不可用时退回普通提交同一思路).
  if (event.metaKey || event.ctrlKey) return { kind: 'submit' }
  // Shift+Enter (内置换行) 与 Alt+Enter (内置提交) 保持原样.
  if (event.shiftKey || event.altKey) return { kind: 'pass' }
  return { kind: 'newline' }
}
