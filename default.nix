# 🐻‍❄️🫖 opentofu-vscode: Visual Studio Code extension for OpenTofu
# Copyright (C) 2025 Noel Towa <cutie@floofy.dev>
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
let
  lockfile = builtins.fromJSON (builtins.readFile ./flake.lock);
  rev = lockfile.nodes.flake-compat.locked;
  flake-compat = builtins.fetchTarball {
    url = "https://github.com/${rev.owner}/${rev.repo}/archive/${rev.rev}.tar.gz";
    sha256 = rev.narHash;
  };
in
  (import flake-compat {src = ./.;}).defaultNix.default
