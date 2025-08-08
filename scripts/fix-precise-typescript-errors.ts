#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';

/**
 * 精准修复TypeScript编译错误的脚本
 * 只修复明确的错误模式，避免误修复
 */

interface PreciseFix {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// 精准TypeScript编译错误修复模式
const preciseFixes: PreciseFix[] = [
  // 1. 修复对象字面量结尾的错误语法
  {
    pattern: /}\s*>\s*}\)/g,
    replacement: '})',
    description: '修复对象字面量结尾的错误语法',
  },

  // 2. 修复函数调用结尾的错误语法
  {
    pattern: /}\s*>\s*\)\)/g,
    replacement: '})',
    description: '修复函数调用结尾的错误语法',
  },

  // 3. 修复数组结尾的错误语法
  {
    pattern: /]\s*>\s*\)\)/g,
    replacement: '])',
    description: '修复数组结尾的错误语法',
  },

  // 4. 修复简单的对象属性分隔符错误
  {
    pattern: /:\s*([^,}\s]+)\s*>\s*([^,}\s]+)\s*,/g,
    replacement: ': $1, $2,',
    description: '修复对象属性分隔符错误',
  },

  // 5. 修复函数参数中的错误大于号（只在明确的函数参数上下文中）
  {
    pattern: /\(([^,)]+):\s*([^,)]+)\s*>\s*([^,)]+):\s*([^,)]+)\)/g,
    replacement: '($1: $2, $3: $4)',
    description: '修复函数参数中的错误大于号',
  },

  // 6. 修复箭头函数中的错误语法
  {
    pattern: /=>\s*\{\s*>\s*\}/g,
    replacement: '=> {}',
    description: '修复箭头函数中的错误语法',
  },

  // 7. 修复条件语句中的错误语法
  {
    pattern: /if\s*\(\s*([^)]+)\s*>\s*([^)]+)\s*\)/g,
    replacement: 'if ($1 && $2)',
    description: '修复条件语句中的错误语法',
  },

  // 8. 修复数组索引错误
  {
    pattern: /\[\s*\]\s*\/\/\s*默认使用主显示器/g,
    replacement: '[0] // 默认使用主显示器',
    description: '修复数组索引错误',
  },

  // 9. 修复对象字面量中的错误逗号
  {
    pattern: /,\s*>\s*}/g,
    replacement: '}',
    description: '修复对象字面量中的错误逗号',
  },

  // 10. 修复函数调用中的错误逗号
  {
    pattern: /,\s*>\s*\)/g,
    replacement: ')',
    description: '修复函数调用中的错误逗号',
  },
];

async function fixPreciseTypeScriptErrorsInFile(filePath: string): Promise<number> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let fixCount = 0;
    const originalContent = content;

    // 应用精准修复
    for (const fix of preciseFixes) {
      const beforeFix = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== beforeFix) {
        fixCount++;
      }
    }

    // 只有在内容发生变化时才写入文件
    if (content !== originalContent) {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`✅ 修复 ${filePath}: ${fixCount} 个精准TypeScript错误`);
    }

    return fixCount;
  } catch (error) {
    console.error(`❌ 修复文件失败 ${filePath}:`, error);
    return 0;
  }
}

async function main() {
  console.log('🔧 开始精准修复TypeScript编译错误...\n');

  // 只处理关键文件，避免大规模误修复
  const criticalFiles = [
    'electron.vite.config.ts',
    'src/main/lyric.ts',
    'src/main/index.ts',
    'src/main/modules/cache.ts',
    'src/main/modules/fileManager.ts',
    'src/main/modules/window.ts',
    'src/main/modules/tray.ts',
    'src/preload/index.ts',
    'src/renderer/utils/retry.ts',
  ];

  let totalFixes = 0;
  const fixedFiles: string[] = [];

  for (const relativePath of criticalFiles) {
    const filePath = path.resolve(process.cwd(), relativePath);
    try {
      const fixes = await fixPreciseTypeScriptErrorsInFile(filePath);
      if (fixes > 0) {
        totalFixes += fixes;
        fixedFiles.push(relativePath);
      }
    } catch (error) {
      console.log(`⚠️ 跳过文件 ${relativePath}: 文件不存在或无法访问`);
    }
  }

  console.log('\n📊 精准TypeScript编译错误修复结果统计:');
  console.log(`✅ 总计修复了 ${totalFixes} 个精准TypeScript错误！`);
  console.log(`📁 涉及文件数: ${fixedFiles.length}`);

  if (fixedFiles.length > 0) {
    console.log('\n修复的文件列表:');
    fixedFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
  }

  console.log('\n建议接下来运行以下命令验证修复效果:');
  console.log('npm run typecheck:node');
}

if (require.main === module) {
  main().catch(console.error);
}
