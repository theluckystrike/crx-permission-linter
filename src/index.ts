import fs from 'fs';
import glob from 'fast-glob';

export interface LinterResult {
  unused: string[];
  used: string[];
}

export async function lintPermissions(dir: string): Promise<LinterResult> {
  const manifestPath = `${dir}/manifest.json`;
  if (!fs.existsSync(manifestPath)) {
    throw new Error('manifest.json not found');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const declared = [
    ...(manifest.permissions || []),
    ...(manifest.optional_permissions || [])
  ];

  if (declared.length === 0) {
    return { unused: [], used: [] };
  }

  const sourceFiles = await glob('**/*.{js,ts,mjs,cjs}', {
    cwd: dir,
    absolute: true,
    ignore: ['node_modules/**', 'dist/**']
  });

  const used = new Set<string>();
  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    declared.forEach(p => {
      // Basic check for chrome.permission or browser.permission
      const regex = new RegExp(`(chrome|browser)\\.${p}`, 'g');
      if (regex.test(content)) {
        used.add(p);
      }
    });
  }

  return {
    used: Array.from(used),
    unused: declared.filter(p => !used.has(p))
  };
}
