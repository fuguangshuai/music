/**
 * 示例插件实现
 * 演示插件系统的基本功能和API使用
 */

import type { Plugin, PluginApp } from '@/types/plugin';

/**
 * 示例插件：音乐通知插件
 * 功能：在歌曲切换时显示通知
 */
const musicNotificationPlugin: Plugin = {
  id: 'music-notification',
  name: '音乐通知',
  version: '1.0.0',
  description: '在歌曲切换时显示桌面通知',
  author: '示例作者',

  // 默认设置
  defaultSettings: {
    enabled: true,
    showArtist: true,
    showAlbum: true,
    duration: 3000,
    position: 'top-right'
  },

  // 安装插件
  async install(app: PluginApp) {
    console.log('🔌 安装音乐通知插件...');
    
    // 初始化插件配置
    const config = app.config.getPluginConfig(this.id);
    if (!config.settings || Object.keys(config.settings).length === 0) {
      app.config.setPluginConfig(this.id, {
        enabled: true,
        settings: this.defaultSettings
      });
    }

    console.log('✅ 音乐通知插件安装完成');
  },

  // 卸载插件
  async uninstall() {
    console.log('🗑️ 卸载音乐通知插件...');
    
    // 清理插件数据
    // 这里可以清理插件创建的数据、事件监听器等
    
    console.log('✅ 音乐通知插件卸载完成');
  },

  // 激活插件
  async activate() {
    console.log('🚀 激活音乐通知插件...');
    
    // 这里会在插件激活时执行
    // 可以注册事件监听器、初始化UI等
    
    console.log('✅ 音乐通知插件激活完成');
  },

  // 停用插件
  async deactivate() {
    console.log('⏸️ 停用音乐通知插件...');
    
    // 这里会在插件停用时执行
    // 可以移除事件监听器、清理UI等
    
    console.log('✅ 音乐通知插件停用完成');
  }
};

/**
 * 示例插件：歌词显示插件
 */
const lyricsDisplayPlugin: Plugin = {
  id: 'lyrics-display',
  name: '歌词显示',
  version: '1.0.0',
  description: '在播放界面显示歌词',
  author: '示例作者',

  defaultSettings: {
    enabled: true,
    fontSize: 16,
    color: '#333333',
    alignment: 'center',
    showTranslation: false
  },

  async install(app: PluginApp) {
    console.log('🔌 安装歌词显示插件...');
    
    // 注册播放器事件监听
    app.events.on('player:play', () => {
      console.log('🎵 歌曲开始播放，准备显示歌词');
      // 显示歌词的逻辑
      console.log('显示歌词');
    });

    app.events.on('player:pause', () => {
      console.log('⏸️ 歌曲暂停，隐藏歌词');
      // 隐藏歌词的逻辑
      console.log('隐藏歌词');
    });

    console.log('✅ 歌词显示插件安装完成');
  },

  async uninstall() {
    console.log('🗑️ 卸载歌词显示插件...');
    // 清理事件监听器和UI元素
    console.log('✅ 歌词显示插件卸载完成');
  },

  async activate() {
    console.log('🚀 激活歌词显示插件...');
    // 激活歌词显示功能
    console.log('✅ 歌词显示插件激活完成');
  },

  async deactivate() {
    console.log('⏸️ 停用歌词显示插件...');
    // 停用歌词显示功能
    console.log('✅ 歌词显示插件停用完成');
  }
};

/**
 * 示例插件：快捷键插件
 */
