/** keymap 决策函数单元测试: 覆盖 Cmd+Enter 模式下的键位映射与边界. */
import { describe, expect, it } from 'vitest'
import { decideKey, type DecideInput, type KeyEventLike } from '../src/client/keymap.ts'

const CMD_ENTER: DecideInput = { mode: 'cmd-enter', phase: 'plain' }
const DEFAULT: DecideInput = { mode: 'enter', phase: 'plain' }

function enter(overrides: Partial<KeyEventLike> = {}): KeyEventLike {
  return {
    key: 'Enter',
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    isComposing: false,
    keyCode: 13,
    ...overrides,
  }
}

describe('decideKey', () => {
  it('非 Enter 键一律放行', () => {
    expect(decideKey({ ...enter(), key: 'a' }, CMD_ENTER)).toEqual({ kind: 'pass' })
  })

  it('未开启 cmd-enter 模式时全部放行', () => {
    expect(decideKey(enter(), DEFAULT)).toEqual({ kind: 'pass' })
    expect(decideKey(enter({ metaKey: true }), DEFAULT)).toEqual({ kind: 'pass' })
  })

  it('IME 组合输入 (候选词确认) 放行', () => {
    expect(decideKey(enter({ isComposing: true }), CMD_ENTER)).toEqual({ kind: 'pass' })
    expect(decideKey(enter({ isComposing: false, keyCode: 229 }), CMD_ENTER)).toEqual({ kind: 'pass' })
  })

  it('提交交易进行中放行', () => {
    for (const phase of ['adjudicating', 'submitting'] as const) {
      expect(decideKey(enter(), { mode: 'cmd-enter', phase })).toEqual({ kind: 'pass' })
      expect(decideKey(enter({ metaKey: true }), { mode: 'cmd-enter', phase })).toEqual({ kind: 'pass' })
    }
  })

  it('Enter 无修饰换行', () => {
    expect(decideKey(enter(), CMD_ENTER)).toEqual({ kind: 'newline' })
  })

  it('Shift+Enter 与 Alt+Enter 放行 (内置换行/其他)', () => {
    expect(decideKey(enter({ shiftKey: true }), CMD_ENTER)).toEqual({ kind: 'pass' })
    expect(decideKey(enter({ altKey: true }), CMD_ENTER)).toEqual({ kind: 'pass' })
  })

  it('命令候选菜单打开时 Enter 放行 (菜单消费)', () => {
    expect(decideKey(enter(), { mode: 'cmd-enter', phase: 'claimed' })).toEqual({ kind: 'pass' })
  })

  it('Cmd/Ctrl+Enter 发送', () => {
    expect(decideKey(enter({ metaKey: true }), CMD_ENTER)).toEqual({ kind: 'send' })
    expect(decideKey(enter({ ctrlKey: true }), CMD_ENTER)).toEqual({ kind: 'send' })
  })

  it('Shift+Cmd/Ctrl+Enter 插话', () => {
    expect(decideKey(enter({ metaKey: true, shiftKey: true }), CMD_ENTER)).toEqual({ kind: 'steer' })
    expect(decideKey(enter({ ctrlKey: true, shiftKey: true }), CMD_ENTER)).toEqual({ kind: 'steer' })
  })
})
