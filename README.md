# dsh-cmd-send

Send messages with Cmd+Enter in the DeepSeek Harness web GUI: Enter inserts a
newline, Cmd+Enter queues, Shift+Cmd+Enter steers.

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
- Steer interrupts the running turn and handles your message immediately, the
  same operation as the built-in Cmd/Ctrl+Enter.
- IME composition is untouched: the Enter that confirms a candidate never
  sends.

The default keeps the built-in keymap (Enter to send); flip the setting to
enable the new one.

## Install

Add the plugin to your web profile:

```sh
dsh plugin --profile web add <this-repo tarball-or-local-path>
```

Restart the web server and refresh the page. The host plugin mounts under
`dsh-cmd-send`; the client bundle is served at
`/plugins/dsh-cmd-send/client.js`.

## Uninstall

```sh
dsh plugin --profile web remove dsh-cmd-send
```

## How it works

- The client mounts an invisible keyboard controller on
  `conversation.input.dock` that intercepts Enter on the composer textarea in
  the document capture phase, then acts through `inputActions.submit()`
  (queue) and the session's public `prompt(..., 'steer')` (steer). Disabled, it
  passes every key through to the built-in logic.
- The send preference persists through the host `settings` service
  (`dsh-cmd-send.sendMode`); the row registers on `settings.general.item`.
