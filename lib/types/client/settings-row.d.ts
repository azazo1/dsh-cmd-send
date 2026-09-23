import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ConfigForm as SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client';
import { type CmdSendSettings } from '../shared.ts';
/** 设置行完整 props: locale 座 + 注入的设置 scope. */
export type SendModeRowProps = PropsRuntime<'settings.general.item'> & PropsLocale<'dsh-cmd-send'> & {
    scope: SettingsScope<CmdSendSettings>;
};
/**
 * 渲染发送快捷键选择行.
 * @param props - slot props (locale 座 + 设置 scope).
 */
export declare function SendModeRow({ scope, t }: SendModeRowProps): import("react").JSX.Element;
