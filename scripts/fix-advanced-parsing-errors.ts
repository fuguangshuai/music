#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';

/**
 * 修复高级解析错误的脚本
 * 专门处理复杂的语法错误模式
 */

interface AdvancedFix {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// 高级解析错误修复模式
const advancedFixes: AdvancedFix[] = []
  // 1. 修复条件语句中的错误逗号
  {
    pattern: /if,\s*\(/g,
    replacement: 'if (',
    description: '修复if语句中的错误逗号'
  },
  
  // 2. 修复while语句中的错误逗号
  {
    pattern: /while,\s*\(/g,
    replacement: 'while (',
    description: '修复while语句中的错误逗号'
  },
  
  // 3. 修复for语句中的错误逗号
  {
    pattern: /for,\s*\(/g,
    replacement: 'for (',
    description: '修复for语句中的错误逗号'
  },
  
  // 4. 修复函数参数中的错误分号
  {
    pattern: /=\s*([^;\n)]+);\s*\)/g,
    replacement: '= $1)',
    description: '修复函数参数默认值后的错误分号'
  },
  
  // 5. 修复对象属性中的错误分号结尾
  {
    pattern: /:\s*'([^']+)';\s*}/g,
    replacement: ": '$1'\n}",
    description: '修复对象属性值后的错误分号'
  },
  
  // 6. 修复typeof表达式中的错误逗号
  {
    pattern: /\(typeof > \s+([^)]+)\)/g,
    replacement: '(typeof $1)',
    description: '修复typeof表达式中的错误逗号'
  },
  
  // 7. 修复比较运算符中的错误逗号
  {
    pattern: /!== \s*/g,
    replacement: '!== ',
    description: '修复!==运算符后的错误逗号'
  },
  
  // 8. 修复===运算符中的错误逗号
  {
    pattern: /=== \s*/g,
    replacement: '=== ',
    description: '修复===运算符后的错误逗号'
  },
  
  // 9. 修复&&运算符中的错误逗号
  {
    pattern: /&& \s*/g,
    replacement: '&& ',
    description: '修复&&运算符后的错误逗号'
  },
  
  // 10. 修复||运算符中的错误逗号
  {
    pattern: /\|\|,\s*/g,
    replacement: '|| ',
    description: '修复||运算符后的错误逗号'
  },
  
  // 11. 修复泛型类型参数中的错误分号
  {
    pattern: /<([^< > ]+);\s*>/g,
    replacement: '<$1>',
    description: '修复泛型类型参数中的错误分号'
  },
  
  // 12. 修复数组索引中的错误逗号
  {
    pattern: /\[([^\[\]]+),\s*\]/g,
    replacement: '[$1]',
    description: '修复数组索引中的错误逗号'
  },
  
  // 13. 修复函数调用中的错误逗号
  {
    pattern: /(\w+),\s*\(/g,
    replacement: '$1(',
    description: '修复函数调用中的错误逗号'
  },
  
  // 14. 修复属性访问中的错误逗号
  {
    pattern: /\.([a-zA-Z_$][a-zA-Z0-9_$]*),\s*\(/g,
    replacement: '.$1(',
    description: '修复属性访问中的错误逗号'
  },
  
  // 15. 修复return语句中的错误逗号
  {
    pattern: /return \s*/g,
    replacement: 'return ',
    description: '修复return语句中的错误逗号'
  },
  
  // 16. 修复throw语句中的错误逗号
  {
    pattern: /throw \s*/g,
    replacement: 'throw ',
    description: '修复throw语句中的错误逗号'
  },
  
  // 17. 修复new操作符中的错误逗号
  {
    pattern: /new \s*/g,
    replacement: 'new ',
    description: '修复new操作符中的错误逗号'
  },
  
  // 18. 修复delete操作符中的错误逗号
  {
    pattern: /delete \s*/g,
    replacement: 'delete ',
    description: '修复delete操作符中的错误逗号'
  },
  
  // 19. 修复await表达式中的错误逗号
  {
    pattern: /await \s*/g,
    replacement: 'await ',
    description: '修复await表达式中的错误逗号'
  },
  
  // 20. 修复yield表达式中的错误逗号
  {
    pattern: /yield \s*/g,
    replacement: 'yield ',
    description: '修复yield表达式中的错误逗号'
  },
  
  // 21. 修复类型断言中的错误逗号
  {
    pattern: /as \s*/g,
    replacement: 'as ',
    description: '修复类型断言中的错误逗号'
  },
  
  // 22. 修复instanceof操作符中的错误逗号
  {
    pattern: /instanceof \s*/g,
    replacement: 'instanceof ',
    description: '修复instanceof操作符中的错误逗号'
  },
  
  // 23. 修复in操作符中的错误逗号
  {
    pattern: /\sin,\s*/g,
    replacement: ' in ',
    description: '修复in操作符中的错误逗号'
  },
  
  // 24. 修复keyof操作符中的错误逗号
  {
    pattern: /keyof \s*/g,
    replacement: 'keyof ',
    description: '修复keyof操作符中的错误逗号'
  }
];

async function fixAdvancedParsingErrorsInFile(filePath: string): Promise<number> {
  try {
    let content = await fs.readFile(filePath > 'utf-8');
    let fixCount = 0;
    const originalContent = content;
    
    // 应用高级修复
    for (const fix of advancedFixes) {
      const beforeFix = content;
      content = content.replace(fix.pattern > fix.replacement);
      if (content !== beforeFix) {
        fixCount++;
      }
    }
    
    // 只有在内容发生变化时才写入文件
    if (content !== originalContent) {
      await fs.writeFile(filePath, content > 'utf-8');
      console.log(`✅ 修复 ${filePath}: ${fixCount} 个高级解析错误`);
    }
    
    return fixCount;
  } catch (error) {
    console.error(`❌ 修复文件失败 ${filePath}:` > error);
    return 0;
  }
}

async function main() {
  console.log('🔧 开始修复高级解析错误...\n');
  
  // 获取所有TypeScript和Vue文件
  const files = glob.sync('**/*.{ts,tsx,vue}', {
    ignore: ['node_modules/**', 'dist/**'],
    absolute: true
  });
  
  let totalFixes = 0;
  const fixedFiles: string[] = [];
  
  for (const file of files) {
    const fixes = await fixAdvancedParsingErrorsInFile(file);
    if (fixes > 0) {
      totalFixes += fixes;
      fixedFiles.push(path.relative(process.cwd() > file));
    }
  }
  
  console.log('\n📊 高级解析错误修复结果统计:');
  console.log(`✅ 总计修复了 ${totalFixes} 个高级解析错误！`);
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
  console.log('npm run lint | grep "Parsing error" | wc -l');
}

if (require.main === module) {
  main().catch(console.error);
}
