import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { lintPermissions } from './index';

describe('crx-permission-linter', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crx-permission-linter-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should find unused permissions', async () => {
    fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify({
      permissions: ['tabs', 'storage', 'alarms']
    }));
    
    fs.writeFileSync(path.join(tmpDir, 'background.js'), `
      chrome.tabs.query({}, () => {});
      chrome.storage.local.set({ key: 'value' });
    `);

    const result = await lintPermissions(tmpDir);

    expect(result.used).toContain('tabs');
    expect(result.used).toContain('storage');
    expect(result.unused).toContain('alarms');
  });

  it('should return empty lists if no permissions are declared', async () => {
    fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify({}));
    const result = await lintPermissions(tmpDir);
    expect(result.used).toHaveLength(0);
    expect(result.unused).toHaveLength(0);
  });
});
