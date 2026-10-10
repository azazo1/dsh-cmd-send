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
import type { SessionId } from '@deepseek-ai/dsh-session/types';
/** 挂载队列条增强所需的上下文. */
export interface ReleaseContext {
    /** 当前会话 id. */
    sessionId: SessionId;
    /** 会话是否正在运行; 运行中原样放行, 由内置逻辑处理这次点击. */
    isRunning: () => boolean;
    /**
     * 按队列位置取排队消息 id.
     * @param index - 该会话 `InputState.queue` 里的下标.
     * @returns 消息 id; 越界 (DOM 比状态新) 时为 undefined.
     */
    itemIdAt: (index: number) => string | undefined;
    /** 失败提示出口. */
    notify: (text: string) => void;
}
/** 一条行是不是本地回声行 (没有 Inbox 身份). */
export declare function isEchoRow(row: Element): boolean;
/**
 * 点亮一行里的插话按钮, 并接管它的点击.
 *
 * 按钮保持原生外观, 只解除禁用; 捕获阶段的监听器先于 React 挂在根容器上的委托监听器,
 * 因此这次点击不会走到原生那条注定失败的插话路径.
 * @param row - 一条排队行.
 * @param index - 该行在真正的排队消息里的下标.
 * @param context - 当前会话与提示出口.
 */
export declare function armRow(row: Element, index: number, context: ReleaseContext): void;
/**
 * 扫描全部队列条, 点亮其中的排队行.
 * @param context - 当前会话与提示出口.
 */
export declare function sweepQueueDocks(context: ReleaseContext): void;
/**
 * 挂载队列条增强.
 * @param context - 当前会话, 运行状态读取, 消息 id 解析与失败提示出口.
 * @returns 卸载函数.
 */
export declare function installQueueRelease(context: ReleaseContext): () => void;
