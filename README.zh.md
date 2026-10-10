# dsh-cmd-send

让 DeepSeek Harness Web 界面支持 Cmd+Enter 发送消息: Enter 只换行,
Cmd+Enter 排队发送, Shift+Cmd+Enter 插话发送. Windows/Linux 也可用
Alt+Enter / Alt+Shift+Enter.
需要 dsh `>=0.2.0-rc.1 <0.3.0`.

## 键位

在侧边栏的 **插件** 页里打开 `dsh-cmd-send` 卡片, 把 **发送快捷键** 切到
**Cmd+Enter 发送** 后:

| 按键 | 空闲时 | 忙碌时 |
| --- | --- | --- |
| Enter | 换行 | 换行 |
| Cmd/Ctrl+Enter | 发送 | 插入排队 (草稿为空时插话全部排队) |
| Shift+Cmd/Ctrl+Enter | 发送 | 插话发送 (steer); 草稿为空时插话队首那条排队消息 |
| Alt+Enter (Windows/Linux) | 发送 | 插入排队 (草稿为空时插话全部排队) |
| Alt+Shift+Enter (Windows/Linux) | 发送 | 插话发送 (steer); 草稿为空时插话队首那条排队消息 |
| Shift+Enter | 换行 | 换行 |

- 忙碌指智能体正在运行; 排队消息会在当前回合结束后按 FIFO 依次执行.
- 插话 (steer) 会打断当前回合, 立即处理你的消息, 图片与文件附件与排队发送
  一样随消息一起送达.
- 草稿为空时 Shift+Cmd/Ctrl+Enter 是 "只把队首那条排队消息插话进去": 等价于
  点队列条上那一行的插话按钮, 只动一条, 其余排队消息保持原位 (还没送达 Host 的
  本地回声行没有插话按钮, 也不会被这个手势选中). 空闲或队列为空时这个手势交还
  内置逻辑 (什么也不做); 草稿为空且不带 Shift 的 Cmd/Ctrl+Enter 仍是 dsh 内置
  的 "插话全部排队消息".
- 中断之后, 队列条上每一行的发送按钮仍然可用: 点它会把那条排队消息当作**普通
  消息**重新发出去 (不是插话), 由智能体自己从队首依次跑. 原生在空闲时会把这三个
  按钮变灰, 于是点完 "中断" 后队列就困住了; 本插件把这一行重新点亮, 并让这次点击
  走 Host 侧的同源接口, 用 `agent.followup()` 送达 -- 与普通发送是同一条通道.
  还没送达 Host 的本地回声行没有身份, 不会点亮; 会话正在运行时按钮保持原生行为
  (真插话).
- `/` 命令补全与 `@` 引用补全照常可用: 候选菜单高亮着某一行时, 不带修饰的  Enter 是选中候选而不是换行. Cmd/Ctrl+Enter 始终是发送手势并绕过菜单, 因此
  以 `/` 开头的草稿总有出路: 直接把技能名打全 (`/skill-name`) 再按
  Cmd/Ctrl+Enter 就发出去了 (技能由 Host 侧识别, 不必先按菜单选中).
  命令进入参数输入 (如 `/plan ` 之后) 时 Enter 同样换行, 参数可以写多行.
- 智能体用 `ask_user_question` 提问时, 卡片里的回答框跟随同一份设置: 裸 Enter
  换行, Cmd/Ctrl+Enter 继续或提交答案. 回答框没有插话通道, 所以
  Shift+Cmd/Ctrl+Enter 也退回继续/提交, Shift+Enter 仍是换行. Windows/Linux
  的 Alt+Enter / Alt+Shift+Enter 同样继续或提交. 卡片上的选项按钮不受影响,
  Enter 依旧是按钮自身的激活手势 (选中该项, 所有问题都答完时直接提交).
- 中文输入法组合输入不受影响, 确认候选词的 Enter 不会误发送.
- dsh 另外有内置的 **繁忙时 Enter 键行为**. 本插件切到 Cmd+Enter 模式后会接管
  普通 Enter, 因此该内置项只在本插件保持 **Enter 发送** 时生效.

