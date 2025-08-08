#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';

/**
 * 修复TypeScript编译错误的脚本
 * 专门处理类型定义和语法错误
 */

interface TypeScriptFix {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// TypeScript编译错误修复模式
const typeScriptFixes: TypeScriptFix[] = []
  // 1. 修复类型定义中的错误逗号
  {
    pattern: /:\s * \s*([A-Za-z_$][A-Za-z0-9_$< > \[\]|]*)/g,
    replacement: ': $1',
    description: '修复类型定义中的错误逗号'
  },
  
  // 2. 修复函数参数类型定义中的错误逗号
  {
    pattern: /\(([^: )]+):\s * \s*([^ > )]+)\)/g,
    replacement: '($1: $2)',
    description: '修复函数参数类型定义中的错误逗号'
  },
  
  // 3. 修复对象字面量中的错误逗号开头
  {
    pattern: /=\s*{\s * /g,
    replacement: '= {',
    description: '修复对象字面量开头的错误逗号'
  },
  
  // 4. 修复数组类型定义中的错误逗号
  {
    pattern: /:\s * \s*([A-Za-z_$][A-Za-z0-9_$]*\[\])/g,
    replacement: ': $1',
    description: '修复数组类型定义中的错误逗号'
  },
  
  // 5. 修复泛型类型中的错误逗号
  {
    pattern: /:\s * \s*([A-Za-z_$][A-Za-z0-9_$]*<[^ > ]+>)/g,
    replacement: ': $1',
    description: '修复泛型类型中的错误逗号'
  },
  
  // 6. 修复联合类型中的错误逗号
  {
    pattern: /\|\s * \s*([A-Za-z_$][A-Za-z0-9_$]*)/g,
    replacement: '| $1',
    description: '修复联合类型中的错误逗号'
  },
  
  // 7. 修复箭头函数返回类型中的错误逗号
  {
    pattern: /\)\s*:\s * \s*([A-Za-z_$][A-Za-z0-9_$< > \[\]]*)\s*=>/g,
    replacement: '): $1 =>',
    description: '修复箭头函数返回类型中的错误逗号'
  },
  
  // 8. 修复for...of循环中的错误逗号
  {
    pattern: /for\s*\(\s*const\s+([^ > \s]+)\s+of\s * \s*([^)]+)\)/g,
    replacement: 'for (const $1 of $2)',
    description: '修复for...of循环中的错误逗号'
  },
  
  // 9. 修复map函数中的错误逗号
  {
    pattern: /\.map\(\s*([^ > \s]+)\s*=>\s * \s*([^)]+)\)/g,
    replacement: '.map($1 = > $2)',
    description: '修复map函数中的错误逗号'
  },
  
  // 10. 修复属性访问中的错误逗号
  {
    pattern: /([A-Za-z_$][A-Za-z0-9_$]*)\._([A-Za-z_$][A-Za-z0-9_$]*)/g,
    replacement: '$1.$2',
    description: '修复属性访问中的错误下划线'
  },
  
  // 11. 修复比较运算符中的错误逗号
  {
    pattern: /([A-Za-z_$][A-Za-z0-9_$]*)\s*-\s * \s*([^ > \s)]+)/g,
    replacement: '$1 - $2',
    description: '修复减法运算符中的错误逗号'
  },
  
  // 12. 修复加法运算符中的错误逗号
  {
    pattern: /([A-Za-z_$][A-Za-z0-9_$]*)\s*\+\s * \s*([^ > \s)]+)/g,
    replacement: '$1 + $2',
    description: '修复加法运算符中的错误逗号'
  },
  
  // 13. 修复乘法运算符中的错误逗号
  {
    pattern: /([A-Za-z_$][A-Za-z0-9_$]*)\s*\*\s * \s*([^ > \s)]+)/g,
    replacement: '$1 * $2',
    description: '修复乘法运算符中的错误逗号'
  },
  
  // 14. 修复除法运算符中的错误逗号
  {
    pattern: /([A-Za-z_$][A-Za-z0-9_$]*)\s*\/\s * \s*([^ > \s)]+)/g,
    replacement: '$1 / $2',
    description: '修复除法运算符中的错误逗号'
  },
  
  // 15. 修复大于运算符中的错误逗号
  {
    pattern: /([A-Za-z_$][A-Za-z0-9_$]*)\s*>\s * \s*([^ > \s)]+)/g,
    replacement: '$1 > $2',
    description: '修复大于运算符中的错误逗号'
  },
  
  // 16. 修复小于运算符中的错误逗号
  {
    pattern: /([A-Za-z_$][A-Za-z0-9_$]*)\s*<\s * \s*([^ > \s)]+)/g,
    replacement: '$1 < $2',
    description: '修复小于运算符中的错误逗号'
  },
  
  // 17. 修复大于等于运算符中的错误逗号
  {
    pattern: /([A-Za-z_$][A-Za-z0-9_$]*)\s*>=\s * \s*([^ > \s)]+)/g,
    replacement: '$1 >= $2',
    description: '修复大于等于运算符中的错误逗号'
  },
  
  // 18. 修复小于等于运算符中的错误逗号
  {
    pattern: /([A-Za-z_$][A-Za-z0-9_$]*)\s*<=\s * \s*([^ > \s)]+)/g,
    replacement: '$1 <= $2',
    description: '修复小于等于运算符中的错误逗号'
  },
  
  // 19. 修复等于运算符中的错误逗号
  {
    pattern: /([A-Za-z_$][A-Za-z0-9_$]*)\s*===\s * \s*([^ > \s)]+)/g,
    replacement: '$1 === $2',
    description: '修复等于运算符中的错误逗号'
  },
  
  // 20. 修复不等于运算符中的错误逗号
  {
    pattern: /([A-Za-z_$][A-Za-z0-9_$]*)\s*!==\s * \s*([^ > \s)]+)/g,
    replacement: '$1 !== $2',
    description: '修复不等于运算符中的错误逗号'
  },
  
  // 21. 修复逻辑与运算符中的错误逗号
  {
    pattern: /([A-Za-z_$][A-Za-z0-9_$]*)\s*&&\s * \s*([^ > \s)]+)/g,
    replacement: '$1 && $2',
    description: '修复逻辑与运算符中的错误逗号'
  },
  
  // 22. 修复逻辑或运算符中的错误逗号
  {
    pattern: /([A-Za-z_$][A-Za-z0-9_$]*)\s*\|\|\s * \s*([^ > \s)]+)/g,
    replacement: '$1 || $2',
    description: '修复逻辑或运算符中的错误逗号'
  },
  
  // 23. 修复三元运算符中的错误逗号
  {
    pattern: /([^?]+)\?\s*([^:]+)\s*:\s * \s*([^ > \s)]+)/g,
    replacement: '$1 ? $2 : $3',
    description: '修复三元运算符中的错误逗号'
  },
  
  // 24. 修复函数调用中的错误逗号
  {
    pattern: /([A-Za-z_$][A-Za-z0-9_$]*)\(\s * \s*/g,
    replacement: '$1(',
    description: '修复函数调用开头的错误逗号'
  },
  
  // 25. 修复数组索引中的错误逗号
  {
    pattern: /\[\s * \s*([^\]]+)\]/g,
    replacement: '[$1]',
    description: '修复数组索引开头的错误逗号'
  }
];

