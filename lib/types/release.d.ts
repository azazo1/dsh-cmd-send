import type { Context } from '@deepseek-ai/cordis';
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
    readonly status: 'idle' | 'running';
    /** Agent 自有的待办队列. */
    readonly inbox: {
        /** 还在等自己那一回合的消息. */
        readonly nextTurn: readonly {
            readonly id: unknown;
        }[];
        /** 取出一条待办消息. */
        remove(messageId: never): boolean;
    };
    /** 把一条消息当作普通消息重新送出, 并唤醒空闲的 driver. */
    followup(message: never): void;
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
export declare function releaseQueuedMessage(agent: ReleaseAgent, itemId: string): 'sent' | 'converged';
/**
 * 注册队列改发接口.
 *
 * `webServer` 来自插件的必需 inject, 可直接取用; `connection` 是可选的:
 * headless 组合里没有它, 这时返回 503 而不是把整个插件拖成必需依赖.
 * @param ctx - host cordis context.
 */
export declare function registerReleaseApi(ctx: Context): void;
export {};
