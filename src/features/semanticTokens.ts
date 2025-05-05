// modified but mostly borrowed by `hashicorp/terraform-ls`:
// https://github.com/hashicorp/vscode-terraform/blob/87ceb0ac381fb3ee9417682e3ff0954115351553/src/features/semanticTokens.ts

import {
    BaseLanguageClient,
    ClientCapabilities,
    DocumentSelector,
    FeatureState,
    ServerCapabilities,
    StaticFeature
} from 'vscode-languageclient';
import Context from '../context';

export default class implements StaticFeature {
    private readonly _languageClient: BaseLanguageClient;
    private readonly _packageJSON: Record<string, unknown>;

    constructor(context: Context) {
        this._packageJSON = context.getExtensionContext().extension.packageJSON;
        this._languageClient = context.getLanguageServer()!.getClient()!;
    }

    clear() {
        /* empty for a reason */
    }

    getState(): FeatureState {
        return { kind: 'static' };
    }

    initialize(_: ServerCapabilities, __: DocumentSelector | undefined) {
        return;
    }

    fillClientCapabilities(capabilities: ClientCapabilities) {
        if (!capabilities.textDocument || !capabilities.textDocument.semanticTokens) return;

        const contributes: { semanticTokenModifiers: any[]; semanticTokenTypes: any[] } = (this._packageJSON
            .contributes as any)!;

        const types = capabilities.textDocument.semanticTokens.tokenTypes.concat(
            contributes.semanticTokenTypes.map((i: { id: string }) => i.id)
        );

        const modifiers = capabilities.textDocument.semanticTokens.tokenModifiers.concat(
            contributes.semanticTokenModifiers.map((i: { id: string }) => i.id)
        );

        capabilities.textDocument.semanticTokens = {
            ...(capabilities.textDocument.semanticTokens || {}),

            tokenTypes: types,
            tokenModifiers: modifiers
        };
    }
}
