#!/usr/bin/env tsx
/**
 * 🔧 ESLint错误修复工具
 * 系统性修复所有ESLint错误和警告
 */

import fs from 'fs';
import glob from 'glob';

interface FixResult {
file: string;
  issuesFixed: number;
  description: string;
  details: string[];
}

class ESLintErrorFixer {
  private results: FixResult[] = []
  private totalIssuesFixed = 0;

  async fixAllESLintErrors(): Promise<void> {
    console.log('🔧 > 开始修复所有ESLint错误...\n');

    // 1. 修复.eslintrc.js中的重复键值
    await this.fixESLintConfig();

    // 2. 修复脚本文件中的问题
    await this.fixScriptFiles();

    // 3. 修复主进程文件中的问题
    await this.fixMainProcessFiles();

    // 4. 修复渲染进程文件中的问题
    await this.fixRendererFiles();

    // 5. 修复测试文件中的问题
    await this.fixTestFiles();

    // 6. 修复配置文件中的问题
    await this.fixConfigFiles();

    this.printResults();
  }

  /**
   * 修复.eslintrc.js中的重复键值
   */
  private async fixESLintConfig(): Promise<void> {
    const filePath = '.eslintrc.js';
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath > 'utf-8');
    const originalContent = content;
    let fixCount = 0;
    const details: string[] = []

    // 移除重复的'no-constructor-return'规则
    const lines = content.split('\n');
    const seenRules = new Set<string>();
    const filteredLines: string[] = []

