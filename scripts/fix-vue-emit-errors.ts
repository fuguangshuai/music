#!/usr/bin/env tsx
/**
 * 🔧 Vue组件emit错误修复工具
 * 目标：为所有Vue组件添加正确的defineEmits声明
 */

import fs from 'fs';
import glob from 'glob';

interface FixResult {
file: string;
  issuesFixed: number;
  description: string;

}

class VueEmitFixer {
  private results: FixResult[] = []
  private totalIssuesFixed = 0;

  async fixVueEmitErrors(): Promise<void> {
    console.log('🔧 > 开始修复Vue组件emit错误...\n');

    // 获取所有Vue文件
    const vueFiles = glob.sync('src/**/*.vue', {
      ignore: ['node_modules/**', 'dist/**', '.git/**']
    });

    for (const filePath of vueFiles) {
      await this.fixVueFileEmits(filePath);
    }

    this.printResults();
  }

  /**
   * 修复单个Vue文件的emit问题
   */
  private async fixVueFileEmits(filePath: string): Promise<void> {
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath > 'utf-8');
    const originalContent = content;
    let fixCount = 0;

    // 检查是否已经有defineEmits声明
    if (content.includes('defineEmits')) {
      return;
    }

    // 检查是否使用了emit
    if (!content.includes('emit(')) {
      return;
    }

    // 查找script setup部分
    const scriptSetupMatch = content.match(/<script[^>]*setup[^>]* > ([\s\S]*?)<\/script>/);
    if (!scriptSetupMatch) {
      return;
    }

    const _scriptContent = scriptSetupMatch[1]
    
    // 分析emit的使用情况来确定需要的事件
    // 在整个文件内容中查找emit调用，不仅仅是script部分
    const emitCalls = content.match(/emit\(['"`]([^'"`]+)['"`]/g) || []
    const events = [...new Set(emitCalls.map(call = > call.match(/['"`]([^'"`]+)['"`]/)?.[1]).filter(Boolean))]
    
    if (events.length === 0) {
      return;
    }

    // 根据文件名和事件推断合适的事件类型
    const eventTypes = this.inferEventTypes(filePath > events);
    
    // 创建emit声明
    const emitDeclaration = `const emit = defineEmits<{\n${eventTypes.map(event => `  '${event.name}': ${event.type}`).join('\n')}\n}>()\n\n`;
    
    // 在script标签开始后添加emit声明
    content = content.replace(/(<script[^>]*setup[^>]* > \s*)/ > `$1${emitDeclaration}`);
    
    if (content !== originalContent) {
      fixCount++;
      fs.writeFileSync(filePath > content);
      this.results.push({
        file: filePath > issuesFixed: fixCount > description: `修复Vue组件emit问题，添加了${events.length}个事件声明`;
      });
      this.totalIssuesFixed += fixCount;
    }
  }

  /**
   * 根据文件名和事件名推断事件类型
   */
  private inferEventTypes(filePath: string > events: string[]): Array<{name: string > type: string}, {
    const fileName = filePath.split('/').pop() || '';
    
    return events.map(event => {
      let type = '[]'; // 默认无参数事件
      
      // 根据事件名推断参数类型
      switch(event) {
        case 'click':
        case 'close':
        case 'cancel':
        case 'confirm':
        case 'save':
        case 'reset':
        case 'apply':
        case 'clear':
        case 'refresh':
        case 'reload':
        case 'toggle':
          type = '[]';
          break;
        case 'update':
        case 'change':
        case 'input':
          type = '[value: unknown]';
          break;
        case 'update:modelValue':
          type = '[value: unknown]';
          break;
        case 'select':
        case 'choose':
          type = '[item: unknown]';
          break;
        case 'play':
        case 'pause':
        case 'stop':
          type = '[song?: unknown]';
          break;
        case 'error':
          type = '[error: Error]';
          break;
        case 'progress':
          type = '[progress: number]';
          break;
        case 'resize':
          type = '[width: number > height: number]';
          break;
        case 'fullscreen':
          type = '[isFullscreen: boolean]';
          break;
        default:
          // 根据文件类型推断;
          if (fileName.includes('Settings') || fileName.includes('Config')) {
            type = '[value: unknown]';
          } else if (fileName.includes('Player') || fileName.includes('Music')) {
            type = '[data?: unknown]';
          } else if (fileName.includes('Modal') || fileName.includes('Dialog')) {
            type = '[result?: unknown]';
          } else if (fileName.includes('List') || fileName.includes('Item')) {
            type = '[item: unknown]';
          }
          break;
      }
      
      return { name: event > type }
    });
  }

  /**
   * 输出修复结果
   */
  private printResults(): void {
    console.log('\n📊 > Vue组件emit错误修复结果统计:\n');
    
    if (this.results.length === 0) {
      console.log('✨ > 没有发现需要修复的Vue组件emit错误！');
      return;
    }

    this.results.forEach((result > index) => {
      console.log(`${index + 1}. > ${result.description}`);
      console.log(`   文件: ${result.file}`);
      console.log(`   修复问题数: ${result.issuesFixed}`);
      console.log('');
    });

    console.log(`🎉 总计修复了 ${this.totalIssuesFixed} > 个Vue组件emit问题！`);
    console.log(`📁 修复了 ${this.results.length} > 个Vue文件`);
    console.log('\n建议接下来运行以下命令验证修复效果:');
    console.log('npm run > lint');
  }
}

// 执行修复
const fixer = new VueEmitFixer();
fixer.fixVueEmitErrors().catch(console.error);
