# crx-permission-linter

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![npm](https://img.shields.io/badge/npm-v1.0.0-cb3837?style=flat-square&logo=npm)](https://www.npmjs.com/package/@theluckystrike/crx-permission-linter)
[![License](https://img.shields.io/badge/License-MIT-3da639?style=flat-square)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/theluckystrike/crx-permission-linter?style=flat-square)](https://github.com/theluckystrike/crx-permission-linter/commits/main)

Lint Chrome extension manifests for over-broad or unnecessary permissions. Keep your extension lean and secure by detecting permissions declared in `manifest.json` that aren't actually used in your code.

## Why Use crx-permission-linter?

Chrome extensions often accumulate unnecessary permissions over time:

- Permissions copied from tutorials or boilerplates
- APIs added during development but later removed
- Host permissions that are overly broad

Unnecessary permissions:
- Increase user trust concerns during installation
- May trigger additional review processes in the Chrome Web Store
- Represent unnecessary attack surface

`crx-permission-linter` analyzes your extension's source code to identify which permissions are actually used, helping you maintain a minimal permissions manifest.

## Installation

```bash
# Install globally
npm install -g @theluckystrike/crx-permission-linter

# Or use with npx (no installation required)
npx @theluckystrike/crx-permission-linter ./my-extension
```

## CLI Usage

```bash
# Lint a local extension directory
crx-permission-linter ./path/to/extension

# Or lint the current directory
crx-permission-linter
```

### Example Output

**All permissions used:**

```
✔ All declared permissions appear to be used.
```

**Unused permissions detected:**

```
⚠ Found 2 potentially unused permissions:
 - alarms
 - bookmarks

Check if you actually call chrome.alarms anywhere in your code.

Used permissions:
 - tabs (used in background.js:3, popup.js:12)
 - storage (used in background.js:5, options.js:8)
```

## Programmatic API

You can also use `crx-permission-linter` as a Node.js library:

```typescript
import { lintPermissions } from '@theluckystrike/crx-permission-linter';

const result = await lintPermissions('./path/to/extension');

console.log(result.used);    // ['tabs', 'storage']
console.log(result.unused);  // ['alarms', 'bookmarks']
console.log(result.locations);
// {
//   tabs: [{ file: 'background.js', line: 3 }],
//   storage: [{ file: 'background.js', line: 5 }]
// }
```

### API Reference

#### `lintPermissions(dir: string): Promise<LinterResult>`

Scans a Chrome extension directory and returns which permissions are used vs unused.

**Parameters:**
- `dir` - Path to the extension directory (must contain `manifest.json`)

**Returns:** `Promise<LinterResult>`

```typescript
interface LinterResult {
  unused: string[];                    // Permissions declared but not detected in code
  used: string[];                      // Permissions that appear to be used
  locations: Record<string, {         // Where each permission is used
    file: string;
    line: number;
  }[]>;
}

interface UsageLocation {
  file: string;
  line: number;
}
```

## Rules & Checks

The linter analyzes permissions from all three manifest locations:

| Manifest Field | Description | Examples |
|----------------|-------------|----------|
| `permissions` | Standard API permissions | `tabs`, `storage`, `alarms` |
| `optional_permissions` | Optional API permissions | `contextMenus`, `topSites` |
| `host_permissions` | Host patterns | `https://*.google.com/*`, `<all_urls>` |

### Detection Patterns

The tool detects permission usage through multiple patterns:

1. **Direct access**: `chrome.tabs.query({}, callback)`
2. **Bracket notation**: `chrome['tabs'].create(...)`
3. **Destructuring**: `const { tabs } = chrome;`
4. **Renamed destructuring**: `const { storage: myStorage } = chrome;`
5. **Browser namespace**: `const { tabs } = browser;`
6. **Host permissions in strings**: URLs matching declared host patterns

### Warnings Produced

The linter produces warnings for:

- **Unused API permissions**: Declared in manifest but never called in source code
- **Unused host permissions**: Host patterns declared but no matching URLs found in network calls
- **Potentially unnecessary `<all_urls>`**: If `fetch`, `XMLHttpRequest`, or `chrome.scripting` is detected but domain-specific host permissions could be used instead

## Project Structure

```
crx-permission-linter/
├── src/
│   ├── index.ts          # Core linter logic
│   ├── cli.ts            # CLI entry point
│   └── index.test.ts    # Test suite
├── package.json
├── tsconfig.json
├── LICENSE
└── README.md
```

## Requirements

- Node.js 18+
- TypeScript 5.9+

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built at [zovo.one](https://zovo.one) by [theluckystrike](https://github.com/theluckystrike)
