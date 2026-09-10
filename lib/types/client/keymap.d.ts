/** 键盘决策纯函数: 根据按键与输入状态决定动作, 与 DOM 解耦以便单元测试. */
import type { InputState } from '@deepseek-ai/dsh-client-ui-conversation/client';
/** 输入机的当前阶段 (对齐 dsh InputState.phase). */
export type InputPhase = InputState['phase'];
/** composer 内容视图: 判断是否"有东西可发"所需的最小字段. */
export type ComposerContentView = Pick<InputState, 'draft' | 'attachmentIds'>;
/** composer 是否有可发送内容: 正文非空白或存在草稿附件. */
export declare function hasContent(input: ComposerContentView): boolean;
/** 浏览器 KeyboardEvent 的最小视图 (测试可用普通对象模拟). */
export interface KeyEventLike {
    key: string;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    isComposing: boolean;
    keyCode: number;
    /** 长按产生的重复 Enter; Cmd/Ctrl+Enter 重复时放行内置忽略逻辑. */
    repeat: boolean;
}
/** 决策结果. */
export type KeyDecision = {
    kind: 'pass';
} | {
    kind: 'newline';
} | {
    kind: 'send';
} | {
    kind: 'steer';
};
/** 决策所需的输入状态. */
export interface DecideInput {
    mode: 'enter' | 'cmd-enter';
    phase: InputPhase;
    /** composer 是否已有可发送内容; 空草稿的 Cmd/Ctrl+Enter 交还内置逻辑. */
    content: boolean;
}
/**
 * 决定 composer 上的一次 Enter 按键应如何处理.
 * 仅在 cmd-enter 模式下拦截; 其他情况一律放行内置逻辑.
 */
export declare function decideKey(event: KeyEventLike, input: DecideInput): KeyDecision;
