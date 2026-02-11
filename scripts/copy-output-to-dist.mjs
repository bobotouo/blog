#!/usr/bin/env node
/**
 * 将 .output/public 复制到 dist，供 Netlify 发布
 */
import { existsSync, rmSync, cpSync, readdirSync } from 'fs';
import { join } from 'path';

const cwd = process.cwd();
const outputPublic = join(cwd, '.output', 'public');
const outputRoot = join(cwd, '.output');
const dest = join(cwd, 'dist');

console.log('Checking build output...');
console.log('  .output exists:', existsSync(outputRoot));
if (existsSync(outputRoot)) {
  const entries = readdirSync(outputRoot);
  console.log('  .output contents:', entries.join(', '));
}

if (existsSync(dest)) {
  console.log('Removing existing dist...');
  rmSync(dest, { recursive: true });
}

if (existsSync(outputPublic)) {
  console.log('Copying .output/public to dist...');
  cpSync(outputPublic, dest, { recursive: true });
  console.log('✓ Successfully copied to dist');
} else {
  console.error('✗ ERROR: .output/public does not exist!');
  console.error('Build may have failed or output structure is different.');
  if (existsSync(outputRoot)) {
    console.error('Available in .output:', readdirSync(outputRoot).join(', '));
  }
  process.exit(1);
}
