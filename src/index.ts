import fs from 'fs';
import glob from 'fast-glob';
import ts from 'typescript';
import path from 'path';

export interface UsageLocation {
  file: string;
  line: number;
}

export interface LinterResult {
  unused: string[];
  used: string[];
  locations: Record<string, UsageLocation[]>;
}

export async function lintPermissions(dir: string): Promise<LinterResult> {
  const manifestPath = `${dir}/manifest.json`;
  if (!fs.existsSync(manifestPath)) {
    throw new Error('manifest.json not found');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const declared = [
    ...(manifest.permissions || []),
    ...(manifest.optional_permissions || []),
    ...(manifest.host_permissions || [])
  ];

  if (declared.length === 0) {
    return { unused: [], used: [], locations: {} };
  }

  const sourceFiles = await glob('**/*.{js,ts,mjs,cjs}', {
    cwd: dir,
    absolute: true,
    ignore: ['node_modules/**', 'dist/**']
  });

  const used = new Set<string>();
  const locations: Record<string, UsageLocation[]> = {};

  const addUsage = (permission: string, file: string, line: number) => {
    used.add(permission);
    if (!locations[permission]) {
      locations[permission] = [];
    }
    // Avoid duplicate locations for the same permission in the same file/line
    if (!locations[permission].some(loc => loc.file === file && loc.line === line)) {
      locations[permission].push({ file, line });
    }
  };

  for (const file of sourceFiles) {
    const relativeFile = path.relative(dir, file);
    const content = fs.readFileSync(file, 'utf-8');
    const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

    const visit = (node: ts.Node) => {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const lineNumber = line + 1;

      // Direct access like chrome.tabs
      if (ts.isPropertyAccessExpression(node)) {
        if (ts.isIdentifier(node.expression) && (node.expression.text === 'chrome' || node.expression.text === 'browser')) {
          const p = node.name.text;
          if (declared.includes(p)) {
            addUsage(p, relativeFile, lineNumber);
          }
        }
      }

      // Bracket access like chrome['tabs']
      if (ts.isElementAccessExpression(node)) {
        if (ts.isIdentifier(node.expression) && (node.expression.text === 'chrome' || node.expression.text === 'browser')) {
          if (ts.isStringLiteral(node.argumentExpression)) {
            const p = node.argumentExpression.text;
            if (declared.includes(p)) {
              addUsage(p, relativeFile, lineNumber);
            }
          }
        }
      }

      // Destructuring like const { tabs } = chrome;
      if (ts.isVariableDeclaration(node) && node.initializer) {
        let initializer = node.initializer;
        while (ts.isParenthesizedExpression(initializer)) {
          initializer = initializer.expression;
        }

        if (ts.isIdentifier(initializer) && (initializer.text === 'chrome' || initializer.text === 'browser')) {
          if (ts.isObjectBindingPattern(node.name)) {
            for (const element of node.name.elements) {
              if (ts.isBindingElement(element)) {
                // { tabs } or { tabs: myTabs }
                const nameNode = element.propertyName || element.name;
                if (ts.isIdentifier(nameNode)) {
                  const p = nameNode.text;
                  if (declared.includes(p)) {
                    addUsage(p, relativeFile, lineNumber);
                  }
                }
              }
            }
          }
        }
      }

      // Host permissions detection in strings
      if (ts.isStringLiteral(node)) {
        const text = node.text;
        for (const p of declared) {
          if (p.includes('://') || p.includes('*') || p === '<all_urls>') {
            if (p === '<all_urls>') continue;

            const domainMatch = p.match(/:\/\/(\*\.)?([^/*]+)/);
            if (domainMatch && domainMatch[2]) {
              if (text.includes(domainMatch[2])) {
                addUsage(p, relativeFile, lineNumber);
              }
            } else {
              const clean = p.replace(/[*<>]/g, '');
              if (clean && clean.length > 3 && text.includes(clean)) {
                addUsage(p, relativeFile, lineNumber);
              }
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    // Heuristics for host permissions and <all_urls>
    if (declared.includes('<all_urls>')) {
      if (content.includes('fetch') || content.includes('XMLHttpRequest') || content.includes('chrome.scripting')) {
        // Find the first occurrence for <all_urls> heuristic
        const lines = content.split('\n');
        let foundLine = 1;
        if (content.includes('fetch')) {
          foundLine = lines.findIndex(l => l.includes('fetch')) + 1;
        } else if (content.includes('XMLHttpRequest')) {
          foundLine = lines.findIndex(l => l.includes('XMLHttpRequest')) + 1;
        } else if (content.includes('chrome.scripting')) {
          foundLine = lines.findIndex(l => l.includes('chrome.scripting')) + 1;
        }
        addUsage('<all_urls>', relativeFile, foundLine || 1);
      }
    }
  }

  return {
    used: Array.from(used),
    unused: declared.filter(p => !used.has(p)),
    locations
  };
}
