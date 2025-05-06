// modified but mostly borrowed by `hashicorp/terraform-ls`:
// https://github.com/hashicorp/vscode-terraform/blob/87ceb0ac381fb3ee9417682e3ff0954115351553/src/api/terraform/terraform.ts

import { ConfigurationTarget, Uri, window, workspace } from 'vscode';
import { ref, useActiveTextEditor } from 'reactive-vscode';
import { dirname } from 'node:path';
import Context from './context';

import {
    type ExecuteCommandParams,
    ExecuteCommandRequest,
    type InitializeResult,
    type LanguageClient
} from 'vscode-languageclient/node';

export interface ModuleCaller {
    uri: string;
}

export interface ModuleCallersResponse {
    v: number;
    callers: ModuleCaller[];
}

export interface ModuleCall {
    name: string;
    source_addr: string;
    version?: string;
    source_type?: string;
    docs_link?: string;
    dependent_modules: ModuleCall[];
}

export interface ModuleCallsResponse {
    v: number;
    module_calls: ModuleCall[];
}

export function getScope(section: string, setting: string) {
    const inspected = workspace.getConfiguration(section).inspect(setting);
    if (inspected === undefined) {
        return ConfigurationTarget.Global;
    }

    if (inspected.globalValue) return ConfigurationTarget.Global;
    else if (inspected.workspaceFolderValue) return ConfigurationTarget.WorkspaceFolder;
    else if (inspected.workspaceValue) return ConfigurationTarget.Workspace;
    else return ConfigurationTarget.Global;
}

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

export async function moduleCallers(moduleUri: string) {
    const client = Context.getInstance().getLanguageServer()!.getClient()!;
    return executeLSWorkspaceCommand<ModuleCallersResponse>('opentofu-ls.module.callers', moduleUri, client);
}

export async function command(command: string, useShell = false) {
    const ctx = Context.getInstance();
    const lsp = ctx.getLanguageServer();
    if (lsp === undefined) return;

    const client = lsp.getClient()!;
    const textEditor = useActiveTextEditor();
    if (textEditor.value === undefined) {
        window.showErrorMessage(`Open a OpenTofu module file and run this again: \`tofu ${command}\``);
        return;
    }

    const uri = textEditor.value.document.uri;
    const response = await moduleCallers(uri.toString());

    async function getSelectedModule(moduleUri: Uri, callers: ModuleCaller[]) {
        if (callers.length > 1) {
            const result = await window.showQuickPick(
                callers.map((m) => m.uri),
                { canPickMany: false, title: 'Choose which workspace to initialize with `tofu init`' }
            );

            if (result === undefined) {
                return undefined;
            }

            return result;
        } else if (callers.length === 1) {
            return callers[0].uri;
        } else {
            return moduleUri.toString();
        }
    }

    const selectedModule = await getSelectedModule(textEditor.value.document.uri, response.callers);
    if (useShell && selectedModule !== undefined) {
        const name = `OpenTofu [${selectedModule}]`;
        const input = await window.showInputBox({
            value: `tofu ${command}`,
            prompt: `Run in ${selectedModule}?`
        });

        if (input === undefined) {
            return;
        }

        const terminal = ref(window.terminals.find((t) => t.name === name));
        if (terminal.value === undefined) {
            terminal.value = window.createTerminal({ name, cwd: dirname(uri.fsPath) });
        }

        terminal.value.sendText(input);
        terminal.value.show();

        return;
    }

    if (selectedModule === undefined) return;
    return executeLSWorkspaceCommand(`opentofu-ls.terraform.${command}`, selectedModule, client);
}
