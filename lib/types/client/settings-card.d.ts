import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { CmdSendCardFace } from './settings-form.ts';
/** 组件拿到的 props. */
export type CmdSendSettingsCardProps = PropsRuntime<'plugins.bundle.config'> & PropsLocale<'dsh-cmd-send'> & InjectFace<CmdSendCardFace>;
/**
 * 渲染卡片的一行简介或配置表单, 由插件页的 view 决定.
 * @param props - 页面要的视图, 字典, 表单快照与动作.
 * @returns 简介文本或配置表单.
 */
export declare function CmdSendSettingsCard(props: CmdSendSettingsCardProps): string | import("react").JSX.Element;
