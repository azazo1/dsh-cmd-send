/** 键盘决策纯函数: 根据按键与输入状态决定动作, 与 DOM 解耦以便单元测试. */
import type { InputState } from '@deepseek-ai/dsh-client-ui-conversation/client'

/** 输入机的当前阶段 (对齐 dsh InputState.phase). */
export type InputPhase = InputState['phase']

/** composer 内容视图: 判断是否"有东西可发"所需的最小字段. */
export type ComposerContentView = Pick<InputState, 'draft' | 'attachmentIds'>

/** composer 是否有可发送内容: 正文非空白或存在草稿附件. */
export function hasContent(input: ComposerContentView): boolean {
  return input.draft.trim() !== '' || input.attachmentIds.length > 0
}

/** 浏览器 KeyboardEvent 的最小视图 (测试可用普通对象模拟). */
export interface KeyEventLike {
  key: string
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  isComposing: boolean
  keyCode: number
  /** 长按产生的重复 Enter; Cmd/Ctrl+Enter 重复时放行内置忽略逻辑. */
  repeat: boolean
}

/** 决策结果. */
export type KeyDecision =
  | { kind: 'pass' } // 放行内置处理 (默认 Enter 发送 / 菜单选择 / IME 组合等)
  | { kind: 'newline' } // Enter 换行: 伪装成 Shift+Enter, 走 Lexical 内置换行
  | { kind: 'send' } // Cmd/Ctrl+Enter: 发送; 忙碌时 Host 自然插入排队
  | { kind: 'steer' } // Shift+Cmd/Ctrl+Enter: 忙碌时插话发送, 空闲时普通发送

/** 决策所需的输入状态. */
export interface DecideInput {
  mode: 'enter' | 'cmd-enter'
  phase: InputPhase
  /** composer 是否已有可发送内容; 空草稿的 Cmd/Ctrl+Enter 交还内置逻辑. */
  content: boolean
  /**
   * 触发候选菜单 (/, @ 补全) 是否开着并高亮了一行.
   * 只影响不带 Cmd/Ctrl 的 Enter: 那时 Enter 属于菜单 (选中当前候选),
   * 而 Cmd/Ctrl+Enter 始终是插件的发送手势, 会绕过菜单直接发送当前草稿.
   */
  candidateHighlight: boolean
}

/**
 * 决定 composer 上的一次 Enter 按键应如何处理.
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
    // 发送手势优先于候选菜单: 菜单开着时 Cmd/Ctrl+Enter 也照样发送当前
    // 草稿 (按原样发, 不套用高亮候选), 这样 "/xxx" 这类开头的消息总有出路.
    // 长按 Cmd/Ctrl+Enter 交给内置 keymap 吞掉, 避免连发.
    if (event.repeat) return { kind: 'pass' }
    // 草稿为空且无附件: 没有可发送的内容, 交还内置逻辑.
    if (!input.content) return { kind: 'pass' }
    return event.shiftKey ? { kind: 'steer' } : { kind: 'send' }
  }
  // Shift+Enter (内置换行) 与 Alt+Enter 保持原样.
  if (event.shiftKey || event.altKey) return { kind: 'pass' }
  // 候选菜单 (/, @ 补全) 高亮着候选: 不带修饰的 Enter 是 "补全" 手势,
  // 交给菜单消费 (选中当前高亮候选), 而不是换行.
  if (input.candidateHighlight) return { kind: 'pass' }
  // 命令 token 已 claim (进入命令模式): Enter 由内置提交逻辑消费.
  if (input.phase === 'claimed') return { kind: 'pass' }
  return { kind: 'newline' }
}
