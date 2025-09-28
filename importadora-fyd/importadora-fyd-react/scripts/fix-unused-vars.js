const fs = require('fs');
const path = require('path');

// Patrones comunes de variables no utilizadas que pueden ser comentadas
const unusedPatterns = [
  {
    pattern: /const \[syncingCategories, setSyncingCategories\] = useState\([^)]*\);/g,
    replacement: '// const [syncingCategories, setSyncingCategories] = useState(false); // Unused state'
  },
  {
    pattern: /const initializeDefaultContent = [^;]*;/g,
    replacement: '// const initializeDefaultContent = ...; // Unused function'
  },
  {
    pattern: /} catch \(error\) \{\s*\/\/ Silently ignore errors\s*\}/g,
    replacement: '} catch {\n    // Silently ignore errors\n  }'
  },
  {
    pattern: /} catch \(error\) \{\s*\}/g,
    replacement: '} catch {\n    // Error handling intentionally empty\n  }'
  }
];

// Variables específicas que sabemos que no se usan
const specificUnusedVars = [
  'firebaseError',
  'syncingCategories',
  'setSyncingCategories',
  'today',
  'newArrivals',
  'electronics',
  'featuredProducts',
  'bestSellers'
];

function fixUnusedVars(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Aplicar patrones generales
    unusedPatterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    // Comentar asignaciones de variables específicas no utilizadas
    specificUnusedVars.forEach(varName => {
      const assignmentPattern = new RegExp(`^(\\s*)const ${varName} = `, 'gm');
      if (assignmentPattern.test(content)) {
        content = content.replace(assignmentPattern, `$1// const ${varName} = `);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed unused vars in: ${filePath}`);
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
    } else if (stat.isFile() && (entry.endsWith('.ts') || entry.endsWith('.tsx'))) {
      fixUnusedVars(fullPath);
    }
  });
}

console.log('🔧 Fixing unused variables...');
processDirectory('./src');
console.log('✅ Unused variables cleanup completed!');