/*
 * 🐻‍❄️🫖 opentofu-vscode: Visual Studio Code extension for OpenTofu
 * Copyright (C) 2025 Noel Towa <cutie@floofy.dev>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { useDisposable, useOutputChannel, useStatusBarItem } from 'reactive-vscode';
import LanguageServer, { Status } from './lsp';
import { sync as which } from 'which';
import { isAbsolute } from 'node:path';
import { execSync } from 'node:child_process';
import { settings } from './settings';

import {
    type ExtensionContext,
    type OutputChannel,
    type StatusBarItem,
    type Disposable,
    window,
    StatusBarAlignment,
    ThemeColor,
    workspace,
    MarkdownString
} from 'vscode';
import { State } from 'vscode-languageclient';

/**
 * A instance of the OpenTofu VSCode extension running.
 */
export default class Context implements Disposable {
    private static INSTANCE: Context = null!;

    private readonly _extensionContext: ExtensionContext;

    private _tofuBinary: string = null!;
    private _statusBar: StatusBarItem | undefined;
    private _lsp: LanguageServer | undefined;

    readonly outputChannel: OutputChannel;

    constructor(ext: ExtensionContext) {
        useDisposable(this);

        this.outputChannel = useOutputChannel('OpenTofu');
        this._extensionContext = ext;

        if (Context.INSTANCE === null) {
            Context.INSTANCE = this;
        }
    }

    /** Returns the current context's instance. */
    static getInstance() {
        return Context.INSTANCE;
    }

    /** Returns a handle of a {@link ExtensionContext `ExtensionContext`}. */
    getExtensionContext() {
        return this._extensionContext;
    }

    getLanguageServer() {
        return this._lsp;
    }

    getTofuBinary() {
        if (this._tofuBinary !== null) return this._tofuBinary;

        let binPath = settings.binary;
        if (!isAbsolute(binPath) && !binPath.startsWith('./')) {
            const ctx = Context.getInstance();
            ctx.outputChannel.appendLine('Finding `tofu` on system...');

            const path = which('tofu', { nothrow: true });
            if (path === null) {
                ctx.outputChannel.appendLine('`tofu` is not found on system');

                window.showErrorMessage('`tofu` is not installed on system.');
                return null;
            }

            return (this._tofuBinary = path);
        } else {
            return (this._tofuBinary = settings.binary);
        }
    }

    /** Sets up the context. */
    async setup() {
        const tofu = this.getTofuBinary();
        if (tofu === null) {
            window.showWarningMessage('`tofu` is not installed on system, extension will not run');
            return;
        }

        if (settings.statusBar) {
            this._updateStatusBar(null);
            this._extensionContext.subscriptions.push(
                workspace.onDidChangeConfiguration((event) => {
                    if (event.affectsConfiguration('opentofu.statusBar')) {
                        const value = workspace.getConfiguration('opentofu').get<boolean>('statusBar', true);
                        if (!value) {
                            this._statusBar?.hide();
                            this._statusBar?.dispose();
                        } else {
                            this._updateStatusBar(this._lsp?.getState() || null);
                        }
                    }
                })
            );
        }

        if (settings.lsp.enable) {
            this._lsp = new LanguageServer();
            await this._lsp.setup(this);
        }

        for (const command of [await import('./commands/openServerLogs').then((m) => m.default)]) {
            command();
        }
    }

    dispose() {
        // Don't dispose an already non-existent context.
        if (Context.INSTANCE === null) return;

        for (const disposable of [
            Context.INSTANCE.outputChannel,
            Context.INSTANCE._statusBar,
            Context.INSTANCE._lsp
        ] as Disposable[]) {
            disposable !== undefined && disposable.dispose();
        }

        Context.INSTANCE = null!;
    }

    _updateStatusBar(state: State | null) {
        if (this._statusBar === undefined) {
            this._statusBar = useStatusBarItem({
                alignment: StatusBarAlignment.Left,
                command: 'opentofu.openServerLogs',
                name: '$(debug-hint) OpenTofu',
                text: 'OpenTofu'
            });
        }

        if (state === null) return;

        let icon = '';
        switch (state) {
            case State.Starting:
                icon = '$(sync~spin) ';
                break;

            case State.Stopped:
                icon = '$(warning) ';
                this._statusBar.color = new ThemeColor('statusBarItem.warningForeground');
                this._statusBar.backgroundColor = new ThemeColor('statusBarItem.warningBackground');

                break;

            case State.Running:
                icon = '$(debug-breakpoint-log) ';
                break;
        }

        const { terraform_version, platform } = getTofuVersion(this.getTofuBinary()!);
        this._statusBar.tooltip = new MarkdownString(
            `OpenTofu v${terraform_version} [${platform}]\n\n---\n${icon}**LSP Status**: ${State[state]}`,
            true
        );

        this._statusBar.show();
    }
}

const getTofuVersion = (tofu: string) => {
    let cached: Record<string, unknown> = null!;

    return (() => {
        if (cached === null) {
            const data = execSync(`${tofu} --version --json`).toString('utf-8');
            return (cached = JSON.parse(data));
        }

        return cached;
    })();
};
