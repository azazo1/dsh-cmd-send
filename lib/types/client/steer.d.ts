/**
 * 插话 (steer) 手势的提交适配: 插件只声明 "这一次提交要 steer", 真正干活的是
 * dsh 内置 composer 的提交机 (SessionInput.submit).
 *
 * 交棒而不是自己组 prompt 的原因: 草稿文本, 图片/文件附件的序列化, `/` 命令
 * 裁决, 提交回声, 以及失败后的草稿与附件恢复都在内置提交机里; 自己组纯文本
 * prompt 会绕过附件 (带图时只能降级成排队) 和失败恢复.
 *
 * 队列消息的插话走另一条路 (updateQueue): 那条消息早已由 Host 收下并排在
 * Inbox 里, 没有草稿可提交, 只是把队首那一条提前拉进当前回合.
 */
import type { ISessions, SessionSnapshot } from '@deepseek-ai/dsh-api-session-controller/client';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
import type { InputState } from '@deepseek-ai/dsh-client-ui-conversation/client';
/** 一次插话提交所需的运行时依赖. */
export interface SteerSubmitDeps {
    /** sessions 服务, 用于由会话 id 解析会话作用域 ctx. */
    sessions: ISessions;
    /** 目标会话 id. */
    sessionId: SessionId;
}
/**
 * 会话的传输通道是否支持插话: 主会话总是支持, 子 agent 会话要求可续聊.
 * 判据与 dsh 内置提交策略 (resolveSubmitMode 的 steeringAvailable) 保持一致,
 * 否则在不支持插话的会话上按 Shift+Cmd+Enter 只会换来一条失败提示.
 * @param subagent - 会话快照里的子 agent 地址 (主会话为 null).
 * @returns 是否可以把这次提交标记为 steer.
 */
export declare function steeringAvailable(subagent: SessionSnapshot['subagent']): boolean;
/**
 * 让内置提交机以 steer 模式提交当前 composer 草稿 (含附件与命令裁决).
 * @param deps - sessions 服务与目标会话 id.
 * @returns 是否成功交棒; false 表示调用方应退回普通提交 (queue).
 */
export declare function submitSteer({ sessions, sessionId }: SteerSubmitDeps): boolean;
/** 一次队列消息插话所需的运行时依赖. */
export interface QueueSteerDeps extends SteerSubmitDeps {
    /** 要插话的那条排队消息 (取队列最上面的一条). */
    itemId: InputState['queue'][number]['id'];
    /** 失败提示文案, 由内置提交机的 composer 通知出口展示. */
    failure: string;
}
/**
 * 在目标会话的 composer 上挂一条通知.
 *
 * 通知出口 (`SessionInput.notify`) 只挂在会话作用域的 facade 上, slot 组件拿到的
 * `inputActions` 里没有它, 因此这里按会话 id 解析一次作用域.
 * @param deps - sessions 服务与目标会话 id.
 * @param text - 通知正文.
 * @returns 是否成功挂上.
 */
export declare function notifySession({ sessions, sessionId }: SteerSubmitDeps, text: string): boolean;
/**
 * 把队列最上面那条排队消息插话进当前回合 (等价于点队列条上那一行的插话按钮).
 *
 * 与 submitSteer 的分工: 草稿插话提交的是 composer 里的内容, 这里提交的是
 * Host 早已收下, 正排在 Inbox 里的消息, 因此走 updateQueue 的 steer 动作.
 * 结果异步返回, 因此本函数只回答 "有没有交棒成功"; 收敛与失败提示按内置
 * 队列插话的同一套策略处理 (不可插话 / 消息已被领走时静默, 其余报一条提示).
 * @param deps - sessions 服务, 目标会话 id, 队列项 id 与失败文案.
 * @returns 是否成功交棒; false 表示调用方应放弃这次按键.
 */
export declare function submitQueueItem({ sessions, sessionId, itemId, failure }: QueueSteerDeps): boolean;
