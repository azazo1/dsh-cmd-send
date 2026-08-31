/**
 * 键盘控制器: 挂在 conversation.input.dock (session 作用域) 的一个隐身条目,
 * 通过 document 捕获阶段拦截 composer (Lexical contenteditable) 上的 Enter,
 * 实现 Cmd+Enter 发送 / Shift+Cmd+Enter 插话 / Enter 换行的键位映射.
 * 仅在设置开启 cmd-enter 模式时生效, 其余情况完全放行内置逻辑.
 */
import { useEffect, useRef } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { InputState } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type { ISessions, SessionSnapshot } from '@deepseek-ai/dsh-api-session-controller/client'
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { DEFAULT_SEND_MODE, type CmdSendSettings } from '../shared.ts'
import { decideKey } from './keymap.ts'

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
  /** 当前输入状态快照. */
  input: {
    draft: string
    imageIds: readonly unknown[]
  }
  /** 输入动作面 (setDraft / submit). */
  actions: {
    setDraft(text: string): void
    submit(): void
  }
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
 * prompt 通道以 steer 模式发送; 失败则恢复草稿. 空闲或带图片时退回
 * 普通提交 (queue), 由 Host 决定直接发送或排队.
 */
async function steerSend(context: SteerContext): Promise<void> {
  const { input, actions } = context
  if (input.draft.trim() === '' && input.imageIds.length === 0) return
  if (!context.running || input.imageIds.length > 0) {
    actions.submit()
    return
  }
  const session = context.sessions.binding(context.sessionId)?.session
  if (session === undefined) {
    actions.submit()
    return
  }
  const text = input.draft
  actions.setDraft('')
  const result = await session.prompt([{ type: 'text', text }], 'steer')
  if (!result.ok) {
    actions.setDraft(text)
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
      const decision = decideKey(event, { mode, phase: state.input.phase })
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
          if (state.input.draft.trim() === '' && state.input.imageIds.length === 0) return
          event.preventDefault()
          event.stopImmediatePropagation()
          state.inputActions.submit()
          return
        case 'steer':
          if (state.input.draft.trim() === '' && state.input.imageIds.length === 0) return
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
