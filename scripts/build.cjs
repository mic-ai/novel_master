#!/usr/bin/env node
// Build wrapper that treats EIO rmdir errors as warnings, not failures.
// Next.js cleanup of the temporary export directory fails on Windows/NTFS
// mounts (EIO: i/o error, rmdir). The actual build artifacts are intact.
// Vercel does not use this script; it runs `next build` directly.

const { spawnSync } = require('child_process');
const path = require('path');

const patchPath = path.resolve(__dirname, 'patch-fs-eio.cjs');
const env = { ...process.env, NODE_OPTIONS: `--require ${patchPath}` };

// Step 1: prisma generate
const gen = spawnSync('npx', ['prisma', 'generate'], { stdio: 'inherit', env, shell: true });
if (gen.status !== 0) process.exit(gen.status ?? 1);

// Step 2: next build (with fs patch applied)
const build = spawnSync('npx', ['next', 'build'], { stdio: 'inherit', env, shell: true });
process.exit(build.status ?? 0);
