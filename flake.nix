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
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-compat = {
      url = "github:edolstra/flake-compat";
      flake = false;
    };
  };

  outputs = {nixpkgs, ...}: let
    eachSystem = nixpkgs.lib.genAttrs nixpkgs.lib.systems.flakeExposed;
    overlays = [];

    nixpkgsFor = system:
      import nixpkgs {
        inherit system overlays;
      };
  in {
    formatter = eachSystem (system: (nixpkgsFor system).alejandra);
    packages = eachSystem (system: let
      inherit (nixpkgsFor system) callPackage;

      opentofu-vscode = callPackage ./nix/package.nix {};
    in {
      inherit opentofu-vscode;
      default = opentofu-vscode;
    });

    devShells = eachSystem (system: let
      inherit (nixpkgsFor system) callPackage;
    in {
      default = callPackage ./nix/devshell.nix {};
    });
  };
}
