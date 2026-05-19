const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/admin/page.tsx',
  'src/app/admin/categories/page.tsx',
  'src/app/admin/questions/page.tsx',
  'src/app/admin/results/page.tsx',
  'src/app/admin/users/page.tsx',
  'src/app/api/sync/route.ts'
];

for (const file of filesToFix) {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes('force-dynamic')) {
      const parts = content.split('\n');
      const importLastIndex = parts.findLastIndex(line => line.startsWith('import '));
      const insertIdx = importLastIndex === -1 ? 0 : importLastIndex + 1;
      
      parts.splice(insertIdx, 0, '\nexport const dynamic = "force-dynamic";\n');
      fs.writeFileSync(fullPath, parts.join('\n'));
      console.log('Fixed', file);
    } else {
      console.log('Already fixed', file);
    }
  } else {
    console.log('File not found', file);
  }
}
