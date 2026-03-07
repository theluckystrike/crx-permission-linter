# crx-permission-linter

Scan source code to identify unused permissions declared in the manifest.json file.

## Installation

```bash
npm install -g @theluckystrike/crx-permission-linter
```

## Usage

Point the tool at your extension directory.

```bash
crx-permission-linter ./my-extension
```

The tool scans all source files for chrome permission calls and highlights any permissions that are unnecessary.

## Chrome Extension Guide

For deeper learning about building extensions, refer to the chrome-extension-guide.

## License

MIT

Built by theluckystrike at zovo.one
