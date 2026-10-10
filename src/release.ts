/**
 * 队列消息改发的 Host 侧接口.
 *
 * 背景: 用户点 "中断" 后, dsh 用 `agent.cancel({ keepInbox: true })` 中止当前
 * 回合, 排队消息被保留但在队列里停住. 此时队列条每行的 "插话发送" 按钮是灰的
 * (`running === false`), 而 Host 的 `updateQueue(steer)` 也会因
 * `agent.status !== 'running'` 回 `session/steer-unavailable`, 于是那批排队
 * 消息在空闲状态下没有任何出路.
 *
 * 本接口补的就是这条路: 把选中的那条排队消息从 Inbox 取出, 再用
 * `agent.followup()` 当作一条普通消息重新送达. `followup` 正是 Host 处理
 * "普通发送" 时用的同一条通道 (`prompt` 的 queue 模式), 它会把消息排到
 * next-turn 末尾并唤醒空闲的 driver, 因此效果是这条队列重新跑起来, 而不是
 * 插话进某个正在进行的回合.
 *
 * 走同源 HTTP 而不是 dsh 的 client-host RPC 通道: 这条动作只有一个动词, 而
 * HTTP 路由是本插件在 Host 侧唯一需要注册的能力, 复用 `connection` 的鉴权即可
 * (它同时挡住 DNS rebinding 与跨站请求, 并要求浏览器侧的登录令牌).
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { RELEASE_API_PREFIX } from './shared.ts'

/**
 * 目标 Agent 在本模块用到的那一点结构面.
 *
 * 刻意不 `import type { Agent } from '@deepseek-ai/dsh-agent'`: 那个包会把
 * `Context.sessions` 增补成 Host 侧的 `SessionStore`, 而本插件的 client 半部
 * (以及 client bundle 的类型) 依赖 `dsh-api-session-controller/client` 对同一个
 * 键的 `ISessions` 增补, 两者在同一个 tsconfig 里会互相覆盖. 这里只声明真正用到的
 * 四个成员, 保持 Host 侧对 client 侧类型图的隔离.
 */
interface ReleaseAgent {
  /** 该 Agent 当前是否在跑一个回合. */
  readonly status: 'idle' | 'running'
  /** Agent 自有的待办队列. */
  readonly inbox: {
    /** 还在等自己那一回合的消息. */
    readonly nextTurn: readonly { readonly id: unknown }[]
    /** 取出一条待办消息. */
    remove(messageId: never): boolean
  }
  /** 把一条消息当作普通消息重新送出, 并唤醒空闲的 driver. */
  followup(message: never): void
}

/** Host 侧 Agent 注册表里本模块用到的那一点. */
interface ReleaseAgentRegistry {
  get(sessionId: SessionId): ReleaseAgent | undefined
}

/** Host 侧 web server 里本模块用到的那一点. */
interface ReleaseWebServer {
  register(route: {
    kind: 'exact' | 'prefix'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
}

/** 按服务名读一个 Host 服务; 缺失时返回 undefined 而不是抛. */
function hostService<T>(ctx: Context, name: string): T | undefined {
  return (ctx as unknown as { get(service: string): unknown }).get(name) as T | undefined
}

/** 请求体上限: 请求里只有两个 id, 给足余量即可. */
const MAX_BODY_BYTES = 8 * 1024

/** 会话 id 白名单 (与 dsh 侧同一条规则). */
const SESSION_ID_RE = /^[A-Za-z0-9_-]{1,128}$/u

/** 消息 id 白名单: dsh 的身份是 UUID 形状, 这里只做长度与字符集兜底. */
const ITEM_ID_RE = /^[A-Za-z0-9._:-]{1,256}$/u

/** dsh 的 connection 服务里本插件用到的那一点. */
interface ConnectionGuard {
  requestRejection(request: { readonly headers: IncomingMessage['headers'] }): 401 | 403 | undefined
}

/** 发一个 JSON 响应. */
function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const data = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(data),
  })
  res.end(data)
}

/** 读一个有界 JSON 对象请求体. */
async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk as Buffer)
    total += buffer.length
    if (total > MAX_BODY_BYTES) throw new Error('请求体过大')
    chunks.push(buffer)
  }
  if (chunks.length === 0) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch {
    throw new Error('请求体不是合法 JSON')
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('请求体必须是 JSON 对象')
  }
  return parsed as Record<string, unknown>
}

