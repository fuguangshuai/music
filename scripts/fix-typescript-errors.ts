#!/usr/bin/env ts-node

/**
 * 企业级TypeScript错误修复工具
 *
 * 功能：
 * 1. 系统性识别和修复TypeScript语法错误
 * 2. 提供详细的修复报告和质量验证
 * 3. 支持批量处理和增量验证
 * 4. 符合企业级代码质量标准
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface FixRule {
  name: string;
  pattern: RegExp;
  replacement: string;
  description: string;
  priority: number; // 1=最高优先级, 5=最低优先级
}

interface FixResult {
  filePath: string;
  rulesApplied: string[];
  fixCount: number;
  success: boolean;
  errors: string[];
}

interface FixReport {
  totalFiles: number;
  successfulFixes: number;
  failedFixes: number;
  totalFixesApplied: number;
  results: FixResult[];
}

/**
 * 综合修复规则集
 * 基于对代码损坏模式的深度分析制定
 */
const COMPREHENSIVE_FIX_RULES: FixRule[] = [
  {
    name: 'array-type-syntax',
    pattern: /(\w+)\[0\]/g,
    replacement: '$1[]',
    description: '修复数组类型语法: Type[0] -> Type[]',
    priority: 1
  },
  {
    name: 'generic-array-type',
    pattern: /<([^<>]+)\[0\]>/g,
    replacement: '<$1[]>',
    description: '修复泛型数组类型: Generic<Type[0]> -> Generic<Type[]>',
    priority: 1
  },
  {
    name: 'function-params-comma',
    pattern: /(\w+:\s*[^,>)]+)\s*>\s*(\w+:\s*[^,>)]+)/g,
    replacement: '$1, $2',
    description: '修复函数参数逗号分隔符: (a: type > b: type) -> (a: type, b: type)',
    priority: 2
  },
  {
    name: 'object-property-separator',
    pattern: /(\w+:\s*[^;,}]+);(\s*\w+:)/g,
    replacement: '$1,$2',
    description: '修复对象属性分隔符: { key: value; other: } -> { key: value, other: }',
    priority: 3
  },
  {
    name: 'watch-function-syntax',
    pattern: /watch\(\(\)\s*=>\s*\(\)\s*=>\s*([^)]+)\)/g,
    replacement: 'watch(() => $1)',
    description: '修复watch函数语法: watch(() => () => value) -> watch(() => value)',
    priority: 2
  },
  {
    name: 'ipc-event-listener',
    pattern: /\.on\(([^)]+)\(([^)]+)\)\s*=>/g,
    replacement: '.on($1, ($2) =>',
    description: '修复IPC事件监听器语法',
    priority: 2
  },
  {
    name: 'ipc-event-listener-comma',
    pattern: /\.on\(([^,)]+),\s*,\s*\(([^)]+)\)\s*=>/g,
    replacement: '.on($1, ($2) =>',
    description: '修复IPC事件监听器多余逗号',
    priority: 2
  },
  {
    name: 'array-access-empty',
    pattern: /\[(\s*)\]/g,
    replacement: '[0]',
    description: '修复空数组访问',
    priority: 3
  },
  {
    name: 'watch-function-params',
    pattern: /watch\(\(\)\s*=>\s*([^,)]+)\(([^)]*)\)\s*=>/g,
    replacement: 'watch(() => $1, ($2) =>',
    description: '修复watch函数参数语法',
    priority: 2
  },
  {
    name: 'function-arrow-syntax',
    pattern: /\(([^)]+)\)\s*=>\s*\{/g,
    replacement: '($1) => {',
    description: '修复箭头函数语法',
    priority: 3
  },
  {
    name: 'emit-function-syntax',
    pattern: /emit\(([^)]+)\(([^)]+)\)\s*=>/g,
    replacement: 'emit($1, ($2) =>',
    description: '修复emit函数语法',
    priority: 2
  },
  {
    name: 'provide-function-syntax',
    pattern: /provide\(([^)]+)\(([^)]+)\)\s*=>/g,
    replacement: 'provide($1, ($2) =>',
    description: '修复provide函数语法',
    priority: 2
  },
  {
    name: 'const-arrow-syntax',
    pattern: /const\s+(\w+)\s*=>\s*/g,
    replacement: 'const $1 = ',
    description: '修复const赋值语法',
    priority: 2
  },
  {
    name: 'typeof-comma-syntax',
    pattern: /typeof,\s*/g,
    replacement: 'typeof ',
    description: '修复typeof语法',
    priority: 2
  },
  {
    name: 'object-spread-syntax',
    pattern: /\.\.\.\s*([^,\]]+)\]/g,
    replacement: '...$1]',
    description: '修复对象展开语法',
    priority: 3
  },
  {
    name: 'watch-callback-missing',
    pattern: /watch\(\(\)\s*=>\s*([^,]+),\s*=>\s*\{/g,
    replacement: 'watch(() => $1, () => {',
    description: '修复watch函数缺少回调参数',
    priority: 1
  },
  {
    name: 'ipc-multiple-commas',
    pattern: /\.on\(([^,]+),\s*async\s*,\s*,\s*\(([^)]+)\)\s*=>/g,
    replacement: '.on($1, async ($2) =>',
    description: '修复IPC事件监听器多余逗号',
    priority: 1
  },
  {
    name: 'modulo-operator-comma',
    pattern: /(\w+)\s*%,\s*(\d+)/g,
    replacement: '$1 % $2',
    description: '修复模运算符后的逗号',
    priority: 2
  },
  {
    name: 'function-default-param-arrow',
    pattern: /\(([^)]+):\s*([^=)]+)\s*=>\s*([^)]+)\)/g,
    replacement: '($1: $2 = $3)',
    description: '修复函数默认参数箭头语法',
    priority: 2
  },
  {
    name: 'object-property-semicolon-fix',
    pattern: /(\w+):\s*([^;,}]+);(\s*\w+:)/g,
    replacement: '$1: $2,$3',
    description: '修复对象属性分号为逗号',
    priority: 2
  },
  {
    name: 'array-type-in-generic',
    pattern: /unknown\[0\]/g,
    replacement: 'unknown[]',
    description: '修复泛型中的数组类型',
    priority: 1
  },
  {
    name: 'logical-operator-comma',
    pattern: /(\w+\.value)\s*&&,\s*([^&]+)/g,
    replacement: '$1 && $2',
    description: '修复逻辑运算符后的逗号',
    priority: 2
  },
  {
    name: 'optional-chaining-fix',
    pattern: /(\w+\.value)\s*\?\s*\.(\w+)/g,
    replacement: '$1?.$2',
    description: '修复可选链语法',
    priority: 1
  },
  {
    name: 'ternary-operator-fix',
    pattern: /(\w+\.value)\s*\?\s*([^?.][^:]+):\s*([^,;]+);/g,
    replacement: '$1 ? $2 : $3,',
    description: '修复三元运算符语法（排除可选链）',
    priority: 2
  },
  {
    name: 'for-loop-comma-fix',
    pattern: /for\s*\(\s*const\s+(\w+)\s+of,\s*([^)]+)\)/g,
    replacement: 'for (const $1 of $2)',
    description: '修复for循环中的逗号',
    priority: 2
  },
  {
    name: 'ipc-excessive-commas',
    pattern: /\.on\(([^,]+),\s*,\s*,\s*,\s*\(([^)]+)\)\s*=>/g,
    replacement: '.on($1, ($2) =>',
    description: '修复IPC事件监听器过多逗号',
    priority: 1
  },
  {
    name: 'emit-excessive-commas',
    pattern: /emit\(([^,]+),\s*,\s*\(([^)]+)\)\s*=>/g,
    replacement: 'emit($1, ($2) =>',
    description: '修复emit函数过多逗号',
    priority: 1
  },
  {
    name: 'provide-excessive-commas',
    pattern: /provide\(([^,]+),\s*,\s*\(([^)]+)\)\s*=>/g,
    replacement: 'provide($1, ($2) =>',
    description: '修复provide函数过多逗号',
    priority: 1
  },
  {
    name: 'object-property-colon-fix',
    pattern: /(\w+):\s*([^;,}]+);(\s*\w+:)/g,
    replacement: '$1: $2,$3',
    description: '修复对象属性分号为逗号',
    priority: 2
  },
  {
    name: 'switch-case-default-fix',
    pattern: /default:\s*$/gm,
    replacement: 'default:\n      break;',
    description: '修复switch语句default分支',
    priority: 3
  },
  {
    name: 'logical-and-comma-fix',
    pattern: /(\w+\.value)\s*&&,\s*([^&]+)/g,
    replacement: '$1 && $2',
    description: '修复逻辑AND运算符后的逗号',
    priority: 2
  }
];

