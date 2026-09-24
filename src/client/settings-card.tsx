/**
 * 插件页里 dsh-cmd-send 卡片的配置页.
 *
 * 页面只在 Host 真的组合了本条目的期间注册 (configForms.whileServed).
 */
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import { SettingsForm } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { SEND_MODE_FIELD, type SendMode } from '../shared.ts'
import { ChoiceField } from './fields.tsx'
import { formLabels } from './locales.ts'
import type { CmdSendCardFace } from './settings-form.ts'

/** 组件拿到的 props. */
export type CmdSendSettingsCardProps =
  PropsRuntime<'plugins.bundle.config'>
  & PropsLocale<'dsh-cmd-send'>
  & InjectFace<CmdSendCardFace>

/**
 * 渲染卡片的一行简介或配置表单, 由插件页的 view 决定.
 * @param props - 页面要的视图, 字典, 表单快照与动作.
 * @returns 简介文本或配置表单.
 */
export function CmdSendSettingsCard(props: CmdSendSettingsCardProps) {
  const { t } = props
  const state = props.useCmdSendCard(snapshot => snapshot)
  if (props.view === 'summary') return t('description')

  const mode: SendMode = state.sendMode.text === 'cmd-enter' ? 'cmd-enter' : 'enter'

  return (
    <SettingsForm labels={formLabels(t)} state={state} onSave={props.save} onDiscard={props.discard}>
      <ChoiceField
        id="plugin-config-cmd-send-mode"
        label={t('sendMode')}
        hint={t('sendModeHint')}
        value={mode}
        options={[
          { value: 'enter', label: t('enter') },
          { value: 'cmd-enter', label: t('cmdEnter') },
        ]}
        overridden={state.sendMode.overridden}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        disabled={!state.writable}
        onSelect={(next) => { props.edit(SEND_MODE_FIELD, next) }}
        onReset={() => { props.resetField(SEND_MODE_FIELD) }}
      />
    </SettingsForm>
  )
}
