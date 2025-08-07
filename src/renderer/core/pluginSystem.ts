/**
 * 插件系统核心架构
 * 简化版本，专注于实用功能，避免复杂类型定义
 */

import { pluginConfigHelpers } from '@/utils/config';

/**
 * 插件接口（简化版）
 */
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  
  // 生命周期方法
  install?: (app: PluginApp) => void | Promise<void>;
  uninstall?: () => void | Promise<void>;
  activate?: () => void | Promise<void>;
  deactivate?: () => void | Promise<void>;
  
  // 插件设置
  settings?: Record<string, any>; // 简化类型
  defaultSettings?: Record<string, any>;
}

/**
 * 插件应用接口（简化版）
 */
export interface PluginApp {
  // 配置管理
  config: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    getPluginConfig: (pluginId: string) => any;
    setPluginConfig: (pluginId: string, config: any) => void;
  };
  
  // 事件系统
  events: {
    on: (event: string, handler: Function) => void;
    off: (event: string, handler: Function) => void;
    emit: (event: string, ...args: any[]) => void;
  };
  
  // 应用API
  api: {
    player: any; // 播放器API
    ui: any; // UI API
    storage: any; // 存储API
    network: any; // 网络API
  };
}

/**
 * 简单的事件发射器
 */
class SimpleEventEmitter {
  private events = new Map<string, Set<Function>>();

  on(event: string, handler: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(event: string, ...args: any[]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`插件事件处理错误 [${event}]:`, error);
        }
      });
    }
  }

  clear(): void {
    this.events.clear();
  }
}

/**
 * 插件管理器
 */
export class PluginManager {
  private plugins = new Map<string, Plugin>();
  private installedPlugins = new Set<string>();
  private activePlugins = new Set<string>();
  private eventEmitter = new SimpleEventEmitter();
  private pluginApp: PluginApp;

  constructor() {
    this.pluginApp = this.createPluginApp();
  }

  /**
   * 创建插件应用接口
   */
  private createPluginApp(): PluginApp {
    return {
      config: {
        get: (key: string) => {
          // 简化实现，直接从localStorage获取
          try {
            const value = localStorage.getItem(`app-config-${key}`);
            return value ? JSON.parse(value) : null;
          } catch {
            return null;
          }
        },
        set: (key: string, value: any) => {
          try {
            localStorage.setItem(`app-config-${key}`, JSON.stringify(value));
          } catch (error) {
            console.error('配置保存失败:', error);
          }
        },
        getPluginConfig: (pluginId: string) => {
          return pluginConfigHelpers.getPluginConfig(pluginId);
        },
        setPluginConfig: (pluginId: string, config: any) => {
          pluginConfigHelpers.setPluginConfig(pluginId, config);
        }
      },
      events: {
        on: (event: string, handler: Function) => {
          this.eventEmitter.on(event, handler);
        },
        off: (event: string, handler: Function) => {
          this.eventEmitter.off(event, handler);
        },
        emit: (event: string, ...args: any[]) => {
          this.eventEmitter.emit(event, ...args);
        }
      },
      api: {
        player: this.createPlayerAPI(),
        ui: this.createUIAPI(),
        storage: this.createStorageAPI(),
        network: this.createNetworkAPI()
      }
    };
  }

  /**
   * 创建播放器API
   */
  private createPlayerAPI() {
    return {
      getCurrentSong: () => {
        // 简化实现，从localStorage获取当前歌曲
        try {
          const state = localStorage.getItem('playerState');
          return state ? JSON.parse(state).currentSong : null;
        } catch {
          return null;
        }
      },
      play: () => {
        this.eventEmitter.emit('player:play');
      },
      pause: () => {
        this.eventEmitter.emit('player:pause');
      },
      next: () => {
        this.eventEmitter.emit('player:next');
      },
      previous: () => {
        this.eventEmitter.emit('player:previous');
      }
    };
  }

  /**
   * 创建UI API
   */
  private createUIAPI() {
    return {
      showNotification: (message: string, type = 'info') => {
        this.eventEmitter.emit('ui:notification', { message, type });
      },
      showDialog: (options: any) => {
        this.eventEmitter.emit('ui:dialog', options);
      },
      addMenuItem: (menu: string, item: any) => {
        this.eventEmitter.emit('ui:menu-item', { menu, item });
      }
    };
  }

  /**
   * 创建存储API
   */
  private createStorageAPI() {
    return {
      get: (key: string) => {
        try {
          const value = localStorage.getItem(`plugin-storage-${key}`);
          return value ? JSON.parse(value) : null;
        } catch {
          return null;
        }
      },
      set: (key: string, value: any) => {
        try {
          localStorage.setItem(`plugin-storage-${key}`, JSON.stringify(value));
        } catch (error) {
          console.error('插件存储失败:', error);
        }
      },
      remove: (key: string) => {
        localStorage.removeItem(`plugin-storage-${key}`);
      }
    };
  }

  /**
   * 创建网络API
   */
  private createNetworkAPI() {
    return {
      request: async (url: string, options: any = {}) => {
        try {
          const response = await fetch(url, options);
          return await response.json();
        } catch (error) {
          console.error('网络请求失败:', error);
          throw error;
        }
      }
    };
  }

  /**
   * 注册插件
   */
  register(plugin: Plugin): boolean {
    try {
      if (this.plugins.has(plugin.id)) {
        console.warn(`插件 ${plugin.id} 已存在`);
        return false;
      }

      // 验证插件基本信息
      if (!plugin.id || !plugin.name || !plugin.version) {
        console.error('插件信息不完整');
        return false;
      }

      this.plugins.set(plugin.id, plugin);
      console.log(`插件 ${plugin.name} (${plugin.id}) 注册成功`);
      
      this.eventEmitter.emit('plugin:registered', plugin);
      return true;
    } catch (error) {
      console.error(`插件注册失败:`, error);
      return false;
    }
  }

