/** @vitest-environment jsdom */
/** ask 回答框的键位适配单元测试: 目标识别与 cmd-enter 模式下的决策. */
import { describe, expect, it } from 'vitest'
import type { KeyEventLike } from '../src/client/keymap.ts'
import { decideAskAnswerKey, isAskAnswerField } from '../src/client/ask-field.ts'

/** 搭一张 ask 提问卡片 (根节点带 data-question-key), 返回其中的回答框. */
function askAnswerField(): HTMLTextAreaElement {
  const frame = document.createElement('div')
  frame.dataset.questionKey = 'question:1'
  const field = document.createElement('textarea')
  frame.append(field)
  document.body.append(frame)
  return field
}

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

describe('isAskAnswerField', () => {
  it('识别卡片内的回答框', () => {
    expect(isAskAnswerField(askAnswerField())).toBe(true)
  })

  it('卡片外的 textarea 与 composer 都不算', () => {
    const stray = document.createElement('textarea')
    const composer = document.createElement('div')
    composer.dataset.composerInput = ''
    document.body.append(stray, composer)
    expect(isAskAnswerField(stray)).toBe(false)
    expect(isAskAnswerField(composer)).toBe(false)
    expect(isAskAnswerField(null)).toBe(false)
  })
})

describe('decideAskAnswerKey', () => {
  it('enter 模式全部放行卡片自带逻辑', () => {
    expect(decideAskAnswerKey(enter(), 'enter')).toEqual({ kind: 'pass' })
    expect(decideAskAnswerKey(enter({ metaKey: true }), 'enter')).toEqual({ kind: 'pass' })
  })

  it('cmd-enter 模式下裸 Enter 换行', () => {
    expect(decideAskAnswerKey(enter(), 'cmd-enter')).toEqual({ kind: 'newline' })
  })

  it('cmd-enter 模式下 Cmd/Ctrl+Enter 继续或提交', () => {
    expect(decideAskAnswerKey(enter({ metaKey: true }), 'cmd-enter')).toEqual({ kind: 'submit' })
    expect(decideAskAnswerKey(enter({ ctrlKey: true }), 'cmd-enter')).toEqual({ kind: 'submit' })
  })

  it('回答框没有插话通道, Shift+Cmd+Enter 也退回继续/提交', () => {
    expect(decideAskAnswerKey(enter({ metaKey: true, shiftKey: true }), 'cmd-enter')).toEqual({ kind: 'submit' })
  })

  it('Shift+Enter 与 macOS Option+Enter 保持内置行为', () => {
    expect(decideAskAnswerKey(enter({ shiftKey: true }), 'cmd-enter')).toEqual({ kind: 'pass' })
    expect(decideAskAnswerKey(enter({ altKey: true }), 'cmd-enter')).toEqual({ kind: 'pass' })
  })

  it('Windows/Linux 上 Alt+Enter 继续或提交', () => {
    expect(decideAskAnswerKey(enter({ altKey: true }), 'cmd-enter', true)).toEqual({ kind: 'submit' })
    expect(decideAskAnswerKey(enter({ altKey: true, shiftKey: true }), 'cmd-enter', true)).toEqual({
      kind: 'submit',
    })
  })

  it('IME 组合输入放行', () => {
    expect(decideAskAnswerKey(enter({ isComposing: true }), 'cmd-enter')).toEqual({ kind: 'pass' })
    expect(decideAskAnswerKey(enter({ isComposing: false, keyCode: 229 }), 'cmd-enter')).toEqual({ kind: 'pass' })
  })

  it('非 Enter 键放行', () => {
    expect(decideAskAnswerKey(enter({ key: 'a' }), 'cmd-enter')).toEqual({ kind: 'pass' })
  })
})
