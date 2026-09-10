/**
 * 键盘控制器: 挂在 conversation.input.dock (session 作用域) 的一个隐身条目,
 * 通过 document 捕获阶段拦截 composer (Lexical contenteditable) 上的 Enter,
 * 实现 Cmd+Enter 发送 / Shift+Cmd+Enter 插话 / Enter 换行的键位映射.
 * 候选菜单 (/, @ 补全) 高亮着候选时, 不带修饰的 Enter 交还菜单 (选中候选);
 * Cmd/Ctrl+Enter 始终是发送手势, 菜单开着也照发当前草稿.
 * 仅在设置开启 cmd-enter 模式时生效, 其余情况完全放行内置逻辑.
 */
import { useEffect, useRef } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { InputActions, InputState } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type { ISessions, SessionSnapshot } from '@deepseek-ai/dsh-api-session-controller/client'
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { DEFAULT_SEND_MODE, type CmdSendSettings } from '../shared.ts'
import { decideKey, hasContent, type ComposerContentView } from './keymap.ts'

/** 控制器完整 props: dock slot 的运行时 props + sessions 服务 + 设置 scope. */
export type KeymapControllerProps = PropsRuntime<'conversation.input.dock'> & {
  /** sessions 服务, 用于解析目标会话的 ISession (steer 发送). */
  sessions: ISessions
  /** dsh-cmd-send 设置 scope (发送模式读取). */
  scope: SettingsScope<CmdSendSettings>
}

/** 一次 steer 发送所需的现场信息. */
interface SteerContext {
  /** 目标会话 id. */
  sessionId: SessionId
  /** 会话是否忙碌 (agent 正在运行). */
  running: boolean
  /** 当前草稿内容. */
  input: ComposerContentView
  /** 输入动作面 (setDraft / submit). */
  actions: Pick<InputActions, 'setDraft' | 'submit'>
  /** sessions 服务. */
  sessions: ISessions
}

/**
 * composer 输入面: Lexical 把根节点标成 data-composer-input.
 * 按键 target 可能是根节点内部的 chip / 文本包装元素.
 */
export function isComposerInput(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('[data-composer-input]') !== null
}

/**
 * 候选菜单里带高亮的那份列表: 菜单根节点带 data-trigger-menu, 列表只在
 * 存在高亮项时才写 aria-activedescendant. 两个标记都来自 dsh 侧稳定契约
 * (菜单关闭时根节点整体不渲染).
 */
const CANDIDATE_LIST_SELECTOR = '[data-trigger-menu] [role="listbox"][aria-activedescendant]'

/**
 * 判断这次按键所在的 composer 是否正显示带高亮的候选菜单 (/, @ 补全).
 * 菜单渲染在 composer 卡片内部, 因此以卡片为查找范围, 避免同一页面里
 * 其他 composer (子 agent 会话等) 的菜单干扰本会话的键位判断.
 */
export function hasHighlightedCandidate(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  const card = target.closest('[data-composer-card]')
  return card !== null && card.querySelector(CANDIDATE_LIST_SELECTOR) !== null
}

/**
 * 把这次 Enter 伪装成 Shift+Enter, 让 Lexical 走内置换行而不是提交.
 * @returns 是否成功改写了 shiftKey.
 */
export function markEnterAsLineBreak(event: KeyboardEvent): boolean {
  try {
    Object.defineProperty(event, 'shiftKey', {
      configurable: true,
      enumerable: true,
      get: () => true,
    })
    return event.shiftKey === true
  } catch {
    return false
  }
}

/**
 * 忙碌时以 steer 模式发送当前草稿: 先清空草稿, 再通过会话的公开
 * prompt 通道以 steer 模式发送; 失败则恢复草稿. 空闲或带附件时退回
 * 普通提交 (queue), 由 Host 决定直接发送或排队.
 *
 * 拦截动作已经吃掉了这次按键, 因此任何异常都必须兜底成普通提交, 否则
 * 用户会看到 "按了没反应". 上游接口漂移时也由此路径降级而不是静默丢失.
 */
async function steerSend(context: SteerContext): Promise<void> {
  const { input, actions } = context
  const text = input.draft
  // 带附件的草稿无法走纯文本 steer 通道, 交给 composer 自身的提交逻辑.
  if (!context.running || input.attachmentIds.length > 0) {
    actions.submit()
    return
  }
  const session = context.sessions.binding(context.sessionId)?.session
  if (session === undefined) {
    actions.submit()
    return
  }
  actions.setDraft('')
  try {
    const result = await session.prompt([{ type: 'text', text }], 'steer')
    if (!result.ok) actions.setDraft(text)
  } catch (error) {
    console.error('[dsh-cmd-send] steer 发送失败, 退回普通提交', error)
    actions.setDraft(text)
    actions.submit()
  }
}

/**
 * 渲染隐身控制器: 挂载全局 keydown 捕获监听, 返回 null.
 * 所有状态经 ref 传递, 监听器只挂载一次, 无需随渲染重建.
 */
export function KeymapController({ useSession, useInput, inputActions, sessionId, sessions, scope }: KeymapControllerProps) {
  const running = useSession((s: SessionSnapshot) => s.running) ?? false
  const input = useInput((s: InputState) => s)
  const latest = useRef({ running, input, inputActions, sessionId, sessions })
  latest.current = { running, input, inputActions, sessionId, sessions }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!isComposerInput(event.target)) return
      const state = latest.current
      if (state.input === undefined || state.inputActions === undefined) return
      const mode = scope.getSnapshot().value?.sendMode ?? DEFAULT_SEND_MODE
      const decision = decideKey(event, {
        mode,
        phase: state.input.phase,
        content: hasContent(state.input),
        candidateHighlight: hasHighlightedCandidate(event.target),
      })
      switch (decision.kind) {
        case 'pass':
          return
        case 'newline':
          // Lexical 的 KEY_ENTER 在 shiftKey 时直接交给 plain-text 换行.
          if (!markEnterAsLineBreak(event)) {
            event.preventDefault()
            event.stopImmediatePropagation()
            document.execCommand('insertLineBreak')
          }
          return
        case 'send':
          event.preventDefault()
          event.stopImmediatePropagation()
          state.inputActions.submit()
          return
        case 'steer':
          event.preventDefault()
          event.stopImmediatePropagation()
          void steerSend({
            sessionId: state.sessionId,
            running: state.running,
            input: state.input,
            actions: state.inputActions,
            sessions: state.sessions,
          })
          return
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [scope])

  return null
}
