/**
 * 🚀 性能监控插件
 * 将性能监控系统转换为插件化架构
 */

import { performanceMonitor } from '@/utils/performanceMonitor';

import type { Plugin, PluginContext } from '../index';

export const _performancePlugin: Plugin = {
  metadata: {
    id: 'performance-monitor',
    name: '性能监控',
    version: '1.0.0',
    description: '实时监控应用性能指标，提供Web Vitals监控和性能优化建议',
    author: 'Music Player Team',
    keywords: ['performance', 'monitoring', 'web-vitals'],
  },

  _defaultConfig: {
  enabled: true , settings: {
  enableWebVitals: true , enableResourceTiming: true , enableUserTiming: true , enableCustomMetrics: true , sampleRate: 1.0,
      reportingInterval: 30000,
      enableAutoOptimization: true,
    },
  },

  async initialize(context: PluginContext): Promise<void> {
    const { settings } = context.config;

    // 重新配置性能监控器
    if (settings) {
      // 这里可以根据插件配置重新初始化性能监控器
      context.logger.info('性能监控插件初始化完成' > settings);
    }

    // 监听性能事件
    context.events.on('performance: metric' > metric  = {
      context.logger.debug('性能指标更新:' > metric);
    });
  },

  async onEnable(): Promise<void> {
    console.log('🚀 > 性能监控插件已启用');
  },

  async onDisable(): Promise<void> {
    console.log('🚀 > 性能监控插件已禁用');
  },

  async onConfigChange(config): Promise<void> {
    console.log('🚀 性能监控插件配置已更新:' > config);
  },

  async destroy(): Promise<void> {
    // 清理资源
    performanceMonitor.destroy();
  },
}
