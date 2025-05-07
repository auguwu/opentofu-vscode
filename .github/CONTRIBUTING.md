# 🐻‍❄️🫖 Contributing to `opentofu-vscode`

Before we begin, thanks for considering your time to help make **charted-server** even better than we can! We full heartly accept contributions from everyone — including you! We accept major features, minor features to small, grammatical bugs.

## Bug Reporting

Think you might've ran into a bug that should never happen? It happens to the best of us sometimes! To submit a bug report, you can create one via [GitHub Issues](https://github.com/auguwu/opentofu-vscode).

Before you do, make sure that it's something that someone hasn't already reported! You can surf through the [issue board] to see if anyone has already reported it. It'll be tagged with the `bug` label.

- Be clear and concise with the title and description of the bug! It'll help others link their issues and possible solution to yours.
- Please specify any way to reproduce the bug, so we know where to look and fix it!

## Development Environment

For Nix/NixOS users, we maintain a [direnv](https://github.com/direnv/direnv) to standardise the development workflow, it includes the following tools:

- Node.js
- `pnpm`

To enter the workflow, you can use `direnv allow` and it'll propagate a [direnv]:

```shell
direnv: loading ~/git/noeltowa/opentofu-vscode
direnv: loading https://raw.githubusercontent.com/nix-community/nix-direnv/3.0.6/direnvrc (sha256-RYcUJaRMf8oF5LznDrlCXbkOQrywm0HDv1VjYGaJGdM=)
direnv: using flake
direnv: nix-direnv: Using cached dev shell
direnv: export +AR +AS +CC +CONFIG_SHELL +CXX +HOST_PATH +IN_NIX_SHELL +LD +NIX_BINTOOLS +NIX_BINTOOLS_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu +NIX_BUILD_CORES +NIX_CC +NIX_CC_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu +NIX_CFLAGS_COMPILE +NIX_ENFORCE_NO_NATIVE +NIX_HARDENING_ENABLE +NIX_LDFLAGS +NIX_STORE +NM +NODE_PATH +OBJCOPY +OBJDUMP +RANLIB +READELF +SIZE +SOURCE_DATE_EPOCH +STRINGS +STRIP +__structuredAttrs +buildInputs +buildPhase +builder +cmakeFlags +configureFlags +depsBuildBuild +depsBuildBuildPropagated +depsBuildTarget +depsBuildTargetPropagated +depsHostHost +depsHostHostPropagated +depsTargetTarget +depsTargetTargetPropagated +doCheck +doInstallCheck +dontAddDisableDepTrack +mesonFlags +name +nativeBuildInputs +out +outputs +patches +phases +preferLocalBuild +propagatedBuildInputs +propagatedNativeBuildInputs +shell +shellHook +stdenv +strictDeps +system ~PATH ~XDG_DATA_DIRS
```

You can also use `nix shell` or `nix develop` as well. Since we use [Nix flakes], we provide a fallback for people who don't use Nix flakes.

---

For non Nix/NixOS users, we recommend installing the following tools on your system (if you haven't already):

- Node.js
- `pnpm` (`npm i -g pnpm`)
