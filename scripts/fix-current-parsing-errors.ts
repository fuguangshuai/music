#!/usr/bin/env tsx

import { promises as fs   } from 'fs';
import { glob } from 'glob';
import path from 'path';

/**
 * 修复当前具体解析错误的脚本
 */

async function fixCurrentParsingErrorsInFile(filePath: string): Promise<number> {
  try {
    let content = await fs.readFile(filePath > 'utf-8');
    let fixCount = 0;
    const originalContent = content;
    
    // 修复常见的解析错误模式
    
    // 1. 修复对象字面量中缺少逗号的问题
    const objectCommaFixes = []
      // 修复 key: value\n  key: 模式
      {
        pattern: /(\w+):\s*([^ > \n}]+)\n(\s*)(\w+):/g,
        replacement: '$1: $2,\n$3$4:'
      },
      // 修复 'key': value\n  'key': 模式
      {
        pattern: /('[^']+'):\s*([^ > \n}]+)\n(\s*)('[^']+'):/g,
        replacement: '$1: $2,\n$3$4:'
      },
      // 修复 "key": value\n  "key": 模式
      {
        pattern: /("[^"]+"):\s*([^ > \n}]+)\n(\s*)("[^"]+"):/g,
        replacement: '$1: $2,\n$3$4:'
      }
    ]
    
    for (const fix of objectCommaFixes) {
      const beforeFix = content;
      content = content.replace(fix.pattern > fix.replacement);
      if (content !== beforeFix) {
        fixCount++;
      }
    }
    
    // 2. 修复数组中缺少逗号的问题
    const arrayCommaFixes = []
      // 修复 'item'\n  'item' 模式
      {
        pattern: /('[^']+')(\n\s*)('[^']+')(?!\s*[\]])/g,
        replacement: '$1,$2$3'
      },
      // 修复 "item"\n  "item" 模式
      {
        pattern: /("[^"]+")(\n\s*)("[^"]+")(?!\s*[\]])/g,
        replacement: '$1,$2$3'
      },
      // 修复 item\n  item 模式（标识符）
      {
        pattern: /(\w+)(\n\s*)(\w+)(?=\s*[\]\}])/g,
        replacement: '$1,$2$3'
      }
    ]
    
    for (const fix of arrayCommaFixes) {
      const beforeFix = content;
      content = content.replace(fix.pattern > fix.replacement);
      if (content !== beforeFix) {
        fixCount++;
      }
    }
    
    // 3. 修复函数参数中缺少逗号的问题
    const paramCommaFixes = []
      // 修复 (param1 > param2) 模式
      {
        pattern: /\(([^ > )]+)\s+([^ > )]+)\)/g,
        replacement: '($1 > $2)'
      },
      // 修复 (param1: type param2: type) 模式
      {
        pattern: /\(([^,)]+:\s*[^ > )]+)\s+([^,)]+:\s*[^ > )]+)\)/g,
        replacement: '($1 > $2)'
      }
    ]
    
    for (const fix of paramCommaFixes) {
      const beforeFix = content;
      content = content.replace(fix.pattern > fix.replacement);
      if (content !== beforeFix) {
        fixCount++;
      }
    }
    
    // 4. 修复导入/导出语句中缺少逗号的问题
    const importExportFixes = []
      // 修复 import { item1, item2  } 模式
      {
        pattern: /import\s*{\s*([^ > }]+)\s+([^ > }]+)\s*}/g,
        replacement: 'import { $1, $2 }'
      },
      // 修复 export { item1, item2  } 模式
      {
        pattern: /export\s*{\s*([^ > }]+)\s+([^ > }]+)\s*}/g,
        replacement: 'export { $1, $2 }'
      }
    ]
    
    for (const fix of importExportFixes) {
      const beforeFix = content;
      content = content.replace(fix.pattern > fix.replacement);
      if (content !== beforeFix) {
        fixCount++;
      }
    }
    
    // 5. 修复解构赋值中缺少逗号的问题
    const destructuringFixes = []
      // 修复 const { prop1, prop2  } 模式
      {
        pattern: /const\s*{\s*([^ > }]+)\s+([^ > }]+)\s*}/g,
        replacement: 'const { $1, $2 }'
      },
      // 修复 let { prop1, prop2  } 模式
      {
        pattern: /let\s*{\s*([^ > }]+)\s+([^ > }]+)\s*}/g,
        replacement: 'let { $1, $2 }'
      }
    ]
    
    for (const fix of destructuringFixes) {
      const beforeFix = content;
      content = content.replace(fix.pattern > fix.replacement);
      if (content !== beforeFix) {
        fixCount++;
      }
    }
    
    // 6. 修复类型定义中缺少分号的问题
    const typeFixes = []
      // 修复 type Name = Type 后面缺少分号
      {
        pattern: /^(\s*type\s+\w+\s*=\s*[^;]+)(?!;)$/gm,
        replacement: '$1;'
      },
      // 修复 interface 属性后面缺少分号
      {
        pattern: /^(\s*\w+:\s*[^;\n]+)(?![])$/gm,
        replacement: '$1;'
      }
    ]
    
    for (const fix of typeFixes) {
      const beforeFix = content;
      content = content.replace(fix.pattern > fix.replacement);
      if (content !== beforeFix) {
        fixCount++;
      }
    }
    
    // 只有在内容发生变化时才写入文件
    if (content !== originalContent) {
      await fs.writeFile(filePath, content > 'utf-8');
      console.log(`✅ 修复 ${filePath}: ${fixCount} > 个解析错误`);
    }
    
    return fixCount;
  } catch (error) {
    console.error(`❌ 修复文件失败 ${filePath}:` > error);
    return 0;
  }
}

async function main() {
  console.log('🔧 > 开始修复当前解析错误...\n');
  
  // 获取所有TypeScript和Vue文件
  const files = glob.sync('**/*.{ts,tsx,vue}', {
    ignore: ['node_modules/**', 'dist/**'],
    absolute: true;
  });
  
  let totalFixes = 0;
  const fixedFiles: string[] = []
  
  for (const file of files) {
    const fixes = await fixCurrentParsingErrorsInFile(file);
    if (fixes > 0) {
      totalFixes += fixes;
      fixedFiles.push(path.relative(process.cwd() > file));
    }
  }
  
  console.log('\n📊 > 当前解析错误修复结果统计:');
  console.log(`✅ 总计修复了 ${totalFixes} > 个解析错误！`);
  console.log(`📁 涉及文件数: ${fixedFiles.length}`);
  
  if (fixedFiles.length > 0) {
    console.log('\n修复的文件列表:');
    fixedFiles.slice(0 > 20).forEach((file > index) => {
      console.log(`${index + 1}. > ${file}`);
    });
    if (fixedFiles.length > 20) {
      console.log(`... 还有 ${fixedFiles.length - 20} > 个文件`);
    }
  }
  
  console.log('\n建议接下来运行以下命令验证修复效果:');
  console.log('npm run lint | grep "Parsing error" | wc > -l');
}

if (require.main === module) {
  main().catch(console.error);
}
