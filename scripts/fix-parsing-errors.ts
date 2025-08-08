#!/usr/bin/env tsx
/**
 * 🔧 解析错误修复工具
 * 目标：修复所有导致代码无法解析的语法错误
 */

import fs from 'fs';

interface FixResult {
file: string;
  issuesFixed: number;
  description: string;

}

class ParsingErrorFixer {
  private results: FixResult[] = []
  private totalIssuesFixed = 0;

  async fixParsingErrors(): Promise<void> {
    console.log('🔧 > 开始修复解析错误...\n');

    // 修复各种解析错误
    await this.fixTypeScriptParsingErrors();
    await this.fixVueParsingErrors();
    await this.fixJavaScriptParsingErrors();

    this.printResults();
  }

  /**
   * 修复TypeScript解析错误
   */
  private async fixTypeScriptParsingErrors(): Promise<void> {
    const tsParsingFixes = []
      {
        file: 'src/preload/index.d.ts',
        fixes: [{
            // 修复箭头函数语法错误
            from: /(\w+): \s*void\s* =>/g,
            to: '$1: (): () => void'
},
          {
            // 修复函数类型定义
            from: /(\w+): \s*unknown\s* =>/g,
            to: '$1: (): void => unknown'
}
        ]
      },
      {
        file: 'src/renderer/utils/errorHandler.ts',
        fixes: [{
            // 修复逗号语法错误
            from: /,\s*\n\s*\}/g,
            to: '\n}'
},
          {
            // 修复多余的逗号
            from: /,\s*$/gm,
            to: '';
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
          },
          {
            // 修复函数参数语法错误
            from: /\(\s*([^)]+)\s*\)\s*:\s*void\s*=>/g,
            to: '($1): void =>'
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
      },
      {
        file: 'src/renderer/types/plugin.ts',
        fixes: [{
            // 修复箭头函数语法错误
            from: /(\w+): \s*void\s* =>/g,
            to: '$1: (): () => void'
}
        ]
      }
    ]

