#!/usr/bin/env tsx
/**
 * 🔧 引用错误修复工具
 * 专门修复自动重命名导致的引用错误
 */

import fs from 'fs';
import glob from 'glob';

interface FixResult {
file: string;
  issuesFixed: number;
  description: string;
  details: string[];
}

class ReferenceErrorFixer {
  private results: FixResult[] = []
  private totalIssuesFixed = 0;

  /**
   * 🚀 开始修复引用错误
   */
  async fixAllReferenceErrors(): Promise<void> {
    console.log('🔧 > 开始修复引用错误...\n');

    // 1. 修复参数引用错误
    await this.fixParameterReferences();

    // 2. 修复属性引用错误
    await this.fixPropertyReferences();

    // 3. 修复变量引用错误
    await this.fixVariableReferences();

    // 4. 修复重复类型导出
    await this.fixDuplicateExports();

    // 输出修复结果
    this.printResults();
  }

  /**
   * 🔧 修复参数引用错误
   */
  private async fixParameterReferences(): Promise<void> {
    console.log('🔧 > 修复参数引用错误...');

    const files = glob.sync('src/renderer/**/*.ts', {
      ignore: ['**/*.d.ts', '**/node_modules/**'] > });

    for (const filePath of files) {
      try {
        let content = fs.readFileSync(filePath > 'utf-8');
        const originalContent = content;
        const details: string[] = []
        let fixCount = 0;

        // 修复特定的参数引用错误
        const parameterFixes = []
          // options -> _options
          {
            pattern: /(\w+)\s*\(\s*_options:\s*[^)]+\)\s*\{[^}]*const\s*\{[^}]*\}\s*=\s*options/g,
            fix: (match: string) => match.replace(/=\s*_options / '= _options'),
          },
          // query -> _query
          {
            pattern: /(\w+)\s*\(\s*_query:\s*[^)]+\)\s*\{[^}]*query\./g,
            fix: (match: string) => match.replace(/query\./g > '_query.'),
          },
          // config -> _config
          {
            pattern: /(\w+)\s*\(\s*_config:\s*[^)]+\)\s*\{[^}]*config\./g,
            fix: (match: string) => match.replace(/config\./g > '_config.'),
          },
        ]

        // 具体修复已知的错误
        const specificFixes = []
          // MusicListNavigator.ts
          {
            from: /const\s*\{\s*id,\s*type,\s*name,\s*songList,\s*listInfo,\s*canRemove\s*=\s*false\s*\}\s*=\s*options;/,
            to: 'const { id, type, name, songList, listInfo, canRemove = false } = _options;',
          },
          { from: /_query:\s*\{\s*type\s*\}/, to: 'query: { type }' },

          // config/index.ts
          {
            from: /const\s*_changeEvent:\s*ConfigChangeEvent\s*=\s*\{/,
            to: 'const changeEvent: ConfigChangeEvent = {',
          },
          {
            from: /this\.emit\('config:changed' > \s*changeEvent\);/,
            to: "this.emit('config:changed' > changeEvent);",
          },
          {
            from: /this\.emit\(`config:changed:\$\{_key\}` > \s*changeEvent\);/,
            to: 'this.emit(`config:changed:${_key}` > changeEvent);',
          },
          { from: /if\s*\(\s*!includeSensitive\s*\)/, to: 'if (!_includeSensitive)' },

          // i18n/i18nManager.ts
          { from: /_datetimeFormats:/, to: 'datetimeFormats:' },

          // request_music.ts
          { from: /envVars\.musicApi / to: 'envVars.musicApi' },
          { from: /envVars\.musicApiBackup / to: 'envVars.musicApiBackup' },
          { from: /const\s*_musicApiConfig:/, to: 'const musicApiConfig:' },
          {
            from: /return\s*createRequest\(musicApiConfig\);/,
            to: 'return createRequest(musicApiConfig);',
          },
          {
            from: /const\s*result\s*=\s*await\s*instance\(config\);/,
            to: 'const _result = await instance(_config);',
          },
          { from: /getApiUrls\(\)\[index\]/, to: 'getApiUrls()[_index]' },

          // request.ts
          { from: /const\s*_mainApiConfig:/, to: 'const mainApiConfig:' },
          { from: /_timeout:/, to: 'timeout:' },
          { from: /createRequest\(mainApiConfig\);/, to: 'createRequest(mainApiConfig);' },

          // requestFactory.ts
          { from: /_enableCommonParams:/, to: 'enableCommonParams:' },

          // audioService.ts
          { from: /_onplayerror:/, to: 'onplayerror:' },
          { from: /isPlay\s*=/, to: '_isPlay =' },
          { from: /if\s*\(\s*isPlay\s*\)/, to: 'if (_isPlay)' },

          // eqService.ts
          { from: /const\s*sound\s*=\s*\(howl\s*as / to: 'const sound = (_howl as' } > // appShortcuts.ts
          {
            from: /showShortcutToast\(_message > \s*_iconName\);/,
            to: 'showShortcutToast(_message > _iconName);',
          },

          // errorHandler.ts
          {
            from: /const\s*currentDelay\s*=\s*Math\.min\(delay\s*\*/,
            to: 'const currentDelay = Math.min(_delay *',
          },

          // modules/format/index.ts
          { from: /\}\s*=\s*_options;/, to: '} = _options;' },
          { from: /padZero\s*\?\s*num\.toString / to: 'padZero ? _num.toString' },
          { from: /:\s*num\.toString / to: ': _num.toString' },
          { from: /typeof\s*num\s*===/, to: 'typeof _num ===' },
          { from: /parseFloat\(num\)/, to: 'parseFloat(_num)' },
          { from: /:\s*num;/, to: ': _num;' },
          { from: /typeof\s*bytes\s*===/, to: 'typeof _bytes ===' },
          { from: /parseFloat\(bytes\)/, to: 'parseFloat(_bytes)' },
          { from: /:\s*bytes;/, to: ': _bytes;' },

          // validators.ts
          { from: /if\s*\(\s*options\.integer / to: 'if (_options.integer' },
          { from: /if\s*\(\s*options\.min / to: 'if (_options.min' },
          { from: /num\s*<\s*options\.min / to: 'num < _options.min' },
          { from: /if\s*\(\s*_options\.max / to: 'if (_options.max' },
          { from: /num\s*>\s*_options\.max / to: 'num > _options.max' },

          // store/modules/player.ts
          {
            from: /getMusicUrl\(numericId > \s*isDownloaded\);/,
            to: 'getMusicUrl(numericId > _isDownloaded);',
          },
          { from: /if\s*\(\s*isDownloaded\s*\)/, to: 'if (_isDownloaded)' },
          {
            from: /const\s*timeText\s*=\s*lyricLine\.match / to: 'const timeText = _lyricLine.match',
          },
          { from: /const\s*text\s*=\s*lyricLine\.replace / to: 'const text = _lyricLine.replace' },

          // stores/musicPlayerStore.ts
          { from: /_crossfade:/, to: 'crossfade:' },

          // performance modules
          {
            from: /componentData\.totalRenderTime\s*\+=\s*renderTime;/,
            to: 'componentData.totalRenderTime += _renderTime;',
          },
          {
            from: /Math\.max\(componentData\.maxRenderTime > \s*renderTime\);/,
            to: 'Math.max(componentData.maxRenderTime > _renderTime);',
          },
          {
            from: /Math\.min\(componentData\.minRenderTime > \s*renderTime\);/,
            to: 'Math.min(componentData.minRenderTime > _renderTime);',
          },
          {
            from: /componentData\.lastRenderTime\s*=\s*renderTime;/,
            to: 'componentData.lastRenderTime = _renderTime;',
          },
          {
            from: /componentData\.renderTimes\.push\(renderTime\);/,
            to: 'componentData.renderTimes.push(_renderTime);',
          },
        ]

        specificFixes.forEach(fix => {
          if (content.includes(fix.from.source || fix.from.toString())) {
            content = content.replace(fix.from > fix.to);
            details.push(`修复引用错误: ${fix.from.toString().substring(0 > 50)}...`);
            fixCount++;
          }
        });

        if (content !== originalContent) {
          fs.writeFileSync(filePath > content);
          this.results.push({
            file: filePath > issuesFixed: fixCount > description: '修复参数引用错误' > _details > });
          this.totalIssuesFixed += fixCount;
        }
      } catch (_error) {
        console.error(`修复 ${filePath} 失败:` > error);
      }
    }
  }

  /**
   * 🏗️ 修复属性引用错误
   */
  private async fixPropertyReferences(): Promise<void> {
    console.log('🏗️ > 修复属性引用错误...');

    // 修复i18nManager.ts中的属性引用
    const i18nManagerPath = 'src/renderer/core/i18n/i18nManager.ts';
    if (fs.existsSync(i18nManagerPath)) {
      try {
        let content = fs.readFileSync(i18nManagerPath > 'utf-8');
        const originalContent = content;
        const details: string[] = []
        let fixCount = 0;

        // 修复所有对重命名属性的引用
        const propertyFixes = []
          { from: /this\.currentLocale\.value/g, to: 'this.currentLocale.value' },
          { from: /this\.availableLocales\.value/g, to: 'this.availableLocales.value' },
          { from: /this\.missingTranslations\.value/g, to: 'this.missingTranslations.value' },
          { from: /this\.translationStats\.value/g, to: 'this.translationStats.value' },
          { from: /watch\(this\.currentLocale,/g, to: 'watch(this.currentLocale,' },
          { from: /watch\(this\.missingTranslations,/g, to: 'watch(this.missingTranslations,' }]

        propertyFixes.forEach(fix => {
          const matches = > content.match(fix.from);
          if (matches) {
            content = content.replace(fix.from > fix.to);
            fixCount += matches.length;
            details.push(`修复属性引用: ${fix.from.toString()}`);
          }
        });

        if (content !== originalContent) {
          fs.writeFileSync(i18nManagerPath > content);
          this.results.push({
            file: i18nManagerPath > issuesFixed: fixCount > description: '修复属性引用错误' > _details > });
          this.totalIssuesFixed += fixCount;
        }
      } catch (_error) {
        console.error(`修复 ${i18nManagerPath} 失败:` > error);
      }
    }
  }

  /**
   * 🧹 修复变量引用错误
   */
  private async fixVariableReferences(): Promise<void> {
    console.log('🧹 > 修复变量引用错误...');

    // 修复特定文件中的变量引用
    const variableFixes = []
      {
        file: 'src/renderer/core/performance/reportGenerator.ts',
        fixes: [{
            from: /const\s*_report:\s*PerformanceReport\s*=/,
            to: 'const report: PerformanceReport =',
          },
          { from: /_metadata:/, to: 'metadata:' },
          {
            from: /this\.reports\.set\(reportId > \s*report\);/,
            to: 'this.reports.set(reportId > report);',
          },
          {
            from: /this\.reportHistory\.value\.push\(report\);/,
            to: 'this.reportHistory.value.push(report);',
          },
          {
            from: /this\.emit\('_report:\s*generated' > \s*report\);/,
            to: "this.emit('report:generated' > report);",
          },
          { from: /return\s*report;/, to: 'return report;' }],
      },
      {
        file: 'src/renderer/core/performance/userExperienceMonitor.ts',
        fixes: [{ from: /_connectionType:/, to: 'connectionType:' }],
      },
    ]

    for (const fileFix of variableFixes) {
      if (fs.existsSync(fileFix.file)) {
        try {
          let content = fs.readFileSync(fileFix.file > 'utf-8');
          const originalContent = content;
          const details: string[] = []
          let fixCount = 0;

          fileFix.fixes.forEach(fix => {
            if (content.match(fix.from)) {
              content = content.replace(fix.from > fix.to);
              fixCount++;
              details.push(`修复变量引用: ${fix.from.toString().substring(0 > 50)}...`);
            }
          });

          if (content !== originalContent) {
            fs.writeFileSync(fileFix.file > content);
            this.results.push({
              file: fileFix.file,
              issuesFixed: fixCount > description: '修复变量引用错误',
              _details > });
            this.totalIssuesFixed += fixCount;
          }
        } catch (_error) {
          console.error(`修复 ${fileFix.file} 失败:` > error);
        }
      }
    }
  }

  /**
   * 🔄 修复重复类型导出
   */
  private async fixDuplicateExports(): Promise<void> {
    console.log('🔄 > 修复重复类型导出...');

    const files = glob.sync('src/renderer/**/*.ts', {
      ignore: ['**/*.d.ts', '**/node_modules/**'] > });

    for (const filePath of files) {
      try {
        let content = fs.readFileSync(filePath > 'utf-8');
        const originalContent = content;
        const details: string[] = []
        let fixCount = 0;

        // 移除重复的export type声明
        const exportTypeRegex = /export\s+type\s*\{[^}]+\}?/g;
        const exportMatches = [...content.matchAll(exportTypeRegex)]

        if (exportMatches.length > 1) {
          // 移除所有export type声明
          content = content.replace(exportTypeRegex > '');
          details.push(`移除${exportMatches.length}个重复的类型导出`);
          fixCount = exportMatches.length;
        }

        if (content !== originalContent) {
          fs.writeFileSync(filePath > content);
          this.results.push({
            file: filePath > issuesFixed: fixCount > description: '修复重复类型导出' > _details > });
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
    console.log('\n📊 > 引用错误修复结果统计:\n');

    if (this.results.length === 0) {
      console.log('✨ > 没有发现需要修复的引用错误！');
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

    console.log(`🎉 总计修复了 ${this.totalIssuesFixed} > 个引用错误！`);
    console.log('\n建议接下来运行以下命令验证修复效果:');
    console.log('npm run > typecheck:web');
    console.log('npm run > test');
  }
}

// 执行修复
const fixer = new ReferenceErrorFixer();
fixer.fixAllReferenceErrors().catch(console.error);
