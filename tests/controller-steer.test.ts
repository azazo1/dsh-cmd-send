/** @vitest-environment jsdom */
/**
 * 控制器端到端回归测试: 用真实 React 挂载 KeymapController, 在 composer 上
 * 派发按键, 校验 Cmd+Enter 走 composer 自身的提交, Shift+Cmd+Enter 交棒给
 * 内置提交机的 steer 模式 (带附件时同样如此).
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
  /** 内置提交机的提交入口 (steer 交棒目标). */
  submit: ReturnType<typeof vi.fn>
  /** 卸载并清理 DOM. */
  unmount(): void
}

/** 子 agent 会话地址 (主会话为 null). */
type SubagentStub = { address: { mode: string } } | null

/** 按给定草稿与忙碌状态挂载控制器. */
function mount(options: {
  draft: string
  attachmentIds?: readonly unknown[]
  running: boolean
  mode?: SendMode
  /** 会话是否为子 agent 会话 (默认主会话). */
  subagent?: SubagentStub
  /** 会话作用域解析是否可用 (默认可用). */
  scopeResolvable?: boolean
  /** conversation 服务是否已提供 (默认已提供). */
  conversationAvailable?: boolean
  /** 在同一个 composer 卡片内放一个候选菜单 (/, @ 补全), 可带高亮项. */
  menu?: { highlight: boolean }
}): Harness {
  const card = document.createElement('div')
  card.setAttribute('data-composer-card', '')
  const composer = document.createElement('div')
  composer.setAttribute('data-composer-input', '')
  card.append(composer)
  if (options.menu !== undefined) {
    const menu = document.createElement('div')
    menu.setAttribute('data-trigger-menu', '')
    const list = document.createElement('div')
    list.setAttribute('role', 'listbox')
    if (options.menu.highlight) list.setAttribute('aria-activedescendant', 'dsh-slash-option-skill-0')
    menu.append(list)
    card.append(menu)
  }
  const container = document.createElement('div')
  document.body.append(card, container)

  const actions = { setDraft: vi.fn(), submit: vi.fn() }
  const submit = vi.fn()
  const input = {
    draft: options.draft,
    attachmentIds: options.attachmentIds ?? [],
    draftRev: 1,
    phase: 'plain',
    occurrences: [],
    queue: [],
  }
  const snapshot = { running: options.running, subagent: options.subagent ?? null }
  const conversation = { input: { for: () => ({ submit }) } }
  const actx = { get: (name: string) => (name === 'conversation' && options.conversationAvailable !== false ? conversation : undefined) }
  const props = {
    useSession: (select: (value: typeof snapshot) => unknown) => select(snapshot),
    useInput: (select: (state: typeof input) => unknown) => select(input),
    inputActions: { ...actions, addAttachments: vi.fn(), removeAttachment: vi.fn(), pruneAttachments: vi.fn() },
    sessionId: 'session-1',
    sessions: { scope: () => (options.scopeResolvable === false ? undefined : actx) },
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
    submit,
    unmount: () => {
      act(() => root.unmount())
      card.remove()
      container.remove()
    },
  }
}

/** 在 composer 上派发一次 Enter 组合键, 返回事件本身 (便于查看 shiftKey 改写). */
function dispatchEnter(composer: HTMLElement, init: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...init })
  act(() => {
    composer.dispatchEvent(event)
  })
  return event
}

