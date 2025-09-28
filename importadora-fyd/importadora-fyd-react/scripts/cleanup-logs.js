const fs = require('fs');
const path = require('path');

// Archivos que pueden mantener console logs (development only)
const allowedLogFiles = [
  'test-storage.js',
  'scripts/',
  'dev.config',
  '.env.'
];

// Reemplazos seguros para producción
const logReplacements = [
  {
    pattern: /console\.log\(/g,
    replacement: '// console.log('
  },
  {
    pattern: /console\.warn\(/g,
    replacement: '// console.warn('
  },
  {
    pattern: /console\.info\(/g,
    replacement: '// console.info('
  }
];

function shouldSkipFile(filePath) {
  return allowedLogFiles.some(allowed => filePath.includes(allowed));
}

function cleanupLogs(filePath) {
  if (shouldSkipFile(filePath)) {
    console.log(`Skipping: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    logReplacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Cleaned: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath);

  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
      processDirectory(fullPath);
    } else if (stat.isFile() && (entry.endsWith('.ts') || entry.endsWith('.tsx') || entry.endsWith('.js') || entry.endsWith('.jsx'))) {
      cleanupLogs(fullPath);
    }
  });
}

console.log('🧹 Cleaning up console logs for production...');
processDirectory('./src');
console.log('✅ Cleanup completed!');