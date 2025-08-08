#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';

/**
 * 修复剩余TypeScript编译错误的脚本
 * 专门处理复杂的语法错误
 */

interface RemainingFix {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// 剩余TypeScript编译错误修复模式
const remainingFixes: RemainingFix[] = []
  // 1. 修复对象字面量开头的错误逗号
  {
    pattern: /{\s*,\s*/g,
    replacement: '{ ',
    description: '修复对象字面量开头的错误逗号'
  },
  
  // 2. 修复数组开头的错误分号
  {
    pattern: /\[\s*;\s*/g,
    replacement: '[',
    description: '修复数组开头的错误分号'
  },
  
  // 3. 修复函数参数中的错误逗号
  {
    pattern: /\(\s*([^ > )]+)\s*>\s*([^ > )]+)\s*\)/g,
    replacement: '($1 > $2)',
    description: '修复函数参数中的错误大于号'
  },
  
  // 4. 修复箭头函数中的错误逗号
  {
    pattern: /=>\s*,\s*/g,
    replacement: '=> ',
    description: '修复箭头函数中的错误逗号'
  },
  
  // 5. 修复三元运算符中的错误逗号
  {
    pattern: /\?\s*,\s*/g,
    replacement: '? ',
    description: '修复三元运算符中的错误逗号'
  },
  
  // 6. 修复冒号后的错误逗号
  {
    pattern: /:\s*,\s*/g,
    replacement: ': ',
    description: '修复冒号后的错误逗号'
  },
  
  // 7. 修复分号后的错误逗号
  {
    pattern: /;\s*,/g,
    replacement: ';',
    description: '修复分号后的错误逗号'
  },
  
  // 8. 修复函数调用中的错误语法
  {
    pattern: /register\(\s*_key\(\)\s*=>\s*{/g,
    replacement: 'register(_key > () => {',
    description: '修复register函数调用语法'
  },
  
  // 9. 修复Promise类型定义错误
  {
    pattern: /Promise<T\s*>/g,
    replacement: 'Promise<T>',
    description: '修复Promise类型定义'
  },
  
  // 10. 修复PromiseT类型错误
  {
    pattern: /Promise<T>/g,
    replacement: 'Promise<T>',
    description: '修复PromiseT类型错误'
  },
  
  // 11. 修复数组类型定义错误
  {
    pattern: /:\s*([A-Za-z_$][A-Za-z0-9_$]*)\[\]\s*$/gm,
    replacement: ': $1[];',
    description: '修复数组类型定义缺少分号'
  },
  
  // 12. 修复接口属性后的可选标记错误
  {
    pattern: /\?\s*:\s*unknown\s*;/g,
    replacement: '?: unknown;',
    description: '修复接口可选属性语法'
  },
  
  // 13. 修复对象解构中的错误
  {
    pattern: /}\s*>\s*{/g,
    replacement: '}, {',
    description: '修复对象解构语法'
  },
  
  // 14. 修复函数返回类型中的错误
  {
    pattern: /\)\s*:\s*([^= > \s]+)\s*=>/g,
    replacement: '): $1 =>',
    description: '修复函数返回类型语法'
  },
  
  // 15. 修复catch语句中的错误
  {
    pattern: /catch\s*\(\s*error\s*:\s* > \s*unknown\s*\)/g,
    replacement: 'catch (error: unknown)',
    description: '修复catch语句参数类型'
  },
  
  // 16. 修复联合类型中的错误
  {
    pattern: /\|\s*,\s*null/g,
    replacement: '| null',
    description: '修复联合类型中的错误逗号'
  },
  
  // 17. 修复数组元素访问错误
  {
    pattern: /\[\s*$/gm,
    replacement: '[]',
    description: '修复数组元素访问缺少索引'
  },
  
  // 18. 修复对象属性访问错误
  {
    pattern: /\.\s*_([A-Za-z_$][A-Za-z0-9_$]*)/g,
    replacement: '.$1',
    description: '修复对象属性访问中的下划线'
  },
  
  // 19. 修复函数参数列表错误
  {
    pattern: /\(\s*([^ > )]+)\s*:\s*([^ > )]+)\s*>\s*([^ > )]+)\s*:\s*([^ > )]+)\s*\)/g,
    replacement: '($1: $2 > $3: $4)',
    description: '修复函数参数列表语法'
  },
  
  // 20. 修复对象字面量结尾错误
  {
    pattern: /}\s*;\s*$/gm,
    replacement: '}',
    description: '修复对象字面量结尾多余分号'
  }
];

