#!/usr/bin/env -S node --experimental-strip-types

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

import { context } from 'esbuild';

const isProd = process.argv.includes('--prod');
const ctx = await context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: isProd,
    sourcemap: !isProd,
    platform: 'node',
    external: ['vscode', 'path', 'fs', 'fs/promises', 'node:path', 'node:child_process', 'node:net'],
    logLevel: 'info',
    outfile: 'out/extension.cjs'
});

await ctx.rebuild();
await ctx.dispose();
