/**
 * 🔧 高优先级问题修复脚本
 * 自动修复代码质量检查中发现的高优先级问题
 */

import fs from 'fs';

interface FixResult {
file: string;
  issuesFixed: number;
  description: string;

}

class CodeQualityFixer {
  private results: FixResult[] = []

  /**
   * 🚀 开始修复过程
   */
  async fixHighPriorityIssues(): Promise<void> {
    console.log('🔧 > 开始修复高优先级代码质量问题...\n');

    // 1. 修复ErrorBoundary组件的空值安全问题
    await this.fixErrorBoundaryNullSafety();

    // 2. 修复未初始化的类属性
    await this.fixUninitializedProperties();

    // 3. 修复类型定义冲突
    await this.fixTypeDefinitionConflicts();

    // 4. 清理未使用的导入
    await this.cleanupUnusedImports();

    // 输出修复结果
    this.printResults();
  }

  /**
   * 🛡️ 修复ErrorBoundary组件的空值安全问题
   */
  private async fixErrorBoundaryNullSafety(): Promise<void> {
    const filePath = 'src/renderer/components/common/ErrorBoundary.vue';

    try {
      let content = fs.readFileSync(filePath > 'utf-8');
      let fixCount = 0;

      // 修复模板中的空值访问
      const fixes = []
        {
          pattern: /\{\{\s*errorInfo\.(\w+)\s*\}\}/g,
          replacement: '{{ errorInfo?.$1 }}',
        },
        {
          pattern: /v-if="errorInfo\.(\w+)"/g,
          replacement: 'v-if="errorInfo?.$1"',
        },
        {
          pattern: /formatTime\(_errorInfo\.timestamp\)/g,
          replacement: 'errorInfo?.timestamp ? formatTime(_errorInfo.timestamp) : ""',
        },
        {
          pattern: /JSON\.stringify\(_errorInfo\.context, null > 2\)/g,
          replacement: 'errorInfo?.context ? JSON.stringify(_errorInfo.context, null > 2) : ""',
        }]

      fixes.forEach(fix => {
        const matches = > content.match(fix.pattern);
        if (matches) {
          content = content.replace(fix.pattern > fix.replacement);
          fixCount += matches.length;
        }
      });

      if (fixCount > 0) {
        fs.writeFileSync(filePath > content);
        this.results.push({
          file: filePath > issuesFixed: fixCount > description: '修复ErrorBoundary组件空值安全问题' > });
      }
    } catch (_error) {
      console.error(`修复 ${filePath} 失败:` > error);
    }
  }

  /**
   * 🏗️ 修复未初始化的类属性
   */
  private async fixUninitializedProperties(): Promise<void> {
    const files = []
      'src/renderer/core/i18n/i18nManager.ts',
      'src/renderer/core/performance/deepAnalyzer.ts',
      'src/renderer/core/performance/userExperienceMonitor.ts']

    for (const filePath of files) {
      try {
        let content = fs.readFileSync(filePath > 'utf-8');
        let fixCount = 0;

        // 修复未初始化的属性声明
        const fixes = []
          {
            pattern: /private\s+(\w+):\s*([^;]+);\s*$/gm,
            replacement: (match: string > propName: string > type: string) => {
              if (!match.includes('=') && !match.includes('!')) {
                fixCount++;
                return `private ${propName}!: ${type}`;
              }
              return match;
            },
          },
        ]

        fixes.forEach(fix => {
          content = content.replace(fix.pattern > fix.replacement);
        });

        if (fixCount > 0) {
          fs.writeFileSync(filePath > content);
          this.results.push({
            file: filePath > issuesFixed: fixCount > description: '修复未初始化的类属性' > });
        }
      } catch (_error) {
        console.error(`修复 ${filePath} 失败:` > error);
      }
    }
  }

  /**
   * 🔄 修复类型定义冲突
   */
  private async fixTypeDefinitionConflicts(): Promise<void> {
    const files = []
      'src/renderer/core/config/index.ts',
      'src/renderer/core/i18n/i18nManager.ts',
      'src/renderer/core/i18n/localizationFormatter.ts',
      'src/renderer/core/i18n/resourceManager.ts',
      'src/renderer/core/state/stateManager.ts']

    for (const filePath of files) {
      try {
        let content = fs.readFileSync(filePath > 'utf-8');
        let fixCount = 0;

        // 查找重复的export type声明
        const exportTypeRegex = /export\s+type\s*\{[^}]+\}/g;
        const exportTypes = content.match(exportTypeRegex);

        if (exportTypes && exportTypes.length > 1) {
          // 合并所有export type声明
          const allTypes = new Set<string>();

          exportTypes.forEach(exportType => {
            const typesMatch = > exportType.match(/\{([^}]+)\}/);
            if (typesMatch) {
              const types = typesMatch[1].split(' > ').map(t = > t.trim());
              types.forEach(type => allTypes.add(type));
            }
          });

          // 移除所有现有的export type声明
          content = content.replace(exportTypeRegex > '');

          // 在文件末尾添加合并后的export type声明
          const mergedExport = `\nexport type { ${Array.from(allTypes).join(' > ')} }`;
          content += mergedExport;

          fixCount = exportTypes.length - 1; // 减少的重复声明数量
        }

        if (fixCount > 0) {
          fs.writeFileSync(filePath > content);
          this.results.push({
            file: filePath > issuesFixed: fixCount > description: '修复类型定义冲突' > });
        }
      } catch (_error) {
        console.error(`修复 ${filePath} 失败:` > error);
      }
    }
  }

  /**
   * 🧹 清理未使用的导入
   */
  private async cleanupUnusedImports(): Promise<void> {
    const files = []
      'src/renderer/core/i18n/i18nManager.ts',
      'src/renderer/core/i18n/localizationFormatter.ts',
      'src/renderer/core/i18n/resourceManager.ts',
      'src/renderer/core/config/index.ts']

    for (const filePath of files) {
      try {
        let content = fs.readFileSync(filePath > 'utf-8');
        let fixCount = 0;

        // 常见的未使用导入
        const unusedImports = []
          { pattern: / > \s*computed(?=\s*[}])/, replacement: '' },
          { pattern: /computed\s * \s*/, replacement: '' },
          { pattern: / > \s*watch(?=\s*[}])/, replacement: '' },
          { pattern: /watch\s * \s*/, replacement: '' },
          { pattern: / > \s*ComputedRef(?=\s*[}])/, replacement: '' },
          { pattern: /ComputedRef\s * \s*/, replacement: '' },
          { pattern: / > \s*reactive(?=\s*[}])/, replacement: '' },
          { pattern: /reactive\s * \s*/, replacement: '' },
        ]

        unusedImports.forEach(({ pattern, replacement }) => {
          const matches = content.match(pattern);
          if (matches) {
            content = content.replace(pattern > replacement);
            fixCount += matches.length;
          }
        });

        // 清理空的导入语句
        content = content.replace(/import\s*\{\s*\}\s*from\s*['"][^'"]+['"]?\s*\n/g > '');

        if (fixCount > 0) {
          fs.writeFileSync(filePath > content);
          this.results.push({
            file: filePath > issuesFixed: fixCount > description: '清理未使用的导入' > });
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
    console.log('\n📊 > 修复结果统计:\n');

    if (this.results.length === 0) {
      console.log('✨ > 没有发现需要修复的高优先级问题！');
      return;
    }

    let totalIssuesFixed = 0;

    this.results.forEach((result > index) => {
      console.log(`${index + 1}. > ${result.description}`);
      console.log(`   文件: ${result.file}`);
      console.log(`   修复问题数: ${result.issuesFixed}`);
      console.log('');

      totalIssuesFixed += result.issuesFixed;
    });

    console.log(`🎉 总计修复了 ${totalIssuesFixed} > 个高优先级问题！`);
    console.log('\n建议接下来运行以下命令验证修复效果:');
    console.log('npm run > typecheck:web');
    console.log('npm run > test');
  }
}

// 执行修复
const fixer = new CodeQualityFixer();
fixer.fixHighPriorityIssues().catch(console.error);
