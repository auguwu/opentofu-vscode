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

import { spawn } from 'node:child_process';
import Context from './context';

import {
    type DocumentFormattingEditProvider,
    type CancellationToken,
    type FormattingOptions,
    type TextDocument,
    TextEdit,
    Range,
    Position
} from 'vscode';

export default class implements DocumentFormattingEditProvider {
    fmt(document: TextDocument, additional: string[] = [], token?: CancellationToken): Promise<string> {
        const tofu = Context.getInstance().getTofuBinary()!;
        const args = [
            'fmt',

            // if we use `-list` (default), then it'll only print the
            // filename and not the contents to update
            '-list=false',

            ...additional,
            document.fileName
        ];

        return new Promise((resolve, reject) => {
            const process = spawn(tofu, args);

            // If we receive a cancellation request, then kill the process.
            token?.onCancellationRequested(() => {
                if (!process.killed) process.kill();
            });

            process.stdout.setEncoding('utf8');
            const stdout = [] as any[];

            process.stdout.on('data', (data) => stdout.push(data));
            process.on('error', (error) => reject(error));
            process.on('close', (exitCode) => {
                if (exitCode !== 0) return reject(new Error(`failed to run "${tofu} ${args.join(' ')}"`));

                resolve(stdout[0]);
            });
        });
    }

    provideDocumentFormattingEdits(document: TextDocument, _: FormattingOptions, token: CancellationToken) {
        return this.fmt(document, ['-write=false'], token).then((stdout) => [
            new TextEdit(new Range(new Position(0, 0), document.lineAt(document.lineCount - 1).range.end), stdout)
        ]);
    }
}
