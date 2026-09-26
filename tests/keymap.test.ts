/** keymap 决策函数单元测试: 覆盖 Cmd+Enter 模式下的键位映射与边界. */
import { describe, expect, it } from 'vitest'
import type { DraftAttachmentId } from '@deepseek-ai/dsh-client-ui-conversation/client'
import { decideKey, hasContent, isAltSendPlatform, type DecideInput, type KeyEventLike } from '../src/client/keymap.ts'

const CMD_ENTER: DecideInput = { mode: 'cmd-enter', phase: 'plain', content: true, candidateHighlight: false }
const CMD_ENTER_EMPTY: DecideInput = { mode: 'cmd-enter', phase: 'plain', content: false, candidateHighlight: false }
const CMD_ENTER_CANDIDATE: DecideInput = { mode: 'cmd-enter', phase: 'plain', content: true, candidateHighlight: true }
const CMD_ENTER_ALT: DecideInput = { mode: 'cmd-enter', phase: 'plain', content: true, candidateHighlight: false, altAsSend: true }
const DEFAULT: DecideInput = { mode: 'enter', phase: 'plain', content: true, candidateHighlight: false }

function enter(overrides: Partial<KeyEventLike> = {}): KeyEventLike {
  return {
    key: 'Enter',
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    isComposing: false,
    keyCode: 13,
    repeat: false,
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
      expect(decideKey(enter(), { mode: 'cmd-enter', phase, content: true, candidateHighlight: false })).toEqual({ kind: 'pass' })
      expect(decideKey(enter({ metaKey: true }), { mode: 'cmd-enter', phase, content: true, candidateHighlight: false })).toEqual({ kind: 'pass' })
    }
  })

  it('Enter 无修饰换行', () => {
    expect(decideKey(enter(), CMD_ENTER)).toEqual({ kind: 'newline' })
  })

  it('Shift+Enter 与 macOS Option+Enter 放行 (内置换行/其他)', () => {
    expect(decideKey(enter({ shiftKey: true }), CMD_ENTER)).toEqual({ kind: 'pass' })
    expect(decideKey(enter({ altKey: true }), CMD_ENTER)).toEqual({ kind: 'pass' })
    expect(decideKey(enter({ altKey: true, shiftKey: true }), CMD_ENTER)).toEqual({ kind: 'pass' })
  })

  it('命令候选菜单打开时 Enter 放行 (菜单消费)', () => {
    expect(decideKey(enter(), { mode: 'cmd-enter', phase: 'claimed', content: true, candidateHighlight: false })).toEqual({ kind: 'pass' })
  })

  it('候选菜单高亮候选时 Enter 放行 (选中候选而不是换行)', () => {
    expect(decideKey(enter(), CMD_ENTER_CANDIDATE)).toEqual({ kind: 'pass' })
    expect(decideKey(enter({ repeat: true }), CMD_ENTER_CANDIDATE)).toEqual({ kind: 'pass' })
  })

  it('候选菜单高亮时 Cmd/Ctrl+Enter 仍发送 (发送手势优先于菜单)', () => {
    expect(decideKey(enter({ metaKey: true }), CMD_ENTER_CANDIDATE)).toEqual({ kind: 'send' })
    expect(decideKey(enter({ ctrlKey: true }), CMD_ENTER_CANDIDATE)).toEqual({ kind: 'send' })
    expect(decideKey(enter({ metaKey: true, shiftKey: true }), CMD_ENTER_CANDIDATE)).toEqual({ kind: 'steer' })
  })

  it('候选菜单高亮时未开启 cmd-enter 模式仍全部放行', () => {
    expect(decideKey(enter(), { ...DEFAULT, candidateHighlight: true })).toEqual({ kind: 'pass' })
  })

  it('草稿为空且无附件时 Cmd/Ctrl+Enter 放行 (没有可发送内容)', () => {
    expect(decideKey(enter({ metaKey: true }), CMD_ENTER_EMPTY)).toEqual({ kind: 'pass' })
    expect(decideKey(enter({ metaKey: true, shiftKey: true }), CMD_ENTER_EMPTY)).toEqual({ kind: 'pass' })
  })

  it('Cmd/Ctrl+Enter 发送', () => {
    expect(decideKey(enter({ metaKey: true }), CMD_ENTER)).toEqual({ kind: 'send' })
    expect(decideKey(enter({ ctrlKey: true }), CMD_ENTER)).toEqual({ kind: 'send' })
  })

  it('Shift+Cmd/Ctrl+Enter 插话', () => {
    expect(decideKey(enter({ metaKey: true, shiftKey: true }), CMD_ENTER)).toEqual({ kind: 'steer' })
    expect(decideKey(enter({ ctrlKey: true, shiftKey: true }), CMD_ENTER)).toEqual({ kind: 'steer' })
  })

  it('长按 Cmd/Ctrl+Enter 放行, 避免连发', () => {
    expect(decideKey(enter({ metaKey: true, repeat: true }), CMD_ENTER)).toEqual({ kind: 'pass' })
    expect(decideKey(enter({ ctrlKey: true, repeat: true }), CMD_ENTER)).toEqual({ kind: 'pass' })
  })

  it('长按普通 Enter 仍换行', () => {
    expect(decideKey(enter({ repeat: true }), CMD_ENTER)).toEqual({ kind: 'newline' })
  })

  it('altAsSend 时 Ctrl/Cmd 系与普通 Enter 保持原样', () => {
    expect(decideKey(enter({ ctrlKey: true }), CMD_ENTER_ALT)).toEqual({ kind: 'send' })
    expect(decideKey(enter({ metaKey: true }), CMD_ENTER_ALT)).toEqual({ kind: 'send' })
    expect(decideKey(enter({ shiftKey: true }), CMD_ENTER_ALT)).toEqual({ kind: 'pass' })
    expect(decideKey(enter(), CMD_ENTER_ALT)).toEqual({ kind: 'newline' })
  })

  it('Windows/Linux 上 Alt+Enter 发送', () => {
    expect(decideKey(enter({ altKey: true }), CMD_ENTER_ALT)).toEqual({ kind: 'send' })
  })

  it('Windows/Linux 上 Alt+Shift+Enter 插话', () => {
    expect(decideKey(enter({ altKey: true, shiftKey: true }), CMD_ENTER_ALT)).toEqual({ kind: 'steer' })
  })

  it('Windows/Linux 上长按 Alt+Enter 放行, 避免连发', () => {
    expect(decideKey(enter({ altKey: true, repeat: true }), CMD_ENTER_ALT)).toEqual({ kind: 'pass' })
    expect(decideKey(enter({ altKey: true, shiftKey: true, repeat: true }), CMD_ENTER_ALT)).toEqual({
      kind: 'pass',
    })
  })

  it('草稿为空时 Alt+Enter 也放行', () => {
    expect(decideKey(enter({ altKey: true }), { ...CMD_ENTER_EMPTY, altAsSend: true })).toEqual({ kind: 'pass' })
  })

  it('候选菜单高亮时 Alt+Enter 仍发送', () => {
    expect(decideKey(enter({ altKey: true }), { ...CMD_ENTER_CANDIDATE, altAsSend: true })).toEqual({ kind: 'send' })
    expect(decideKey(enter({ altKey: true, shiftKey: true }), { ...CMD_ENTER_CANDIDATE, altAsSend: true })).toEqual({
      kind: 'steer',
    })
  })

  it('isAltSendPlatform 识别 Windows/Linux, 排除 Apple', () => {
    expect(isAltSendPlatform('Win32')).toBe(true)
    expect(isAltSendPlatform('Windows')).toBe(true)
    expect(isAltSendPlatform('Linux x86_64')).toBe(true)
    expect(isAltSendPlatform('Linux')).toBe(true)
    expect(isAltSendPlatform('MacIntel')).toBe(false)
    expect(isAltSendPlatform('MacARM64')).toBe(false)
    expect(isAltSendPlatform('macOS')).toBe(false)
    expect(isAltSendPlatform('iPhone')).toBe(false)
    expect(isAltSendPlatform('iPad')).toBe(false)
  })

  it('enter 模式下即使 altAsSend 也全部放行', () => {
    expect(decideKey(enter({ altKey: true }), { ...DEFAULT, altAsSend: true })).toEqual({ kind: 'pass' })
    expect(decideKey(enter({ altKey: true, shiftKey: true }), { ...DEFAULT, altAsSend: true })).toEqual({
      kind: 'pass',
    })
  })
})

describe('hasContent', () => {
  it('正文非空白即视为有内容', () => {
    expect(hasContent({ draft: 'hi', attachmentIds: [] })).toBe(true)
    expect(hasContent({ draft: '   ', attachmentIds: [] })).toBe(false)
  })

  it('正文为空但存在附件时同样视为有内容', () => {
    expect(hasContent({ draft: '', attachmentIds: ['attachment-1' as DraftAttachmentId] })).toBe(true)
  })
})