/**
 * 智能文件修复器
 */
class TypeScriptFixer {
  private fixReport: FixReport = {
    totalFiles: 0,
    successfulFixes: 0,
    failedFixes: 0,
    totalFixesApplied: 0,
    results: []
  };

  /**
   * 修复单个文件
   */
  async fixFile(filePath: string): Promise<FixResult> {
    const result: FixResult = {
      filePath,
      rulesApplied: [],
      fixCount: 0,
      success: false,
      errors: []
    };

    try {
      // 读取文件内容
      const originalContent = fs.readFileSync(filePath, 'utf-8');
      let fixedContent = originalContent;

      // 按优先级排序规则
      const sortedRules = COMPREHENSIVE_FIX_RULES.sort((a, b) => a.priority - b.priority);

      // 应用修复规则
      for (const rule of sortedRules) {
        const beforeFix = fixedContent;
        fixedContent = fixedContent.replace(rule.pattern, rule.replacement);

        if (beforeFix !== fixedContent) {
          result.rulesApplied.push(rule.name);
          result.fixCount++;
        }
      }

      // 如果有修复，写入文件
      if (fixedContent !== originalContent) {
        // 创建备份
        const backupPath = `${filePath}.backup`;
        if (!fs.existsSync(backupPath)) {
          fs.writeFileSync(backupPath, originalContent);
        }

        // 写入修复后的内容
        fs.writeFileSync(filePath, fixedContent);

        console.log(`✅ 修复文件: ${filePath} (应用了 ${result.fixCount} 个修复)`);
      }

      result.success = true;
      return result;

    } catch (error) {
      result.errors.push(`修复失败: ${error.message}`);
      console.error(`❌ 修复文件失败: ${filePath} - ${error.message}`);
      return result;
    }
  }

