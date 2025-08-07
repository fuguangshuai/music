/**
 * 统一的配置管理器
 * 提供类型安全的配置访问和更新，消除项目中分散的配置管理逻辑
 */

import type { AppConfig } from '@/types/common';
import { isElectron } from '@/utils';

/**
 * 配置选项接口
 */
export interface ConfigOptions<T> {
  /** 默认配置 */
  defaults: T;
  /** 存储方式 */
  storage?: 'localStorage' | 'sessionStorage' | 'memory' | 'electron';
  /** 存储键名 */
  key?: string;
  /** 配置验证器 */
  validator?: (value: unknown) => value is T;
  /** 是否自动保存 */
  autoSave?: boolean;
}

/**
 * 配置管理器类
 */
export class ConfigManager<T extends Record<string, unknown>> {
  private config: T;
  private options: ConfigOptions<T>;
  private listeners: Set<(config: T) => void> = new Set();

  constructor(options: ConfigOptions<T>) {
    this.options = {
      storage: 'localStorage',
      key: 'app-config',
      autoSave: true,
      ...options
    };
    this.config = this.loadConfig();
  }

  /**
   * 加载配置
   */
  private loadConfig(): T {
    const { defaults, storage = 'localStorage', key = 'app-config' } = this.options;

    try {
      let stored: string | null = null;

      switch (storage) {
        case 'memory':
          return { ...defaults };
        
        case 'electron':
          if (isElectron && window.electron) {
            const electronData = window.electron.ipcRenderer.sendSync('get-store-value', 'set');
            stored = electronData ? JSON.stringify(electronData) : null;
          } else {
            // 降级到localStorage
            stored = localStorage.getItem(key);
          }
          break;
        
        case 'localStorage':
        case 'sessionStorage':
          stored = window[storage].getItem(key);
          break;
      }

      if (stored) {
        const parsed = JSON.parse(stored);
        if (this.options.validator && !this.options.validator(parsed)) {
          console.warn('Invalid config found, using defaults');
          return { ...defaults };
        }
        return { ...defaults, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }

    return { ...defaults };
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    const { storage = 'localStorage', key = 'app-config', autoSave = true } = this.options;

    if (!autoSave || storage === 'memory') return;

    try {
      switch (storage) {
        case 'electron':
          if (isElectron && window.electron) {
            window.electron.ipcRenderer.send('set-store-value', 'set', this.config);
          } else {
            // 降级到localStorage
            localStorage.setItem(key, JSON.stringify(this.config));
          }
          break;
        
        case 'localStorage':
        case 'sessionStorage':
          window[storage].setItem(key, JSON.stringify(this.config));
          break;
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  /**
   * 获取配置值
   */
  get<K extends keyof T>(key: K): T[K] {
    return this.config[key];
  }

  /**
   * 获取所有配置
   */
  getAll(): T {
    return { ...this.config };
  }

  /**
   * 设置配置值
   */
  set<K extends keyof T>(key: K, value: T[K]): void {
    this.config[key] = value;
    this.saveConfig();
    this.notifyListeners();
  }

  /**
   * 批量更新配置
   */
  update(updates: Partial<T>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    this.notifyListeners();
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.config = { ...this.options.defaults };
    this.saveConfig();
    this.notifyListeners();
  }

  /**
   * 添加配置变更监听器
   */
  subscribe(listener: (config: T) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.config);
      } catch (error) {
        console.error('Config listener error:', error);
      }
    });
  }

  /**
   * 验证配置
   */
  validate(): boolean {
    if (!this.options.validator) return true;
    return this.options.validator(this.config);
  }

  /**
   * 导出配置
   */
  export(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * 导入配置
   */
  import(configJson: string): boolean {
    try {
      const parsed = JSON.parse(configJson);
      if (this.options.validator && !this.options.validator(parsed)) {
        console.error('Invalid config format');
        return false;
      }
      this.config = { ...this.options.defaults, ...parsed };
      this.saveConfig();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to import config:', error);
      return false;
    }
  }
}

/**
 * 创建配置管理器实例
 */
export const createConfig = <T extends Record<string, unknown>>(
  options: ConfigOptions<T>
): ConfigManager<T> => {
  return new ConfigManager(options);
};

/**
 * 配置验证器
 */
export const createValidator = <T>(schema: Record<keyof T, (value: unknown) => boolean>) => {
  return (value: unknown): value is T => {
    if (!value || typeof value !== 'object') return false;
    
    const obj = value as Record<string, unknown>;
    return Object.entries(schema).every(([key, validator]) => {
      return (validator as any)(obj[key]);
    });
  };
};

/**
 * 常用验证函数
 */
export const validators = {
  string: (value: unknown): value is string => typeof value === 'string',
  number: (value: unknown): value is number => typeof value === 'number' && !isNaN(value),
  boolean: (value: unknown): value is boolean => typeof value === 'boolean',
  array: (value: unknown): value is unknown[] => Array.isArray(value),
  object: (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value),
  optional: <T>(validator: (value: unknown) => value is T) =>
    (value: unknown): value is T | undefined => value === undefined || validator(value)
};

// 导入默认配置
import setDataDefault from '@/../main/set.json';

/**
 * 应用配置验证器
 */
const appConfigValidator = (value: unknown): value is AppConfig => {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  // 验证可选的数字类型
  if (obj.musicApiPort !== undefined && !validators.number(obj.musicApiPort)) return false;
  if (obj.volume !== undefined && (!validators.number(obj.volume) || obj.volume < 0 || obj.volume > 100)) return false;

  // 验证字符串枚举类型
  if (obj.theme !== undefined && (typeof obj.theme !== 'string' || !['light', 'dark', 'auto'].includes(obj.theme))) return false;
  if (obj.language !== undefined && (typeof obj.language !== 'string' || !['zh-CN', 'en-US', 'ja-JP'].includes(obj.language))) return false;
  if (obj.quality !== undefined && (typeof obj.quality !== 'string' || !['standard', 'higher', 'exhigh', 'lossless'].includes(obj.quality))) return false;
  if (obj.playMode !== undefined && (typeof obj.playMode !== 'string' || !['order', 'random', 'single', 'loop'].includes(obj.playMode))) return false;

  // 验证可选的字符串类型
  if (obj.downloadPath !== undefined && !validators.string(obj.downloadPath)) return false;
  if (obj.realIP !== undefined && !validators.string(obj.realIP)) return false;

  // 验证可选的布尔类型
  if (obj.showLyrics !== undefined && !validators.boolean(obj.showLyrics)) return false;
  if (obj.desktopLyrics !== undefined && !validators.boolean(obj.desktopLyrics)) return false;
  if (obj.enableRealIP !== undefined && !validators.boolean(obj.enableRealIP)) return false;
  if (obj.enableFlac !== undefined && !validators.boolean(obj.enableFlac)) return false;

  return true;
};

/**
 * 全局应用配置管理器
 */
export const appConfig = createConfig<AppConfig>({
  defaults: setDataDefault as AppConfig,
  storage: 'electron',
  key: 'appSettings',
  validator: appConfigValidator,
  autoSave: true
});

/**
 * 用户偏好配置接口
 */
export interface UserPreferences extends Record<string, unknown> {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US' | 'ja-JP';
  volume: number;
  playMode: 'order' | 'random' | 'single' | 'loop';
  showLyrics: boolean;
  desktopLyrics: boolean;
  autoPlay: boolean;
}

/**
 * 用户偏好配置管理器
 */
export const userPreferences = createConfig<UserPreferences>({
  defaults: {
    theme: 'auto',
    language: 'zh-CN',
    volume: 50,
    playMode: 'order',
    showLyrics: true,
    desktopLyrics: false,
    autoPlay: false
  },
  storage: 'localStorage',
  key: 'userPreferences',
  autoSave: true
});

/**
 * 播放器状态配置接口
 */
export interface PlayerState extends Record<string, unknown> {
  currentSong: Record<string, unknown> | null;
  playList: unknown[];
  playListIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
}

/**
 * 播放器状态管理器
 */
export const playerState = createConfig<PlayerState>({
  defaults: {
    currentSong: null,
    playList: [],
    playListIndex: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackRate: 1.0
  },
  storage: 'localStorage',
  key: 'playerState',
  autoSave: true
});

/**
 * 插件配置接口
 */
export interface PluginConfig extends Record<string, unknown> {
  enabled: boolean;
  settings: Record<string, any>; // 简化类型，避免复杂定义
}

/**
 * 插件配置管理器
 */
export const pluginConfig = createConfig<Record<string, PluginConfig>>({
  defaults: {},
  storage: 'localStorage',
  key: 'pluginConfig',
  autoSave: true
});

/**
 * 插件配置管理辅助函数
 */
export const pluginConfigHelpers = {
  /**
   * 获取插件配置
   */
  getPluginConfig: (pluginId: string): PluginConfig => {
    return pluginConfig.get(pluginId) || { enabled: false, settings: {} };
  },

  /**
   * 设置插件配置
   */
  setPluginConfig: (pluginId: string, config: Partial<PluginConfig>): void => {
    const current = pluginConfigHelpers.getPluginConfig(pluginId);
    pluginConfig.set(pluginId, { ...current, ...config });
  },

  /**
   * 启用插件
   */
  enablePlugin: (pluginId: string): void => {
    pluginConfigHelpers.setPluginConfig(pluginId, { enabled: true });
  },

  /**
   * 禁用插件
   */
  disablePlugin: (pluginId: string): void => {
    pluginConfigHelpers.setPluginConfig(pluginId, { enabled: false });
  },

  /**
   * 检查插件是否启用
   */
  isPluginEnabled: (pluginId: string): boolean => {
    return pluginConfigHelpers.getPluginConfig(pluginId).enabled;
  },

  /**
   * 获取插件设置
   */
  getPluginSettings: (pluginId: string): Record<string, any> => {
    return pluginConfigHelpers.getPluginConfig(pluginId).settings;
  },

  /**
   * 更新插件设置
   */
  updatePluginSettings: (pluginId: string, settings: Record<string, any>): void => {
    const current = pluginConfigHelpers.getPluginConfig(pluginId);
    pluginConfigHelpers.setPluginConfig(pluginId, {
      ...current,
      settings: { ...current.settings, ...settings }
    });
  }
};

/**
 * 便捷的配置访问函数
 */
export const getAppConfig = () => appConfig;
export const getUserPreferences = () => userPreferences;
export const getPlayerState = () => playerState;
export const getPluginConfig = () => pluginConfig;
