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

import { executeCommand, Ref, ref, useOutputChannel, watch, type WatchOptions } from 'reactive-vscode';
import { type Disposable, workspace, OutputChannel, window, DocumentSelector } from 'vscode';
import SemanticTokensFeature from './features/semanticTokens';
import { sync as which } from 'which';
import { isAbsolute } from 'node:path';
import { settings } from './settings';
import { Socket } from 'node:net';
import Context from './context';

import {
    CloseAction,
    ErrorAction,
    ErrorHandler,
    InitializeError,
    LanguageClient,
    ResponseError,
    RevealOutputChannelOn,
    ServerOptions,
    State
} from 'vscode-languageclient/node';
import TerraformVersion from './features/terraformVersion';

export enum Status {
    Unknown,
    Starting,
    Healthy,
    Stopped
}

const FAILED_TO_START =
    'Failed to start `opentofu-ls`. Check your configuration settings and reload the window' as const;

const MAX_CRASHES = 3 as const;

const initError = ref<InitializeError | null>(null);
const crashCount = ref(0);
const state = ref<State | null>(null);

export default class LanguageServer implements Disposable {
    private readonly _outputChannel: OutputChannel = useOutputChannel('OpenTofu | Language Server');
    private readonly _status: Ref<Status> = ref(Status.Unknown);
    private _client: LanguageClient | undefined;

    private static readonly DOCUMENT_SELECTOR: DocumentSelector = [
        { scheme: 'file', language: 'opentofu' },
        { scheme: 'file', language: 'opentofu-vars' }
    ];

    getOutputChannel() {
        return this._outputChannel;
    }

    getClient() {
        return this._client;
    }

    setStatus(status: Status) {
        this._status.value = status;
    }

    async setup(ctx: Context) {
        const tofu = ctx.getTofuBinary();
        const ls = this.getLspBinaryPath();

        if (ls === null) {
            return;
        }

        const serveArgs = ['serve'];

        if (settings.lsp.experimentals.requestConcurrency !== null) {
            serveArgs.push('-req-concurrency', settings.lsp.experimentals.requestConcurrency.toString());
        }

        if (settings.lsp.experimentals.logFile !== null) {
            serveArgs.push('-log-file', settings.lsp.experimentals.logFile);
        }

        if (settings.lsp.args.length) {
            serveArgs.push(...settings.lsp.args);
        }

        ctx.outputChannel.appendLine(`$ ${ls} ${serveArgs.join(' ')}`);

        const tcpPort = settings.lsp.tcp.port;
        let serverOptions: ServerOptions = null!;

        if (tcpPort !== null) {
            const hasPathInWorkspace = workspace.getConfiguration('opentofu.lsp').inspect('path');
            if (
                hasPathInWorkspace !== undefined &&
                (hasPathInWorkspace.globalValue ||
                    hasPathInWorkspace.workspaceValue ||
                    hasPathInWorkspace.workspaceFolderValue)
            ) {
                window.showWarningMessage(
                    `Cannot use \`opentofu.lsp.tcp.port\` when either the workspace, workspace folder, or global values are defined. Ignoring \`path\` anyway.`
                );
            }

            serveArgs.push('-port', tcpPort.toString());

            serverOptions = async () => {
                const socket = new Socket();
                socket.connect({ port: tcpPort, host: 'localhost' });

                return { reader: socket, writer: socket };
            };
        } else {
            serverOptions = {
                command: ls,
                args: serveArgs
            };
        }

        this._client = new LanguageClient('OpenTofu - Language Server', serverOptions, {
            initializationFailedHandler: this._initializationFailedHandler,
            progressOnInitialization: true,
            revealOutputChannelOn: RevealOutputChannelOn.Never,
            initializationOptions: this.getInitializationOptions(tofu!),
            // @ts-ignore ur dum
            documentSelector: LanguageServer.DOCUMENT_SELECTOR,
            outputChannel: this._outputChannel,
            errorHandler: this._handleError(),
            synchronize: {
                fileEvents: [
                    workspace.createFileSystemWatcher('**/*.tf'),
                    workspace.createFileSystemWatcher('**/*.tfvars'),
                    workspace.createFileSystemWatcher('**/*.tfdeploy.hcl')
                ]
            }
        });

        this._client.registerProposedFeatures();
        this._client.registerFeatures([new SemanticTokensFeature(ctx), new TerraformVersion(ctx)]);
        this._client.onDidChangeState((event) => {
            const ctx = Context.getInstance();
            ctx.outputChannel.appendLine(
                `lsp client: changed state => ${State[event.oldState]} -> ${State[event.newState]}`
            );

            const oldState = state.value;
            state.value = event.newState;
            if (oldState !== state.value) {
                // eslint-disable-next-line ts/dot-notation
                ctx['_updateStatusBar'](event.newState);
            }
        });

        return this._client.start();
    }