const shortcutPlugin: Plugin = {
  id: 'shortcuts',
  name: '快捷键',
  version: '1.0.0',
  description: '为播放器添加键盘快捷键支持',
  author: '示例作者',

  defaultSettings: {
    enabled: true,
    playPause: 'Space',
    next: 'ArrowRight',
    previous: 'ArrowLeft',
    volumeUp: 'ArrowUp',
    volumeDown: 'ArrowDown'
  },

  async install(app: PluginApp) {
    console.log('🔌 安装快捷键插件...');
    
    // 注册键盘事件监听器
    const handleKeydown = (event: KeyboardEvent) => {
      const settings = app.config.getPluginConfig(this.id).settings;
      
      if (!settings.enabled) return;

      switch (event.code) {
        case settings.playPause:
          event.preventDefault();
          console.log('快捷键: 播放/暂停');
          app.api.player.play(); // 这里应该根据当前状态切换
          break;
        case settings.next:
          event.preventDefault();
          console.log('快捷键: 下一首');
          app.api.player.next();
          break;
        case settings.previous:
          event.preventDefault();
          console.log('快捷键: 上一首');
          app.api.player.previous();
          break;
        case settings.volumeUp:
          event.preventDefault();
          console.log('快捷键: 音量+');
          break;
        case settings.volumeDown:
          event.preventDefault();
          console.log('快捷键: 音量-');
          break;
      }
    };

    // 保存事件处理器引用，以便后续清理
    (this as any).keydownHandler = handleKeydown;
    document.addEventListener('keydown', handleKeydown);

    console.log('✅ 快捷键插件安装完成');
  },

  async uninstall() {
    console.log('🗑️ 卸载快捷键插件...');
    
    // 移除事件监听器
    if ((this as any).keydownHandler) {
      document.removeEventListener('keydown', (this as any).keydownHandler);
      delete (this as any).keydownHandler;
    }

    console.log('✅ 快捷键插件卸载完成');
  },

  async activate() {
    console.log('🚀 激活快捷键插件...');
    console.log('✅ 快捷键插件激活完成');
  },

  async deactivate() {
    console.log('⏸️ 停用快捷键插件...');
    console.log('✅ 快捷键插件停用完成');
  }
};

/**
 * 插件注册函数
 */
export function registerExamplePlugins(pluginManager: any) {
  console.log('📦 注册示例插件...');
  
  // 注册所有示例插件
  const plugins = [
    musicNotificationPlugin,
    lyricsDisplayPlugin,
    shortcutPlugin
  ];

  let successCount = 0;
  
  plugins.forEach(plugin => {
    if (pluginManager.register(plugin)) {
      successCount++;
    }
  });

  console.log(`✅ 成功注册 ${successCount}/${plugins.length} 个示例插件`);
  return successCount === plugins.length;
}

/**
 * 插件测试函数
 */
interface TestResult {
  plugin: string;
  success: boolean;
  message: string;
}

export async function testExamplePlugins(pluginManager: any) {
  console.log('🧪 测试示例插件...');

  const testResults: TestResult[] = [];
  
  // 测试音乐通知插件
  try {
    await pluginManager.install('music-notification');
    await pluginManager.activate('music-notification');
    
    const status = pluginManager.getPluginStatus('music-notification');
    testResults.push({
      plugin: 'music-notification',
      success: status.active,
      message: status.active ? '测试通过' : '激活失败'
    });
  } catch (error) {
    testResults.push({
      plugin: 'music-notification',
      success: false,
      message: `测试失败: ${error}`
    });
  }

  // 测试歌词显示插件
  try {
    await pluginManager.install('lyrics-display');
    await pluginManager.activate('lyrics-display');
    
    const status = pluginManager.getPluginStatus('lyrics-display');
    testResults.push({
      plugin: 'lyrics-display',
      success: status.active,
      message: status.active ? '测试通过' : '激活失败'
    });
  } catch (error) {
    testResults.push({
      plugin: 'lyrics-display',
      success: false,
      message: `测试失败: ${error}`
    });
  }

  // 测试快捷键插件
  try {
    await pluginManager.install('shortcuts');
    await pluginManager.activate('shortcuts');
    
    const status = pluginManager.getPluginStatus('shortcuts');
    testResults.push({
      plugin: 'shortcuts',
      success: status.active,
      message: status.active ? '测试通过' : '激活失败'
    });
  } catch (error) {
    testResults.push({
      plugin: 'shortcuts',
      success: false,
      message: `测试失败: ${error}`
    });
  }

  // 输出测试结果
  console.log('📊 插件测试结果:');
  testResults.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.plugin}: ${result.message}`);
  });

  const successCount = testResults.filter(r => r.success).length;
  console.log(`\n🎯 测试完成: ${successCount}/${testResults.length} 个插件测试通过`);
  
  return testResults;
}

// 导出插件
export {
  musicNotificationPlugin,
  lyricsDisplayPlugin,
  shortcutPlugin
};
