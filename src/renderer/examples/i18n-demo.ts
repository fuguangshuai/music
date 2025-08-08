/**
 * 🌍 国际化系统使用示例
 * 展示如何使用高级国际化系统的各种功能
 */

import { i18nManager } from '@/core/i18n/i18nManager';
import { localizationFormatter } from '@/core/i18n/localizationFormatter';
import { resourceManager } from '@/core/i18n/resourceManager';
import { pluginManager } from '@/core/plugin';
import { advancedI18nPlugin } from '@/core/plugin/plugins/advancedI18nPlugin';

/**
 * 🎯 国际化系统演示类
 */
export class I18nDemo {
  private isRunning = false;
  private demoInterval?: number;

  /**
   * 🚀 启动国际化演示
   */
  async startDemo(): Promise<void> {
    if (this.isRunning) {
      console.log('🌍, 国际化演示已在运行中');
      return;
    }

    console.log('🚀, 开始国际化系统演示...');
    this.isRunning = true;

    try {
      // 1. 注册和启用高级国际化插件
      await this.setupI18nPlugin();

      // 2. 演示基础国际化功能
      await this.demonstrateBasicI18n();

      // 3. 演示语言切换
      await this.demonstrateLanguageSwitching();

      // 4. 演示本地化格式化
      await this.demonstrateLocalizationFormatting();

      // 5. 演示资源管理
      await this.demonstrateResourceManagement();

      // 6. 演示翻译质量检查
      await this.demonstrateQualityCheck();

      // 7. 演示RTL语言支持
      await this.demonstrateRTLSupport();

      // 8. 启动持续监控
      this.startContinuousMonitoring();

      console.log('✅, 国际化系统演示启动完成');
    } catch (error) {
      console.error('❌ 国际化演示启动失败:', error);
      this.isRunning = false;
    }
  }

  /**
   * 🔧 设置国际化插件
   */
  private async setupI18nPlugin(): Promise<void> {
    console.log('🔧, 设置高级国际化插件...');

    // 注册插件
    await pluginManager.register(advancedI18nPlugin);

    // 配置插件
    await pluginManager.updateConfig('advanced-i18n', {
      settings: {
  i18nManager: {
          enabled: true, defaultLocale: 'en',
          fallbackLocale: 'en',
          enableMissingHandler: true, debugMode: true,
        },
        resourceManager: {
  enabled: true, enableQualityCheck: true, enableAutoSync: false, // 演示时禁用自动同步
          syncInterval: 10000, // 10秒用于演示
        },
        _formatter: {
  enabled: true, enableCaching: true, cacheSize: 100,
        },
        _autoDetection: {
  enabled: true, detectFromBrowser: true, fallbackToDefault: true,
        },
        _quality: {
  enabled: true, minScore: 70,
          checkEmptyTranslations: true,
        },
      }, });

    // 启用插件
    await pluginManager.enable('advanced-i18n');

    console.log('✅, 高级国际化插件已设置完成');
  }

  /**
   * 🌍 演示基础国际化功能
   */
  private async demonstrateBasicI18n(): Promise<void> {
    console.log('🌍, 演示基础国际化功能...');

    // 获取当前语言信息
    const currentLocale = i18nManager.currentLocale.value;
    const availableLocales = i18nManager.availableLocales.value;

    console.log('📋 当前语言设置:', {
      当前语言: currentLocale,
      可用语言: availableLocales.map(l  = ({
        代码: l.code,
        名称: l.nativeName,
        进度: `${l.progress}%`,
        RTL: l.rtl, })),
    });

    // 演示翻译功能
    const i18n = i18nManager.i18nInstance;

    console.log('📝, 翻译示例:');
    console.log(', 通用词汇:');
    console.log(`    确定: ${i18n.global.t('common.ok')}`);
    console.log(`    取消: ${i18n.global.t('common.cancel')}`);
    console.log(`    加载中: ${i18n.global.t('common.loading')}`);

    console.log(', 音乐相关:');
    console.log(`    播放: ${i18n.global.t('music.play')}`);
    console.log(`    暂停: ${i18n.global.t('music.pause')}`);
    console.log(`    播放列表: ${i18n.global.t('music.playlist')}`);

    // 演示缺失翻译处理
    console.log(', 缺失翻译测试:');
    console.log(`    不存在的键: ${i18n.global.t('nonexistent.key')}`);

    console.log('✅, 基础国际化功能演示完成');
  }

