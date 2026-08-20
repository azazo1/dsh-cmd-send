import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import { type CmdSendSettings } from '../shared.ts';
/** 设置行完整 props: locale 座 + 注入的设置 scope. */
export type SendModeRowProps = PropsLocale<'dsh-cmd-send'> & {
    scope: SettingsScope<CmdSendSettings>;
};
/**
 * 渲染发送快捷键选择行.
 * @param props - slot props (locale 座 + 设置 scope).
 */
export declare function SendModeRow({ scope, t }: SendModeRowProps): import("react").JSX.Element;
