# dsh-cmd-send

让 DeepSeek Harness Web 界面支持 Cmd+Enter 发送消息: Enter 只换行,
Cmd+Enter 排队发送, Shift+Cmd+Enter 插话发送.

需要 dsh `>=0.1.5-rc.1`.

## 键位

在侧边栏的 **插件** 页里打开 `dsh-cmd-send` 卡片, 把 **发送快捷键** 切到
**Cmd+Enter 发送** 后:

| 按键 | 空闲时 | 忙碌时 |
| --- | --- | --- |
| Enter | 换行 | 换行 |
| Cmd/Ctrl+Enter | 发送 | 插入排队 |
| Shift+Cmd/Ctrl+Enter | 发送 | 插话发送 (steer) |
| Shift+Enter | 换行 | 换行 |

- 忙碌指智能体正在运行; 排队消息会在当前回合结束后按 FIFO 依次执行.
- 插话 (steer) 会打断当前回合, 立即处理你的消息, 图片与文件附件与排队发送
  一样随消息一起送达.
- `/` 命令补全与 `@` 引用补全照常可用: 候选菜单高亮着某一行时, 不带修饰的
  Enter 是选中候选而不是换行. Cmd/Ctrl+Enter 始终是发送手势并绕过菜单, 因此
  以 `/` 开头的草稿总有出路: 直接把技能名打全 (`/skill-name`) 再按
  Cmd/Ctrl+Enter 就发出去了 (技能由 Host 侧识别, 不必先按菜单选中).
- 智能体用 `ask_user_question` 提问时, 卡片里的回答框跟随同一份设置: 裸 Enter
  换行, Cmd/Ctrl+Enter 继续或提交答案. 回答框没有插话通道, 所以
  Shift+Cmd/Ctrl+Enter 也退回继续/提交, Shift+Enter 仍是换行. 卡片上的选项
  按钮不受影响, Enter 依旧是按钮自身的激活手势 (选中该项, 所有问题都答完时
  直接提交).
- 中文输入法组合输入不受影响, 确认候选词的 Enter 不会误发送.
- dsh 另外有内置的 **繁忙时 Enter 键行为**. 本插件切到 Cmd+Enter 模式后会接管
  普通 Enter, 因此该内置项只在本插件保持 **Enter 发送** 时生效.

默认保持 dsh 内置键位 (Enter 发送), 切换开关即可无感启用/停用.

## 安装

把插件加入 web profile:

```shell
dsh plugin --profile web add azazo1/dsh-cmd-send
dsh plugin --profile web add azazo1/dsh-cmd-send#v0.1.3
```

重启 web 服务器后刷新页面. 主机插件挂载在 `dsh-cmd-send`; 客户端 bundle 由
`/plugins/dsh-cmd-send/client.js` 提供.

## 卸载

```shell
dsh plugin --profile web remove dsh-cmd-send
```

## 实现说明

- 客户端在 `conversation.input.dock` 挂载隐身键盘控制器, 于 document 捕获
  阶段拦截 Lexical composer (`[data-composer-input]`) 的 Enter. 排队提交走
  `inputActions.submit()`; 插话手势则把 composer 交棒给内置提交机
  (`SessionInput.submit('steer')`, 经 `sessions.scope(id)` 取到会话作用域),
  草稿提交, 附件序列化, `/` 命令裁决与失败恢复都由它负责, 因此带附件的插话
  与排队发送走同一条通道. 插话只在智能体忙碌且会话通道支持 (可续聊的子
  agent 会话) 时生效, 其余情况退回普通提交. 未开启时完全放行内置逻辑.
  普通 Enter 会被改写成 Shift+Enter, 由 Lexical 插入换行; 改写之前先看同一个
  composer 卡片 (`[data-composer-card]` 内带 `aria-activedescendant` 的
  `[data-trigger-menu]` 列表) 是否高亮着候选, 是则把这次裸 Enter 交还内置的
  菜单仲裁; Cmd/Ctrl+Enter 从不交还, 一律发送.
- ask 提问卡片接管 composer 座位时, 主 composer 只是被隐藏而仍挂载, 卡片里的
  回答框是普通 textarea 而不是 Lexical composer, 因此控制器额外识别卡片根节点
  (`[data-question-key]`) 内的 textarea: 裸 Enter 伪装成 Shift+Enter 交给浏览器
  原生换行, Cmd/Ctrl+Enter 抹掉 Shift 后放行给卡片自带的处理器, 由它推进到下一
  题或提交答案. 卡片上的选项按钮与计划评审面板只放行原生按键.
- 发送偏好存在 profile 条目 `dsh-cmd-send` 的 volatile Config 里, 由插件页卡片
  (`plugins.bundle.config`) 编辑, 保存才写回 profile 的 patch 层.