/** 从请求体取一个符合白名单的字符串字段. */
function requiredId(body: Record<string, unknown>, field: string, pattern: RegExp): string {
  const value = body[field]
  if (typeof value !== 'string' || !pattern.test(value)) throw new Error(`${field} 不合法`)
  return value
}

/**
 * 把一条停住的排队消息当作普通消息重新送出.
 *
 * 顺序: 先从 Inbox 取出 (这一步会记一条 `outcome: 'canceled'` 的 splice, 因为
 * 这条待办确实被撤下了), 再经 `followup` 重新入队并唤醒 driver. 之所以不直接
 * `steer`: 空闲时没有可插话的回合, 而 `followup` 才是 "普通发送" 的同一条路,
 * 消息按 FIFO 排在 next-turn 末尾, 由 driver 从队首开始跑.
 * @param agent - 目标会话的活着的 Agent.
 * @param itemId - 队列项身份 (Inbox occurrence identity).
 * @returns 处理结果: sent 已改发, converged 无需处理 (已被领走或在运行中).
 */
export function releaseQueuedMessage(agent: ReleaseAgent, itemId: string): 'sent' | 'converged' {
  const message = agent.inbox.nextTurn.find(candidate => String(candidate.id) === itemId)
  if (message === undefined) return 'converged'
  // 运行中的回合有自己的插话通道 (dsh 内置的 steer), 这里不抢: 把正在跑的
  // steer 降级成排队追加会改变它的语义, 所以交给内置逻辑.
  if (agent.status === 'running') return 'converged'
  agent.inbox.remove(message.id as never)
  agent.followup(message as never)
  return 'sent'
}

/**
 * 注册队列改发接口.
 *
 * `webServer` 来自插件的必需 inject, 可直接取用; `connection` 是可选的:
 * headless 组合里没有它, 这时返回 503 而不是把整个插件拖成必需依赖.
 * @param ctx - host cordis context.
 */
export function registerReleaseApi(ctx: Context): void {
  const webServer = hostService<ReleaseWebServer>(ctx, 'webServer')
  if (webServer === undefined) {
    ctx.logger.warn('dsh-cmd-send: webServer 服务不可用, 队列改发接口未注册')
    return
  }
  webServer.register({
    kind: 'prefix',
    path: RELEASE_API_PREFIX,
    handler: async (req: IncomingMessage, res: ServerResponse) => {
      const connection = hostService<ConnectionGuard>(ctx, 'connection')
      if (connection === undefined) {
        sendJson(res, 503, { ok: false, error: 'dsh 的 connection 服务不可用, 无法校验请求来源' })
        return
      }
      const rejection = connection.requestRejection(req)
      if (rejection !== undefined) {
        sendJson(res, rejection, {
          ok: false,
          error: rejection === 401 ? '请求未通过 dsh 认证' : '请求未通过 Host/Origin 校验',
        })
        return
      }
      const url = new URL(req.url ?? '/', 'http://localhost')
      if (req.method !== 'POST' || url.pathname !== `${RELEASE_API_PREFIX}/release`) {
        sendJson(res, 404, { ok: false, error: '没有这个接口' })
        return
      }
      try {
        const body = await readJsonBody(req)
        const rawSessionId = requiredId(body, 'sessionId', SESSION_ID_RE)
        const itemId = requiredId(body, 'itemId', ITEM_ID_RE)
        const agents = hostService<ReleaseAgentRegistry>(ctx, 'agents')
        const agent = agents?.get(rawSessionId as SessionId)
        if (agent === undefined) {
          sendJson(res, 404, { ok: false, error: '这个会话没有活着的 agent' })
          return
        }
        const outcome = releaseQueuedMessage(agent, itemId)
        if (outcome === 'sent') {
          ctx.logger.info(`dsh-cmd-send: 已把排队消息 ${itemId} 作为普通消息重新送出 (会话 ${rawSessionId})`)
        }
        sendJson(res, 200, { ok: true })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        ctx.logger.warn(`dsh-cmd-send: 队列改发请求被拒绝: ${message}`)
        sendJson(res, 400, { ok: false, error: message })
      }
    },
  })
}
