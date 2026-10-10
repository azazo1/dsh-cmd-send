/**
 * Host 侧队列改发的单元测试.
 *
 * 这里刻意用最小替身而不是真 Agent: 本模块与 Agent 的接触面只有 status, inbox
 * 与 followup 三处, 用替身能把 "取出再当作普通消息送出" 的顺序钉死, 并覆盖两个
 * 需要静默收敛的分支 (消息已被领走, 会话正在运行).
 */
import { describe, expect, it, vi } from 'vitest'
import { releaseQueuedMessage } from '../src/release.ts'

/** 一个最小 Agent 替身, 记录 inbox 与 followup 上的动作. */
function agent(options: { status?: 'idle' | 'running'; messages?: string[] } = {}) {
  const messages = options.messages ?? []
  return {
    status: options.status ?? 'idle',
    inbox: {
      nextTurn: messages.map(id => ({ id })),
      remove: vi.fn(() => true),
    },
    followup: vi.fn(),
  }
}

describe('releaseQueuedMessage', () => {
  it('空闲时取出目标消息并当作普通消息重新送出', () => {
    const target = agent({ messages: ['q-1'] })
    expect(releaseQueuedMessage(target, 'q-1')).toBe('sent')
    expect(target.inbox.remove).toHaveBeenCalledWith('q-1')
    expect(target.followup).toHaveBeenCalledWith({ id: 'q-1' })
  })

  it('只动指定那一条, 其余排队消息原地不动', () => {
    const target = agent({ messages: ['q-1', 'q-2'] })
    expect(releaseQueuedMessage(target, 'q-2')).toBe('sent')
    expect(target.inbox.remove).toHaveBeenCalledWith('q-2')
    expect(target.followup).toHaveBeenCalledWith({ id: 'q-2' })
  })

  it('消息已被领走时静默收敛, 不做任何动作', () => {
    const target = agent({ messages: ['q-1'] })
    expect(releaseQueuedMessage(target, 'gone')).toBe('converged')
    expect(target.inbox.remove).not.toHaveBeenCalled()
    expect(target.followup).not.toHaveBeenCalled()
  })

  it('会话正在运行时交给内置插话, 这里不抢', () => {
    const target = agent({ status: 'running', messages: ['q-1'] })
    expect(releaseQueuedMessage(target, 'q-1')).toBe('converged')
    expect(target.inbox.remove).not.toHaveBeenCalled()
    expect(target.followup).not.toHaveBeenCalled()
  })
})