/** 在 composer 上派发一次 Enter 组合键, 返回内置逻辑是否已被取消 (preventDefault). */
function pressEnter(composer: HTMLElement, init: KeyboardEventInit): boolean {
  return dispatchEnter(composer, init).defaultPrevented
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
    expect(harness.submit).not.toHaveBeenCalled()
  })

  it('忙碌时 Shift+Cmd+Enter 以 steer 模式交棒内置提交机', () => {
    harness = mount({ draft: '打断一下', running: true })
    expect(pressEnter(harness.composer, { metaKey: true, shiftKey: true })).toBe(true)
    expect(harness.submit).toHaveBeenCalledWith('steer')
    expect(harness.actions.submit).not.toHaveBeenCalled()
    expect(harness.actions.setDraft).not.toHaveBeenCalled()
  })

  it('忙碌时 Shift+Cmd+Enter 带附件同样以 steer 模式提交', () => {
    harness = mount({ draft: '看图', attachmentIds: ['attachment-1'], running: true })
    expect(pressEnter(harness.composer, { metaKey: true, shiftKey: true })).toBe(true)
    expect(harness.submit).toHaveBeenCalledWith('steer')
    expect(harness.actions.submit).not.toHaveBeenCalled()
  })

  it('只有附件没有正文时 Shift+Cmd+Enter 也以 steer 模式提交', () => {
    harness = mount({ draft: '   ', attachmentIds: ['attachment-1'], running: true })
    expect(pressEnter(harness.composer, { metaKey: true, shiftKey: true })).toBe(true)
    expect(harness.submit).toHaveBeenCalledWith('steer')
  })

  it('空闲时 Shift+Cmd+Enter 退回普通提交', () => {
    harness = mount({ draft: '你好', running: false })
    expect(pressEnter(harness.composer, { metaKey: true, shiftKey: true })).toBe(true)
    expect(harness.actions.submit).toHaveBeenCalledTimes(1)
    expect(harness.submit).not.toHaveBeenCalled()
  })

  it('子 agent 会话不可续聊时 Shift+Cmd+Enter 退回普通提交', () => {
    harness = mount({ draft: '看图', attachmentIds: ['attachment-1'], running: true, subagent: { address: { mode: 'one-shot' } } })
    expect(pressEnter(harness.composer, { metaKey: true, shiftKey: true })).toBe(true)
    expect(harness.actions.submit).toHaveBeenCalledTimes(1)
    expect(harness.submit).not.toHaveBeenCalled()
  })

  it('会话作用域解析不到时 Shift+Cmd+Enter 退回普通提交', () => {
    harness = mount({ draft: '看图', attachmentIds: ['attachment-1'], running: true, scopeResolvable: false })
    expect(pressEnter(harness.composer, { metaKey: true, shiftKey: true })).toBe(true)
    expect(harness.actions.submit).toHaveBeenCalledTimes(1)
    expect(harness.submit).not.toHaveBeenCalled()
  })

  it('conversation 服务缺失时 Shift+Cmd+Enter 退回普通提交', () => {
    harness = mount({ draft: '看图', running: true, conversationAvailable: false })
    expect(pressEnter(harness.composer, { metaKey: true, shiftKey: true })).toBe(true)
    expect(harness.actions.submit).toHaveBeenCalledTimes(1)
    expect(harness.submit).not.toHaveBeenCalled()
  })

  it('草稿为空且无附件时 Cmd+Enter 交还内置逻辑', () => {
    harness = mount({ draft: '   ', running: true })
    expect(pressEnter(harness.composer, { metaKey: true, shiftKey: true })).toBe(false)
    expect(harness.actions.submit).not.toHaveBeenCalled()
    expect(harness.submit).not.toHaveBeenCalled()
  })

  it('关闭插件键位时完全不拦截', () => {
    harness = mount({ draft: '你好', running: true, mode: DEFAULT_SEND_MODE })
    expect(pressEnter(harness.composer, { metaKey: true })).toBe(false)
    expect(harness.actions.submit).not.toHaveBeenCalled()
  })

  it('候选菜单高亮候选时 Enter 交还菜单 (不改写成换行)', () => {
    harness = mount({ draft: '/ski', running: false, menu: { highlight: true } })
    const event = dispatchEnter(harness.composer, {})
    expect(event.shiftKey).toBe(false)
    expect(event.defaultPrevented).toBe(false)
    expect(harness.actions.submit).not.toHaveBeenCalled()
  })

  it('候选菜单高亮候选时 Cmd+Enter 仍直接发送草稿', () => {
    harness = mount({ draft: '/ski', running: false, menu: { highlight: true } })
    const event = dispatchEnter(harness.composer, { metaKey: true })
    expect(event.defaultPrevented).toBe(true)
    expect(harness.actions.submit).toHaveBeenCalledTimes(1)
    expect(harness.submit).not.toHaveBeenCalled()
  })

  it('候选菜单高亮候选时 Shift+Cmd+Enter 仍插话发送', () => {
    harness = mount({ draft: '/ski', running: true, menu: { highlight: true } })
    expect(pressEnter(harness.composer, { metaKey: true, shiftKey: true })).toBe(true)
    expect(harness.submit).toHaveBeenCalledWith('steer')
  })

  it('候选菜单打开但没有高亮项时 Enter 仍然是换行', () => {
    harness = mount({ draft: '/zzz', running: false, menu: { highlight: false } })
    expect(dispatchEnter(harness.composer, {}).shiftKey).toBe(true)
    expect(harness.actions.submit).not.toHaveBeenCalled()
  })
})
