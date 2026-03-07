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

  it('should detect destructuring usage', async () => {
    fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify({
      permissions: ['tabs', 'storage', 'alarms', 'bookmarks']
    }));
    
    fs.writeFileSync(path.join(tmpDir, 'background.js'), `
      const { tabs } = chrome;
      const { storage, alarms: myAlarms } = browser;
      const { bookmarks = {} } = chrome;
      
      tabs.query({}, () => {});
    `);

    const result = await lintPermissions(tmpDir);

    expect(result.used).toContain('tabs');
    expect(result.used).toContain('storage');
    expect(result.used).toContain('alarms');
    expect(result.used).toContain('bookmarks');
    expect(result.unused).toHaveLength(0);
  });

  it('should handle host_permissions', async () => {
    fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify({
      host_permissions: ['https://*.google.com/*', 'https://api.github.com/']
    }));
    
    fs.writeFileSync(path.join(tmpDir, 'background.js'), `
      fetch('https://google.com/search');
    `);

    const result = await lintPermissions(tmpDir);

    expect(result.used).toContain('https://*.google.com/*');
    expect(result.unused).toContain('https://api.github.com/');
  });

  it('should handle <all_urls>', async () => {
    fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify({
      host_permissions: ['<all_urls>']
    }));
    
    fs.writeFileSync(path.join(tmpDir, 'background.js'), `
      fetch('https://any-site.com');
    `);

    const result = await lintPermissions(tmpDir);

    expect(result.used).toContain('<all_urls>');
  });

  it('should return empty lists if no permissions are declared', async () => {
    fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify({}));
    const result = await lintPermissions(tmpDir);
    expect(result.used).toHaveLength(0);
    expect(result.unused).toHaveLength(0);
  });
});
