// Single source of truth for the build.
//   node scripts/build.mjs            -> one-shot production build (minified)
//   node scripts/build.mjs --watch    -> dev mode: rebuilds on every src change,
//                                        and re-syncs static files into dist/.
//
// Why one script: keeps every entry point (popup, content, background) configured
// in one place, avoids npm-run-all, and lets static files participate in the watch.

import { build, context } from 'esbuild';
import {
  copyFile,
  mkdir,
  readdir,
  rm,
  watch as fsWatch,
} from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PUBLIC_DIR = join(ROOT, 'public');
const DIST = join(ROOT, 'dist');

const isWatch = process.argv.includes('--watch');
const isProd = !isWatch;

/** Recursively copy a directory's contents. */
async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

// Files / dirs that get copied verbatim into dist/.
//   - public/ contains extension-level statics (manifest.json, icon.png).
//   - popup.html lives next to its component code in src/popup/ but still
//     needs to land at the root of dist/ so Chrome can find it.
const STATIC_TARGETS = [
  { src: PUBLIC_DIR, dest: DIST, kind: 'dir' },
  {
    src: join(ROOT, 'src/popup/popup.html'),
    dest: join(DIST, 'popup.html'),
    kind: 'file',
  },
];

async function syncStatic() {
  for (const t of STATIC_TARGETS) {
    if (t.kind === 'dir') {
      await copyDir(t.src, t.dest);
    } else {
      await mkdir(dirname(t.dest), { recursive: true });
      await copyFile(t.src, t.dest);
    }
  }
  console.log('📋 Synced static files → dist/');
}

const sharedOptions = {
  bundle: true,
  loader: { '.ts': 'ts', '.tsx': 'tsx' },
  minify: isProd,
  sourcemap: !isProd,
  logLevel: 'info',
  // Targeting current Chrome since this is a Chrome-only MV3 extension.
  target: 'chrome120',
};

const targets = [
  {
    entryPoints: ['src/popup/index.tsx'],
    outfile: 'dist/popup.bundle.js',
  },
  {
    entryPoints: ['src/content/window.ts', 'src/content/linter.ts'],
    outdir: 'dist',
  },
  {
    entryPoints: ['src/background/background.ts'],
    outfile: 'dist/background.js',
  },
];

async function main() {
  if (isProd) {
    if (existsSync(DIST)) {
      await rm(DIST, { recursive: true, force: true });
    }
  }
  await mkdir(DIST, { recursive: true });
  await syncStatic();

  if (isWatch) {
    const contexts = await Promise.all(
      targets.map((t) => context({ ...sharedOptions, ...t })),
    );
    await Promise.all(contexts.map((c) => c.watch()));
    console.log('👀 Watching src/ and static files — Ctrl+C to stop');

    // Coalesce bursts of fs events (a single save can fire several).
    let pending = false;
    const debouncedSync = () => {
      if (pending) return;
      pending = true;
      setTimeout(() => {
        pending = false;
        syncStatic().catch((err) => console.error('Static sync failed:', err));
      }, 80);
    };

    // One watcher per static target. Fire-and-forget; failures shouldn't
    // tear down the whole dev process.
    for (const t of STATIC_TARGETS) {
      (async () => {
        try {
          const watcher = fsWatch(
            t.src,
            t.kind === 'dir' ? { recursive: true } : undefined,
          );
          for await (const _event of watcher) {
            debouncedSync();
          }
        } catch (err) {
          console.error(`Watch failed for ${t.src}:`, err);
        }
      })();
    }
  } else {
    await Promise.all(
      targets.map((t) => build({ ...sharedOptions, ...t })),
    );
    console.log('✅ Build complete (production, minified)');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
