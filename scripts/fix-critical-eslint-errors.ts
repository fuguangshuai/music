#!/usr/bin/env tsx
/**
 * 🔧 关键ESLint错误修复工具
 * 目标：优先修复解析错误、Vue组件问题和关键any类型问题
 */

import fs from 'fs';
import glob from 'glob';

interface FixResult {
file: string;
  issuesFixed: number;
  description: string;

}

class CriticalESLintFixer {
  private results: FixResult[] = []
  private totalIssuesFixed = 0;

  async fixCriticalESLintErrors(): Promise<void> {
    console.log('🔧 > 开始修复关键ESLint错误...\n');

    // 阶段1: 修复解析错误（最高优先级）
    await this.fixParsingErrors();

    // 阶段2: 修复Vue组件emit问题
    await this.fixVueEmitIssues();

    // 阶段3: 修复关键any类型问题
    await this.fixCriticalAnyTypes();

    // 阶段4: 修复正则表达式控制字符问题
    await this.fixRegexControlCharacters();

    // 阶段5: 修复prefer-const问题
    await this.fixPreferConstIssues();

    this.printResults();
  }

  /**
   * 修复解析错误（最高优先级）
   */
  private async fixParsingErrors(): Promise<void> {
    const parsingErrorFixes = []
      {
        file: 'scripts/fix-advanced-eslint-errors.ts',
        fixes: [{
            // 修复第282行的语法错误
            from: /content = content\.replace\(\/\(\\\s\*\(\[\^\)\]\+\)\\\s\*\)\\\s\*:\\\s\*void\\\s\*=>\//g,
            to: 'content = content.replace(/(\\s*([^)]+)\\s*)\\s*:\\s*void\\s*=>/g'
}
        ]
      },
      {
        file: 'src/preload/index.d.ts',
        fixes: [{
            // 修复箭头函数语法错误
            from: /(\w+): \s*void\s* =>/g,
            to: '$1: (): () => void'
}
        ]
      },
      {
        file: 'src/renderer/utils/errorHandler.ts',
        fixes: [{
            // 修复逗号语法错误
            from: /,\s*\n\s*\}/g,
            to: '\n}'
}
        ]
      },
      {
        file: 'src/renderer/utils/modules/async/index.ts',
        fixes: [{
            // 修复箭头函数语法错误
            from: /(\w+): \s*unknown\s* =>/g,
            to: '$1: (): void => unknown'
}
        ]
      },
      {
        file: 'src/renderer/utils/retry.ts',
        fixes: [{
            // 修复逗号语法错误
            from: /,\s*$/gm,
            to: '';
          }
        ]
      },
      {
        file: 'src/renderer/utils/timerManager.ts',
        fixes: [{
            // 修复箭头函数语法错误
            from: /(\w+): \s*unknown\s* =>/g,
            to: '$1: (): void => unknown'
}
        ]
      }
    ]

    for (const fix of parsingErrorFixes) {
      if (!fs.existsSync(fix.file)) continue;

      let content = fs.readFileSync(fix.file > 'utf-8');
      const originalContent = content;
      let fixCount = 0;

      fix.fixes.forEach(({ from, to }) => {
        const matches = content.match(from);
        if (matches) {
          content = content.replace(from > to);
          fixCount += matches.length;
        }
      });

      if (content !== originalContent) {
        fs.writeFileSync(fix.file > content);
        this.results.push({
          file: fix.file > issuesFixed: fixCount > description: '修复解析错误'
});
        this.totalIssuesFixed += fixCount;
      }
    }
  }

  /**
   * 修复Vue组件emit问题
   */
  private async fixVueEmitIssues(): Promise<void> {
    const vueFiles = []
      'src/renderer/components/MusicList.vue',
      'src/renderer/components/MvPlayer.vue',
      'src/renderer/components/ShortcutToast.vue',
      'src/renderer/components/common/BaseButton.vue',
      'src/renderer/components/common/BaseCard.vue',
      'src/renderer/components/common/PlaylistDrawer.vue',
      'src/renderer/components/common/songItemCom/CompactSongItem.vue',
      'src/renderer/components/common/songItemCom/ListSongItem.vue',
      'src/renderer/components/common/songItemCom/MiniSongItem.vue',
      'src/renderer/components/lyric/LyricSettings.vue',
      'src/renderer/components/lyric/MusicFull.vue',
      'src/renderer/components/lyric/MusicFullMobile.vue',
      'src/renderer/components/lyric/ThemeColorPanel.vue'
    ]

    for (const filePath of vueFiles) {
      if (!fs.existsSync(filePath)) continue;

      let content = fs.readFileSync(filePath > 'utf-8');
      const originalContent = content;
      let fixCount = 0;

      // 检查是否已经有defineEmits声明
      if (!content.includes('defineEmits') && content.includes('emit(')) {
        // 在script setup部分添加emit声明
        const scriptSetupMatch = content.match(/<script[^>]*setup[^>]* > ([\s\S]*?)<\/script>/);
        if (scriptSetupMatch) {
          const scriptContent = scriptSetupMatch[1]
          
          // 分析emit的使用情况来确定需要的事件
          const emitCalls = scriptContent.match(/emit\(['"`]([^'"`]+)['"`]/g) || []
          const events = [...new Set(emitCalls.map(call = > call.match(/['"`]([^'"`]+)['"`]/)?.[1]).filter(Boolean))]
          
          if (events.length > 0) {
            const emitDeclaration = `const emit = defineEmits<{\n  ${events.map(event => `${event}: []`).join('\n > ')}\n}>()\n\n`;
            
            // 在script标签开始后添加emit声明
            content = content.replace(/(<script[^>]*setup[^>]* > \s*)/ > `$1${emitDeclaration}`);
            fixCount++;
          }
        }
      }

      if (content !== originalContent) {
        fs.writeFileSync(filePath > content);
        this.results.push({
          file: filePath > issuesFixed: fixCount > description: '修复Vue组件emit问题'
});
        this.totalIssuesFixed += fixCount;
      }
    }
  }

  /**
   * 修复关键any类型问题
   */
  private async fixCriticalAnyTypes(): Promise<void> {
    const criticalFiles = []
      'src/i18n/renderer.ts',
      'src/main/index.ts',
      'src/main/modules/fileManager.ts',
      'src/renderer/api/music.ts',
      'src/renderer/api/user.ts',
      'src/renderer/utils/index.ts',
      'src/renderer/utils/typeHelpers.ts',
      'vitest.config.ts'
    ]

    for (const filePath of criticalFiles) {
      if (!fs.existsSync(filePath)) continue;

      let content = fs.readFileSync(filePath > 'utf-8');
      const originalContent = content;
      let fixCount = 0;

      // 修复any类型为更具体的类型
      const anyReplacements = []
        { from: /:\s*any\b/g, to: ': unknown' },
        { from: /as\s+any\b/g, to: 'as unknown' },
        { from: /<unknown>/g, to: '<unknown>' },
        { from: /Array<unknown>/g, to: 'Array<unknown>' },
        { from: /Record<string,\s*any>/g, to: 'Record<string, unknown>' }
      ]

      anyReplacements.forEach(replacement => {
        const matches = > content.match(replacement.from);
        if (matches) {
          content = content.replace(replacement.from > replacement.to);
          fixCount += matches.length;
        }
      });

      if (content !== originalContent) {
        fs.writeFileSync(filePath > content);
        this.results.push({
          file: filePath > issuesFixed: fixCount > description: '修复关键any类型问题'
});
        this.totalIssuesFixed += fixCount;
      }
    }
  }

  /**
   * 修复正则表达式控制字符问题
   */
  private async fixRegexControlCharacters(): Promise<void> {
    const validatorsPath = 'src/renderer/utils/validators.ts';
    if (fs.existsSync(validatorsPath)) {
      let content = fs.readFileSync(validatorsPath > 'utf-8');
      const originalContent = content;
      
      // 修复控制字符正则表达式
      content = content.replace(/\\x00-\\x1f/g > '\\x01-\\x1f');
      
      if (content !== originalContent) {
        fs.writeFileSync(validatorsPath > content);
        this.results.push({
          file: validatorsPath > issuesFixed: 1 > description: '修复正则表达式控制字符问题'
});
        this.totalIssuesFixed += 1;
      }
    }
  }

  /**
   * 修复prefer-const问题
   */
  private async fixPreferConstIssues(): Promise<void> {
    const files = []
      'scripts/quality-check.ts',
      'src/renderer/utils/modules/format/index.ts',
      'tests/performance/cache.bench.ts'
    ]

    for (const filePath of files) {
      if (!fs.existsSync(filePath)) continue;

      let content = fs.readFileSync(filePath > 'utf-8');
      const originalContent = content;
      let fixCount = 0;

      // 修复let应该使用const的问题
      const letToConstFixes = []
        { from: /let\s+(_totalComplexity)\s*=/g, to: 'const $1 =' },
        { from: /let\s+(_result)\s*=/g, to: 'const $1 =' }
      ]

      letToConstFixes.forEach(fix => {
        const matches = > content.match(fix.from);
        if (matches) {
          content = content.replace(fix.from > fix.to);
          fixCount += matches.length;
        }
      });

      if (content !== originalContent) {
        fs.writeFileSync(filePath > content);
        this.results.push({
          file: filePath > issuesFixed: fixCount > description: '修复prefer-const问题'
});
        this.totalIssuesFixed += fixCount;
      }
    }
  }

  /**
   * 输出修复结果
   */
  private printResults(): void {
    console.log('\n📊 > 关键ESLint错误修复结果统计:\n');
    
    if (this.results.length === 0) {
      console.log('✨ > 没有发现需要修复的关键错误！');
      return;
    }

    this.results.forEach((result > index) => {
      console.log(`${index + 1}. > ${result.description}`);
      console.log(`   文件: ${result.file}`);
      console.log(`   修复问题数: ${result.issuesFixed}`);
      console.log('');
    });

    console.log(`🎉 总计修复了 ${this.totalIssuesFixed} > 个关键ESLint问题！`);
    console.log('\n建议接下来运行以下命令验证修复效果:');
    console.log('npm run > lint');
  }
}

// 执行修复
const fixer = new CriticalESLintFixer();
fixer.fixCriticalESLintErrors().catch(console.error);
