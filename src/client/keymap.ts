/** 键盘决策纯函数: 根据按键与输入状态决定动作, 与 DOM 解耦以便单元测试. */

/** 输入机的当前阶段 (对齐 dsh InputState.phase). */
export type InputPhase = 'plain' | 'adjudicating' | 'claimed' | 'submitting'

/** 浏览器 KeyboardEvent 的最小视图 (测试可用普通对象模拟). */
export interface KeyEventLike {
  key: string
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  isComposing: boolean
  keyCode: number
}

/** 决策结果. */
export type KeyDecision =
  | { kind: 'pass' } // 放行内置处理 (默认 Enter 发送 / 菜单选择 / IME 组合等)
  | { kind: 'newline' } // Enter 换行: 阻止 React 合成事件, 浏览器默认插入换行
  | { kind: 'send' } // Cmd/Ctrl+Enter: 发送; 忙碌时 Host 自然插入排队
  | { kind: 'steer' } // Shift+Cmd/Ctrl+Enter: 忙碌时插话发送, 空闲时普通发送

/** 决策所需的输入状态. */
export interface DecideInput {
  mode: 'enter' | 'cmd-enter'
  phase: InputPhase
}

/**
 * 决定 composer textarea 上的一次 Enter 按键应如何处理.
 * 仅在 cmd-enter 模式下拦截; 其他情况一律放行内置逻辑.
 */
export function decideKey(event: KeyEventLike, input: DecideInput): KeyDecision {
  if (event.key !== 'Enter') return { kind: 'pass' }
  // IME 组合输入 (中文输入法确认候选词) 必须放行.
  if (event.isComposing || event.keyCode === 229) return { kind: 'pass' }
  if (input.mode !== 'cmd-enter') return { kind: 'pass' }
  // 提交交易进行中: 内置逻辑本就会忽略 Enter, 无需插手.
  if (input.phase === 'adjudicating' || input.phase === 'submitting') return { kind: 'pass' }
  const meta = event.metaKey || event.ctrlKey
  if (meta) {
    return event.shiftKey ? { kind: 'steer' } : { kind: 'send' }
  }
  // Shift+Enter (内置换行) 与 Alt+Enter 保持原样.
  if (event.shiftKey || event.altKey) return { kind: 'pass' }
  // 命令候选菜单 (slash 菜单) 打开时, Enter 由菜单消费 (选择候选).
  if (input.phase === 'claimed') return { kind: 'pass' }
  return { kind: 'newline' }
}
