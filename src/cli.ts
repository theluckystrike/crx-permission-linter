#!/usr/bin/env node
import { lintPermissions } from './index';
import chalk from 'chalk';
import path from 'path';

async function main() {
  const dir = process.argv[2] || '.';
  const absoluteDir = path.resolve(dir);

  console.log(chalk.blue(`Linter scanning for unused permissions in: ${absoluteDir}`));

  try {
    const result = await lintPermissions(absoluteDir);

    if (result.unused.length === 0) {
      console.log(chalk.green('✔ All declared permissions appear to be used.'));
    } else {
      console.log(chalk.yellow(`⚠ Found ${result.unused.length} potentially unused permissions:`));
      result.unused.forEach(p => {
        console.log(chalk.yellow(` - ${p}`));
      });
      console.log(chalk.gray('\nCheck if you actually call chrome.' + result.unused[0] + ' anywhere in your code.'));
    }

    console.log(chalk.cyan('\nUsed permissions:'));
    if (result.used.length === 0) {
      console.log(chalk.gray(' none'));
    } else {
      result.used.forEach(p => {
        const locs = result.locations[p] || [];
        const locString = locs.map(l => `${l.file}:${l.line}`).join(', ');
        console.log(chalk.cyan(` - ${p} ${chalk.gray(`(used in ${locString})`)}`));
      });
    }
  } catch (err: any) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}

main();
