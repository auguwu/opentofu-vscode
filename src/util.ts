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

import {
    ExecuteCommandParams,
    ExecuteCommandRequest,
    InitializeResult,
    LanguageClient
} from 'vscode-languageclient/node';

export async function clientSupportsCommand(command: string, init?: InitializeResult) {
    if (init === undefined) return false;

    return init.capabilities.executeCommandProvider?.commands.includes(command) ?? false;
}

export async function executeLSWorkspaceCommand<T>(
    command: string,
    module: string,
    client: LanguageClient
): Promise<T> {
    if (!clientSupportsCommand(command, client.initializeResult)) {
        throw new Error(`Command [${command}] is not supported by \`opentofu-ls\``);
    }

    return client.sendRequest<ExecuteCommandParams, T, void>(ExecuteCommandRequest.type, {
        command,
        arguments: [`uri=${module}`]
    });
}
