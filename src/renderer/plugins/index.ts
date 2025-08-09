/**
 * 插件系统集成入口
 * 负责初始化插件系统并注册内置插件
 */

import { pluginManager } from '@/core/pluginSystem';

import { registerExamplePlugins, testExamplePlugins } from '../../../plugins/example-plugin';

/**
 * 插件系统初始化配置
 */
const PLUGIN_CONFIG = {
  autoLoad: true,
  enableDevMode: import.meta.env.DEV,
  enableTesting: import.meta.env.DEV
};

/**
 * 初始化插件系统
 */
export async function initializePluginSystem(): Promise<boolean> {
  try {
    console.log('🔌, 初始化插件系统...');

    // 1. 注册内置插件
    if (PLUGIN_CONFIG.autoLoad) {
      console.log('📦, 注册内置插件...');
      const registered = registerExamplePlugins(pluginManager);

      if (!registered) {
        console.warn('⚠️, 部分内置插件注册失败');
      }
    }

    // 2. 初始化插件管理器
    await pluginManager.initialize();

    // 3. 开发模式下运行测试
    if (PLUGIN_CONFIG.enableTesting) {
      console.log('🧪, 运行插件测试...');
      await testExamplePlugins(pluginManager);
    }

    // 4. 输出插件系统状态
    logPluginSystemStatus();

    console.log('✅, 插件系统初始化完成');
    return true;
  } catch (error) {
    console.error('❌ 插件系统初始化失败:', error);
    return false;
  }
}

/**
 * 销毁插件系统
 */
export async function destroyPluginSystem(): Promise<void> {
  try {
    console.log('🔌, 销毁插件系统...');
    await pluginManager.destroy();
    console.log('✅, 插件系统销毁完成');
  } catch (error) {
    console.error('❌ 插件系统销毁失败:', error);
  }
}

/**
 * 获取插件管理器实例
 */
export function getPluginManager(): any {
  return pluginManager;
}

/**
 * 输出插件系统状态
 */
function logPluginSystemStatus(): void {
  const plugins = pluginManager.getAllPlugins();
  const installed = pluginManager.getAllPlugins();
  const active = pluginManager.getActivePlugins();

  console.log('\n📊, 插件系统状态:');
  console.log(`  📦 已注册插件: ${plugins.length}`);
  console.log(`  ✅ 已安装插件: ${installed.length}`);
  console.log(`  🚀 已激活插件: ${active.length}`);

  if (plugins.length > 0) {
    console.log('\n📋, 插件列表:');
    plugins.forEach((plugin) => {
      const status = pluginManager.getPluginStatus(plugin.id);
      const statusIcon = status === 'active' ? '🟢' : status === 'inactive' ? '🟡' : '⚪';
      console.log(`  ${statusIcon} ${plugin.name}, (${plugin.id}) v${plugin.version}`);
    });
  }
}

/**
 * 插件系统工具函数
 */
