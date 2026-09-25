# dsh-cmd-send

Send messages with Cmd+Enter in the DeepSeek Harness web GUI: Enter inserts a
newline, Cmd+Enter queues, Shift+Cmd+Enter steers.

Requires dsh `>=0.1.7-rc.2`.

## Keymap

Switch **Send shortcut** to **Cmd+Enter to send** on the `dsh-cmd-send` card of
the sidebar's **Plugins** page:

| Key | Idle | Busy |
| --- | --- | --- |
| Enter | newline | newline |
| Cmd/Ctrl+Enter | send | queue |
| Shift+Cmd/Ctrl+Enter | send | steer |
| Shift+Enter | newline | newline |

- Busy means the agent is running; queued messages execute in FIFO order after
  the current turn finishes.
- Steer interrupts the running turn and handles your message immediately, and it
  carries image/file attachments exactly like a queued send does.
- The `/` command and `@` reference completions keep working: while the
  candidate menu shows a highlighted row, Enter picks that candidate instead of
  breaking the line. Cmd/Ctrl+Enter stays the send gesture and bypasses the
  menu, so a draft that starts with `/` can always be sent as typed (typing a
  full `/skill-name` and pressing Cmd/Ctrl+Enter sends it right away).
- When the agent asks with `ask_user_question`, the answer field in that card
  follows the same setting: plain Enter breaks the line, Cmd/Ctrl+Enter moves on
  or submits the answer. The answer field has no steer channel, so
  Shift+Cmd/Ctrl+Enter falls back to the same continue/submit gesture, while
  Shift+Enter still breaks the line. The option buttons in the card are
  untouched: Enter stays their own activation gesture (pick the option, and
  submit once every question is answered).
- IME composition is untouched: the Enter that confirms a candidate never
  sends.
- dsh also has a built-in **Enter behavior while busy** row. This plugin's
  Cmd+Enter mode takes over plain Enter, so that built-in row only applies
  when this plugin stays on **Enter to send**.

The default keeps the built-in keymap (Enter to send); flip the setting to
enable the new one.

## Install

On the Web side, install into the `web` profile:

```shell
dsh plugin --profile web add azazo1/dsh-cmd-send
dsh plugin --profile web add azazo1/dsh-cmd-send#v0.1.3
```

Restart `dsh web` afterwards and refresh the page once. The host plugin mounts
under `dsh-cmd-send`; the client bundle is served at
`/plugins/dsh-cmd-send/client.js`.

The desktop app installs into the `desktop` profile, which it owns exclusively:
`dsh plugin` refuses `--profile desktop`, so use the in-app plugin manager and
put the package name from the command above (or a local directory) into its
install field. Restart the app afterwards and refresh the window once.

The engine line requires `@deepseek-ai/dsh-*` at `0.1.7-rc.2` or newer while
staying on `0.1.x` (both `peerDependencies` and `devDependencies` use
`>=0.1.7-rc.2 <0.2.0`). Earlier engine lines cannot install this version.

The `web` and `desktop` profiles run the same Web app; the desktop build only
adds a Host child process and a platform marker on `<html>`, so the same package
works on both sides and needs no separate build.

## Uninstall

```shell
dsh plugin --profile web remove dsh-cmd-send
```

## How it works

- The client mounts an invisible keyboard controller on
  `conversation.input.dock` that intercepts Enter on the Lexical composer
  (`[data-composer-input]`) in the document capture phase. Queue submits go
  through `inputActions.submit()`; the steer gesture hands the composer over to
  the built-in submit machine (`SessionInput.submit('steer')`, reached via
  `sessions.scope(id)`), which owns draft commit, attachment serialization,
  command adjudication, and failure recovery. Steer only applies while the agent
  is busy and the transport supports it (a continuable subagent session),
  otherwise the gesture falls back to a normal submit. Disabled, the controller
  passes every key through to the built-in logic. Plain Enter is rewritten as
  Shift+Enter so Lexical inserts a line break; before rewriting, the controller
  checks the candidate menu of the same composer card (`[data-composer-card]`
  holding a `[data-trigger-menu]` listbox with `aria-activedescendant`) and
  passes the bare Enter back to the built-in menu arbitration whenever a
  candidate is highlighted. Cmd/Ctrl+Enter is never passed back: it always
  sends.
- An `ask_user_question` card takes over the composer seat while the main
  composer stays mounted but hidden, and the card's answer field is a plain
  textarea rather than the Lexical composer. The controller therefore also
  recognizes the textarea inside the card root (`[data-question-key]`): plain
  Enter is rewritten as Shift+Enter so the browser inserts the line break
  natively, and Cmd/Ctrl+Enter is passed through with Shift cleared, handing the
  gesture to the card's own handler that advances or submits the answer. The
  card's option buttons and the plan review panel keep their native keys.
- The send preference lives in the volatile Config of the `dsh-cmd-send` profile
  entry, edited by the plugin page card (`plugins.bundle.config`), and is only
  written back to the profile's patch layer on save.
