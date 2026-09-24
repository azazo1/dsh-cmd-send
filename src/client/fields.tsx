/**
 * 配置卡片里的选择字段行: 官方 SettingsForm 内的一行 (标签, 覆盖标记, 重置, 下拉选择, 说明).
 *
 * 官方字段控件只覆盖文本与数字, 所以这里用官方 Menu 拼一个选择器,
 * 排版沿用官方 fields.module.css 的尺寸与间距.
 */
import { useState } from 'react'
import { IconChevronDownOutlineMedium, Menu, Tag } from '@deepseek-ai/dsh-client-ui-primitives'

/** 一个可选项. */
export interface ChoiceOption<Value extends string> {
  /** 选中时写入配置的值. */
  value: Value
  /** 已本地化的选项文案. */
  label: string
}

/** 选择字段行的 props. */
export interface ChoiceFieldProps<Value extends string> {
  /** 标签与控件的关联 id. */
  id: string
  /** 已本地化的字段标签. */
  label: string
  /** 字段说明. */
  hint: string
  /** 当前草稿值. */
  value: Value
  /** 可选项, 按显示顺序. */
  options: readonly ChoiceOption<Value>[]
  /** 保存后该字段是否留下 user 层条目. */
  overridden: boolean
  /** 覆盖标记的文案. */
  overriddenLabel: string
  /** 重置控件的文案. */
  resetLabel: string
  /** 只读或保存中时锁定控件. */
  disabled: boolean
  /** 选中某个值. */
  onSelect: (next: Value) => void
  /** 暂存清空该字段, 保存后回落到组合层. */
  onReset: () => void
}

/**
 * 渲染一行选择字段.
 * @param props - 字段文案, 当前值, 可选项与动作.
 * @returns 该字段行.
 */
export function ChoiceField<Value extends string>(props: ChoiceFieldProps<Value>) {
  const [open, setOpen] = useState(false)
  const selected = props.options.find(option => option.value === props.value)
  return (
    <div className="dsh-cmd-send-field">
      <div className="dsh-cmd-send-head">
        <span className="dsh-cmd-send-label" id={`${props.id}-label`}>{props.label}</span>
        {props.overridden
          ? (
            <span className="dsh-cmd-send-badges">
              <Tag tone="neutral">{props.overriddenLabel}</Tag>
              <button
                type="button"
                className="dsh-cmd-send-reset"
                disabled={props.disabled}
                onClick={props.onReset}
              >
                {props.resetLabel}
              </button>
            </span>
          )
          : null}
      </div>
      <Menu
        open={open}
        onClose={() => { setOpen(false) }}
        items={props.options.map(option => ({ id: option.value, label: option.label }))}
        selectedId={props.value}
        portal
        anchor={(
          <button
            type="button"
            className="dsh-cmd-send-selector"
            aria-labelledby={`${props.id}-label`}
            aria-haspopup="menu"
            aria-expanded={open}
            disabled={props.disabled}
            onClick={() => { setOpen(current => !current) }}
          >
            {selected?.label ?? ''}
            <IconChevronDownOutlineMedium className="dsh-cmd-send-chevron" />
          </button>
        )}
        onSelect={(id) => {
          setOpen(false)
          const next = props.options.find(option => option.value === id)
          if (next !== undefined && next.value !== props.value) props.onSelect(next.value)
        }}
      />
      <p className="dsh-cmd-send-hint">{props.hint}</p>
    </div>
  )
}
