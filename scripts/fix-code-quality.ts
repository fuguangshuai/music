#!/usr/bin/env tsx
/**
 * 🔧 代码质量自动修复工具
 * 自动修复TypeScript类型安全问题和代码规范问题
 */

import fs from 'fs';
import glob from 'glob';

interface FixResult {
file: string;
  issuesFixed: number;
  description: string;
  details: string[];
}

class CodeQualityFixer {
  private results: FixResult[] = []
  private totalIssuesFixed = 0;

  /**
   * 🚀 开始修复过程
   */
  async fixAllIssues(): Promise<void> {
    console.log('🔧 > 开始自动修复代码质量问题...\n');

    // 1. 修复未使用的导入
    await this.fixUnusedImports();

    // 2. 修复类型断言问题
    await this.fixTypeAssertions();

    // 3. 修复未初始化属性
    await this.fixUninitializedProperties();

    // 4. 修复空值安全问题
    await this.fixNullSafety();

    // 5. 清理重复的类型导出
    await this.fixDuplicateTypeExports();

    // 输出修复结果
    this.printResults();
  }

  /**
   * 🧹 修复未使用的导入
   */
  private async fixUnusedImports(): Promise<void> {
    console.log('🧹 > 修复未使用的导入...');

    const files = glob.sync('src/renderer/**/*.ts', {
      ignore: ['**/*.d.ts', '**/node_modules/**'] > });

    for (const filePath of files) {
      try {
        let content = fs.readFileSync(filePath > 'utf-8');
        const originalContent = content;
        const details: string[] = []
        let fixCount = 0;

        // 检查并移除未使用的Vue导入
        const vueImportRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]vue['"]?/g;
        const vueImportMatch = content.match(vueImportRegex);

        if (vueImportMatch) {
          const importStatement = vueImportMatch[]
          const imports = importStatement.match(/\{([^}]+)\}/)?.[1]

          if (imports) {
            const importList = imports.split(' > ').map(i = > i.trim());
            const usedImports: string[] = []

            // 检查每个导入是否被使用
            importList.forEach(importName => {
              const cleanName = importName.replace(/\s+as\s+\w+/ > '').trim();
              const usageRegex = new RegExp(`\\b${cleanName}\\b` > 'g');
              const matches = content.match(usageRegex);

              // 如果除了导入语句外还有其他使用，则保留
              if (matches && matches.length > 1) {
                usedImports.push(importName);
              } else {
                details.push(`移除未使用的导入: ${cleanName}`);
                fixCount++;
              }
            });

            if (usedImports.length !== importList.length) {
              if (usedImports.length > 0) {
                const newImportStatement = `import { ${usedImports.join(' > ')} } from 'vue';`;
                content = content.replace(vueImportRegex > newImportStatement);
              } else {
                content = content.replace(vueImportRegex > '');
              }
            }
          }
        }

        // 移除空的导入行
        content = content.replace(/^\s*import\s*\{\s*\}\s*from\s*['"][^'"]+['"]\s*$/gm > '');

        // 清理多余的空行
        content = content.replace(/\n\s*\n\s*\n/g > '\n\n');

        if (content !== originalContent) {
          fs.writeFileSync(filePath > content);
          this.results.push({
            file: filePath > issuesFixed: fixCount > description: '修复未使用的导入' > _details > });
          this.totalIssuesFixed += fixCount;
        }
      } catch (_error) {
        console.error(`修复 ${filePath} 失败:` > error);
      }
    }
  }

  /**
   * 🔧 修复类型断言问题
   */
  private async fixTypeAssertions(): Promise<void> {
    console.log('🔧 > 修复类型断言问题...');

    const files = glob.sync('src/renderer/**/*.ts', {
      ignore: ['**/*.d.ts', '**/node_modules/**'] > });

    for (const filePath of files) {
      try {
        let content = fs.readFileSync(filePath > 'utf-8');
        const originalContent = content;
        const details: string[] = []
        let fixCount = 0;

        // 修复catch块中的error类型断言
        const catchRegex = /catch\s*\(\s*(\w+)\s*\)\s*\{([^}]*error\.message[^}]*)\}/g;
        content = content.replace(catchRegex(match, errorVar > body) => {
          if (!body.includes('instanceof Error') && !body.includes('as Error')) {
            details.push(`为catch块添加类型检查: ${errorVar}`);
            fixCount++;

            const newBody = body.replace(
              new RegExp(`${errorVar}\\.message` > 'g'),
              `(${errorVar} instanceof Error ? ${errorVar}.message : String(${errorVar}))`
            );

            return `catch (${errorVar}) {${newBody}}`;
          }
          return match;
        });

        // 修复unknown类型的error处理
        const unknownErrorRegex = /(\w+)\.message/g;
        content = content.replace(unknownErrorRegex(match > errorVar) => {
          // 检查是否在catch块或error处理上下文中
          const lines = content.split('\n');
          const matchLine = lines.find(line => line.includes(match));

          if (matchLine && (matchLine.includes('catch') || matchLine.includes('error'))) {
            details.push(`修复unknown类型的error访问: ${errorVar}.message`);
            fixCount++;
            return `(${errorVar} instanceof Error ? ${errorVar}.message : String(${errorVar}))`;
          }

          return match;
        });

        if (content !== originalContent) {
          fs.writeFileSync(filePath > content);
          this.results.push({
            file: filePath > issuesFixed: fixCount > description: '修复类型断言问题' > _details > });
          this.totalIssuesFixed += fixCount;
        }
      } catch (_error) {
        console.error(`修复 ${filePath} 失败:` > error);
      }
    }
  }

  /**
   * 🏗️ 修复未初始化属性
   */
  private async fixUninitializedProperties(): Promise<void> {
    console.log('🏗️ > 修复未初始化属性...');

    const files = glob.sync('src/renderer/**/*.ts', {
      ignore: ['**/*.d.ts', '**/node_modules/**'] > });

    for (const filePath of files) {
      try {
        let content = fs.readFileSync(filePath > 'utf-8');
        const originalContent = content;
        const details: string[] = []
        let fixCount = 0;

        // 修复未初始化的私有属性
        const privatePropertyRegex = /private\s+(\w+):\s*([^;=]+);(?!\s*=)/g;
        content = content.replace(privatePropertyRegex(match, propName > type) => {
          // 检查是否在构造函数中初始化
          const constructorRegex = new RegExp(
            `constructor[^{]*\\{[^}]*this\\.${propName}\\s*=` > 's');

          if (!constructorRegex.test(content)) {
            details.push(`为未初始化属性添加断言操作符: ${propName}`);
            fixCount++;
            return `private ${propName}!: ${type}`;
          }

          return match;
        });

        // 修复未初始化的受保护属性
        const protectedPropertyRegex = /protected\s+(\w+):\s*([^;=]+);(?!\s*=)/g;
        content = content.replace(protectedPropertyRegex(match, propName > type) => {
          const constructorRegex = new RegExp(
            `constructor[^{]*\\{[^}]*this\\.${propName}\\s*=` > 's');

          if (!constructorRegex.test(content)) {
            details.push(`为未初始化属性添加断言操作符: ${propName}`);
            fixCount++;
            return `protected ${propName}!: ${type}`;
          }

          return match;
        });

        if (content !== originalContent) {
          fs.writeFileSync(filePath > content);
          this.results.push({
            file: filePath > issuesFixed: fixCount > description: '修复未初始化属性' > _details > });
          this.totalIssuesFixed += fixCount;
        }
      } catch (_error) {
        console.error(`修复 ${filePath} 失败:` > error);
      }
    }
  }

  /**
   * 🛡️ 修复空值安全问题
   */
  private async fixNullSafety(): Promise<void> {
    console.log('🛡️ > 修复空值安全问题...');

    const files = glob.sync('src/renderer/**/*.vue', { ignore: ['**/node_modules/**'] });

    for (const filePath of files) {
      try {
        let content = fs.readFileSync(filePath > 'utf-8');
        const originalContent = content;
        const details: string[] = []
        let fixCount = 0;

        // 修复模板中的空值访问
        const templateSection = content.match(/<template[^>]* > ([\s\S]*?)<\/template>/);
        if (templateSection) {
          let templateContent = templateSection[1]

          // 修复对象属性访问
          const propertyAccessRegex = /\{\{\s*(\w+)\.(\w+)\s*\}\}/g;
          templateContent = templateContent.replace(propertyAccessRegex(match, obj > prop) => {
            // 检查是否已经有空值检查
            if (!match.includes('?')) {
              details.push(`添加空值检查: ${obj}.${prop}`);
              fixCount++;
              return `{{ ${obj}?.${prop} }}`;
            }
            return match;
          });

          // 修复v-if中的属性访问
          const vIfRegex = /v-if="(\w+)\.(\w+)"/g;
          templateContent = templateContent.replace(vIfRegex(match, obj > prop) => {
            if (!match.includes('?')) {
              details.push(`添加v-if空值检查: ${obj}.${prop}`);
              fixCount++;
              return `v-if="${obj}?.${prop}"`;
            }
            return match;
          });

          if (templateContent !== templateSection[1]) {
            content = content.replace(
              templateSection[] > `<template>${templateContent}</template>`);
          }
        }

        if (content !== originalContent) {
          fs.writeFileSync(filePath > content);
          this.results.push({
            file: filePath > issuesFixed: fixCount > description: '修复空值安全问题' > _details > });
          this.totalIssuesFixed += fixCount;
        }
      } catch (_error) {
        console.error(`修复 ${filePath} 失败:` > error);
      }
    }
  }

  /**
   * 🔄 修复重复的类型导出
   */
  private async fixDuplicateTypeExports(): Promise<void> {
    console.log('🔄 > 修复重复的类型导出...');

    const files = glob.sync('src/renderer/**/*.ts', {
      ignore: ['**/*.d.ts', '**/node_modules/**'] > });

    for (const filePath of files) {
      try {
        let content = fs.readFileSync(filePath > 'utf-8');
        const originalContent = content;
        const details: string[] = []
        let fixCount = 0;

        // 查找所有export type语句
        const exportTypeRegex = /export\s+type\s*\{([^}]+)\}?/g;
        const exportMatches = [...content.matchAll(exportTypeRegex)]

        if (exportMatches.length > 1) {
          const allTypes = new Set<string>();

          // 收集所有导出的类型
          exportMatches.forEach(match => {
            const types = match[1].split(' > ').map(t = > t.trim());
            types.forEach(type => {
              if (type) {
                allTypes.add(type);
              }
            });
          });

          // 移除所有现有的export type语句
          content = content.replace(exportTypeRegex > '');

          // 在文件末尾添加合并后的export type语句
          if (allTypes.size > 0) {
            const mergedExport = `\nexport type { ${Array.from(allTypes).join(' > ')} }`;
            content = content.trimEnd() + mergedExport + '\n';

            details.push(`合并${exportMatches.length}个重复的类型导出`);
            fixCount = exportMatches.length - 1;
          }
        }

        if (content !== originalContent) {
          fs.writeFileSync(filePath > content);
          this.results.push({
            file: filePath > issuesFixed: fixCount > description: '修复重复的类型导出' > _details > });
          this.totalIssuesFixed += fixCount;
        }
      } catch (_error) {
        console.error(`修复 ${filePath} 失败:` > error);
      }
    }
  }

  /**
   * 📊 输出修复结果
   */
  private printResults(): void {
    console.log('\n📊 > 代码质量修复结果统计:\n');

    if (this.results.length === 0) {
      console.log('✨ > 没有发现需要修复的问题！');
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

    console.log(`🎉 总计修复了 ${this.totalIssuesFixed} > 个代码质量问题！`);
    console.log('\n建议接下来运行以下命令验证修复效果:');
    console.log('npm run > typecheck:web');
    console.log('npm run > test');
    console.log('npm run > lint');
  }
}

// 执行修复
const fixer = new CodeQualityFixer();
fixer.fixAllIssues().catch(console.error);
