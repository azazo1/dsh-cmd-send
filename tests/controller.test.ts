/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest'
import { isComposerInput, markEnterAsLineBreak } from '../src/client/controller.tsx'

describe('isComposerInput', () => {
  it('识别 Lexical composer 根节点及其内部元素', () => {
    const root = document.createElement('div')
    root.dataset.composerInput = ''
    const inner = document.createElement('span')
    root.append(inner)
    document.body.append(root)
    expect(isComposerInput(root)).toBe(true)
    expect(isComposerInput(inner)).toBe(true)
    expect(isComposerInput(document.createElement('textarea'))).toBe(false)
    expect(isComposerInput(null)).toBe(false)
  })
})

describe('markEnterAsLineBreak', () => {
  it('把 Enter 伪装成 Shift+Enter', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false })
    expect(event.shiftKey).toBe(false)
    expect(markEnterAsLineBreak(event)).toBe(true)
    expect(event.shiftKey).toBe(true)
  })
})
