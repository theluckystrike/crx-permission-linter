# crx-permission-linter

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![npm](https://img.shields.io/badge/npm-v1.0.0-cb3837?style=flat-square&logo=npm)](https://www.npmjs.com/package/@theluckystrike/crx-permission-linter)
[![MIT License](https://img.shields.io/badge/License-MIT-3da639?style=flat-square)](LICENSE)

Lint Chrome extension manifests for over-broad or unnecessary permissions.

## Installation

```bash
npm install -g @theluckystrike/crx-permission-linter
```

Or use npx without installing:

```bash
npx @theluckystrike/crx-permission-linter ./my-extension
```

## CLI Usage

```bash
crx-permission-linter ./path/to/extension
```

The tool scans all JavaScript and TypeScript source files in your extension directory, parses the `manifest.json`, and reports which declared permissions are actually used in your code.

**Example output:**

```
✔ All declared permissions appear to be used.
```

Or when unused permissions are found:

```
⚠ Found 2 potentially unused permissions:
 - alarms
 - bookmarks

Check if you actually call chrome.alarms anywhere in your code.

Used permissions: tabs, storage
```

## API Usage

You can also use `crx-permission-linter` programmatically in your Node.js projects:

```typescript
import { lintPermissions } from '@theluckystrike/crx-permission-linter';

const result = await lintPermissions('./path/to/extension');

console.log(result.used);   // ['tabs', 'storage']
console.log(result.unused); // ['alarms', 'bookmarks']
```

### `lintPermissions(dir: string): Promise<LinterResult>`

Scans a Chrome extension directory and returns which permissions are used vs unused.

**Parameters:**
- `dir` - Path to the extension directory (must contain `manifest.json`)

**Returns:** `Promise<LinterResult>`
```typescript
interface LinterResult {
  unused: string[];  // Permissions declared but not detected in code
  used: string[];    // Permissions that appear to be used
}
```

## What Permissions It Checks

The linter analyzes permissions from all three manifest locations:

- `permissions` - Standard API permissions (e.g., `tabs`, `storage`, `alarms`)
- `optional_permissions` - Optional API permissions
- `host_permissions` - Host patterns (e.g., `https://*.google.com/*`, `<all_urls>`)

### Detection Patterns

The tool detects permission usage through:

1. **Direct access**: `chrome.tabs.query(...)`
2. **Bracket notation**: `chrome['tabs'].create(...)`
3. **Destructuring**: `const { tabs } = chrome;`
4. **Renamed destructuring**: `const { storage: myStorage } = chrome;`
5. **Host permissions**: URLs matching declared host patterns in fetch/XHR calls

### Warnings Produced

The linter produces warnings for:

- **Unused API permissions**: Declared in manifest but never called in source code
- **Unused host permissions**: Host patterns declared but no matching URLs found in network calls
- **Potentially unnecessary `<all_urls>`**: If `fetch`, `XMLHttpRequest`, or `chrome.scripting` is detected but domain-specific host permissions could be used instead

---

MIT License - Built by [theluckystrike](https://github.com/theluckystrike) | [zovo.one](https://zovo.one)
