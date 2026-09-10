/** @vitest-environment jsdom */
/**
 * 控制器端到端回归测试: 用真实 React 挂载 KeymapController, 在 composer 上
 * 派发按键, 校验 Cmd+Enter 与 Shift+Cmd+Enter 分别走 submit 与会话 steer 通道.
 * 这里刻意按新版 dsh 的 InputState 形状 (draft/attachmentIds/phase) 构造输入,
 * 防止上游字段改名后插件静默失效.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { KeymapController, type KeymapControllerProps } from '../src/client/controller.tsx'
import { DEFAULT_SEND_MODE, type CmdSendSettings, type SendMode } from '../src/shared.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** 一次挂载所需的可控外部依赖. */
interface Harness {
  /** 挂载用的 React root. */
  root: Root
  /** composer 根节点 (data-composer-input). */
  composer: HTMLElement
  /** 输入动作回调. */
  actions: { setDraft: ReturnType<typeof vi.fn>; submit: ReturnType<typeof vi.fn> }
  /** 会话 steer 通道. */
  prompt: ReturnType<typeof vi.fn>
  /** 卸载并清理 DOM. */
  unmount(): void
}

/** 按给定草稿与忙碌状态挂载控制器. */
function mount(options: {
  draft: string
  attachmentIds?: readonly unknown[]
  running: boolean
  mode?: SendMode
}): Harness {
  const composer = document.createElement('div')
  composer.setAttribute('data-composer-input', '')
  const container = document.createElement('div')
  document.body.append(composer, container)

  const actions = { setDraft: vi.fn(), submit: vi.fn() }
  const prompt = vi.fn(async () => ({ ok: true, value: { accepted: true } }))
  const input = {
    draft: options.draft,
    attachmentIds: options.attachmentIds ?? [],
    draftRev: 1,
    phase: 'plain',
    occurrences: [],
    queue: [],
  }
  const props = {
    useSession: (select: (snapshot: { running: boolean }) => unknown) => select({ running: options.running }),
    useInput: (select: (state: typeof input) => unknown) => select(input),
    inputActions: { ...actions, addAttachments: vi.fn(), removeAttachment: vi.fn(), pruneAttachments: vi.fn() },
    sessionId: 'session-1',
    sessions: { binding: () => ({ session: { prompt } }) },
    scope: { getSnapshot: () => ({ value: { sendMode: options.mode ?? 'cmd-enter' } as CmdSendSettings }) },
  } as unknown as KeymapControllerProps

  const root = createRoot(container)
  act(() => {
    root.render(createElement(KeymapController, props))
  })
  return {
    root,
    composer,
    actions,
    prompt,
    unmount: () => {
      act(() => root.unmount())
      composer.remove()
      container.remove()
    },
  }
}

/** 在 composer 上派发一次 Enter 组合键. */
function pressEnter(composer: HTMLElement, init: KeyboardEventInit): boolean {
  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...init })
  act(() => {
    composer.dispatchEvent(event)
  })
  return event.defaultPrevented
}

let harness: Harness | undefined
afterEach(() => {
  harness?.unmount()
  harness = undefined
})

describe('KeymapController', () => {
  it('闲置时 Cmd+Enter 走 composer 自身的提交', () => {
    harness = mount({ draft: '你好', running: false })
    expect(pressEnter(harness.composer, { metaKey: true })).toBe(true)
    expect(harness.actions.submit).toHaveBeenCalledTimes(1)
    expect(harness.prompt).not.toHaveBeenCalled()
  })

  it('忙碌时 Shift+Cmd+Enter 以 steer 模式发送草稿', async () => {
    harness = mount({ draft: '打断一下', running: true })
    expect(pressEnter(harness.composer, { metaKey: true, shiftKey: true })).toBe(true)
    await act(async () => { await Promise.resolve() })
    expect(harness.prompt).toHaveBeenCalledWith([{ type: 'text', text: '打断一下' }], 'steer')
    expect(harness.actions.setDraft).toHaveBeenCalledWith('')
    expect(harness.actions.submit).not.toHaveBeenCalled()
  })

  it('忙碌时 Shift+Cmd+Enter 带附件退回普通提交', async () => {
    harness = mount({ draft: '看图', attachmentIds: ['attachment-1'], running: true })
    expect(pressEnter(harness.composer, { metaKey: true, shiftKey: true })).toBe(true)
    await act(async () => { await Promise.resolve() })
    expect(harness.actions.submit).toHaveBeenCalledTimes(1)
    expect(harness.prompt).not.toHaveBeenCalled()
  })

  it('草稿为空且无附件时 Cmd+Enter 交还内置逻辑', () => {
    harness = mount({ draft: '   ', running: true })
    expect(pressEnter(harness.composer, { metaKey: true, shiftKey: true })).toBe(false)
    expect(harness.actions.submit).not.toHaveBeenCalled()
    expect(harness.prompt).not.toHaveBeenCalled()
  })

  it('关闭插件键位时完全不拦截', () => {
    harness = mount({ draft: '你好', running: true, mode: DEFAULT_SEND_MODE })
    expect(pressEnter(harness.composer, { metaKey: true })).toBe(false)
    expect(harness.actions.submit).not.toHaveBeenCalled()
  })

  it('steer 发送失败时恢复草稿', async () => {
    harness = mount({ draft: '会失败', running: true })
    harness.prompt.mockResolvedValueOnce({ ok: false, error: new Error('nope') })
    pressEnter(harness.composer, { metaKey: true, shiftKey: true })
    await act(async () => { await Promise.resolve() })
    expect(harness.actions.setDraft).toHaveBeenLastCalledWith('会失败')
  })
})
