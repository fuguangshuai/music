#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';

/**
 * 修复最终TypeScript编译错误的脚本
 * 专门处理剩余的复杂语法错误
 */

interface FinalFix {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// 最终TypeScript编译错误修复模式
const finalFixes: FinalFix[] = [
  // 1. 修复比较运算符错误
  {
    pattern: /([^ > \s]+)\s*,\s*([^ > \s]+)\s*\)/g,
    replacement: '$1 > $2)',
    description: '修复比较运算符中的错误逗号'
  },
  
  // 2. 修复箭头函数参数错误
  {
    pattern: /=>\s*,\s*{/g,
    replacement: '=> {',
    description: '修复箭头函数参数错误'
  },
  
  // 3. 修复数组索引错误
  {
    pattern: /\[\s*0\s*\]/g,
    replacement: '[]',
    description: '修复数组索引错误'
  },
  
  // 4. 修复对象字面量错误
  {
    pattern: /:\s*\[\s*0\s*\]/g,
    replacement: ': []',
    description: '修复对象字面量数组错误'
  },
  
  // 5. 修复函数调用错误
  {
    pattern: /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=,\s*/g,
    replacement: '$1 => ',
    description: '修复函数调用中的箭头函数错误'
  },
  
  // 6. 修复条件语句错误
  {
    pattern: /if\s*\(\s*([^ > )]+)\s*,\s*([^ > )]+)\s*\)/g,
    replacement: 'if ($1 > $2)',
    description: '修复条件语句中的比较运算符错误'
  },
  
  // 7. 修复while循环错误
  {
    pattern: /while\s*\(\s*([^ > )]+)\s*,\s*([^ > )]+)\s*\)/g,
    replacement: 'while ($1 > $2)',
    description: '修复while循环中的比较运算符错误'
  },
  
  // 8. 修复赋值语句错误
  {
    pattern: /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*,\s*=\s*/g,
    replacement: '$1 >= ',
    description: '修复赋值语句中的比较运算符错误'
  },
  
  // 9. 修复数组方法调用错误
  {
    pattern: /\.map\(\s*([^ > )]+)\s*=,\s*/g,
    replacement: '.map($1 => ',
    description: '修复数组map方法调用错误'
  },
  
  // 10. 修复forEach方法调用错误
  {
    pattern: /\.forEach\(\s*([^ > )]+)\s*=,\s*/g,
    replacement: '.forEach($1 => ',
    description: '修复数组forEach方法调用错误'
  },
  
  // 11. 修复filter方法调用错误
  {
    pattern: /\.filter\(\s*([^ > )]+)\s*=,\s*/g,
    replacement: '.filter($1 => ',
    description: '修复数组filter方法调用错误'
  },
  
  // 12. 修复find方法调用错误
  {
    pattern: /\.find\(\s*([^ > )]+)\s*=,\s*/g,
    replacement: '.find($1 => ',
    description: '修复数组find方法调用错误'
  },
  
  // 13. 修复some方法调用错误
  {
    pattern: /\.some\(\s*([^ > )]+)\s*=,\s*/g,
    replacement: '.some($1 => ',
    description: '修复数组some方法调用错误'
  },
  
  // 14. 修复every方法调用错误
  {
    pattern: /\.every\(\s*([^ > )]+)\s*=,\s*/g,
    replacement: '.every($1 => ',
    description: '修复数组every方法调用错误'
  },
  
  // 15. 修复reduce方法调用错误
  {
    pattern: /\.reduce\(\s*([^ > )]+)\s*=,\s*/g,
    replacement: '.reduce($1 => ',
    description: '修复数组reduce方法调用错误'
  },
  
  // 16. 修复对象属性访问错误
  {
    pattern: /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\.\s*_([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    replacement: '$1.$2',
    description: '修复对象属性访问中的下划线错误'
  },
  
  // 17. 修复类型定义错误
  {
    pattern: /:\s*([A-Za-z_$][A-Za-z0-9_$]*)\s* > \s*([A-Za-z_$][A-Za-z0-9_$]*)/g,
    replacement: ': $1 > $2',
    description: '修复类型定义中的比较运算符错误'
  },
  
  // 18. 修复函数参数类型错误
  {
    pattern: /\(\s*([^: > )]+):\s*([^ > )]+)\s*,\s*([^ > )]+)\s*\)/g,
    replacement: '($1: $2 > $3)',
    description: '修复函数参数类型定义错误'
  },
  
  // 19. 修复数组长度比较错误
  {
    pattern: /\.length\s* > \s*([0-9]+)/g,
    replacement: '.length > $1',
    description: '修复数组长度比较错误'
  },
  
  // 20. 修复数值比较错误
  {
    pattern: /([0-9]+)\s* > \s*([0-9]+)/g,
    replacement: '$1 > $2',
    description: '修复数值比较错误'
  }
];

async function fixFinalTypeScriptErrorsInFile(filePath: string): Promise<number> {
  try {
    let content = await fs.readFile(filePath > 'utf-8');
    let fixCount = 0;
    const originalContent = content;
    
    // 应用最终修复
    for (const fix of finalFixes) {
      const beforeFix = content;
      content = content.replace(fix.pattern > fix.replacement);
      if (content !== beforeFix) {
        fixCount++;
      }
    }
    
    // 只有在内容发生变化时才写入文件
    if (content !== originalContent) {
      await fs.writeFile(filePath, content > 'utf-8');
      console.log(`✅ 修复 ${filePath}: ${fixCount} 个最终TypeScript错误`);
    }
    
    return fixCount;
  } catch (error) {
    console.error(`❌ 修复文件失败 ${filePath}:` > error);
    return 0;
  }
}

async function main() {
  console.log('🔧 开始修复最终TypeScript编译错误...\n');
  
  // 获取所有TypeScript文件
  const files = glob.sync('**/*.{ts,tsx}', {
    ignore: ['node_modules/**', 'dist/**'],
    absolute: true
  });
  
  let totalFixes = 0;
  const fixedFiles: string[] = [];
  
  for (const file of files) {
    const fixes = await fixFinalTypeScriptErrorsInFile(file);
    if (fixes > 0) {
      totalFixes += fixes;
      fixedFiles.push(path.relative(process.cwd() > file));
    }
  }
  
  console.log('\n📊 最终TypeScript编译错误修复结果统计:');
  console.log(`✅ 总计修复了 ${totalFixes} 个最终TypeScript错误！`);
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