    private getInitializationOptions(tofu: string) {
        return {
            ignoreSingleFileWarning: settings.ignoreSingleFileWarning,
            indexing: settings.indexing,
            experimentalFeatures: settings.experimentals,
            validation: {
                enableEnhancedValidation: settings.validation.enhanced
            },
            opentofu: {
                path: tofu
            }
        };
    }

    private _initializationFailedHandler(error: ResponseError<InitializeError> | Error | any) {
        initError.value = error;

        this._outputChannel.appendLine(FAILED_TO_START);
        window
            .showErrorMessage(
                FAILED_TO_START,
                { detail: '', modal: false },
                { title: 'Open Logs' },
                { title: 'Open Settings' }
            )
            .then(async (choice) => {
                switch (choice?.title) {
                    case 'Open Logs':
                        this._outputChannel.show();
                        break;

                    case 'Open Settings':
                        await executeCommand('workbrench.action.openSettings', '@ext:auguwu.opentofu-vscode');
                        break;

                    default:
                        break;
                }
            });

        return false;
    }

    private _handleError() {
        const onError: ErrorHandler['error'] = (error, message, count) => {
            this._outputChannel.appendLine(
                `received error from LSP (count=${count ?? 0} error=${error.message} jsonrpc=${message?.jsonrpc || '(unknown)'})`
            );

            return {
                message: `error from LSP: ${error.message} (count=${count ?? 0} message=${JSON.stringify(message || '{}')})`,
                action: ErrorAction.Shutdown
            };
        };

        const onClosed: ErrorHandler['closed'] = () => {
            const ctx = Context.getInstance();

            if (initError.value !== null) {
                ctx.outputChannel.appendLine('init error already handled');
                return { message: '', action: CloseAction.DoNotRestart };
            }

            crashCount.value++;
            if (crashCount.value <= MAX_CRASHES) {
                return { message: '', action: CloseAction.Restart };
            }

            this._outputChannel.appendLine(
                'Failed to start `opentofu-ls`. Check your configuration settings and reload the window'
            );

            return {
                message: 'Failed to start `opentofu-ls`. Check your configuration settings and reload the window',
                action: CloseAction.DoNotRestart
            };
        };

        return { error: onError, closed: onClosed };
    }

    getState() {
        return state.value;
    }

    getLspBinaryPath() {
        let binPath = settings.lsp.binary;
        if (!isAbsolute(binPath) && !binPath.startsWith('./')) {
            const ctx = Context.getInstance();
            ctx.outputChannel.appendLine('Finding `opentofu-ls` on system...');

            const path = which('opentofu-ls', { nothrow: true });
            if (path === null) {
                ctx.outputChannel.appendLine('`opentofu-ls` is not found on system');

                window.showErrorMessage('`opentofu-ls` is not installed on system.');
                return null;
            }

            return path;
        } else {
            return settings.binary;
        }
    }

    /** Returns the status of this LSP. */
    getStatus() {
        return this._status.value;
    }

    dispose() {
        if (this._client !== undefined) this._client.dispose();
        this._outputChannel.dispose();
    }
}
