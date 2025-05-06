### 🐻‍❄️🫖 [OpenTofu]: Visual Studio Code | Extension

#### _Visual Studio Code extension for [OpenTofu]_

This project aims to be a successor towards [`gamunu/vscode-opentofu`], the extension that I've been using but it came that it hasn't been maintained and is a fork of [`hashicorp/vscode-terraform`]. This is a whole different project with different views that I hope you can understand. :)

The one thing you might notice is no webviews. That wasn't in my list of plans for this extension, this extension was made to have a MVP of the OpenTofu Language Server and have formatting capabilities, that's pretty much it.

## Commands

<!-- commands -->

| Command                          | Title                             |
| -------------------------------- | --------------------------------- |
| `opentofu.openServerLogs`        | OpenTofu: Open Server Logs        |
| `opentofu.apply`                 | OpenTofu: tofu apply              |
| `opentofu.init`                  | OpenTofu: tofu init               |
| `opentofu.plan`                  | OpenTofu: tofu plan               |
| `opentofu.validate`              | OpenTofu: Validate                |
| `opentofu.enableLanguageServer`  | OpenTofu: Enable Language Server  |
| `opentofu.disableLanguageServer` | OpenTofu: Disable Language Server |
| `opentofu.fmt`                   | OpenTofu: Format                  |

<!-- commands -->

## Configuration

<!-- configs -->

| Key                                             | Description                                                                                                    | Type      | Default         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------- | --------------- |
| `opentofu.statusBar`                            | Shows a status bar on the left-hand side, similar to `rust-analyzer`.                                          | `boolean` | `true`          |
| `opentofu.binary`                               | Location to the `tofu` binary                                                                                  | `string`  | `"tofu"`        |
| `opentofu.ignoreSingleFileWarning`              | If a warning is emitted by the LSP if there is ever a single file.                                             | `boolean` | `true`          |
| `opentofu.validation.enhanced`                  | Provides enhanced validation                                                                                   | `boolean` | `false`         |
| `opentofu.indexing.ignoreDirectoryNames`        | A list of directory names that the LSP should ignore when indexing                                             | `array`   | `[]`            |
| `opentofu.indexing.ignorePaths`                 | A list of paths that the LSP should ignore when indexing                                                       | `array`   | `[]`            |
| `opentofu.experimentals.validateOnSave`         | **EXPERIMENTAL**: Runs the `validate` subcommand on the file that was saved                                    | `boolean` | `false`         |
| `opentofu.experimentals.prefillRequiredFields`  | Allows the LSP to pre-fill all required fields.                                                                | `boolean` | `false`         |
| `opentofu.lsp.enable`                           | Enables the use of OpenTofu's experimental LSP support                                                         | `boolean` | `true`          |
| `opentofu.lsp.binary`                           | Binary location to the LSP. Defaults to `opentofu-ls` on the system.                                           | `string`  | `"opentofu-ls"` |
| `opentofu.lsp.args`                             | Arguments to passthrough the LSP server (it'll be after `opentofu-ls serve`)                                   | `array`   | `[]`            |
| `opentofu.lsp.tcp.port`                         | TCP port that the LSP will run in, this will use TCP mode.                                                     | `number`  | `null`          |
| `opentofu.lsp.experimentals.requestConcurrency` | Number of RPC requests to process concurrently, using a lower number of 2 is not recommended.                  | `number`  | `null`          |
| `opentofu.lsp.experimentals.logFile`            | Path to a file to log into support for variables (e.g. timestamp, pid, ppid) via Go templating (`{{varName}}`) | `string`  | `null`          |

<!-- configs -->

## License

> [!IMPORTANT]
> This repository borrows code from [`hashicorp/vscode-terraform`]. It'll be stated at the top of the file if the code in any file is heavily modified & borrowed from HashiCorp.

**auguwu/opentofu-vscode** is released under the **GNU General Public License v3** (unless stated otherwise) with love and care by [Noel Towa](https://floofy.dev)! 🐻‍❄️♥️

[`hashicorp/vscode-terraform`]: https://github.com/hashicorp/vscode-terraform
[`gamunu/vscode-opentofu`]: https://github.com/gamunu/vscode-opentofu
[OpenTofu]: https://opentofu.org
