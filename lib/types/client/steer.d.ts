/**
 * 插话 (steer) 手势的提交适配: 插件只声明 "这一次提交要 steer", 真正干活的是
 * dsh 内置 composer 的提交机 (SessionInput.submit).
 *
 * 交棒而不是自己组 prompt 的原因: 草稿文本, 图片/文件附件的序列化, `/` 命令
 * 裁决, 提交回声, 以及失败后的草稿与附件恢复都在内置提交机里; 自己组纯文本
 * prompt 会绕过附件 (带图时只能降级成排队) 和失败恢复.
 */
import type { ISessions, SessionSnapshot } from '@deepseek-ai/dsh-api-session-controller/client';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
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
