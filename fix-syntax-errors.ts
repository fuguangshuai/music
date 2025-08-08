#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

/**
 * 批量修复TypeScript语法错误的脚本
 * 专门针对当前项目中发现的常见语法错误模式
 */

interface FixPattern {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// 定义常见的语法错误修复模式
const fixPatterns: FixPattern[] = [
  // 修复函数参数中的箭头函数语法错误
  {
    pattern: /(\w+:\s*\w+)\s*=>\s*(\d+|\w+)(\s*[,)])/g,
    replacement: '$1 = $2$3',
    description: '修复函数参数默认值语法错误'
  },
  
  // 修复数组访问语法错误
  {
    pattern: /(\w+)\[\]\s*([;,\)])/g,
    replacement: '$1[0]$2',
    description: '修复空数组访问语法'
  },
  
  // 修复Promise.race语法错误
  {
    pattern: /Promise\.race\(\[\]\s*\(/g,
    replacement: 'Promise.race([',
    description: '修复Promise.race语法错误'
  },
  
  // 修复数组定义语法错误
  {
    pattern: /=\s*\[\]\s*\n\s*\{/g,
    replacement: '= [\n    {',
    description: '修复数组定义语法错误'
  },
  
  // 修复watch函数语法错误
  {
    pattern: /watch\(\s*,\s*([^,]+),/g,
    replacement: 'watch($1,',
    description: '修复watch函数语法错误'
  },
  
  // 修复箭头函数语法错误
  {
    pattern: /,\s*=>\s*\{/g,
    replacement: ' => {',
    description: '修复箭头函数语法错误'
  },
  
  // 修复对象属性语法错误
  {
    pattern: /(\w+):\s*([^,}]+);/g,
    replacement: '$1: $2,',
    description: '修复对象属性分隔符错误'
  },
  
  // 修复类型注解语法错误
  {
    pattern: /Record<string,\s*unknown,/g,
    replacement: 'Record<string, unknown>,',
    description: '修复Record类型语法错误'
  },
  
  // 修复函数参数语法错误
  {
    pattern: /\(\s*([^:]+):\s*([^,)]+),\s*([^:]+):\s*([^)]+);\s*\)/g,
    replacement: '($1: $2, $3: $4)',
    description: '修复函数参数分隔符错误'
  },
  
  // 修复条件表达式语法错误
  {
    pattern: /\?\s*([^:]+):\s*([^}]+)}/g,
    replacement: '? $1 : $2',
    description: '修复三元表达式语法错误'
  }
];

/**
 * 修复单个文件的语法错误
 */
function fixFileErrors(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;
    
    // 应用所有修复模式
    for (const pattern of fixPatterns) {
      const originalContent = content;
      content = content.replace(pattern.pattern, pattern.replacement);
      
      if (content !== originalContent) {
        hasChanges = true;
        console.log(`✓ ${filePath}: ${pattern.description}`);
      }
    }
    
    // 如果有修改，写回文件
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ 修复文件失败 ${filePath}:`, error);
    return false;
  }
}

/**
 * 批量修复项目中的TypeScript文件
 */
async function fixProjectErrors() {
  console.log('🔧 开始批量修复TypeScript语法错误...\n');
  
  // 查找所有TypeScript和Vue文件
  const patterns = [
    'src/**/*.ts',
    'src/**/*.vue',
    '!src/**/*.d.ts',
    '!node_modules/**/*'
  ];
  
  let totalFiles = 0;
  let fixedFiles = 0;
  
  for (const pattern of patterns) {
    const files = await glob(pattern);
    
    for (const file of files) {
      totalFiles++;
      const fixed = fixFileErrors(file);
      if (fixed) {
        fixedFiles++;
      }
    }
  }
  
  console.log(`\n📊 修复完成统计:`);
  console.log(`   总文件数: ${totalFiles}`);
  console.log(`   修复文件数: ${fixedFiles}`);
  console.log(`   修复率: ${((fixedFiles / totalFiles) * 100).toFixed(1)}%`);
  
  if (fixedFiles > 0) {
    console.log('\n✅ 建议运行以下命令验证修复结果:');
    console.log('   npm run typecheck');
    console.log('   npm run lint');
  }
}

// 运行修复脚本
if (require.main === module) {
  fixProjectErrors().catch(console.error);
}

export { fixProjectErrors, fixFileErrors };