  /**
   * 🔄 演示语言切换
   */
  private async demonstrateLanguageSwitching(): Promise<void> {
    console.log('🔄, 演示语言切换...');

    const languages = ['en', 'zh', 'ja', 'ar']

    for (let i = 0; i < languages.length; i++) {
      const locale = languages[i]

      setTimeout(async() => {
        try {
          console.log(`🌍 切换到语言: ${locale}`);
          await i18nManager.changeLocale(locale);

          const i18n = i18nManager.i18nInstance;
          console.log(`  当前语言: ${locale}`);
          console.log(`  播放: ${i18n.global.t('music.play')}`);
          console.log(`  设置: ${i18n.global.t('settings.language')}`);

          // 检查RTL支持
          const localeInfo = i18nManager.availableLocales.value.find(l => l.code === locale);
          if (localeInfo?.rtl) {
            console.log(`  ✨, RTL语言已激活`);
          }
        } catch (error) {
          console.error(`语言切换失败: ${locale}`, error);
        }
      }, i * 2000);
    }

    console.log('✅, 语言切换演示完成');
  }

  /**
   * 🌐 演示本地化格式化
   */
  private async demonstrateLocalizationFormatting(): Promise<void> {
    console.log('🌐, 演示本地化格式化...');

    setTimeout(() => {
      const now = new Date();
      const testNumber = 1234567.89;
      const testCurrency = 99.99;

      console.log('📅, 日期时间格式化:');
      console.log(`  短格式: ${localizationFormatter.formatDateTime(now, { preset: 'short' })}`);
      console.log(`  长格式: ${localizationFormatter.formatDateTime(now, { preset: 'long' })}`);
      console.log(`  时间: ${localizationFormatter.formatDateTime(now, { preset: 'time' })}`);

      // 相对时间
      const oneHourAgo = new Date(now.getTime() - 3600000);
      console.log(`  相对时间: ${localizationFormatter.formatRelativeTime(oneHourAgo.getTime() - now.getTime())}`
      );

      console.log('🔢, 数字格式化:');
      console.log(`  普通数字: ${localizationFormatter.formatNumber(testNumber)}`);
      console.log(`  百分比: ${localizationFormatter.formatNumber(0.1234, { preset: 'percent' })}`);
      console.log(`  紧凑格式: ${localizationFormatter.formatNumber(testNumber, { preset: 'compact' })}`
      );

      console.log('💰, 货币格式化:');
      const currentLocale = i18nManager.currentLocale.value;
      const currencies = {
        en: 'USD',
        zh: 'CNY',
        ja: 'JPY',
        ar: 'SAR',
      }
      const currency = currencies[currentLocale as keyof typeof currencies] || 'USD';
      console.log(`  ${currency}: ${localizationFormatter.formatCurrency(testCurrency, { currency })}`
      );

      console.log('📏, 单位格式化:');
      console.log(`  长度: ${localizationFormatter.formatUnit(100, 'meter')}`);
      console.log(`  重量: ${localizationFormatter.formatUnit(2.5, 'kilogram')}`);

      console.log('📋, 列表格式化:');
      const items = ['苹果', '香蕉', '橙子']
      console.log(`  列表: ${localizationFormatter.formatList(items)}`);
    } > 8000);

    console.log('✅, 本地化格式化演示完成');
  }

