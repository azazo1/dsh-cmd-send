/**
 * 键盘控制器: 挂在 conversation.input.dock (session 作用域) 的一个隐身条目,
 * 通过 document 捕获阶段拦截 composer (Lexical contenteditable) 上的 Enter,
 * 实现 Cmd+Enter 发送 / Shift+Cmd+Enter 插话 / Enter 换行的键位映射;
 * Windows/Linux 另支持 Alt+Enter 发送 / Alt+Shift+Enter 插话.
 * 候选菜单 (/, @ 补全) 高亮着候选时, 不带修饰的 Enter 交还菜单 (选中候选);
 * Cmd/Ctrl+Enter 始终是发送手势, 菜单开着也照发当前草稿.
 * ask 提问卡片接管 composer 座位时, 卡片里的回答框按同一份模式接管 Enter
 * (裸 Enter 换行, Cmd/Ctrl+Enter 继续/提交), 见 ask-field.ts.
 * 仅在设置开启 cmd-enter 模式时生效, 其余情况完全放行内置逻辑.
 */
import { useEffect, useRef } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { InputState } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type { ISessions, SessionSnapshot } from '@deepseek-ai/dsh-api-session-controller/client'
import type { ConfigForm as SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import { DEFAULT_SEND_MODE, type CmdSendSettings } from '../shared.ts'
import { decideAskAnswerKey, isAskAnswerField } from './ask-field.ts'
import { decideKey, hasContent, isAltSendPlatform } from './keymap.ts'
import { steeringAvailable, submitSteer } from './steer.ts'

/** 控制器完整 props: dock slot 的运行时 props + sessions 服务 + 设置 scope. */
export type KeymapControllerProps = PropsRuntime<'conversation.input.dock'> & {
  /** sessions 服务, 用于由会话 id 解析会话作用域 (steer 提交). */
  sessions: ISessions
  /** dsh-cmd-send 设置 scope (发送模式读取). */
  scope: SettingsScope<CmdSendSettings>
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
 * 改写这次按键的 shiftKey 视图, 让下游处理器 (Lexical 的 KEY_ENTER_COMMAND,
 * React 的 onKeyDown) 看到期望的修饰键状态. 事件对象本身不可变, 因此用
 * getter 覆盖属性; 覆盖失败时返回 false, 由调用方决定退路.
 * @param event - 正在派发的键盘事件.
 * @param shiftKey - 想让下游看到的 shiftKey.
 * @returns 是否成功改写.
 */
export function rewriteShiftKey(event: KeyboardEvent, shiftKey: boolean): boolean {
  try {
    Object.defineProperty(event, 'shiftKey', {
      configurable: true,
      enumerable: true,
      get: () => shiftKey,
    })
    return event.shiftKey === shiftKey
  } catch {
    return false
  }
}

/**
 * 渲染隐身控制器: 挂载全局 keydown 捕获监听, 返回 null.
 * 所有状态经 ref 传递, 监听器只挂载一次, 无需随渲染重建.
 */
export function KeymapController({ useSession, useInput, inputActions, sessionId, sessions, scope }: KeymapControllerProps) {
  const running = useSession((s: SessionSnapshot) => s.running) ?? false
  const subagent = useSession((s: SessionSnapshot) => s.subagent) ?? null
  const input = useInput((s: InputState) => s)
  const latest = useRef({ running, subagent, input, inputActions, sessionId, sessions })
  latest.current = { running, subagent, input, inputActions, sessionId, sessions }

  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
    const altAsSend = isAltSendPlatform(nav.userAgentData?.platform || nav.platform || nav.userAgent || '')
    const onKeyDown = (event: KeyboardEvent): void => {
      const mode = scope.getSnapshot().value?.sendMode ?? DEFAULT_SEND_MODE
      // ask 提问卡片接管 composer 座位时, 主 composer 只是被隐藏而仍挂载;
      // 卡片里的回答框是普通 textarea, 按同一份发送模式接管它的 Enter.
      if (isAskAnswerField(event.target)) {
        const ask = decideAskAnswerKey(event, mode, altAsSend)
        // 换行: 伪装成 Shift+Enter, 由浏览器原生插入换行并触发卡片自己的
        // onChange; 继续/提交: 抹掉 Shift 后放行, 交给卡片自带的处理器.
        if (ask.kind === 'newline') rewriteShiftKey(event, true)
        else if (ask.kind === 'submit') rewriteShiftKey(event, false)
        return
      }
      if (!isComposerInput(event.target)) return
      const state = latest.current
      if (state.input === undefined || state.inputActions === undefined) return
      const decision = decideKey(event, {
        mode,
        phase: state.input.phase,
        content: hasContent(state.input),
        candidateHighlight: hasHighlightedCandidate(event.target),
        altAsSend,
      })
      switch (decision.kind) {
        case 'pass':
          return
        case 'newline':
          // Lexical 的 KEY_ENTER 在 shiftKey 时直接交给 plain-text 换行.
          if (!rewriteShiftKey(event, true)) {
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
          // 空闲, 会话不支持插话, 或交棒失败时退回普通提交 (queue), 保证按键不落空.
          // 三者的判据与 dsh 内置提交策略 resolveSubmitMode 对齐.
          if (!state.running || !steeringAvailable(state.subagent) || !submitSteer({ sessions: state.sessions, sessionId: state.sessionId })) {
            state.inputActions.submit()
          }
          return
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [scope])

  return null
}