  /**
   * 安装插件
   */
  async install(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        console.error(`插件 ${pluginId} 不存在`);
        return false;
      }

      if (this.installedPlugins.has(pluginId)) {
        console.warn(`插件 ${pluginId} 已安装`);
        return true;
      }

      // 执行安装
      if (plugin.install) {
        await plugin.install(this.pluginApp);
      }

      // 设置默认配置
      if (plugin.defaultSettings) {
        const currentConfig = pluginConfigHelpers.getPluginConfig(pluginId);
        if (!currentConfig.settings || Object.keys(currentConfig.settings).length === 0) {
          pluginConfigHelpers.updatePluginSettings(pluginId, plugin.defaultSettings);
        }
      }

      this.installedPlugins.add(pluginId);
      console.log(`插件 ${plugin.name} 安装成功`);
      
      this.eventEmitter.emit('plugin:installed', plugin);
      return true;
    } catch (error) {
      console.error(`插件安装失败:`, error);
      return false;
    }
  }

  /**
   * 卸载插件
   */
  async uninstall(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        console.error(`插件 ${pluginId} 不存在`);
        return false;
      }

      // 先停用插件
      if (this.activePlugins.has(pluginId)) {
        await this.deactivate(pluginId);
      }

      // 执行卸载
      if (plugin.uninstall) {
        await plugin.uninstall();
      }

      this.installedPlugins.delete(pluginId);
      console.log(`插件 ${plugin.name} 卸载成功`);
      
      this.eventEmitter.emit('plugin:uninstalled', plugin);
      return true;
    } catch (error) {
      console.error(`插件卸载失败:`, error);
      return false;
    }
  }

  /**
   * 激活插件
   */
  async activate(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        console.error(`插件 ${pluginId} 不存在`);
        return false;
      }

      if (!this.installedPlugins.has(pluginId)) {
        console.error(`插件 ${pluginId} 未安装`);
        return false;
      }

      if (this.activePlugins.has(pluginId)) {
        console.warn(`插件 ${pluginId} 已激活`);
        return true;
      }

      // 执行激活
      if (plugin.activate) {
        await plugin.activate();
      }

      this.activePlugins.add(pluginId);
      pluginConfigHelpers.enablePlugin(pluginId);
      
      console.log(`插件 ${plugin.name} 激活成功`);
      this.eventEmitter.emit('plugin:activated', plugin);
      return true;
    } catch (error) {
      console.error(`插件激活失败:`, error);
      return false;
    }
  }

  /**
   * 停用插件
   */
  async deactivate(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        console.error(`插件 ${pluginId} 不存在`);
        return false;
      }

      if (!this.activePlugins.has(pluginId)) {
        console.warn(`插件 ${pluginId} 未激活`);
        return true;
      }

      // 执行停用
      if (plugin.deactivate) {
        await plugin.deactivate();
      }

      this.activePlugins.delete(pluginId);
      pluginConfigHelpers.disablePlugin(pluginId);
      
      console.log(`插件 ${plugin.name} 停用成功`);
      this.eventEmitter.emit('plugin:deactivated', plugin);
      return true;
    } catch (error) {
      console.error(`插件停用失败:`, error);
      return false;
    }
  }

  /**
   * 获取插件列表
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取已安装插件列表
   */
  getInstalledPlugins(): Plugin[] {
    return Array.from(this.installedPlugins)
      .map(id => this.plugins.get(id))
      .filter(Boolean) as Plugin[];
  }

  /**
   * 获取已激活插件列表
   */
  getActivePlugins(): Plugin[] {
    return Array.from(this.activePlugins)
      .map(id => this.plugins.get(id))
      .filter(Boolean) as Plugin[];
  }

  /**
   * 检查插件状态
   */
  getPluginStatus(pluginId: string) {
    return {
      registered: this.plugins.has(pluginId),
      installed: this.installedPlugins.has(pluginId),
      active: this.activePlugins.has(pluginId),
      enabled: pluginConfigHelpers.isPluginEnabled(pluginId)
    };
  }

  /**
   * 获取插件配置
   */
  getPluginConfig(pluginId: string): any {
    return this.pluginApp.config.getPluginConfig(pluginId);
  }

  /**
   * 获取插件应用接口
   */
  getPluginApp(): PluginApp {
    return this.pluginApp;
  }

  /**
   * 初始化插件系统
   */
  async initialize(): Promise<void> {
    console.log('🔌 初始化插件系统...');
    
    // 自动激活已启用的插件
    for (const plugin of this.plugins.values()) {
      if (pluginConfigHelpers.isPluginEnabled(plugin.id)) {
        if (!this.installedPlugins.has(plugin.id)) {
          await this.install(plugin.id);
        }
        if (!this.activePlugins.has(plugin.id)) {
          await this.activate(plugin.id);
        }
      }
    }
    
    console.log('✅ 插件系统初始化完成');
  }

  /**
   * 销毁插件系统
   */
  async destroy(): Promise<void> {
    console.log('🔌 销毁插件系统...');
    
    // 停用所有插件
    for (const pluginId of this.activePlugins) {
      await this.deactivate(pluginId);
    }
    
    // 清理事件监听器
    this.eventEmitter.clear();
    
    console.log('✅ 插件系统销毁完成');
  }
}

/**
 * 全局插件管理器实例
 */
export const pluginManager = new PluginManager();