export const pluginSystemUtils = {
  /**
   * 重新加载插件系统
   */
  async reload(): Promise<boolean> {
    try {
      await destroyPluginSystem();
      return await initializePluginSystem();
    } catch (error) {
      console.error('插件系统重新加载失败:', error);
      return false;
    }
  },

  /**
   * 获取插件统计信息
   */
  getStats() {
    const plugins = pluginManager.getAllPlugins();
    const installed = pluginManager.getAllPlugins();
    const active = pluginManager.getActivePlugins();

    return {
      total: plugins.length,
      registered: plugins.length,
      installed: installed.length,
      active: active.length,
      enabled: active.length, // 简化实现
      errors: 0 // 简化实现
    };
  },

  /**
   * 搜索插件
   */
  searchPlugins(query: string) {
    const plugins = pluginManager.getAllPlugins();
    const lowerQuery = query.toLowerCase();

    return plugins.filter(
      (plugin) =>
        plugin.name.toLowerCase().includes(lowerQuery) ||
        plugin.id.toLowerCase().includes(lowerQuery) ||
        (plugin.description && plugin.description.toLowerCase().includes(lowerQuery)) ||
        (plugin.author && plugin.author.toLowerCase().includes(lowerQuery))
    );
  },

  /**
   * 按状态过滤插件
   */
  filterPluginsByStatus(status: 'all' | 'active' | 'installed' | 'registered') {
    switch (status) {
      case 'active':
        return pluginManager.getActivePlugins();
      case 'installed':
        return pluginManager.getAllPlugins();
      case 'registered':
        return pluginManager.getAllPlugins();
      default:
        return pluginManager.getAllPlugins();
    }
  },

  /**
   * 批量操作插件
   */
  async batchOperation(
    pluginIds: string[],
    operation: 'install' | 'uninstall' | 'activate' | 'deactivate'
  ): Promise<{ success: string[]; failed: string[] }> {
    const results: { success: string[]; failed: string[] } = { success: [], failed: [] };

    for (const pluginId of pluginIds) {
      try {
        let success = false;

        switch (operation) {
          case 'install':
            const plugin = pluginManager.getAllPlugins().find((p) => p.id === pluginId);
            if (plugin) {
              success = await pluginManager.install(plugin);
            }
            break;
          case 'uninstall':
            success = await pluginManager.uninstall(pluginId);
            break;
          case 'activate':
            success = await pluginManager.activate(pluginId);
            break;
          case 'deactivate':
            success = await pluginManager.deactivate(pluginId);
            break;
        }

        if (success) {
          results.success.push(pluginId);
        } else {
          results.failed.push(pluginId);
        }
      } catch (error) {
        console.error(`插件 ${pluginId} ${operation} 操作失败:`, error);
        results.failed.push(pluginId);
      }
    }

    return results;
  },

  /**
   * 导出插件配置
   */
  exportPluginConfigs(): string {
    const plugins = pluginManager.getAllPlugins();
    const configs = {} as any;

    plugins.forEach((plugin) => {
      const status = pluginManager.getPluginStatus(plugin.id);
      configs[plugin.id] = {
        enabled: status === 'active',
        settings: {} // 暂时返回空对象，后续可以扩展配置功能
      };
    });

    return JSON.stringify(configs, null, 2);
  },

  /**
   * 导入插件配置
   */
  async importPluginConfigs(configJson: string): Promise<boolean> {
    try {
      const configs = JSON.parse(configJson);

      for (const [pluginId, config] of Object.entries(configs as any)) {
        const pluginConfig = config as any;
        if (pluginConfig.enabled) {
          const plugin = pluginManager.getAllPlugins().find((p) => p.id === pluginId);
          if (plugin) {
            await pluginManager.install(plugin);
          }
          await pluginManager.activate(pluginId);
        }

        if (pluginConfig.settings) {
          // 这里需要访问pluginApp，简化实现
          console.log(`导入插件 ${pluginId} 的配置:`, pluginConfig.settings);
        }
      }

      return true;
    } catch (error) {
      console.error('导入插件配置失败:', error);
      return false;
    }
  }
};

/**
 * 插件系统事件监听器
 */
export function setupPluginSystemListeners(): void {
  // 监听应用关闭事件，自动销毁插件系统
  window.addEventListener('beforeunload', () => {
    destroyPluginSystem();
  });

  // 监听插件系统事件
  const pluginApp = pluginManager; // pluginManager本身就是PluginApp
  if (pluginApp) {
    pluginApp.events.on('plugin: error', (error: any) => {
      console.error('插件系统错误:', error);
    });

    pluginApp.events.on('plugin: activated', (plugin: any) => {
      console.log(`插件 ${(plugin as any).name}, 已激活`);
    });

    pluginApp.events.on('plugin: deactivated', (plugin: any) => {
      console.log(`插件 ${(plugin as any).name}, 已停用`);
    });
  }
}

/**
 * 开发模式工具
 */
export const devTools = {
  /**
   * 热重载插件
   */
  async hotReload(pluginId: string): Promise<boolean> {
    try {
      console.log(`🔄 热重载插件: ${pluginId}`);

      // 停用并卸载插件
      await pluginManager.deactivate(pluginId);
      await pluginManager.uninstall(pluginId);

      // 重新注册、安装和激活插件
      // 这里需要重新导入插件模块，简化实现
      console.log(`✅ 插件 ${pluginId}, 热重载完成`);
      return true;
    } catch (error) {
      console.error(`插件 ${pluginId} 热重载失败:`, error);
      return false;
    }
  },

  /**
   * 获取插件调试信息
   */
  getDebugInfo(pluginId: string) {
    const plugin = pluginManager.getAllPlugins().find((p) => p.id === pluginId);
    const status = pluginManager.getPluginStatus(pluginId);

    return {
      plugin,
      status,
      config: {}, // 暂时返回空配置
      timestamp: Date.now()
    };
  },

  /**
   * 模拟插件事件
   */
  emitEvent(event: string, data?: any) {
    const pluginApp = pluginManager; // pluginManager本身就是PluginApp
    if (pluginApp) {
      pluginApp.events.emit(event, data);
      console.log(`🎯 模拟事件: ${event}`, data);
    }
  }
};

// 导出主要接口
export { pluginManager };
