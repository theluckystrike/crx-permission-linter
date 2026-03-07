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

  it('should track usage locations correctly', async () => {
    fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify({
      permissions: ['tabs', 'storage']
    }));
    
    fs.writeFileSync(path.join(tmpDir, 'background.js'), `
// Line 2
chrome.tabs.query({}, () => {}); // Line 3
// Line 4
chrome.storage.local.set({ key: 'value' }); // Line 5
    `);

    const result = await lintPermissions(tmpDir);

    expect(result.used).toContain('tabs');
    expect(result.used).toContain('storage');
    
    expect(result.locations['tabs']).toContainEqual({ file: 'background.js', line: 3 });
    expect(result.locations['storage']).toContainEqual({ file: 'background.js', line: 5 });
  });

  it('should track multiple locations for the same permission', async () => {
    fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify({
      permissions: ['tabs']
    }));
    
    fs.writeFileSync(path.join(tmpDir, 'background.js'), `
      chrome.tabs.create({});
    `);

    fs.writeFileSync(path.join(tmpDir, 'content.js'), `
      chrome.tabs.sendMessage(1, {});
    `);

    const result = await lintPermissions(tmpDir);

    expect(result.locations['tabs']).toHaveLength(2);
    expect(result.locations['tabs']).toContainEqual({ file: 'background.js', line: 2 });
    expect(result.locations['tabs']).toContainEqual({ file: 'content.js', line: 2 });
  });

  it('should detect destructuring usage with line numbers', async () => {
    fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify({
      permissions: ['tabs', 'storage', 'alarms', 'bookmarks']
    }));
    
    fs.writeFileSync(path.join(tmpDir, 'background.js'), `
      const { tabs } = chrome; // Line 2
      const { storage, alarms: myAlarms } = browser; // Line 3
      const { bookmarks = {} } = chrome; // Line 4
      
      tabs.query({}, () => {});
    `);

    const result = await lintPermissions(tmpDir);

    expect(result.used).toContain('tabs');
    expect(result.used).toContain('storage');
    expect(result.used).toContain('alarms');
    expect(result.used).toContain('bookmarks');
    
    expect(result.locations['tabs']).toContainEqual({ file: 'background.js', line: 2 });
    expect(result.locations['storage']).toContainEqual({ file: 'background.js', line: 3 });
    expect(result.locations['alarms']).toContainEqual({ file: 'background.js', line: 3 });
    expect(result.locations['bookmarks']).toContainEqual({ file: 'background.js', line: 4 });
  });

  it('should handle host_permissions with line numbers', async () => {
    fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify({
      host_permissions: ['https://*.google.com/*', 'https://api.github.com/']
    }));
    
    fs.writeFileSync(path.join(tmpDir, 'background.js'), `
      fetch('https://google.com/search'); // Line 2
    `);

    const result = await lintPermissions(tmpDir);

    expect(result.used).toContain('https://*.google.com/*');
    expect(result.locations['https://*.google.com/*']).toContainEqual({ file: 'background.js', line: 2 });
  });

  it('should handle <all_urls> with line numbers', async () => {
    fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify({
      host_permissions: ['<all_urls>']
    }));
    
    fs.writeFileSync(path.join(tmpDir, 'background.js'), `
      // Some comment
      fetch('https://any-site.com'); // Line 3
    `);

    const result = await lintPermissions(tmpDir);

    expect(result.used).toContain('<all_urls>');
    expect(result.locations['<all_urls>']).toContainEqual({ file: 'background.js', line: 3 });
  });

  it('should return empty lists if no permissions are declared', async () => {
    fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify({}));
    const result = await lintPermissions(tmpDir);
    expect(result.used).toHaveLength(0);
    expect(result.unused).toHaveLength(0);
  });
});
