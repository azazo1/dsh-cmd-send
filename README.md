# dsh-cmd-send

Send messages with Cmd+Enter in the DeepSeek Harness web GUI: Enter inserts a
newline, Cmd+Enter queues, Shift+Cmd+Enter steers.

Requires dsh `>=0.1.5-rc.1`.

## Keymap

Switch **Send shortcut** to **Cmd+Enter to send** in Settings -> General:

| Key | Idle | Busy |
| --- | --- | --- |
| Enter | newline | newline |
| Cmd/Ctrl+Enter | send | queue |
| Shift+Cmd/Ctrl+Enter | send | steer |
| Shift+Enter | newline | newline |

- Busy means the agent is running; queued messages execute in FIFO order after
  the current turn finishes.
- Steer interrupts the running turn and handles your message immediately.
- IME composition is untouched: the Enter that confirms a candidate never
  sends.
- dsh also has a built-in **Enter behavior while busy** row. This plugin's
  Cmd+Enter mode takes over plain Enter, so that built-in row only applies
  when this plugin stays on **Enter to send**.

The default keeps the built-in keymap (Enter to send); flip the setting to
enable the new one.

## Install

Add the plugin to your web profile:

```shell
dsh plugin --profile web add azazo1/dsh-cmd-send
dsh plugin --profile web add azazo1/dsh-cmd-send#v0.1.3
```

Restart the web server and refresh the page. The host plugin mounts under
`dsh-cmd-send`; the client bundle is served at
`/plugins/dsh-cmd-send/client.js`.

## Uninstall

```shell
dsh plugin --profile web remove dsh-cmd-send
```

## How it works

- The client mounts an invisible keyboard controller on
  `conversation.input.dock` that intercepts Enter on the Lexical composer
  (`[data-composer-input]`) in the document capture phase, then acts through
  `inputActions.submit()` (queue) and the session's public
  `prompt(..., 'steer')` (steer). Disabled, it passes every key through to the
  built-in logic. Plain Enter is rewritten as Shift+Enter so Lexical inserts a
  line break.
- The send preference persists through the host `settings` service
  (`dsh-cmd-send.sendMode`); the row registers on `settings.general.item`.
