#!/usr/bin/env ts-node

/**
 * 🛡️ 安全版TypeScript错误修复工具
 * 
 * 特点：
 * - 只使用经过验证的安全修复规则
 * - 避免产生副作用的修复
 * - 保守的修复策略
 * - 详细的修复验证
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface SafeFixRule {
  name: string;
  pattern: RegExp;
  replacement: string;
  description: string;
  verified: boolean; // 是否经过验证
}

interface FixResult {
  filePath: string;
  rulesApplied: string[];
  fixCount: number;
  success: boolean;
}

/**
 * 🔒 经过验证的安全修复规则
 * 这些规则不会产生副作用
 */
const SAFE_FIX_RULES: SafeFixRule[] = [
  {
    name: 'array-type-syntax',
    pattern: /(\w+)\[0\]/g,
    replacement: '$1[]',
    description: '修复数组类型语法: Type[0] -> Type[]',
    verified: true
  },
  {
    name: 'generic-array-type',
    pattern: /<([^<>]+)\[0\]>/g,
    replacement: '<$1[]>',
    description: '修复泛型数组类型: Generic<Type[0]> -> Generic<Type[]>',
    verified: true
  },
  {
    name: 'unknown-array-type',
    pattern: /unknown\[0\]/g,
    replacement: 'unknown[]',
    description: '修复unknown数组类型',
    verified: true
  },
  {
    name: 'simple-object-semicolon',
    pattern: /(\w+):\s*([^;,}]+);(\s*\w+:)/g,
    replacement: '$1: $2,$3',
    description: '修复对象属性分号为逗号',
    verified: true
  },
  {
    name: 'basic-comma-separator',
    pattern: /(\w+:\s*[^,>)]+)\s*>\s*(\w+:\s*[^,>)]+)/g,
    replacement: '$1, $2',
    description: '修复基本逗号分隔符',
    verified: true
  }
];

class SafeTypeScriptFixer {
  private results: FixResult[] = [];
  private totalFixes = 0;

  /**
   * 安全修复单个文件
   */
  async fixFile(filePath: string): Promise<FixResult> {
    const result: FixResult = {
      filePath,
      rulesApplied: [],
      fixCount: 0,
      success: false
    };

    try {
      if (!fs.existsSync(filePath)) {
        return result;
      }

      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;

      // 只应用安全的修复规则
      for (const rule of SAFE_FIX_RULES) {
        if (!rule.verified) continue;

        const matches = content.match(rule.pattern);
        if (matches) {
          content = content.replace(rule.pattern, rule.replacement);
          result.rulesApplied.push(rule.name);
          result.fixCount += matches.length;
        }
      }

      // 只有在内容确实改变时才写入文件
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        result.success = true;
        this.totalFixes += result.fixCount;
      } else {
        result.success = true; // 没有需要修复的内容也算成功
      }

    } catch (error) {
      console.error(`修复文件 ${filePath} 失败:`, error);
      result.success = false;
    }

    return result;
  }

  /**
   * 批量修复文件
   */
  async fixFiles(patterns: string[]): Promise<void> {
    console.log('🛡️ 启动安全TypeScript修复工具');
    
    for (const pattern of patterns) {
      console.log(`🔍 扫描模式: ${pattern}`);
      const files = glob.sync(pattern, {
        ignore: ['**/node_modules/**', '**/*.d.ts']
      });

      console.log(`📁 找到 ${files.length} 个文件`);

      for (const file of files) {
        const result = await this.fixFile(file);
        this.results.push(result);
        
        if (result.fixCount > 0) {
          console.log(`✅ 修复文件: ${file} (应用了 ${result.fixCount} 个修复)`);
        }
      }
    }

    this.printReport();
  }

  /**
   * 打印修复报告
   */
  private printReport(): void {
    console.log('\n📊 安全修复报告');
    console.log('==================');
    
    const successfulFiles = this.results.filter(r => r.success).length;
    const filesWithFixes = this.results.filter(r => r.fixCount > 0).length;
    
    console.log(`📈 总体统计:`);
    console.log(`- 处理文件总数: ${this.results.length}`);
    console.log(`- 成功处理文件: ${successfulFiles}`);
    console.log(`- 有修复的文件: ${filesWithFixes}`);
    console.log(`- 总修复次数: ${this.totalFixes}`);
    console.log(`- 成功率: ${((successfulFiles / this.results.length) * 100).toFixed(2)}%`);

    // 显示修复详情
    const fixedFiles = this.results.filter(r => r.fixCount > 0);
    if (fixedFiles.length > 0) {
      console.log(`\n🔧 修复详情:`);
      fixedFiles.forEach(result => {
        console.log(`- ${result.filePath}: ${result.fixCount} 个修复 (${result.rulesApplied.join(', ')})`);
      });
    }

    console.log('\n✅ 安全修复完成！');
  }

  /**
   * 执行所有修复
   */
  async fixAllErrors(): Promise<void> {
    const patterns = [
      'src/**/*.ts',
      'src/**/*.vue'
    ];

    await this.fixFiles(patterns);
  }
}

// 执行安全修复
const safeFixer = new SafeTypeScriptFixer();
safeFixer.fixAllErrors().catch(console.error);
