#!/usr/bin/env node
/**
 * 检查构建输出：Netlify preset 可能直接输出到 dist，或需要从 .output/public 复制
 */
import { existsSync, readdirSync, readFileSync, cpSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

const cwd = process.cwd();
const outputPublic = join(cwd, '.output', 'public');
const outputRoot = join(cwd, '.output');
const dest = join(cwd, 'dist');
const netlifyFunctionsInternal = join(cwd, '.netlify', 'functions-internal');
const netlifyFunctions = join(cwd, '.netlify', 'functions');

console.log('Checking build output...');
console.log('  .output exists:', existsSync(outputRoot));
console.log('  dist exists:', existsSync(dest));
console.log('  .netlify/functions-internal exists:', existsSync(netlifyFunctionsInternal));
console.log('  .netlify/functions exists:', existsSync(netlifyFunctions));

if (existsSync(outputRoot)) {
  const entries = readdirSync(outputRoot);
  console.log('  .output contents:', entries.join(', '));
}

// 如果 dist 已存在且包含 index.html 和 _nuxt，说明 Netlify preset 已直接输出到 dist
if (existsSync(dest)) {
  const distEntries = readdirSync(dest);
  console.log('  dist contents:', distEntries.slice(0, 10).join(', '), distEntries.length > 10 ? '...' : '');
  const hasIndex = distEntries.includes('index.html');
  const hasNuxt = distEntries.some(e => e.startsWith('_nuxt') || e === '_nuxt');
  console.log('  dist has index.html:', hasIndex);
  console.log('  dist has _nuxt:', hasNuxt);
  
  if (hasIndex && hasNuxt) {
    console.log('✓ dist already contains build output from Netlify preset');
    // 确保 _redirects 文件存在
    const redirectsFile = join(dest, '_redirects');
    // 优先保留 Nitro 写入的 dist/_redirects（不包含 /* -> function，避免 API 收到错误 path）
    if (!existsSync(redirectsFile)) {
      console.log('⚠ _redirects not found in dist, copying from public/ if present');
      const publicRedirects = join(cwd, 'public', '_redirects');
      if (existsSync(publicRedirects)) {
        cpSync(publicRedirects, redirectsFile);
        console.log('✓ Copied _redirects from public/ to dist/');
      } else {
        console.warn('⚠ No _redirects in dist or public; API may rely on function path: "/*"');
      }
    } else {
      console.log('✓ _redirects exists in dist (Nitro or previous copy)');
    }
    process.exit(0);
  }
}

// 如果 dist 不存在或不完整，尝试从 .output/public 复制
if (existsSync(outputPublic)) {
  console.log('Copying .output/public to dist...');
  const redirectsInDist = join(dest, '_redirects');
  const savedRedirects = existsSync(redirectsInDist) ? readFileSync(redirectsInDist, 'utf8') : null;
  if (existsSync(dest)) {
    rmSync(dest, { recursive: true });
  }
  cpSync(outputPublic, dest, { recursive: true });
  if (savedRedirects) {
    writeFileSync(join(dest, '_redirects'), savedRedirects);
    console.log('✓ Restored Nitro _redirects into dist');
  }
  if (!existsSync(join(dest, '_redirects')) && existsSync(join(cwd, 'public', '_redirects'))) {
    cpSync(join(cwd, 'public', '_redirects'), join(dest, '_redirects'));
    console.log('✓ Copied _redirects from public/ to dist/');
  }
  console.log('✓ Successfully copied .output/public to dist');
} else {
  console.log('⚠ .output/public does not exist');
  console.log('Assuming Netlify preset outputs directly to dist');
  if (!existsSync(dest)) {
    console.error('✗ ERROR: dist does not exist and .output/public is missing!');
    console.error('Build may have failed.');
    process.exit(1);
  }
  console.log('✓ dist exists, using it as-is');
}

// 检查 server 函数是否存在
const netlifyRoot = join(cwd, '.netlify');
if (!existsSync(netlifyRoot)) {
  console.error('✗ ERROR: .netlify directory does not exist!');
  console.error('  API routes (/api/*) will not work.');
  console.error('  Make sure NITRO_PRESET=netlify is set in build environment.');
  console.error('  Current NITRO_PRESET:', process.env.NITRO_PRESET || 'not set');
  process.exit(1);
} else {
  console.log('✓ .netlify directory exists');
  const netlifyEntries = readdirSync(netlifyRoot);
  console.log('  .netlify contents:', netlifyEntries.join(', '));
  
  // 检查 functions-internal（Nitro 构建输出）或 functions（Netlify 部署）
  const funcDirs = [];
  if (existsSync(netlifyFunctionsInternal)) {
    funcDirs.push({ name: 'functions-internal', path: netlifyFunctionsInternal });
  }
  if (existsSync(netlifyFunctions)) {
    funcDirs.push({ name: 'functions', path: netlifyFunctions });
  }
  
  if (funcDirs.length === 0) {
    console.error('✗ ERROR: No .netlify/functions-internal or .netlify/functions found!');
    console.error('  API routes (/api/*) will not work.');
    console.error('  Make sure NITRO_PRESET=netlify is set and build completed successfully.');
    process.exit(1);
  }
  
  for (const { name, path: funcPath } of funcDirs) {
    const funcEntries = readdirSync(funcPath);
    console.log(`✓ ${name} found:`, funcEntries.join(', '));
    const serverFunc = join(funcPath, 'server');
    if (existsSync(serverFunc)) {
      console.log(`✓ Server function exists in ${name} at:`, serverFunc);
    } else {
      console.warn(`⚠ Server function not found in ${name}`);
    }
  }
}
