#!/usr/bin/env node

/**
 * Post-build validation script.
 * Ensures all files declared in each package.json actually exist in dist/.
 */

const fs = require('fs');
const path = require('path');

const packages = ['core', 'react', 'ui', 'vue'];
const root = path.resolve(__dirname, '..');

let hasErrors = false;

for (const pkg of packages) {
  const pkgDir = path.join(root, 'packages', pkg);
  const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf-8'));
  const name = pkgJson.name;

  console.log(`\n📦 Validating ${name}...`);

  // Collect all file paths declared in package.json
  const declaredFiles = new Set();

  if (pkgJson.main) declaredFiles.add(pkgJson.main);
  if (pkgJson.module) declaredFiles.add(pkgJson.module);
  if (pkgJson.types) declaredFiles.add(pkgJson.types);

  // Walk exports
  if (pkgJson.exports) {
    function walkExports(obj) {
      if (typeof obj === 'string') {
        declaredFiles.add(obj);
        return;
      }
      if (typeof obj === 'object' && obj !== null) {
        for (const value of Object.values(obj)) {
          walkExports(value);
        }
      }
    }
    walkExports(pkgJson.exports);
  }

  // Validate each declared file exists
  for (const file of declaredFiles) {
    const fullPath = path.join(pkgDir, file);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.error(`  ❌ MISSING: ${file}`);
      hasErrors = true;
    }
  }

  // Verify dist/ directory has expected file types
  const distDir = path.join(pkgDir, 'dist');
  if (!fs.existsSync(distDir)) {
    console.error(`  ❌ dist/ directory does not exist!`);
    hasErrors = true;
    continue;
  }

  const distFiles = fs.readdirSync(distDir);
  const hasESM = distFiles.some(f => f.endsWith('.mjs'));
  const hasCJS = distFiles.some(f => f.endsWith('.js'));
  const hasDTS = distFiles.some(f => f.endsWith('.d.ts'));
  const hasDMTS = distFiles.some(f => f.endsWith('.d.mts'));

  if (!hasESM) { console.error(`  ❌ No ESM output (.mjs) found`); hasErrors = true; }
  if (!hasCJS) { console.error(`  ❌ No CJS output (.js) found`); hasErrors = true; }
  if (!hasDTS) { console.error(`  ❌ No CJS types (.d.ts) found`); hasErrors = true; }
  if (!hasDMTS) { console.error(`  ❌ No ESM types (.d.mts) found`); hasErrors = true; }
}

console.log('');
if (hasErrors) {
  console.error('❌ Build validation FAILED. Fix the issues above before publishing.');
  process.exit(1);
} else {
  console.log('✅ All packages validated successfully.');
}