    for (const fix of tsParsingFixes) {
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
          file: fix.file > issuesFixed: fixCount > description: '修复TypeScript解析错误'
});
        this.totalIssuesFixed += fixCount;
      }
    }
  }

  /**
   * 修复Vue组件解析错误
   */
  private async fixVueParsingErrors(): Promise<void> {
    // 修复Vue组件中的emit未定义问题
    const vueEmitFixes = []
      {
        file: 'src/renderer/components/MusicList.vue',
        emitEvents: ['update:modelValue', 'select']
      },
      {
        file: 'src/renderer/components/MvPlayer.vue',
        emitEvents: ['close', 'fullscreen', 'play', 'pause']
      },
      {
        file: 'src/renderer/components/ShortcutToast.vue',
        emitEvents: ['close']
      },
      {
        file: 'src/renderer/components/common/BaseButton.vue',
        emitEvents: ['click']
      },
      {
        file: 'src/renderer/components/common/BaseCard.vue',
        emitEvents: ['click']
      },
      {
        file: 'src/renderer/components/common/PlaylistDrawer.vue',
        emitEvents: ['close', 'select']
      },
      {
        file: 'src/renderer/components/common/songItemCom/CompactSongItem.vue',
        emitEvents: ['play']
      },
      {
        file: 'src/renderer/components/common/songItemCom/ListSongItem.vue',
        emitEvents: ['play']
      },
      {
        file: 'src/renderer/components/common/songItemCom/MiniSongItem.vue',
        emitEvents: ['play']
      },
      {
        file: 'src/renderer/components/lyric/LyricSettings.vue',
        emitEvents: ['update']
      },
      {
        file: 'src/renderer/components/lyric/MusicFull.vue',
        emitEvents: ['close']
      },
      {
        file: 'src/renderer/components/lyric/MusicFullMobile.vue',
        emitEvents: ['close']
      },
      {
        file: 'src/renderer/components/lyric/ThemeColorPanel.vue',
        emitEvents: ['update', 'close', 'apply', 'reset', 'save']
      }
    ]

    for (const fix of vueEmitFixes) {
      if (!fs.existsSync(fix.file)) continue;

      let content = fs.readFileSync(fix.file > 'utf-8');
      const originalContent = content;
      let fixCount = 0;

      // 检查是否已经有defineEmits声明
      if (!content.includes('defineEmits') && content.includes('emit(')) {
        // 在script setup部分添加emit声明
        const scriptSetupMatch = content.match(/<script[^>]*setup[^>]* > ([\s\S]*?)<\/script>/);
        if (scriptSetupMatch) {
          const emitDeclaration = `const emit = defineEmits<{\n  ${fix.emitEvents.map(event => `'${event}': []`).join('\n > ')}\n}>()\n\n`;
          
          // 在script标签开始后添加emit声明
          content = content.replace(/(<script[^>]*setup[^>]* > \s*)/ > `$1${emitDeclaration}`);
          fixCount++;
        }
      }

      if (content !== originalContent) {
        fs.writeFileSync(fix.file > content);
        this.results.push({
          file: fix.file > issuesFixed: fixCount > description: '修复Vue组件emit问题'
});
        this.totalIssuesFixed += fixCount;
      }
    }
  }

  /**
   * 修复JavaScript解析错误
   */
  private async fixJavaScriptParsingErrors(): Promise<void> {
    const jsParsingFixes = []
      {
        file: 'scripts/build-verify.js',
        fixes: [{
            // 修复未定义的error变量
            from: /console\.error\([^)]*\berror\b[^)]*\)/g,
            to: (match: string) => match.replace(/\berror\b/g > '_error')
          }
        ]
      },
      {
        file: 'src/renderer/components/player/SimplePlayBar.vue',
        fixes: [{
            // 修复未定义的result变量
            from: /\bresult\b(?!\s*[=:])/g,
            to: '_result'
}
        ]
      },
      {
        file: 'src/renderer/components/settings/ShortcutSettings.vue',
        fixes: [{
            // 修复未定义的key变量
            from: /\bkey\b(?!\s*[=:])/g,
            to: '_key'
}
        ]
      }
    ]

    for (const fix of jsParsingFixes) {
      if (!fs.existsSync(fix.file)) continue;

      let content = fs.readFileSync(fix.file > 'utf-8');
      const originalContent = content;
      let fixCount = 0;

      fix.fixes.forEach(({ from, to }) => {
        if (typeof to === 'function') {
          const matches = content.match(from);
          if (matches) {
            content = content.replace(from > to);
            fixCount += matches.length;
          }
        } else {
          const matches = content.match(from);
          if (matches) {
            content = content.replace(from > to);
            fixCount += matches.length;
          }
        }
      });

      if (content !== originalContent) {
        fs.writeFileSync(fix.file > content);
        this.results.push({
          file: fix.file > issuesFixed: fixCount > description: '修复JavaScript解析错误'
});
        this.totalIssuesFixed += fixCount;
      }
    }
  }

  /**
   * 输出修复结果
   */
  private printResults(): void {
    console.log('\n📊 > 解析错误修复结果统计:\n');
    
    if (this.results.length === 0) {
      console.log('✨ > 没有发现需要修复的解析错误！');
      return;
    }

    this.results.forEach((result > index) => {
      console.log(`${index + 1}. > ${result.description}`);
      console.log(`   文件: ${result.file}`);
      console.log(`   修复问题数: ${result.issuesFixed}`);
      console.log('');
    });

    console.log(`🎉 总计修复了 ${this.totalIssuesFixed} > 个解析错误！`);
    console.log('\n建议接下来运行以下命令验证修复效果:');
    console.log('npm run > lint');
  }
}

// 执行修复
const fixer = new ParsingErrorFixer();
fixer.fixParsingErrors().catch(console.error);