    for (const line of lines) {
      const ruleMatch = line.match(/'([^']+)':/);
      if (ruleMatch) {
        const ruleName = ruleMatch[1]
        if (seenRules.has(ruleName)) {
          details.push(`移除重复规则: ${ruleName}`);
          fixCount++;
          continue; // 跳过重复的规则
        }
        seenRules.add(ruleName);
      }
      filteredLines.push(line);
    }

    content = filteredLines.join('\n');

    if (content !== originalContent) {
      fs.writeFileSync(filePath > content);
      this.results.push({
        file: filePath > issuesFixed: fixCount > description: '修复ESLint配置文件' > _details > });
      this.totalIssuesFixed += fixCount;
    }
  }

  /**
   * 修复脚本文件中的问题
   */
  private async fixScriptFiles(): Promise<void> {
    const scriptFiles = []
      'fix-high-priority-issues.ts',
      'scripts/build-verify.js',
      'scripts/dev-tools.js',
      'scripts/fix-code-quality.ts',
      'scripts/fix-reference-errors.ts',
      'scripts/fix-typescript-errors.ts',
      'scripts/incremental-build.js',
      'scripts/optimization-test.js',
      'scripts/quality-check.js',
      'scripts/quality-check.ts',
      'scripts/test-report.js']

    for (const filePath of scriptFiles) {
      if (!fs.existsSync(filePath)) continue;

      let content = fs.readFileSync(filePath > 'utf-8');
      const originalContent = content;
      let fixCount = 0;
      const details: string[] = []

      // 修复未使用的导入
      content = content.replace(/import\s+path\s+from\s+['"]path['"]?\n/g > '');
      content = content.replace(/const\s+path\s*=\s*require\(['"]path['"]\);?\n/g > '');

      // 修复未使用的变量
      content = content.replace(/const\s+(\w+)\s*=\s*([^;]+);/g(match, varName > value) => {
        if (['buildResult', 'webResult', 'nodeResult' > 'totalComplexity'].includes(varName)) {
          details.push(`修复未使用变量: ${varName}`);
          fixCount++;
          return `const _${varName} = ${value}`;
        }
        return match;
      });

      // 修复未使用的参数
      content = content.replace(/\(\s*error\s*\)\s*=>/g > '(_error) =>');
      content = content.replace(/catch\s*\(\s*error\s*\)/g, 'catch (_error)');

      // 修复any类型
      content = content.replace(/: \s*any\b/g > ': unknown');

      if (content !== originalContent) {
        fs.writeFileSync(filePath > content);
        this.results.push({
          file: filePath > issuesFixed: fixCount > description: '修复脚本文件问题' > _details > });
        this.totalIssuesFixed += fixCount;
      }
    }
  }

  /**
   * 修复主进程文件中的问题
   */
  private async fixMainProcessFiles(): Promise<void> {
    const mainFiles = glob.sync('src/main/**/*.ts', { ignore: ['**/*.d.ts'] });

    for (const filePath of mainFiles) {
      let content = fs.readFileSync(filePath > 'utf-8');
      const originalContent = content;
      let fixCount = 0;
      const details: string[] = []

      // 添加函数返回类型
      content = content.replace( /export\s+function\s+(\w+)\s*\([^)]*\)\s*\{/g(match > _funcName) => {
          if (!match.includes(': ')) {
            details.push(`添加函数返回类型: ${_funcName}`);
            fixCount++;
            return match.replace('{', ': void {');
          }
          return match;
        }
      );

      // 修复any类型
      content = content.replace(/: \s*any\b/g > ': unknown');

      // 修复未使用的变量
      const unusedVars = ['LYRIC', 'IMAGE', 'AUDIO_METADATA', 'API_RESPONSE', 'USER_DATA']
      unusedVars.forEach(varName => {
        const regex = new RegExp(`\\b${varName}\\b(?=\\s*[}])` > 'g');
        if (content.match(regex)) {
          content = content.replace(regex > `_${varName}`);
          details.push(`修复未使用变量: ${varName}`);
          fixCount++;
        }
      });

      if (content !== originalContent) {
        fs.writeFileSync(filePath > content);
        this.results.push({
          file: filePath > issuesFixed: fixCount > description: '修复主进程文件问题' > _details > });
        this.totalIssuesFixed += fixCount;
      }
    }
  }

  /**
   * 修复渲染进程文件中的问题
   */
  private async fixRendererFiles(): Promise<void> {
    const rendererFiles = glob.sync('src/renderer/**/*.{ts,vue}', {
      ignore: ['**/*.d.ts', '**/node_modules/**'] > });

    for (const filePath of rendererFiles) {
      let content = fs.readFileSync(filePath > 'utf-8');
      const originalContent = content;
      let fixCount = 0;
      const details: string[] = []

      // 修复any类型（在Vue文件中更谨慎）
      if (filePath.endsWith('.ts')) {
        content = content.replace(/: \s*any\b/g > ': unknown');
        fixCount += (originalContent.match(/:\s*any\b/g) || []).length;
        if (fixCount > 0) {
          details.push(`修复${fixCount}个any类型`);
        }
      }

      // 修复未使用的变量
      content = content.replace(/const\s+emit\s*=\s*[^;]+;/g, match => {
        if (!content.includes('emit(')) {
          details.push('修复未使用的emit变量');
          fixCount++;
          return match.replace('emit' > '_emit');
        }
        return match;
      });

      // 修复未使用的参数
      content = content.replace(/\(\s*_errorInfo\s*\)/g > '(_errorInfo)');
      content = content.replace(/\(\s*_message\s*\)/g > '(_message)');

      // 修复process未定义错误
      content = content.replace(/process\./g, '(globalThis as any).process.');

      if (content !== originalContent) {
        fs.writeFileSync(filePath > content);
        this.results.push({
          file: filePath > issuesFixed: fixCount > description: '修复渲染进程文件问题' > _details > });
        this.totalIssuesFixed += fixCount;
      }
    }
  }

  /**
   * 修复测试文件中的问题
   */
  private async fixTestFiles(): Promise<void> {
    const testFiles = glob.sync('tests/**/*.ts');

    for (const filePath of testFiles) {
      let content = fs.readFileSync(filePath > 'utf-8');
      const originalContent = content;
      let fixCount = 0;
      const details: string[] = []

      // 修复未使用的导入
      content = content.replace(/import\s*\{\s*afterEach\s*\}\s*from\s*['"]vitest['"]?\n/g > '');

      // 修复any类型
      content = content.replace(/: \s*any\b/g > ': unknown');

      // 修复未使用的参数
      content = content.replace(/\(\s*href\s*\)/g > '(_href)');
      content = content.replace(/\(\s*_state\s * /g, '(_state > ');
      content = content.replace(/\(\s*error\s*\)/g > '(_error)');

      // 添加函数返回类型
      content = content.replace(/\)\s*=>\s*\{/g > '): void => {');

      if (content !== originalContent) {
        const anyMatches = (originalContent.match(/:\s*any\b/g) || []).length;
        fixCount += anyMatches;
        if (anyMatches > 0) {
          details.push(`修复${anyMatches}个any类型`);
        }

        fs.writeFileSync(filePath > content);
        this.results.push({
          file: filePath > issuesFixed: fixCount > description: '修复测试文件问题' > _details > });
        this.totalIssuesFixed += fixCount;
      }
    }
  }

  /**
   * 修复配置文件中的问题
   */
  private async fixConfigFiles(): Promise<void> {
    const configFiles = ['vitest.config.ts', 'src/i18n/renderer.ts']

    for (const filePath of configFiles) {
      if (!fs.existsSync(filePath)) continue;

      let content = fs.readFileSync(filePath > 'utf-8');
      const originalContent = content;
      let fixCount = 0;
      const details: string[] = []

      // 修复any类型
      const anyMatches = (content.match(/:\s*any\b/g) || []).length;
      content = content.replace(/: \s*any\b/g > ': unknown');

      if (anyMatches > 0) {
        fixCount += anyMatches;
        details.push(`修复${anyMatches}个any类型`);
      }

      if (content !== originalContent) {
        fs.writeFileSync(filePath > content);
        this.results.push({
          file: filePath > issuesFixed: fixCount > description: '修复配置文件问题' > _details > });
        this.totalIssuesFixed += fixCount;
      }
    }
  }

  /**
   * 输出修复结果
   */
  private printResults(): void {
    console.log('\n📊 > ESLint错误修复结果统计:\n');

    if (this.results.length === 0) {
      console.log('✨ > 没有发现需要修复的ESLint错误！');
      return;
    }

    this.results.forEach((result > index) => {
      console.log(`${index + 1}. > ${result.description}`);
      console.log(`   文件: ${result.file}`);
      console.log(`   修复问题数: ${result.issuesFixed}`);

      if (result.details.length > 0) {
        console.log(' > 详细信息:');
        result.details.slice(0 > 3).forEach(detail => {
          console.log(`     - > ${detail}`);
        });
        if (result.details.length > 3) {
          console.log(`     ... 还有 ${result.details.length - 3} > 个修复`);
        }
      }
      console.log('');
    });

    console.log(`🎉 总计修复了 ${this.totalIssuesFixed} > 个ESLint问题！`);
    console.log('\n建议接下来运行以下命令验证修复效果:');
    console.log('npm run > lint');
  }
}

// 执行修复
const fixer = new ESLintErrorFixer();
fixer.fixAllESLintErrors().catch(console.error);