默认保持 dsh 内置键位 (Enter 发送), 切换开关即可无感启用/停用.

## 安装

Web 端装进 `web` profile:

```shell
dsh plugin --profile web add azazo1/dsh-cmd-send
dsh plugin --profile web add azazo1/dsh-cmd-send#v0.1.3
```

装完重启 `dsh web`, 浏览器里刷新一次页面. 主机插件挂载在 `dsh-cmd-send`;
客户端 bundle 由 `/plugins/dsh-cmd-send/client.js` 提供.

桌面端装进 `desktop` profile. 它由 Electron 应用独占管理, `dsh plugin` 会拒绝
`--profile desktop`, 所以要用应用内的插件管理器: 在插件页的安装入口填上面命令里
对应的包名或本地目录. 装上后重启应用, 窗口刷新一次.

引擎版本线要求 `@deepseek-ai/dsh-*` 不低于 `0.2.0-rc.1`, 且仍在 `0.2.x` 上
(peerDependencies 与 devDependencies 都写作 `>=0.2.0-rc.1 <0.3.0`). 更早的引擎线
装不上这个版本.

web 与 desktop 两个 profile 跑的是同一套 Web 应用, 桌面端只是多起一个 Host 子进程
并给 `<html>` 打上平台标记, 所以同一份包在两边通用, 不需要分别构建.

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
  agent 会话) 时生效, 其余情况退回普通提交. 草稿为空时的 Shift+Cmd/Ctrl+Enter
  另走队列通道: 取 `InputState.queue` 最上面那条, 经
  `conversation.updateQueue(id, { kind: 'steer' })` 插话进当前回合, 等价于队列
  条上那一行的插话按钮; 空闲, 队列为空, 会话不支持插话或交棒失败时这次按键
  落空, 不做任何提交. 未开启时完全放行内置逻辑. 普通 Enter 会被改写成
  Shift+Enter, 由 Lexical 插入换行; 改写之前先看同一个
  composer 卡片 (`[data-composer-card]` 内带 `aria-activedescendant` 的
  `[data-trigger-menu]` 列表) 是否高亮着候选, 是则把这次裸 Enter 交还内置的
  菜单仲裁; Cmd/Ctrl+Enter 从不交还, 一律发送.
- 队列条那三个按钮由 Host 侧的 `POST /dsh-cmd-send/api/release` 支撑: 客户端
  只解除按钮的禁用态, 点击后把 `{ sessionId, itemId }` 交给 Host, Host 从
  `agent.inbox.nextTurn` 里取出该条, 先 `remove` 再 `followup`, 因此它按普通
  消息重新排队并唤醒空闲的 driver, 而不是插话. 消息 id 按队列位置取: 原生列表
  就是按 `InputState.queue` 的顺序渲染 `<li>`, 回声行排在真正的排队行之后,
  因此非回声行的第 n 行对应 `queue[n]`; 状态里没有对应项就放弃这一行, 不发
  猜测的消息. 会话正在运行时按钮保持原生行为. 接口走同源 HTTP 并复用
  `connection.requestRejection` 的鉴权 (同时挡住 DNS rebinding 与跨站请求).
  这一项不依赖发送快捷键模式, 两种模式下都生效.
- ask 提问卡片接管 composer 座位时, 主 composer 只是被隐藏而仍挂载, 卡片里的
  回答框是普通 textarea 而不是 Lexical composer, 因此控制器额外识别卡片根节点
  (`[data-question-key]`) 内的 textarea: 裸 Enter 伪装成 Shift+Enter 交给浏览器
  原生换行, Cmd/Ctrl+Enter 抹掉 Shift 后放行给卡片自带的处理器, 由它推进到下一
  题或提交答案. 卡片上的选项按钮与计划评审面板只放行原生按键.
- 发送偏好存在 profile 条目 `dsh-cmd-send` 的 volatile Config 里, 由插件页卡片
  (`plugins.bundle.config`) 编辑, 保存才写回 profile 的 patch 层.
