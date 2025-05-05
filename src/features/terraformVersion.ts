// modified but mostly borrowed by `hashicorp/terraform-ls`:
// https://github.com/hashicorp/vscode-terraform/blob/87ceb0ac381fb3ee9417682e3ff0954115351553/src/features/terraformVersion.ts

import type { ClientCapabilities, FeatureState, ServerCapabilities, StaticFeature } from 'vscode-languageclient';
import { executeLSWorkspaceCommand } from '../util';
import LanguageServer, { Status } from '../lsp';
import { useActiveTextEditor } from 'reactive-vscode';
import type { Disposable } from 'vscode';
import { dirname } from 'node:path';
import Context from '../context';

export default class TerraformVersion implements StaticFeature {
    private static readonly COMMAND = 'client.refreshTerraformVersion' as const;

    private readonly _lsp: LanguageServer;
    private _disposables: Disposable[] = [];

    constructor(context: Context) {
        this._lsp = context.getLanguageServer()!;
    }

    clear() {
        return;
    }

    getState(): FeatureState {
        return { kind: 'static' };
    }

    fillClientCapabilities(capabilities: ClientCapabilities) {
        capabilities.experimental = capabilities.experimental || {};
        capabilities.experimental.refreshTerraformVersionCommandId = TerraformVersion.COMMAND;
    }

    initialize(capabilities: ServerCapabilities) {
        const client = this._lsp.getClient()!;

        if (!capabilities.experimental?.refreshTerraformVersion) {
            client.outputChannel.appendLine(`LSP doesn't support command: ${TerraformVersion.COMMAND}`);
            return;
        }

        const handler = client.onRequest(TerraformVersion.COMMAND, async () => {
            const editor = useActiveTextEditor();
            if (editor.value === undefined) return;

            const dir = dirname(editor.value.document.uri.toString());

            try {
                await executeLSWorkspaceCommand('opentofu-ls.module.terraform', dir, client);
            } catch (ex) {
                let message = '???';
                if (ex instanceof Error) {
                    message = ex.message;
                } else if (typeof ex === 'string') {
                    message = ex;
                }

                this._lsp.getOutputChannel().appendLine(message);
            }

            this._lsp.setStatus(Status.Healthy);
        });

        this._disposables.push(handler);
    }

    dispose() {
        for (const disposable of this._disposables) {
            disposable.dispose();
        }
    }
}
