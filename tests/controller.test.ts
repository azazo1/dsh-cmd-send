/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest'
import { hasHighlightedCandidate, isComposerInput, rewriteShiftKey } from '../src/client/controller.tsx'

/** 搭一个 composer 卡片, 按需在其中放候选菜单 (可带高亮项). */
function composerCard(options: { menu: boolean; highlight: boolean } = { menu: false, highlight: false }): HTMLElement {
  const card = document.createElement('div')
  card.dataset.composerCard = ''
  const editor = document.createElement('div')
  editor.dataset.composerInput = ''
  card.append(editor)
  if (options.menu) {
    const menu = document.createElement('div')
    menu.dataset.triggerMenu = ''
    const list = document.createElement('div')
    list.setAttribute('role', 'listbox')
    if (options.highlight) list.setAttribute('aria-activedescendant', 'dsh-slash-option-skill-0')
    menu.append(list)
    card.append(menu)
  }
  document.body.append(card)
  return card
}

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

describe('hasHighlightedCandidate', () => {
  it('菜单未打开时返回 false', () => {
    const card = composerCard()
    expect(hasHighlightedCandidate(card.querySelector('[data-composer-input]'))).toBe(false)
  })

  it('菜单打开但没有高亮项时返回 false', () => {
    const card = composerCard({ menu: true, highlight: false })
    expect(hasHighlightedCandidate(card.querySelector('[data-composer-input]'))).toBe(false)
  })

  it('菜单打开且高亮一项时返回 true', () => {
    const card = composerCard({ menu: true, highlight: true })
    expect(hasHighlightedCandidate(card.querySelector('[data-composer-input]'))).toBe(true)
  })

  it('只看按键所在卡片, 不受同页面其他 composer 的菜单影响', () => {
    composerCard({ menu: true, highlight: true })
    const plain = composerCard()
    expect(hasHighlightedCandidate(plain.querySelector('[data-composer-input]'))).toBe(false)
    expect(hasHighlightedCandidate(null)).toBe(false)
  })
})

describe('rewriteShiftKey', () => {
  it('把 Enter 伪装成 Shift+Enter', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false })
    expect(event.shiftKey).toBe(false)
    expect(rewriteShiftKey(event, true)).toBe(true)
    expect(event.shiftKey).toBe(true)
  })

  it('也能抹掉 Shift (Shift+Cmd+Enter 走继续/提交)', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, metaKey: true })
    expect(rewriteShiftKey(event, false)).toBe(true)
    expect(event.shiftKey).toBe(false)
    expect(event.metaKey).toBe(true)
  })
})
