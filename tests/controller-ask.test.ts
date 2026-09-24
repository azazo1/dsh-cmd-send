/** @vitest-environment jsdom */
/**
 * ask 回答框的接线回归测试: 用真实 React 挂载 KeymapController, 并挂一张模仿
 * 提问卡片的 DOM (根节点带 data-question-key, 里面的 textarea 的 onKeyDown 与
 * dsh 的 continueFromCustom 同构: shiftKey 或 IME 组合时放行, 否则继续/提交).
 *
 * 校验两件事: 捕获阶段改写过的 shiftKey 确实能被卡片自己的 React 处理器看到
 * (整个机制的关键假设), 以及 cmd-enter 模式下裸 Enter 不再继续/提交.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { act, createElement, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { KeymapController, type KeymapControllerProps } from '../src/client/controller.tsx'
import type { CmdSendSettings, SendMode } from '../src/shared.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** 卡片处理器观察到的一次按键. */
interface Observed {
  /** 卡片处理器看到的 shiftKey. */
  shiftKey: boolean
  /** 卡片处理器是否继续/提交 (preventDefault 并推进). */
  continued: boolean
}

/** 一次挂载所需的句柄. */
interface Harness {
  /** 卡片里的回答框. */
  field: HTMLTextAreaElement
  /** 卡片处理器的观察结果. */
  observed: Observed
  /** 卸载并清理 DOM. */
  unmount(): void
}

let harness: Harness | undefined

afterEach(() => {
  harness?.unmount()
  harness = undefined
})

/** 挂载控制器与一张最小提问卡片, 返回卡片里的回答框. */
function mount(mode: SendMode): Harness {
  const observed: Observed = { shiftKey: false, continued: false }
  /** 与 dsh QuestionComposer 的 continueFromCustom 同构的回答框处理器. */
  const AnswerField = () => createElement('textarea', {
    onKeyDown: (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      observed.shiftKey = event.shiftKey
      observed.continued = false
      if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
      event.preventDefault()
      observed.continued = true
    },
  })
  const card = createElement('div', { 'data-question-key': 'question:1' }, createElement(AnswerField))
  const props = {
    useSession: (select: (value: unknown) => unknown) => select({ running: false, subagent: null }),
    useInput: (select: (value: unknown) => unknown) => select({ draft: '', attachmentIds: [], phase: 'plain' }),
    inputActions: { submit: () => {} },
    sessionId: 'session-1',
    sessions: { scope: () => undefined },
    scope: { getSnapshot: () => ({ value: { sendMode: mode } as CmdSendSettings }) },
  } as unknown as KeymapControllerProps

  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  act(() => {
    root.render(createElement('div', null, card, createElement(KeymapController, props)))
  })
  const field = container.querySelector('textarea')
  if (field === null) throw new Error('回答框没有渲染出来')
  return {
    field,
    observed,
    unmount: () => {
      act(() => root.unmount())
      container.remove()
    },
  }
}

/** 在回答框上派发一次 Enter, 返回事件本身. */
function dispatchEnter(field: HTMLTextAreaElement, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...init })
  act(() => {
    field.dispatchEvent(event)
  })
  return event
}

describe('ask 回答框的键位接线', () => {
  it('cmd-enter 模式下裸 Enter 被改写成换行, 卡片处理器不再继续/提交', () => {
    harness = mount('cmd-enter')
    const event = dispatchEnter(harness.field)
    expect(harness.observed.shiftKey).toBe(true)
    expect(harness.observed.continued).toBe(false)
    expect(event.defaultPrevented).toBe(false)
  })

  it('cmd-enter 模式下 Cmd/Ctrl+Enter 仍是继续/提交', () => {
    harness = mount('cmd-enter')
    for (const init of [{ metaKey: true }, { ctrlKey: true }] as const) {
      dispatchEnter(harness.field, init)
      expect(harness.observed.shiftKey).toBe(false)
      expect(harness.observed.continued).toBe(true)
    }
  })

  it('回答框没有插话通道, Shift+Cmd+Enter 也退回继续/提交', () => {
    harness = mount('cmd-enter')
    dispatchEnter(harness.field, { metaKey: true, shiftKey: true })
    expect(harness.observed.shiftKey).toBe(false)
    expect(harness.observed.continued).toBe(true)
  })

  it('Shift+Enter 与 IME 组合输入放行卡片自带逻辑', () => {
    harness = mount('cmd-enter')
    dispatchEnter(harness.field, { shiftKey: true })
    expect(harness.observed.shiftKey).toBe(true)
    expect(harness.observed.continued).toBe(false)
    dispatchEnter(harness.field, { isComposing: true })
    expect(harness.observed.continued).toBe(false)
  })

  it('enter 模式完全不改键位', () => {
    harness = mount('enter')
    dispatchEnter(harness.field)
    expect(harness.observed.shiftKey).toBe(false)
    expect(harness.observed.continued).toBe(true)
  })
})
