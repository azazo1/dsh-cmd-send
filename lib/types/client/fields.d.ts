/** 一个可选项. */
export interface ChoiceOption<Value extends string> {
    /** 选中时写入配置的值. */
    value: Value;
    /** 已本地化的选项文案. */
    label: string;
}
/** 选择字段行的 props. */
export interface ChoiceFieldProps<Value extends string> {
    /** 标签与控件的关联 id. */
    id: string;
    /** 已本地化的字段标签. */
    label: string;
    /** 字段说明. */
    hint: string;
    /** 当前草稿值. */
    value: Value;
    /** 可选项, 按显示顺序. */
    options: readonly ChoiceOption<Value>[];
    /** 保存后该字段是否留下 user 层条目. */
    overridden: boolean;
    /** 覆盖标记的文案. */
    overriddenLabel: string;
    /** 重置控件的文案. */
    resetLabel: string;
    /** 只读或保存中时锁定控件. */
    disabled: boolean;
    /** 选中某个值. */
    onSelect: (next: Value) => void;
    /** 暂存清空该字段, 保存后回落到组合层. */
    onReset: () => void;
}
/**
 * 渲染一行选择字段.
 * @param props - 字段文案, 当前值, 可选项与动作.
 * @returns 该字段行.
 */
export declare function ChoiceField<Value extends string>(props: ChoiceFieldProps<Value>): import("react").JSX.Element;
