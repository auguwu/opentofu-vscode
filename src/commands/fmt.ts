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

import { useActiveTextEditor, useCommand } from 'reactive-vscode';
import { commands } from '../generated-meta';
import { noop } from '@noelware/utils';
import Context from '../context';

export default () =>
    useCommand(commands.fmt, async () => {
        const editor = useActiveTextEditor();
        if (editor.value === undefined) return;

        return Context.getInstance().getFormatter().fmt(editor.value.document).then(noop);
    });
