/**
 * 键盘控制器: 挂在 conversation.input.dock (session 作用域) 的一个隐身条目,
 * 通过 document 捕获阶段拦截 composer textarea 上的 Enter 按键, 实现
 * Cmd+Enter 发送 / Shift+Cmd+Enter 插话 / Enter 换行的键位映射.
 * 仅在设置开启 cmd-enter 模式时生效, 其余情况完全放行内置逻辑.
 */
import { useEffect, useRef } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// 类型: 加载 conversation SlotMap merge (dock 的 standardProps 类型).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { ISessions, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { SessionId } from '@deepseek-ai/dsh-api-remotes/client'
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
  const running = useSession((s) => s.running) ?? false
  const input = useInput((s) => s)
  const latest = useRef({ running, input, inputActions, sessionId, sessions })
  latest.current = { running, input, inputActions, sessionId, sessions }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target
      if (!(target instanceof HTMLTextAreaElement)) return
      // 只处理 composer 输入区 (data-input-scroll 容器内的 textarea).
      if (target.closest('[data-input-scroll]') === null) return
      const state = latest.current
      if (state.input === undefined || state.inputActions === undefined) return
      const mode = scope.getSnapshot().value?.sendMode ?? DEFAULT_SEND_MODE
      const decision = decideKey(event, { mode, phase: state.input.phase })
      switch (decision.kind) {
        case 'pass':
          return
        case 'newline':
          // 阻止 React 合成事件收到 Enter, 浏览器默认动作插入换行.
          event.stopImmediatePropagation()
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
