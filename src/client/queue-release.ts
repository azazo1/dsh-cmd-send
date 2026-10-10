/**
 * 队列条的客户端增强: 让中断后停住的排队消息还能发出去.
 *
 * 原生 QueueDock 的 "插话发送" 按钮在 `running === false` 时禁用, 因为插话在语义上
 * 只对正在跑的回合成立. 但用户点完 "中断" 之后, 队列里的消息就被困住了: 既不会自己
 * 继续, 按钮也是灰的, 而 Host 侧的 `updateQueue(steer)` 同样会以
 * `session/steer-unavailable` 拒绝.
 *
 * 本模块不改写原生组件 (它在 dsh 内部, 插件拿不到), 而是挂一个 DOM 观察器: 在队列条
 * 的排队行上把那个被禁用的按钮重新点亮, 并把这一次点击换成 Host 侧的改发接口
 * (见 ../release.ts) -- 效果等同于普通发送一条消息, 由 driver 自己从队首跑起来.
 *
 * 行与消息 id 的对应不使用 React 内部结构: 原生列表按 `InputState.queue` 的顺序渲染
 * `<li>`, 本地回声行 (`[data-submission-echo]`) 排在真正的排队行之后. 因此非回声行里
 * 的第 n 行就是 `queue[n]` -- 这是插件本来就持有的状态, 与 DOM 顺序同一个契约.
 */
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { RELEASE_API_PREFIX, type ReleaseQueuedResponse } from '../shared.ts'

/** 原生队列条根节点. */
const DOCK_SELECTOR = '[data-queue-dock]'

/** 本地回声行 (还没被 Host 收下, 没有真正的 Inbox 身份), 不参与增强. */
const ECHO_SELECTOR = '[data-submission-echo]'

/** 原生插话按钮的 aria-label, 中英文两套都要认 (取自原生字典). */
const STEER_LABELS = ['插话发送', 'Steer queued message']

/** 已经接管过的按钮上挂的标记. */
const ARMED_ATTR = 'data-cmd-send-release'

/** 接管后的按钮标题, 取代原生那句 "仅运行中可插话发送". */
const ARMED_TITLE = '作为普通消息发送'

/** 挂载队列条增强所需的上下文. */
export interface ReleaseContext {
  /** 当前会话 id. */
  sessionId: SessionId
  /** 会话是否正在运行; 运行中原样放行, 由内置逻辑处理这次点击. */
  isRunning: () => boolean
  /**
   * 按队列位置取排队消息 id.
   * @param index - 该会话 `InputState.queue` 里的下标.
   * @returns 消息 id; 越界 (DOM 比状态新) 时为 undefined.
   */
  itemIdAt: (index: number) => string | undefined
  /** 失败提示出口. */
  notify: (text: string) => void
}

/** 向 Host 请求把一条排队消息当作普通消息重新送出. */
async function requestRelease(sessionId: string, itemId: string): Promise<void> {
  const response = await fetch(`${RELEASE_API_PREFIX}/release`, {
    method: 'POST',
    // 同源请求要带上 dsh 的登录令牌 cookie, 否则会被 Host 的鉴权挡下.
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, itemId }),
  })
  const text = await response.text()
  let parsed: unknown = {}
  try {
    parsed = text === '' ? {} : JSON.parse(text)
  } catch {
    throw new Error(`接口返回了非 JSON 内容 (HTTP ${String(response.status)})`)
  }
  const result = parsed as ReleaseQueuedResponse
  if (!response.ok || result.ok !== true) {
    const message = 'error' in result && typeof result.error === 'string'
      ? result.error
      : `HTTP ${String(response.status)}`
    throw new Error(message)
  }
}

/** 一条行是不是本地回声行 (没有 Inbox 身份). */
export function isEchoRow(row: Element): boolean {
  return row.matches(ECHO_SELECTOR) || row.querySelector(ECHO_SELECTOR) !== null
}

/**
 * 判断一个按钮是不是那一行的插话按钮.
 * @param button - 候选按钮.
 * @returns 是否是插话按钮.
 */
function isSteerButton(button: HTMLButtonElement): boolean {
  const label = button.getAttribute('aria-label')
  return label !== null && STEER_LABELS.includes(label)
}

/**
 * 点亮一行里的插话按钮, 并接管它的点击.
 *
 * 按钮保持原生外观, 只解除禁用; 捕获阶段的监听器先于 React 挂在根容器上的委托监听器,
 * 因此这次点击不会走到原生那条注定失败的插话路径.
 * @param row - 一条排队行.
 * @param index - 该行在真正的排队消息里的下标.
 * @param context - 当前会话与提示出口.
 */
export function armRow(row: Element, index: number, context: ReleaseContext): void {
  // 回声行还没有 Inbox 身份, 发不出去.
  if (isEchoRow(row)) return
  for (const button of row.querySelectorAll('button')) {
    if (!isSteerButton(button)) continue
    if (!button.hasAttribute(ARMED_ATTR)) {
      button.setAttribute(ARMED_ATTR, '')
      button.addEventListener('click', (event: MouseEvent) => {
        // 会话在这期间又跑起来了: 这次点击属于内置插话, 放行.
        if (context.isRunning()) return
        const itemId = context.itemIdAt(index)
        // 状态里没有这一行 (DOM 比状态新): 不发猜测的消息.
        if (itemId === undefined) return
        event.preventDefault()
        event.stopImmediatePropagation()
        void requestRelease(context.sessionId, itemId).catch((error: unknown) => {
          console.error('[dsh-cmd-send] 队列消息改发失败', error)
          context.notify('队列消息改发失败')
        })
      }, true)
    }
    // 原生每次重渲染都会把 disabled 与 title 写回来, 这里按需补一次; 只在真的有差异
    // 时写, 避免观察器被自己的写入反复唤醒.
    if (button.disabled) button.disabled = false
    if (button.title !== ARMED_TITLE) button.title = ARMED_TITLE
  }
}

/**
 * 扫描全部队列条, 点亮其中的排队行.
 * @param context - 当前会话与提示出口.
 */
export function sweepQueueDocks(context: ReleaseContext): void {
  for (const dock of document.querySelectorAll(DOCK_SELECTOR)) {
    // 运行中完全交给内置逻辑, 不做任何改写.
    if (context.isRunning()) continue
    let index = 0
    for (const row of dock.querySelectorAll('li')) {
      if (isEchoRow(row)) continue
      armRow(row, index, context)
      index += 1
    }
  }
}

/**
 * 挂载队列条增强.
 * @param context - 当前会话, 运行状态读取, 消息 id 解析与失败提示出口.
 * @returns 卸载函数.
 */
export function installQueueRelease(context: ReleaseContext): () => void {
  if (typeof document === 'undefined') return () => {}
  let scheduled = false
  const sweep = (): void => {
    scheduled = false
    sweepQueueDocks(context)
  }
  // 一次渲染会带来大量变更记录, 合并到一帧里扫一次即可.
  const schedule = (): void => {
    if (scheduled) return
    scheduled = true
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(sweep)
    else queueMicrotask(sweep)
  }
  sweep()
  const observer = new MutationObserver(schedule)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled'],
  })
  return () => { observer.disconnect() }
}
