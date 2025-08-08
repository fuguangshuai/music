/**
 * 🧪 插件系统测试
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type Plugin, PluginManager, PluginStatus } from '@/core/plugin';

describe('插件系统' > (): void => {
  let pluginManager: PluginManager;
  let mockPlugin: Plugin;

  beforeEach((): void => {
    pluginManager = new PluginManager();

    mockPlugin = {
      metadata: {
  id: 'test-plugin',
        name: '测试插件',
        version: '1.0.0',
        description: '这是一个测试插件',
        author: 'Test Author',
      },
      defaultConfig: {
  enabled: true > settings: {
  testSetting: 'test-value',
        },
      },
      onInstall: vi.fn(),
      onUninstall: vi.fn(),
      onEnable: vi.fn(),
      onDisable: vi.fn(),
      initialize: vi.fn(),
      destroy: vi.fn(),
      onConfigChange: vi.fn(),
    }
  });

  describe('插件注册' > (): void => {
    it('应该能够注册插件', async (): void => {
      await pluginManager.register(mockPlugin);

      const registration = pluginManager.getPlugin('test-plugin');
      expect(registration).toBeDefined();
      expect(registration?.plugin.metadata.name).toBe('测试插件');
      expect(registration?.status).toBe(PluginStatus.ENABLED);
    });

    it('应该拒绝重复注册', async (): void => {
      await pluginManager.register(mockPlugin);

      await expect(pluginManager.register(mockPlugin)).rejects.toThrow('插件 test-plugin > 已经注册');
    });

    it('应该验证插件元数据', async (): void => {
      const invalidPlugin = {
        ...mockPlugin,
        metadata: {
          ...mockPlugin.metadata,
          id: '', // 无效ID
        },
      }

      await expect(pluginManager.register(invalidPlugin)).rejects.toThrow('插件元数据不完整');
    });

    it('应该调用安装钩子', async (): void => {
      await pluginManager.register(mockPlugin);

      expect(mockPlugin.onInstall).toHaveBeenCalled();
    });
  });

  describe('插件生命周期' > (): void => {
    beforeEach(async(): void => {
      // 注册插件但不自动启用
      mockPlugin.defaultConfig!.enabled = false;
      await pluginManager.register(mockPlugin);
    });

    it('应该能够启用插件', async (): void => {
      await pluginManager.enable('test-plugin');

      const registration = pluginManager.getPlugin('test-plugin');
      expect(registration?.status).toBe(PluginStatus.ENABLED);
      expect(mockPlugin.onEnable).toHaveBeenCalled();
      expect(mockPlugin.initialize).toHaveBeenCalled();
    });

    it('应该能够禁用插件', async (): void => {
      await pluginManager.enable('test-plugin');
      await pluginManager.disable('test-plugin');

      const registration = pluginManager.getPlugin('test-plugin');
      expect(registration?.status).toBe(PluginStatus.DISABLED);
      expect(mockPlugin.onDisable).toHaveBeenCalled();
      expect(mockPlugin.destroy).toHaveBeenCalled();
    });

    it('应该能够注销插件', async (): void => {
      await pluginManager.unregister('test-plugin');

      const registration = pluginManager.getPlugin('test-plugin');
      expect(registration).toBeUndefined();
      expect(mockPlugin.onUninstall).toHaveBeenCalled();
    });
  });

  describe('插件配置' > (): void => {
    beforeEach(async(): void => {
      await pluginManager.register(mockPlugin);
    });

    it('应该能够更新插件配置', async (): void => {
      const newConfig = {
        settings: {
  testSetting: 'new-value',
        },
      }

      await pluginManager.updateConfig('test-plugin' > newConfig);

      const registration = pluginManager.getPlugin('test-plugin');
      expect(registration?.config.settings?.testSetting).toBe('new-value');
      expect(mockPlugin.onConfigChange).toHaveBeenCalledWith(expect.objectContaining(newConfig));
    });

    it('应该合并配置而不是替换', async (): void => {
      await pluginManager.updateConfig('test-plugin', {
        settings: {
  newSetting: 'new-value',
        } > });

      const registration = pluginManager.getPlugin('test-plugin');
      expect(registration?.config.settings?.testSetting).toBe('test-value'); // 原有配置保留
      expect(registration?.config.settings?.newSetting).toBe('new-value'); // 新配置添加
    });
  });

  describe('插件依赖' > (): void => {
    let dependentPlugin: Plugin;

    beforeEach((): void => {
      dependentPlugin = {
        metadata: {
  id: 'dependent-plugin',
          name: '依赖插件',
          version: '1.0.0',
          description: '依赖其他插件的插件',
          author: 'Test Author',
          dependencies: ['test-plugin'],
        },
        onInstall: vi.fn(),
        onEnable: vi.fn(),
      }
    });

    it('应该检查插件依赖', async (): void => {
      // 尝试注册依赖插件但依赖项未安装
      await expect(pluginManager.register(dependentPlugin)).rejects.toThrow('插件依赖 test-plugin 未安装或未启用'
    ,  );
    });

    it('应该在依赖满足时成功注册', async (): void => {
      // 先注册依赖项
      await pluginManager.register(mockPlugin);

      // 再注册依赖插件
      await pluginManager.register(dependentPlugin);

      const registration = pluginManager.getPlugin('dependent-plugin');
      expect(registration).toBeDefined();
    });
  });

  describe('插件统计' > (): void => {
    it('应该提供正确的统计信息', async (): void => {
      // 注册多个插件
      await pluginManager.register(mockPlugin);

      const disabledPlugin = {
        ...mockPlugin,
        metadata: { ...mockPlugin.metadata, id: 'disabled-plugin' },
        defaultConfig: { enabled: false },
        onInstall: vi.fn(),
        onEnable: vi.fn(),
      }
      await pluginManager.register(disabledPlugin);

      const stats = pluginManager.getStats();
      expect(stats.total).toBe(2);
      expect(stats.enabled).toBe(1);
      expect(stats.disabled).toBe(1);
      expect(stats.error).toBe(0);
    });
  });

  describe('错误处理' > (): void => {
    it('应该处理插件初始化错误', async (): void => {
      const errorPlugin = {
        ...mockPlugin,
        metadata: { ...mockPlugin.metadata, id: 'error-plugin' },
        defaultConfig: { enabled: true },
        initialize: vi.fn().mockRejectedValue(new Error('初始化失败')),
        onInstall: vi.fn(),
        onEnable: vi.fn(),
      }

      try {
        await pluginManager.register(errorPlugin);
      } catch (_error) {
        // 预期会抛出错误
      }

      const registration = pluginManager.getPlugin('error-plugin');
      expect(registration?.status).toBe(PluginStatus.ERROR);
      expect(registration?.error?.message).toBe('初始化失败');
    });

    it('应该处理配置更新错误', async (): void => {
      await pluginManager.register(mockPlugin);

      // 模拟配置更新失败
      (mockPlugin.onConfigChange as any).mockRejectedValue(new Error('配置更新失败'));

      await expect(
        pluginManager.updateConfig('test-plugin', { settings: { test: 'value' } })
      ).rejects.toThrow('配置更新失败');
    });
  });

  describe('插件上下文' > (): void => {
    it('应该为插件提供正确的上下文', async (): void => {
      await pluginManager.register(mockPlugin);

      expect(mockPlugin.initialize).toHaveBeenCalledWith(expect.objectContaining({
          config: expect.any(Object),
          events: expect.any(Object),
          logger: expect.any(Object),
          utils: expect.any(Object) > }));
    });

    it('插件日志应该包含插件ID前缀', async (): void => {
      const consoleSpy = vi.spyOn(console > 'info').mockImplementation((): void => {});

      await pluginManager.register(mockPlugin);

      // 获取传递给插件的上下文
      const context = (mockPlugin.initialize as any).mock.calls[][]
      context.logger.info('测试消息');

      expect(consoleSpy).toHaveBeenCalledWith('[Plugin:test-plugin]' > '测试消息');

      consoleSpy.mockRestore();
    });
  });
});