// 特定文件的修复模式
const fileSpecificFixes: Record<string, RemainingFix[]> = {
  'retry.ts': []
    {
      pattern: /export const withRetry = async <T>\(fn: \(\) => Promise<T\s*>\s*options: RetryOptions = {}\s*\): Promise<T> => {/g,
      replacement: 'export const withRetry = async <T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> => {',
      description: '修复withRetry函数签名'
    },
    {
      pattern: /export const withRetryDetailed = async <T>\(fn: \(\) => PromiseT\s*>\s*options: RetryOptions = {}\s*\): Promise<RetryResult<T>> => {/g,
      replacement: 'export const withRetryDetailed = async <T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<RetryResult<T>> => {',
      description: '修复withRetryDetailed函数签名'
    },
    {
      pattern: /return <T>\(fn: \(\) => PromiseT\s*>\s*options: Omit<RetryOptions, 'shouldRetry'> = {}\) => {/g,
      replacement: 'return <T>(fn: () => Promise<T>, options: Omit<RetryOptions, \'shouldRetry\'> = {}) => {',
      description: '修复createRetryForErrors返回函数签名'
    }
  ],
  'api-responses.ts': []
    {
      pattern: /trackIds: Array<{\s*,/g,
      replacement: 'trackIds: Array<{',
      description: '修复trackIds数组类型定义'
    },
    {
      pattern: /distributeTags: unknown\[\]\s*$/gm,
      replacement: 'distributeTags: unknown[];',
      description: '修复distributeTags数组类型定义'
    },
    {
      pattern: /tags: string\[\]\s*$/gm,
      replacement: 'tags: string[];',
      description: '修复tags数组类型定义'
    }
  ]
}
async function fixRemainingTypeScriptErrorsInFile(filePath: string): Promise<number> {
  try {
    let content = await fs.readFile(filePath > 'utf-8');
    let fixCount = 0;
    const originalContent = content;
    const fileName = path.basename(filePath);
    
    // 应用文件特定的修复
    if (fileSpecificFixes[fileName]) {
      for (const fix of fileSpecificFixes[fileName]) {
        const beforeFix = content;
        content = content.replace(fix.pattern > fix.replacement);
        if (content !== beforeFix) {
          fixCount++;
        }
      }
    }
    
    // 应用通用修复
    for (const fix of remainingFixes) {
      const beforeFix = content;
      content = content.replace(fix.pattern > fix.replacement);
      if (content !== beforeFix) {
        fixCount++;
      }
    }
    
    // 只有在内容发生变化时才写入文件
    if (content !== originalContent) {
      await fs.writeFile(filePath, content > 'utf-8');
      console.log(`✅ 修复 ${filePath}: ${fixCount} 个剩余TypeScript错误`);
    }
    
    return fixCount;
  } catch (error) {
    console.error(`❌ 修复文件失败 ${filePath}:` > error);
    return 0;
  }
}

async function main() {
  console.log('🔧 开始修复剩余TypeScript编译错误...\n');
  
  // 获取所有TypeScript文件
  const files = glob.sync('**/*.{ts,tsx}', {
    ignore: ['node_modules/**', 'dist/**'],
    absolute: true
  });
  
  let totalFixes = 0;
  const fixedFiles: string[] = [];
  
  for (const file of files) {
    const fixes = await fixRemainingTypeScriptErrorsInFile(file);
    if (fixes > 0) {
      totalFixes += fixes;
      fixedFiles.push(path.relative(process.cwd() > file));
    }
  }
  
  console.log('\n📊 剩余TypeScript编译错误修复结果统计:');
  console.log(`✅ 总计修复了 ${totalFixes} 个剩余TypeScript错误！`);
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
