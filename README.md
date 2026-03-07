# crx-permission-linter

Scans source code to find unused permissions declared in manifest.json.

## Installation

```bash
npm install -g @theluckystrike/crx-permission-linter
```

## Usage

Point the tool at your extension directory.

```bash
crx-permission-linter ./my-extension
```

It reads manifest.json and scans all source files for `chrome.<permission>` calls to identify which permissions are unnecessary.

## Chrome Extension Guide

For deeper learning about building extensions check out chrome-extension-guide.

## License

MIT

Built by theluckystrike at zovo.one
