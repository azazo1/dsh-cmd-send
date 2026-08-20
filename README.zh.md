# dsh-cmd-send

让 DeepSeek Harness Web 界面支持 Cmd+Enter 发送消息: Enter 只换行,
Cmd+Enter 排队发送, Shift+Cmd+Enter 插话发送.

## 键位

在 设置 -> 常规 -> 发送快捷键 中切换到 **Cmd+Enter 发送** 后:

| 按键 | 空闲时 | 忙碌时 |
| --- | --- | --- |
| Enter | 换行 | 换行 |
| Cmd/Ctrl+Enter | 发送 | 插入排队 |
| Shift+Cmd/Ctrl+Enter | 发送 | 插话发送 (steer) |
| Shift+Enter | 换行 | 换行 |

- 忙碌指智能体正在运行; 排队消息会在当前回合结束后按 FIFO 依次执行.
- 插话 (steer) 会打断当前回合, 立即处理你的消息, 与 dsh 内置的
  Cmd/Ctrl+Enter 插话一致.
- 中文输入法组合输入不受影响, 确认候选词的 Enter 不会误发送.

默认保持 dsh 内置键位 (Enter 发送), 切换开关即可无感启用/停用.

## 安装

把插件加入 web profile:

```sh
dsh plugin --profile web add <本仓库 tarball 或本地路径>
```

重启 web 服务器后刷新页面. 主机插件挂载在 `dsh-cmd-send`; 客户端 bundle 由
`/plugins/dsh-cmd-send/client.js` 提供.

## 卸载

```sh
dsh plugin --profile web remove dsh-cmd-send
```

## 实现说明

- 客户端在 `conversation.input.dock` 挂载隐身键盘控制器, 于 document 捕获
  阶段拦截 composer textarea 的 Enter, 通过 `inputActions.submit()` (排队发送)
  与会话公开的 `prompt(..., 'steer')` (插话发送) 执行动作; 未开启时完全放行
  内置逻辑.
- 发送偏好经 Host `settings` 服务持久化 (`dsh-cmd-send.sendMode`), 设置行注册
  于 `settings.general.item`.
