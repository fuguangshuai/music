/**
 * 插件系统类型定义
 * 简化版本，避免复杂类型定义，专注于实用性
 */

// 重新导出核心类型，避免重复定义
export type { Plugin, PluginApp } from '@/core/pluginSystem';

/**
 * 插件元数据
 */
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

/**
 * 插件状态
 */
export interface PluginStatus {
  registered: boolean;
  installed: boolean;
  active: boolean;
  enabled: boolean;
  error?: string;
}

/**
 * 插件事件类型
 */
export type PluginEventType =
  | 'plugin:registered'
  | 'plugin:installed'
  | 'plugin:uninstalled'
  | 'plugin:activated'
  | 'plugin:deactivated'
  | 'plugin:error'
  | 'player:play'
  | 'player:pause'
  | 'player:next'
  | 'player:previous'
  | 'ui:notification'
  | 'ui:dialog'
  | 'ui:menu-item';

/**
 * 插件事件数据
 */
export interface PluginEventData {
  type: PluginEventType;
  plugin?: Plugin;
  data?: any; // 简化类型
  timestamp: number;
}

/**
 * 插件配置项
 */
export interface PluginConfigItem {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea';
  defaultValue?: any;
  options?: Array<{ label: string; value: any }>;
  description?: string;
  required?: boolean;
  validation?: (value: any) => boolean | string;
}

/**
 * 插件配置模式
 */
export interface PluginConfigSchema {
  title: string;
  description?: string;
  items: PluginConfigItem[];
}

/**
 * 插件API权限
 */
export interface PluginPermissions {
  player?: boolean;
  ui?: boolean;
  storage?: boolean;
  network?: boolean;
  filesystem?: boolean;
  system?: boolean;
}

/**
 * 插件加载选项
 */
export interface PluginLoadOptions {
  autoInstall?: boolean;
  autoActivate?: boolean;
  permissions?: PluginPermissions;
  timeout?: number;
}

/**
 * 插件错误类型
 */
export class PluginError extends Error {
  constructor(
    _message: string,
    public pluginId: string,
    public code?: string
  ) {
    super(_message);
    this.name = 'PluginError';
  }
}

/**
 * 插件工具函数类型
 */
export interface PluginUtils {
  /**
   * 创建插件实例
   */
  createPlugin: (metadata: PluginMetadata) => Plugin;

  /**
   * 验证插件
   */
  validatePlugin: (plugin: Plugin) => boolean;

  /**
   * 格式化插件版本
   */
  formatVersion: (version: string) => string;

  /**
   * 比较插件版本
   */
  compareVersions: (v1: string, v2: string) => number;

  /**
   * 生成插件ID
   */
  generatePluginId: (name: string, author?: string) => string;
}

/**
 * 插件生命周期钩子
 */
export interface PluginLifecycleHooks {
  beforeInstall?: (plugin: Plugin) => void | Promise<void>;
  afterInstall?: (plugin: Plugin) => void | Promise<void>;
  beforeUninstall?: (plugin: Plugin) => void | Promise<void>;
  afterUninstall?: (plugin: Plugin) => void | Promise<void>;
  beforeActivate?: (plugin: Plugin) => void | Promise<void>;
  afterActivate?: (plugin: Plugin) => void | Promise<void>;
  beforeDeactivate?: (plugin: Plugin) => void | Promise<void>;
  afterDeactivate?: (plugin: Plugin) => void | Promise<void>;
}

/**
 * 插件管理器配置
 */
export interface PluginManagerConfig {
  autoLoad?: boolean;
  pluginDir?: string;
  maxPlugins?: number;
  timeout?: number;
  hooks?: PluginLifecycleHooks;
  permissions?: PluginPermissions;
}

/**
 * 插件注册表项
 */
export interface PluginRegistryEntry {
  plugin: Plugin;
  metadata: PluginMetadata;
  status: PluginStatus;
  loadTime?: number;
  activateTime?: number;
  error?: PluginError;
}

/**
 * 插件搜索过滤器
 */
export interface PluginFilter {
  name?: string;
  author?: string;
  version?: string;
  status?: keyof PluginStatus;
  keywords?: string[];
}

/**
 * 插件排序选项
 */
export interface PluginSortOptions {
  field: 'name' | 'version' | 'author' | 'loadTime' | 'activateTime';
  order: 'asc' | 'desc';
}

/**
 * 插件统计信息
 */
export interface PluginStats {
  total: number;
  registered: number;
  installed: number;
  active: number;
  enabled: number;
  errors: number;
}

/**
 * 插件开发工具类型
 */
export interface PluginDevTools {
  /**
   * 热重载插件
   */
  hotReload: (pluginId: string) => Promise<boolean>;

  /**
   * 调试插件
   */
  debug: (pluginId: string, enabled: boolean) => void;

  /**
   * 获取插件日志
   */
  getLogs: (pluginId: string) => string[];

  /**
   * 清理插件日志
   */
  clearLogs: (pluginId: string) => void;

  /**
   * 插件性能分析
   */
  profile: (pluginId: string) => Promise<unknown>;
}

/**
 * 简化的插件构建器
 */
export class PluginBuilder {
  private plugin: any = {};

  id(id: string): this {
    (this.plugin as any).id = id;
    return this;
  }

  name(name: string): this {
    (this.plugin as any).name = name;
    return this;
  }

  version(version: string): this {
    (this.plugin as any).version = version;
    return this;
  }

  description(description: string): this {
    (this.plugin as any).description = description;
    return this;
  }

  author(author: string): this {
    (this.plugin as any).author = author;
    return this;
  }

  onInstall(handler: (app: any) => void | Promise<void>): this {
    (this.plugin as any).install = handler;
    return this;
  }

  onUninstall(handler: () => void | Promise<void>): this {
    (this.plugin as any).uninstall = handler;
    return this;
  }

  onActivate(handler: () => void | Promise<void>): this {
    (this.plugin as any).activate = handler;
    return this;
  }

  onDeactivate(handler: () => void | Promise<void>): this {
    (this.plugin as any).deactivate = handler;
    return this;
  }

  settings(settings: Record<string, unknown>): this {
    (this.plugin as any).settings = settings;
    return this;
  }

  defaultSettings(settings: Record<string, unknown>): this {
    (this.plugin as any).defaultSettings = settings;
    return this;
  }

  build(): Plugin {
    if (!(this.plugin as any).id || !(this.plugin as any).name || !(this.plugin as any).version) {
      throw new PluginError('插件ID、名称和版本是必需的', (this.plugin as any).id || 'unknown');
    }
    return this.plugin as Plugin;
  }
}

/**
 * 创建插件构建器
 */
export const createPlugin = (): PluginBuilder => {
  return new PluginBuilder();
};