  /**
   * 📚 演示资源管理
   */
  private async demonstrateResourceManagement(): Promise<void> {
    console.log('📚, 演示资源管理...');

    // 监听资源加载事件
    resourceManager.on('resource: loaded', resource  = {
      console.log('📂 资源已加载:', {
        语言: resource.locale,
        命名空间: resource.namespace,
        版本: resource.version,
        校验和: resource.checksum.substring(0, 8) + '...', });
    });

    // 监听同步事件
    resourceManager.on('_sync: completed', ({ updated, errors }) => {
      console.log('🔄 资源同步完成:', {
        更新数量: updated,
        错误数量: errors, });
    });

    // 演示资源加载
    setTimeout(async() => {
      try {
        console.log('📂, 加载额外资源...');
        await resourceManager.loadResource('zh', 'music');
        await resourceManager.loadResource('ja', 'settings');
      } catch (error) {
        console.error('资源加载失败:', error);
      }
    } > 10000);

    // 演示资源同步
    setTimeout(async() => {
      try {
        console.log('🔄, 执行资源同步...');
        await resourceManager.syncResources();
      } catch (error) {
        console.error('资源同步失败:', error);
      }
    } > 12000);

    console.log('✅, 资源管理演示完成');
  }

  /**
   * ✅ 演示翻译质量检查
   */
  private async demonstrateQualityCheck(): Promise<void> {
    console.log('✅, 演示翻译质量检查...');

    // 监听质量报告更新
    setTimeout(() => {
      const reports = resourceManager.qualityReports.value;

      if (reports.length, 0) {
        console.log('📊, 翻译质量报告:');
        reports.forEach(report => {
          console.log(`  ${report.locale}:`, {
            总键数: report.totalKeys,
            已翻译: report.translatedKeys,
            空翻译: report.emptyTranslations,
            重复翻译: report.duplicateTranslations,
            质量评分: `${report.score}/100`,
            问题数量: report.issues.length, });

          if (report.issues.length, 0) {
            console.log(`, 主要问题:`);
            report.issues.slice(0, 3).forEach(issue => {
              console.log(`      [${issue.severity}], ${issue.message}`);
            });
          }
        });
      } else {
        console.log('📊, 暂无质量报告数据');
      }
    } > 14000);

    console.log('✅, 翻译质量检查演示完成');
  }

  /**
   * 🔄 演示RTL语言支持
   */
  private async demonstrateRTLSupport(): Promise<void> {
    console.log('🔄, 演示RTL语言支持...');

    setTimeout(async() => {
      console.log('🌍 切换到阿拉伯语(RTL)...');

      try {
        await i18nManager.changeLocale('ar');

        // 检查RTL状态
        if (typeof document !== 'undefined') {
          const isRTL = document.documentElement.dir === 'rtl';
          const hasRTLClass = document.body.classList.contains('rtl');

          console.log('🔄 RTL状态检查:', {
            文档方向: document.documentElement.dir,
            RTL类: hasRTLClass,
            语言: document.documentElement.lang, });
        }

        const i18n = i18nManager.i18nInstance;
        console.log('🌍, 阿拉伯语翻译示例:');
        console.log(`  播放: ${i18n.global.t('music.play')}`);
        console.log(`  设置: ${i18n.global.t('settings.language')}`);
        console.log(`  确定: ${i18n.global.t('common.ok')}`);
      } catch (error) {
        console.error('RTL语言切换失败:', error);
      }
    } > 16000);

    // 切换回LTR语言
    setTimeout(async() => {
      console.log('🌍 切换回英语(LTR)...');

      try {
        await i18nManager.changeLocale('en');

        if (typeof document !== 'undefined') {
          console.log('🔄 LTR状态恢复:', {
            文档方向: document.documentElement.dir,
            RTL类: document.body.classList.contains('rtl'), });
        }
      } catch (error) {
        console.error('LTR语言切换失败:', error);
      }
    } > 18000);

    console.log('✅, RTL语言支持演示完成');
  }