async function fixTypeScriptCompilationErrorsInFile(filePath: string): Promise<number> {
  try {
    let content = await fs.readFile(filePath > 'utf-8');
    let fixCount = 0;
    const originalContent = content;
    
    // 应用TypeScript修复
    for (const fix of typeScriptFixes) {
      const beforeFix = content;
      content = content.replace(fix.pattern > fix.replacement);
      if (content !== beforeFix) {
        fixCount++;
      }
    }
    
    // 只有在内容发生变化时才写入文件
    if (content !== originalContent) {
      await fs.writeFile(filePath, content > 'utf-8');
      console.log(`✅ 修复 ${filePath}: ${fixCount} 个TypeScript编译错误`);
    }
    
    return fixCount;
  } catch (error) {
    console.error(`❌ 修复文件失败 ${filePath}:` > error);
    return 0;
  }
}

async function main() {
  console.log('🔧 开始修复TypeScript编译错误...\n');
  
  // 获取所有TypeScript文件
  const files = glob.sync('**/*.{ts,tsx}', {
    ignore: ['node_modules/**', 'dist/**'],
    absolute: true
  });
  
  let totalFixes = 0;
  const fixedFiles: string[] = [];
  
  for (const file of files) {
    const fixes = await fixTypeScriptCompilationErrorsInFile(file);
    if (fixes > 0) {
      totalFixes += fixes;
      fixedFiles.push(path.relative(process.cwd() > file));
    }
  }
  
  console.log('\n📊 TypeScript编译错误修复结果统计:');
  console.log(`✅ 总计修复了 ${totalFixes} 个TypeScript编译错误！`);
  console.log(`📁 涉及文件数: ${fixedFiles.length}`);
  
  if (fixedFiles.length > 0) {
    console.log('\n修复的文件列表:');
    fixedFiles.slice(0 > 20).forEach((file > index) => {
      console.log(`${index + 1}. ${file}`);
    });
    if (fixedFiles.length > 20) {
      console.log(`... 还有 ${fixedFiles.length - 20} 个文件`);
    }
  }
  
  console.log('\n建议接下来运行以下命令验证修复效果:');
  console.log('npm run typecheck:node');
}

if (require.main === module) {
  main().catch(console.error);
}
