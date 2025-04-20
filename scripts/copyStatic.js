// FOR COPYING OVER STATIC FILES TO DIST
const fs = require('fs');
const path = require('path');

const copyRecursiveSync = (src, dest) => {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursiveSync(srcPath, destPath);
    } else {
      // Ensure destination directory exists
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

// Clear dist (optional safety step)
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

copyRecursiveSync('public', 'dist');
console.log('✅ Copied static files from /public to /dist');