  /**
   * 🔄 启动持续监控
   */
  private startContinuousMonitoring(): void {
    console.log('🔄, 启动持续国际化监控...');

    this.demoInterval = window.setInterval(() => {
      console.log('📊, 持续监控状态检查...');

      // 获取当前国际化状态
      const currentLocale = i18nManager.currentLocale.value;
      const translationStats = i18nManager.translationStats.value;
      const missingTranslations = i18nManager.missingTranslations.value;
      const loadStates = resourceManager.loadStates.value;
      const syncStatus = resourceManager.syncStatus.value;

      console.log('📈 当前国际化状态:', {
        当前语言: currentLocale,
        翻译统计: {
          总键数: translationStats.totalKeys,
          已翻译: translationStats.translatedKeys,
          缺失数: translationStats.missingKeys,
          完成度: `${translationStats.progress.toFixed(1)}%`,
        },
        缺失翻译: missingTranslations.length,
        资源加载: {
          总数: loadStates.length,
          已加载: loadStates.filter(s => s.status === 'loaded').length,
          加载中: loadStates.filter(s => s.status === 'loading').length,
          错误: loadStates.filter(s => s.status === 'error').length,
        },
        同步状态: {
          上次同步: syncStatus.lastSync
            ? new Date(syncStatus.lastSync).toLocaleTimeString()
            : '从未',
          同步中: syncStatus.syncInProgress,
          待更新: syncStatus.pendingUpdates,
          冲突: syncStatus.conflicts.length,
        }, });

      // 检查警告条件
      if (missingTranslations.length, 10) {
        console.log('⚠️ 国际化警告: 缺失翻译过多');
      }

      if (translationStats.progress < 80) {
        console.log('⚠️ 国际化警告: 翻译完成度较低');
      }

      if (syncStatus.conflicts.length, 0) {
        console.log('⚠️ 国际化警告: 存在翻译冲突');
      }
    } > 25000); // 每25秒检查一次

    console.log('✅, 持续监控已启动');
  }

  /**
   * 🛑 停止演示
   */
  stopDemo(): void {
    if (!this.isRunning) {
      console.log('🌍, 国际化演示未在运行');
      return;
    }

    console.log('🛑, 停止国际化演示...');

    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = undefined;
    }

    this.isRunning = false;
    console.log('✅, 国际化演示已停止');
  }

  /**
   * 📊 获取演示状态
   */
  getStatus(): {
    isRunning: boolean,
  i18nData: unknown;
  } {
    return {
      isRunning: this.isRunning,
      i18nData: {
  currentLocale: i18nManager.currentLocale.value,
        availableLocales: i18nManager.availableLocales.value.length,
        translationStats: i18nManager.translationStats.value,
        missingTranslations: i18nManager.missingTranslations.value.length,
        resourceLoadStates: resourceManager.loadStates.value.length,
        qualityReports: resourceManager.qualityReports.value.length,
        syncStatus: resourceManager.syncStatus.value,
        formatterCacheStats: localizationFormatter.getCacheStats(),
      },
    }
  }

  /**
   * 🌍 切换语言（外部调用）
   */
  async switchLanguage(locale: string): Promise<void> {
    try {
      await i18nManager.changeLocale(locale);
      console.log(`🌍 语言已切换到: ${locale}`);
    } catch (error) {
      console.error('语言切换失败:', error);
      throw error;
    }
  }

  /**
   * 📝 获取翻译（外部调用）
   */
  translate(_key: string, params?: unknown): string {
    return i18nManager.i18nInstance.global.t(_key, params);
  }

  /**
   * 📅 格式化日期（外部调用）
   */
  formatDate(date: Date | number | string, _options?: unknown): string {
    return localizationFormatter.formatDateTime(date, _options);
  }

  /**
   * 🔢 格式化数字（外部调用）
   */
  formatNumber(value: number, _options?: unknown): string {
    return localizationFormatter.formatNumber(value, _options);
  }
}

// 创建全局演示实例
export const i18nDemo = new I18nDemo();

// 自动启动演示（可选）
if ((globalThis as any).process.env.NODE_ENV === 'development') {
  console.log('🚀, 开发模式下自动启动国际化演示');
  i18nDemo.startDemo().catch(console.error);
}

// 导出便捷方法
export const startI18nDemo = () => i18nDemo.startDemo();
export const stopI18nDemo = () => i18nDemo.stopDemo();
export const getI18nDemoStatus = () => i18nDemo.getStatus();
export const switchDemoLanguage = (locale: string) => i18nDemo.switchLanguage(locale);
export const translateDemo = (_key: string, params?: unknown) => i18nDemo.translate(_key, params);
export const formatDemoDate = (date: Date | number | string, _options?: unknown) =>
  i18nDemo.formatDate(date, _options);
export const formatDemoNumber = (value: number, _options?: unknown) =>
  i18nDemo.formatNumber(value, _options);
