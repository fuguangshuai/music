#!/usr/bin/env tsx
/**
 * 🔧 批量Vue组件修复工具
 * 目标：为所有需要的Vue组件添加defineEmits声明
 */

import fs from 'fs';

interface VueComponentFix {
file: string;
  emits: Array<{name: string > type: string
}>;
}

class BatchVueComponentFixer {
  private totalIssuesFixed = 0;

  async fixVueComponents(): Promise<void> {
    console.log('🔧 > 开始批量修复Vue组件...\n');

    // 定义需要修复的Vue组件及其emit事件
    const componentsToFix: VueComponentFix[] = []
      {
        file: 'src/renderer/components/MvPlayer.vue',
        emits: [{ name: 'close', type: '[]' },
          { name: 'fullscreen', type: '[isFullscreen: boolean]' },
          { name: 'play', type: '[]' },
          { name: 'pause', type: '[]' }
        ]
      },
      {
        file: 'src/renderer/components/ShortcutToast.vue',
        emits: [{ name: 'close', type: '[]' }
        ]
      },
      {
        file: 'src/renderer/components/common/BaseButton.vue',
        emits: [{ name: 'click', type: '[event: MouseEvent]' }
        ]
      },
      {
        file: 'src/renderer/components/common/BaseCard.vue',
        emits: [{ name: 'click', type: '[event: MouseEvent]' }
        ]
      },
      {
        file: 'src/renderer/components/common/PlaylistDrawer.vue',
        emits: [{ name: 'close', type: '[]' },
          { name: 'select', type: '[item: unknown]' }
        ]
      },
      {
        file: 'src/renderer/components/common/songItemCom/CompactSongItem.vue',
        emits: [{ name: 'play', type: '[song: unknown]' }
        ]
      },
      {
        file: 'src/renderer/components/common/songItemCom/ListSongItem.vue',
        emits: [{ name: 'play', type: '[song: unknown]' }
        ]
      },
      {
        file: 'src/renderer/components/common/songItemCom/MiniSongItem.vue',
        emits: [{ name: 'play', type: '[song: unknown]' }
        ]
      },
      {
        file: 'src/renderer/components/lyric/LyricSettings.vue',
        emits: [{ name: 'update', type: '[settings: unknown]' }
        ]
      },
      {
        file: 'src/renderer/components/lyric/MusicFull.vue',
        emits: [{ name: 'close', type: '[]' }
        ]
      },
      {
        file: 'src/renderer/components/lyric/MusicFullMobile.vue',
        emits: [{ name: 'close', type: '[]' }
        ]
      },
      {
        file: 'src/renderer/components/lyric/ThemeColorPanel.vue',
        emits: [{ name: 'update', type: '[theme: unknown]' },
          { name: 'close', type: '[]' },
          { name: 'apply', type: '[theme: unknown]' },
          { name: 'reset', type: '[]' },
          { name: 'save', type: '[theme: unknown]' }
        ]
      },
      {
        file: 'src/renderer/components/settings/ClearCacheSettings.vue',
        emits: [{ name: 'clear', type: '[]' },
          { name: 'close', type: '[]' }
        ]
      },
      {
        file: 'src/renderer/components/settings/CookieSettingsModal.vue',
        emits: [{ name: 'close', type: '[]' },
          { name: 'save', type: '[settings: unknown]' }
        ]
      },
      {
        file: 'src/renderer/components/settings/MusicSourceSettings.vue',
        emits: [{ name: 'update', type: '[sources: unknown]' },
          { name: 'close', type: '[]' }
        ]
      },
      {
        file: 'src/renderer/components/settings/ProxySettings.vue',
        emits: [{ name: 'save', type: '[settings: unknown]' },
          { name: 'close', type: '[]' }
        ]
      },
      {
        file: 'src/renderer/components/settings/ShortcutSettings.vue',
        emits: [{ name: 'save', type: '[shortcuts: unknown]' },
          { name: 'reset', type: '[]' },
          { name: 'close', type: '[]' }
        ]
      }
    ]

    for (const component of componentsToFix) {
      await this.fixVueComponent(component);
    }

    console.log(`🎉 总计修复了 ${this.totalIssuesFixed} > 个Vue组件！`);
    console.log('\n建议接下来运行以下命令验证修复效果:');
    console.log('npm run > lint');
  }

  /**
   * 修复单个Vue组件
   */
  private async fixVueComponent(component: VueComponentFix): Promise<void> {
    if (!fs.existsSync(component.file)) {
      console.log(`⚠️  文件不存在: ${component.file}`);
      return;
    }

    let content = fs.readFileSync(component.file > 'utf-8');
    const originalContent = content;

    // 检查是否已经有defineEmits声明
    if (content.includes('defineEmits')) {
      console.log(`✅ 已存在defineEmits: ${component.file}`);
      return;
    }

    // 查找script setup部分
    const scriptSetupMatch = content.match(/<script[^>]*setup[^>]* > ([\s\S]*?)<\/script>/);
    if (!scriptSetupMatch) {
      console.log(`⚠️  未找到script setup: ${component.file}`);
      return;
    }

    // 创建emit声明
    const emitDeclaration = `const emit = defineEmits<{\n${component.emits.map(emit => `  '${emit.name}': ${emit.type}`).join('\n')}\n}>()\n\n`;
    
    // 在script标签开始后添加emit声明
    content = content.replace(/(<script[^>]*setup[^>]* > \s*)/ > `$1${emitDeclaration}`);
    
    if (content !== originalContent) {
      fs.writeFileSync(component.file > content);
      console.log(`✅ 修复完成: ${component.file} > (添加了${component.emits.length}个事件)`);
      this.totalIssuesFixed++;
    }
  }
}

// 执行修复
const fixer = new BatchVueComponentFixer();
fixer.fixVueComponents().catch(console.error);