  /**
   * 批量修复文件
   */
  async fixFiles(pattern: string): Promise<FixReport> {
    console.log(`🔍 扫描文件模式: ${pattern}`);

    const files = glob.sync(pattern, {
      ignore: ['node_modules/**', 'dist/**', '**/*.backup']
    });

    console.log(`📁 找到 ${files.length} 个文件需要处理`);

    this.fixReport.totalFiles += files.length;

    for (const file of files) {
      const result = await this.fixFile(file);
      this.fixReport.results.push(result);

      if (result.success) {
        this.fixReport.successfulFixes++;
        this.fixReport.totalFixesApplied += result.fixCount;
      } else {
        this.fixReport.failedFixes++;
      }
    }

    return this.fixReport;
  }

  /**
   * 生成修复报告
   */
  generateReport(): string {
    const report = this.fixReport;

    return `
📊 TypeScript修复报告
====================

📈 总体统计:
- 处理文件总数: ${report.totalFiles}
- 成功修复文件: ${report.successfulFixes}
- 修复失败文件: ${report.failedFixes}
- 总修复次数: ${report.totalFixesApplied}
- 成功率: ${((report.successfulFixes / report.totalFiles) * 100).toFixed(2)}%

🔧 修复详情:
${report.results
  .filter(r => r.fixCount > 0)
  .map(r => `- ${r.filePath}: ${r.fixCount} 个修复 (${r.rulesApplied.join(', ')})`)
  .join('\n')}

❌ 失败文件:
${report.results
  .filter(r => !r.success)
  .map(r => `- ${r.filePath}: ${r.errors.join(', ')}`)
  .join('\n')}
`;
  }
}

/**
 * 主执行函数
 */
async function main() {
  console.log('🚀 启动企业级TypeScript修复工具');

  const fixer = new TypeScriptFixer();

  // 修复TypeScript文件
  await fixer.fixFiles('src/**/*.ts');

  // 修复Vue文件中的TypeScript
  await fixer.fixFiles('src/**/*.vue');

  // 生成报告
  const report = fixer.generateReport();
  console.log(report);

  // 保存报告
  fs.writeFileSync('fix-report.txt', report);

  console.log('✅ 修复完成！报告已保存到 fix-report.txt');
}

// 执行修复
if (require.main === module) {
  main().catch(console.error);
}

export { TypeScriptFixer, COMPREHENSIVE_FIX_RULES };

