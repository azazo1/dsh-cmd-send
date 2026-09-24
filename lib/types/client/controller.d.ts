import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client';
import type { ConfigForm as SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client';
import { type CmdSendSettings } from '../shared.ts';
/** 控制器完整 props: dock slot 的运行时 props + sessions 服务 + 设置 scope. */
export type KeymapControllerProps = PropsRuntime<'conversation.input.dock'> & {
    /** sessions 服务, 用于由会话 id 解析会话作用域 (steer 提交). */
    sessions: ISessions;
    /** dsh-cmd-send 设置 scope (发送模式读取). */
    scope: SettingsScope<CmdSendSettings>;
};
/**
 * composer 输入面: Lexical 把根节点标成 data-composer-input.
 * 按键 target 可能是根节点内部的 chip / 文本包装元素.
 */
export declare function isComposerInput(target: EventTarget | null): boolean;
/**
 * 判断这次按键所在的 composer 是否正显示带高亮的候选菜单 (/, @ 补全).
 * 菜单渲染在 composer 卡片内部, 因此以卡片为查找范围, 避免同一页面里
 * 其他 composer (子 agent 会话等) 的菜单干扰本会话的键位判断.
 */
export declare function hasHighlightedCandidate(target: EventTarget | null): boolean;
/**
 * 改写这次按键的 shiftKey 视图, 让下游处理器 (Lexical 的 KEY_ENTER_COMMAND,
 * React 的 onKeyDown) 看到期望的修饰键状态. 事件对象本身不可变, 因此用
 * getter 覆盖属性; 覆盖失败时返回 false, 由调用方决定退路.
 * @param event - 正在派发的键盘事件.
 * @param shiftKey - 想让下游看到的 shiftKey.
 * @returns 是否成功改写.
 */
export declare function rewriteShiftKey(event: KeyboardEvent, shiftKey: boolean): boolean;
/**
 * 渲染隐身控制器: 挂载全局 keydown 捕获监听, 返回 null.
 * 所有状态经 ref 传递, 监听器只挂载一次, 无需随渲染重建.
 */
export declare function KeymapController({ useSession, useInput, inputActions, sessionId, sessions, scope }: KeymapControllerProps): null;
