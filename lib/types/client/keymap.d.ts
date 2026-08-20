/** 键盘决策纯函数: 根据按键与输入状态决定动作, 与 DOM 解耦以便单元测试. */
/** 输入机的当前阶段 (对齐 dsh InputState.phase). */
export type InputPhase = 'plain' | 'adjudicating' | 'claimed' | 'submitting';
/** 浏览器 KeyboardEvent 的最小视图 (测试可用普通对象模拟). */
export interface KeyEventLike {
    key: string;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    isComposing: boolean;
    keyCode: number;
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
}
/**
 * 决定 composer textarea 上的一次 Enter 按键应如何处理.
 * 仅在 cmd-enter 模式下拦截; 其他情况一律放行内置逻辑.
 */
export declare function decideKey(event: KeyEventLike, input: DecideInput): KeyDecision;
