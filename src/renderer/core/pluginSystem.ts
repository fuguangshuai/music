// 插件系统基础类型定义

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  install?: (app?: PluginApp) => Promise<void> | void;
  uninstall?: (app?: PluginApp) => Promise<void> | void;
  activate?: (app?: PluginApp) => Promise<void> | void;
  deactivate?: (app?: PluginApp) => Promise<void> | void;
  settings?: Record<string, unknown>;
  defaultSettings?: Record<string, unknown>;
}

export interface PluginApp {
  plugins: Map<string, Plugin>;
  install: (plugin: Plugin) => Promise<boolean>;
  uninstall: (pluginId: string) => Promise<boolean>;
  activate: (pluginId: string) => Promise<boolean>;
  deactivate: (pluginId: string) => Promise<boolean>;
  getPluginStatus: (pluginId: string) => 'installed' | 'active' | 'inactive' | 'not-found';
  register: (plugin: Plugin) => boolean;
  // 添加缺失的方法
  initialize?: () => Promise<void>;
  destroy?: () => Promise<void>;
  getAllPlugins: () => Plugin[];
  getActivePlugins: () => Plugin[];
  // 添加事件系统
  events: {
    on: (event: string, handler: (data?: any) => void) => void;
    emit: (event: string, data?: any) => void;
  };
  // 添加配置系统
  config: {
    getPluginConfig: (pluginId: string) => any;
    setPluginConfig: (pluginId: string, config: any) => void;
  };
  // 添加API系统
  api: {
    player: {
      play: () => void;
      pause: () => void;
      next: () => void;
      previous: () => void;
    };
  };
}

// 插件管理器类
export class PluginManager implements PluginApp {
  plugins = new Map<string, Plugin>();
  private activePlugins = new Set<string>();
  private eventHandlers = new Map<string, Array<(data?: any) => void>>();
  private pluginConfigs = new Map<string, any>();

  // 事件系统
  events = {
    on: (event: string, handler: (data?: any) => void) => {
      if (!this.eventHandlers.has(event)) {
        this.eventHandlers.set(event, []);
      }
      this.eventHandlers.get(event)!.push(handler);
    },
    emit: (event: string, data?: any) => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(data);
          } catch (error) {
            console.error(`事件处理器错误 (${event}):`, error);
          }
        });
      }
    }
  };

  // 配置系统
  config = {
    getPluginConfig: (pluginId: string) => {
      return this.pluginConfigs.get(pluginId) || {};
    },
    setPluginConfig: (pluginId: string, config: any) => {
      this.pluginConfigs.set(pluginId, config);
    }
  };

  // API系统
  api = {
    player: {
      play: () => {
        console.log('播放音乐');
        // 这里应该调用实际的播放器API
      },
      pause: () => {
        console.log('暂停音乐');
        // 这里应该调用实际的播放器API
      },
      next: () => {
        console.log('下一首');
        // 这里应该调用实际的播放器API
      },
      previous: () => {
        console.log('上一首');
        // 这里应该调用实际的播放器API
      }
    }
  };

  register(plugin: Plugin): boolean {
    if (!plugin.id || !plugin.name || !plugin.version) {
      console.error('插件注册失败：缺少必要信息');
      return false;
    }

    this.plugins.set(plugin.id, plugin);
    console.log(`插件 ${plugin.name} 注册成功`);
    return true;
  }

  async install(plugin: Plugin): Promise<boolean> {
    if (!plugin.id) {
      console.error('插件ID不能为空');
      return false;
    }

    // 先注册插件
    this.register(plugin);

    try {
      if (plugin.install) {
        await plugin.install(this);
      }
      console.log(`插件 ${plugin.name} 安装成功`);
      return true;
    } catch (error) {
      console.error(`插件 ${plugin.name} 安装失败:`, error);
      return false;
    }
  }

  async uninstall(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.error(`插件 ${pluginId} 不存在`);
      return false;
    }

    try {
      // 先停用插件
      if (this.activePlugins.has(pluginId)) {
        await this.deactivate(pluginId);
      }

      if (plugin.uninstall) {
        await plugin.uninstall(this);
      }

      this.plugins.delete(pluginId);
      console.log(`插件 ${plugin.name} 卸载成功`);
      return true;
    } catch (error) {
      console.error(`插件 ${plugin.name} 卸载失败:`, error);
      return false;
    }
  }

  async activate(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.error(`插件 ${pluginId} 不存在`);
      return false;
    }

    if (this.activePlugins.has(pluginId)) {
      console.warn(`插件 ${plugin.name} 已经激活`);
      return true;
    }

    try {
      if (plugin.activate) {
        await plugin.activate(this);
      }
      this.activePlugins.add(pluginId);
      console.log(`插件 ${plugin.name} 激活成功`);
      return true;
    } catch (error) {
      console.error(`插件 ${plugin.name} 激活失败:`, error);
      return false;
    }
  }

  async deactivate(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.error(`插件 ${pluginId} 不存在`);
      return false;
    }

    if (!this.activePlugins.has(pluginId)) {
      console.warn(`插件 ${plugin.name} 未激活`);
      return true;
    }

    try {
      if (plugin.deactivate) {
        await plugin.deactivate(this);
      }
      this.activePlugins.delete(pluginId);
      console.log(`插件 ${plugin.name} 停用成功`);
      return true;
    } catch (error) {
      console.error(`插件 ${plugin.name} 停用失败:`, error);
      return false;
    }
  }

  getPluginStatus(pluginId: string): 'installed' | 'active' | 'inactive' | 'not-found' {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return 'not-found';
    }

    if (this.activePlugins.has(pluginId)) {
      return 'active';
    }

    return 'inactive';
  }

  // 获取所有插件列表
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  // 获取激活的插件列表
  getActivePlugins(): Plugin[] {
    return Array.from(this.activePlugins)
      .map((id) => this.plugins.get(id))
      .filter((plugin): plugin is Plugin => plugin !== undefined);
  }

  // 初始化插件系统
  async initialize(): Promise<void> {
    console.log('插件系统初始化完成');
  }

  // 销毁插件系统
  async destroy(): Promise<void> {
    // 停用所有激活的插件
    for (const pluginId of this.activePlugins) {
      await this.deactivate(pluginId);
    }
    console.log('插件系统已销毁');
  }
}

// 创建全局插件管理器实例
export const pluginManager = new PluginManager();

// 默认导出
export default pluginManager;
