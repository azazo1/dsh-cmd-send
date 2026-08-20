import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ISessions, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import { type CmdSendSettings } from '../shared.ts';
/** 控制器完整 props: dock slot 的运行时 props + sessions 服务 + 设置 scope. */
export type KeymapControllerProps = PropsRuntime<'conversation.input.dock'> & {
    /** sessions 服务, 用于解析目标会话的 ISession (steer 发送). */
    sessions: ISessions;
    /** dsh-cmd-send 设置 scope (发送模式读取). */
    scope: SettingsScope<CmdSendSettings>;
};
/**
 * 渲染隐身控制器: 挂载全局 keydown 捕获监听, 返回 null.
 * 所有状态经 ref 传递, 监听器只挂载一次, 无需随渲染重建.
 */
export declare function KeymapController({ useSession, useInput, inputActions, sessionId, sessions, scope }: KeymapControllerProps): null;
