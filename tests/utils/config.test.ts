/**
 * 配置管理单元测试
 * 验证统一配置管理器的正确性
 */

import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigManager, createConfig, validators } from '@/utils/config';

describe('ConfigManager', () => {
  let configManager: ConfigManager<{ theme: string; volume: number; enabled: boolean }>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 模拟 localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    };
    
    configManager = new ConfigManager({
      defaults: {
        theme: 'light',
        volume: 50,
        enabled: true
      },
      storage: 'localStorage',
      key: 'test-config'
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(configManager.get('theme')).toBe('light');
      expect(configManager.get('volume')).toBe(50);
      expect(configManager.get('enabled')).toBe(true);
    });

    it('should load from storage if available', () => {
      const storedConfig = JSON.stringify({ theme: 'dark', volume: 75 });
      vi.mocked(localStorage.getItem).mockReturnValue(storedConfig);
      
      const manager = new ConfigManager({
        defaults: { theme: 'light', volume: 50, enabled: true },
        storage: 'localStorage',
        key: 'test-config'
      });
      
      expect(manager.get('theme')).toBe('dark');
      expect(manager.get('volume')).toBe(75);
      expect(manager.get('enabled')).toBe(true); // default value
    });

    it('should handle invalid stored data', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('invalid-json');
      
      const manager = new ConfigManager({
        defaults: { theme: 'light', volume: 50, enabled: true },
        storage: 'localStorage',
        key: 'test-config'
      });
      
      expect(manager.get('theme')).toBe('light');
    });
  });

  describe('get and set operations', () => {
    it('should get configuration values', () => {
      expect(configManager.get('theme')).toBe('light');
      expect(configManager.get('volume')).toBe(50);
    });

    it('should set configuration values', () => {
      configManager.set('theme', 'dark');
      expect(configManager.get('theme')).toBe('dark');
    });

    it('should get all configuration', () => {
      const allConfig = configManager.getAll();
      expect(allConfig).toEqual({
        theme: 'light',
        volume: 50,
        enabled: true
      });
    });

    it('should update multiple values', () => {
      configManager.update({ theme: 'dark', volume: 75 });
      expect(configManager.get('theme')).toBe('dark');
      expect(configManager.get('volume')).toBe(75);
      expect(configManager.get('enabled')).toBe(true);
    });
  });

  describe('persistence', () => {
    it('should save to localStorage when setting values', () => {
      configManager.set('theme', 'dark');
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test-config',
        JSON.stringify({ theme: 'dark', volume: 50, enabled: true })
      );
    });

    it('should save to localStorage when updating values', () => {
      configManager.update({ theme: 'dark', volume: 75 });
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test-config',
        JSON.stringify({ theme: 'dark', volume: 75, enabled: true })
      );
    });

    it('should not save when autoSave is disabled', () => {
      const manager = new ConfigManager({
        defaults: { theme: 'light' },
        autoSave: false
      });
      
      manager.set('theme', 'dark');
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('reset functionality', () => {
    it('should reset to default values', () => {
      configManager.set('theme', 'dark');
      configManager.set('volume', 75);
      
      configManager.reset();
      
      expect(configManager.get('theme')).toBe('light');
      expect(configManager.get('volume')).toBe(50);
    });
  });

  describe('subscription system', () => {
    it('should notify listeners on changes', () => {
      const listener = vi.fn();
      const unsubscribe = configManager.subscribe(listener);
      
      configManager.set('theme', 'dark');
      
      expect(listener).toHaveBeenCalledWith({
        theme: 'dark',
        volume: 50,
        enabled: true
      });
      
      unsubscribe();
    });

    it('should not notify after unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = configManager.subscribe(listener);
      
      unsubscribe();
      configManager.set('theme', 'dark');
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => { throw new Error('Listener error'); });
      const normalListener = vi.fn();
      
      configManager.subscribe(errorListener);
      configManager.subscribe(normalListener);
      
      expect(() => configManager.set('theme', 'dark')).not.toThrow();
      expect(normalListener).toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('should validate configuration when validator is provided', () => {
      const validator = vi.fn().mockReturnValue(true);
      const manager = new ConfigManager({
        defaults: { theme: 'light' },
        validator
      });
      
      expect(manager.validate()).toBe(true);
      expect(validator).toHaveBeenCalled();
    });

    it('should reject invalid stored data', () => {
      const invalidConfig = JSON.stringify({ theme: 'invalid-theme' });
      vi.mocked(localStorage.getItem).mockReturnValue(invalidConfig);
      
      const validator = vi.fn().mockReturnValue(false);
      const manager = new ConfigManager({
        defaults: { theme: 'light' },
        validator
      });
      
      expect(manager.get('theme')).toBe('light'); // should use default
    });
  });

  describe('import/export', () => {
    it('should export configuration as JSON', () => {
      configManager.set('theme', 'dark');
      const exported = configManager.export();
      
      expect(JSON.parse(exported)).toEqual({
        theme: 'dark',
        volume: 50,
        enabled: true
      });
    });

    it('should import configuration from JSON', () => {
      const importData = JSON.stringify({ theme: 'dark', volume: 75 });
      const success = configManager.import(importData);
      
      expect(success).toBe(true);
      expect(configManager.get('theme')).toBe('dark');
      expect(configManager.get('volume')).toBe(75);
    });

    it('should reject invalid import data', () => {
      const success = configManager.import('invalid-json');
      expect(success).toBe(false);
    });
  });
});

describe('createConfig factory', () => {
  it('should create ConfigManager instance', () => {
    const config = createConfig({
      defaults: { test: 'value' }
    });
    
    expect(config).toBeInstanceOf(ConfigManager);
    expect(config.get('test')).toBe('value');
  });
});

describe('validators', () => {
  it('should provide basic type validators', () => {
    expect(validators.string('test')).toBe(true);
    expect(validators.string(123)).toBe(false);
    
    expect(validators.number(123)).toBe(true);
    expect(validators.number('123')).toBe(false);
    
    expect(validators.boolean(true)).toBe(true);
    expect(validators.boolean('true')).toBe(false);
    
    expect(validators.array([])).toBe(true);
    expect(validators.array({})).toBe(false);
    
    expect(validators.object({})).toBe(true);
    expect(validators.object([])).toBe(false);
  });

  it('should provide optional validator', () => {
    const optionalString = validators.optional(validators.string);
    
    expect(optionalString('test')).toBe(true);
    expect(optionalString(undefined)).toBe(true);
    expect(optionalString(123)).toBe(false);
  });
});
