/** @vitest-environment jsdom */
/**
 * ask 回答框的接线回归测试: 用真实 React 挂载 KeymapController, 并挂一张模仿
 * 提问卡片的 DOM (根节点带 data-question-key, 里面的 textarea 的 onKeyDown 与
 * dsh 的 continueFromCustom 同构: shiftKey 或 IME 组合时放行, 否则继续/提交).
 *
 * 校验两件事: 捕获阶段改写过的 shiftKey 确实能被卡片自己的 React 处理器看到
 * (整个机制的关键假设), 以及 cmd-enter 模式下裸 Enter 不再继续/提交.
 *
 * Windows/Linux 的 Alt+Enter 走同一条继续/提交, 平台判定来自控制器里的
 * navigator.platform, 所以那组用例按平台覆写 navigator.platform.
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
  /** 卡片处理器看到的 altKey (平台相关的用例用它确认插件没有吃掉按键). */
  altKey: boolean
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

/** 当前用例覆写的 navigator.platform, 用例结束恢复. */
let platformRestore: (() => void) | undefined

afterEach(() => {
  harness?.unmount()
  harness = undefined
  platformRestore?.()
  platformRestore = undefined
})

/**
 * 覆写 navigator.platform, 供平台相关的用例挑选键位.
 * 不调用时保持 jsdom 默认: platform 为空串, 控制器回落到含 `darwin` 的
 * userAgent, 于是判定为非 Windows/Linux (与本机 macOS 行为一致).
 */
function setPlatform(platform: string): void {
  const original = Object.getOwnPropertyDescriptor(Navigator.prototype, 'platform')
  Object.defineProperty(navigator, 'platform', { configurable: true, get: () => platform })
  platformRestore = () => {
    if (original === undefined) Reflect.deleteProperty(navigator, 'platform')
    else Object.defineProperty(navigator, 'platform', original)
  }
}

/** 挂载控制器与一张最小提问卡片, 返回卡片里的回答框. */
function mount(mode: SendMode): Harness {
  const observed: Observed = { shiftKey: false, altKey: false, continued: false }
  /** 与 dsh QuestionComposer 的 continueFromCustom 同构的回答框处理器. */
  const AnswerField = () => createElement('textarea', {
    onKeyDown: (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      observed.shiftKey = event.shiftKey
      observed.altKey = event.altKey
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

  it('Windows/Linux 上 Alt+Enter 与 Alt+Shift+Enter 都继续/提交', () => {
    setPlatform('Win32')
    harness = mount('cmd-enter')
    dispatchEnter(harness.field, { altKey: true })
    expect(harness.observed.shiftKey).toBe(false)
    expect(harness.observed.continued).toBe(true)
    // 回答框没有插话通道, 带 Shift 也退回继续/提交.
    dispatchEnter(harness.field, { altKey: true, shiftKey: true })
    expect(harness.observed.shiftKey).toBe(false)
    expect(harness.observed.continued).toBe(true)
  })

  it('Windows/Linux 上 enter 模式不抢 Alt+Enter (仍按卡片自带逻辑)', () => {
    setPlatform('Win32')
    harness = mount('enter')
    dispatchEnter(harness.field, { altKey: true })
    expect(harness.observed.altKey).toBe(true)
    expect(harness.observed.shiftKey).toBe(false)
    expect(harness.observed.continued).toBe(true)
  })

  it('Linux 平台同样把 Alt+Enter 当继续/提交', () => {
    setPlatform('Linux x86_64')
    harness = mount('cmd-enter')
    dispatchEnter(harness.field, { altKey: true, shiftKey: true })
    expect(harness.observed.shiftKey).toBe(false)
    expect(harness.observed.continued).toBe(true)
  })

  it('macOS 上 Option+Enter 不被插件改写, 由卡片自带逻辑消费', () => {
    setPlatform('MacIntel')
    harness = mount('cmd-enter')
    dispatchEnter(harness.field, { altKey: true })
    expect(harness.observed.shiftKey).toBe(false)
    expect(harness.observed.continued).toBe(true)
    // 与 Windows/Linux 的对照组: 带 Shift 时插件不抹 shiftKey, 换行走卡片
    // 自带的 Shift+Enter 分支, 由此确认平台判定真的生效而不是全靠放行.
    dispatchEnter(harness.field, { altKey: true, shiftKey: true })
    expect(harness.observed.shiftKey).toBe(true)
    expect(harness.observed.continued).toBe(false)
  })
})
