/**
 * dsh-cmd-send 配置卡片的暂存表单.
 *
 * 表单是 profile 条目 volatile Config 的投影: 草稿只留在卡片页, 保存才写回 profile 的 patch 层.
 */
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import {
  SettingsFormModel, settingsTextField,
  type SettingsFieldState, type SettingsFormActions, type SettingsFormScope, type SettingsFormShell,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { SEND_MODE_FIELD, type CmdSendSettings } from '../shared.ts'

/** 卡片读到的状态. */
export interface CmdSendCardState extends SettingsFormShell {
  /** 发送模式字段. */
  sendMode: SettingsFieldState
}

/** 卡片注册时注入给组件的面. */
export interface CmdSendCardFace extends SettingsFormActions {
  hooks: {
    /** 组件通过它读快照 (useCmdSendCard). */
    cmdSendCard: SnapshotStore<CmdSendCardState>
  }
}

/** 把本插件条目的配置表单桥接成配置卡片的暂存表单. */
export class CmdSendSettingsForm {
  private readonly form: SettingsFormModel<CmdSendSettings>
  private readonly store: SnapshotStore<CmdSendCardState>

  /**
   * @param scope - 本插件 profile 条目的共享配置表单 (ctx.configForms.get).
   */
  constructor(scope: SettingsFormScope<CmdSendSettings>) {
    this.form = new SettingsFormModel(scope, [settingsTextField(SEND_MODE_FIELD)])
    this.store = this.form.bind(() => ({
      ...this.form.shell(),
      sendMode: this.form.field(SEND_MODE_FIELD),
    }))
  }

  /**
   * 构造 slot 注册要注入的面.
   * @returns 快照 hook 与表单动作.
   */
  inject(): CmdSendCardFace {
    return { hooks: { cmdSendCard: this.store }, ...this.form.actions() }
  }

  /** 释放对配置表单的订阅. */
  dispose(): void {
    this.form.dispose()
  }
}
