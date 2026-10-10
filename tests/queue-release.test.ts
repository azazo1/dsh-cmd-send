/** @vitest-environment jsdom */
/**
 * 队列条增强的单元测试.
 *
 * 覆盖两件容易静默失效的事: 按钮只有在该点亮时才被点亮 (回声行与运行中的会话都
 * 不碰), 以及点击真的走 Host 的改发接口而不是原生那条注定失败的插话路径.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { armRow, installQueueRelease, isEchoRow, sweepQueueDocks } from '../src/client/queue-release.ts'
import { RELEASE_API_PREFIX } from '../src/shared.ts'

/** 一条排队行, 按需带插话按钮. */
function queueRow(options: { echo?: boolean; steerButton?: boolean } = {}): HTMLElement {
  const row = document.createElement('li')
  if (options.echo === true) row.setAttribute('data-submission-echo', '')
  if (options.steerButton !== false) {
    const button = document.createElement('button')
    button.setAttribute('aria-label', '插话发送')
    button.disabled = true
    button.title = '仅运行中可插话发送'
    row.append(button)
  }
  return row
}

/** 搭一个带若干排队行的队列条. */
function dock(rows: readonly HTMLElement[]): HTMLElement {
  const host = document.createElement('div')
  host.setAttribute('data-queue-dock', '')
  for (const row of rows) host.append(row)
  document.body.append(host)
  return host
}

/** 挂载增强所需的上下文. */
function context(options: { running?: boolean; sessionId?: string; queue?: readonly string[] } = {}) {
  const queue = options.queue ?? ['q-1']
  return {
    sessionId: (options.sessionId ?? 'session-1') as never,
    isRunning: () => options.running === true,
    itemIdAt: (index: number) => queue[index],
    notify: vi.fn(),
  }
}

/** 点击一行里的插话按钮. */
function clickSteer(row: Element): void {
  row.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('isEchoRow', () => {
  it('认得出本地回声行', () => {
    expect(isEchoRow(queueRow({ echo: true }))).toBe(true)
    expect(isEchoRow(queueRow())).toBe(false)
  })
})

describe('armRow', () => {
  it('空闲时点亮插话按钮并接管点击', async () => {
    const row = queueRow()
    const fetchMock = vi.fn(async () => new Response('{"ok":true}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    armRow(row, 0, context())
    const button = row.querySelector('button')
    expect(button?.disabled).toBe(false)
    expect(button?.title).toBe('作为普通消息发送')
    clickSteer(row)
    await vi.waitFor(() => { expect(fetchMock).toHaveBeenCalledTimes(1) })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${RELEASE_API_PREFIX}/release`)
    expect(JSON.parse(String(init.body))).toEqual({ sessionId: 'session-1', itemId: 'q-1' })
  })

  it('按行下标取对应的排队消息, 不是取队首', async () => {
    const row = queueRow()
    const fetchMock = vi.fn(async () => new Response('{"ok":true}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    armRow(row, 1, context({ queue: ['q-1', 'q-2'] }))
    clickSteer(row)
    await vi.waitFor(() => { expect(fetchMock).toHaveBeenCalledTimes(1) })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toEqual({ sessionId: 'session-1', itemId: 'q-2' })
  })

  it('本地回声行不参与 (还没有 Host 身份)', () => {
    const row = queueRow({ echo: true })
    armRow(row, 0, context())
    expect(row.querySelector('button')?.disabled).toBe(true)
  })

  it('状态里没有对应项时点击不发请求', async () => {
    const row = queueRow()
    const fetchMock = vi.fn(async () => new Response('{"ok":true}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    armRow(row, 5, context())
    clickSteer(row)
    await Promise.resolve()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('点击确实阻止了原生处理器', () => {
    const row = queueRow()
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"ok":true}', { status: 200 })))
    armRow(row, 0, context())
    const native = vi.fn()
    row.querySelector('button')?.addEventListener('click', native)
    clickSteer(row)
    expect(native).not.toHaveBeenCalled()
  })

  it('会话又跑起来时放行原生插话', () => {
    const row = queueRow()
    const fetchMock = vi.fn(async () => new Response('{"ok":true}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const ctx = context({ running: true })
    armRow(row, 0, ctx)
    const native = vi.fn()
    row.querySelector('button')?.addEventListener('click', native)
    clickSteer(row)
    expect(native).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('接口报错时提示一次', async () => {
    const row = queueRow()
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"ok":false,"error":"没有这个接口"}', { status: 404 })))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const ctx = context()
      armRow(row, 0, ctx)
      clickSteer(row)
      await vi.waitFor(() => { expect(ctx.notify).toHaveBeenCalledTimes(1) })
    } finally {
      error.mockRestore()
    }
  })
})

describe('sweepQueueDocks', () => {
  it('回声行不占下标, 真正的排队行按顺序对齐', async () => {
    const first = queueRow()
    const second = queueRow()
    const echo = queueRow({ echo: true })
    dock([first, second, echo])
    const fetchMock = vi.fn(async () => new Response('{"ok":true}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    sweepQueueDocks(context({ queue: ['q-1', 'q-2'] }))
    expect(echo.querySelector('button')?.disabled).toBe(true)
    clickSteer(second)
    await vi.waitFor(() => { expect(fetchMock).toHaveBeenCalledTimes(1) })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toEqual({ sessionId: 'session-1', itemId: 'q-2' })
  })

  it('运行中完全不改写队列条', () => {
    const row = queueRow()
    dock([row])
    sweepQueueDocks(context({ running: true }))
    expect(row.querySelector('button')?.disabled).toBe(true)
  })
})

describe('installQueueRelease', () => {
  it('挂载时扫描一次, 并在原生重渲染写回 disabled 后再次点亮', async () => {
    const row = queueRow()
    dock([row])
    const button = row.querySelector('button')
    const dispose = installQueueRelease(context())
    expect(button?.disabled).toBe(false)

    // 原生组件把 disabled 写回来.
    if (button !== null) button.disabled = true
    await vi.waitFor(() => { expect(button?.disabled).toBe(false) })

    dispose()
    if (button !== null) button.disabled = true
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(button?.disabled).toBe(true)
  })
})
