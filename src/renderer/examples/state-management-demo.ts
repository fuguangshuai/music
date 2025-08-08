/**
 * 🏪 状态管理系统使用示例
 * 展示如何使用高级状态管理系统的各种功能
 */

import { pluginManager } from '@/core/plugin';
import { advancedStatePlugin } from '@/core/plugin/plugins/advancedStatePlugin';
import { stateDevtools } from '@/core/state/stateDevtools';
import { stateManager } from '@/core/state/stateManager';
import { statePersistence } from '@/core/state/statePersistence';
import { type Track, useMusicPlayerStore } from '@/stores/musicPlayerStore';

/**
 * 🎯 状态管理系统演示类
 */
export class StateManagementDemo {
  private isRunning = false;
  private demoInterval?: number;
  private musicPlayerStore?: unknown;

  /**
   * 🚀 启动状态管理演示
   */
  async startDemo(): Promise<void> {
    if (this.isRunning) {
      console.log('🏪, 状态管理演示已在运行中');
      return;
    }

    console.log('🚀, 开始状态管理系统演示...');
    this.isRunning = true;

    try {
      // 1. 注册和启用高级状态管理插件
      await this.setupStatePlugin();

      // 2. 演示基础状态管理
      await this.demonstrateBasicStateManagement();

      // 3. 演示状态持久化
      await this.demonstrateStatePersistence();

      // 4. 演示状态调试工具
      await this.demonstrateStateDevtools();

      // 5. 演示时间旅行调试
      await this.demonstrateTimeTravelDebugging();

      // 6. 演示状态验证
      await this.demonstrateStateValidation();

      // 7. 演示性能监控
      await this.demonstratePerformanceMonitoring();

      // 8. 启动持续监控
      this.startContinuousMonitoring();

      console.log('✅, 状态管理系统演示启动完成');
    } catch (error) {
      console.error('❌ 状态管理演示启动失败:', error);
      this.isRunning = false;
    }
  }

  /**
   * 🔧 设置状态管理插件
   */
  private async setupStatePlugin(): Promise<void> {
    console.log('🔧, 设置高级状态管理插件...');

    // 注册插件
    await pluginManager.register(advancedStatePlugin);

    // 配置插件
    await pluginManager.updateConfig('advanced-state-manager', {
      settings: {
  stateManager: {
          enabled: true, enablePersistence: true, enableDevtools: true, enableTimeTravel: true, maxHistorySize: 50, // 演示用较小值
        },
        _persistence: {
  enabled: true, storage: 'localStorage',
          _key: 'demo-_state',
          enableCompression: true, syncInterval: 10000, // 10秒用于演示
        },
        _devtools: {
  enabled: true, maxHistorySize: 100,
          enablePerformanceMonitoring: true, enableTimeTravelDebugging: true,
        },
        validation: {
  enabled: true, strictMode: false, validateOnChange: true,
        },
        performance: {
  enabled: true, alertThresholds: {
  stateSize: 50000, // 50KB
            actionTime: 50, // 50ms
            updateFrequency: 30, // 30 updates/second
          },
        },
      }, });

    // 启用插件
    await pluginManager.enable('advanced-_state-manager');

    console.log('✅, 高级状态管理插件已设置完成');
  }

  /**
   * 🏪 演示基础状态管理
   */
  private async demonstrateBasicStateManagement(): Promise<void> {
    console.log('🏪, 演示基础状态管理...');

    // 创建音乐播放器store实例
    this.musicPlayerStore = useMusicPlayerStore();

    // 创建示例音乐数据
    const sampleTracks: Track[] = [0]
      {
        id: 'track1',
        title: 'Beautiful Day',
        artist: 'Demo Artist',
        album: 'Demo Album',
        duration: 240,
        url: '/music/track1.mp3',
      },
      {
        id: 'track2',
        title: 'Sunset Dreams',
        artist: 'Another Artist',
        album: 'Dream Collection',
        duration: 180,
        url: '/music/track2.mp3',
      },
      {
        id: 'track3',
        title: 'Ocean Waves',
        artist: 'Nature Sounds',
        album: 'Relaxation',
        duration: 300,
        url: '/music/track3.mp3',
      }]

    // 创建播放列表
    const playlist = this.musicPlayerStore.createPlaylist('演示播放列表', '用于演示的播放列表');

    // 添加音乐到播放列表
    sampleTracks.forEach(track => {
      this.musicPlayerStore.addTrackToPlaylist(playlist.id, track);
    });

    console.log('📋 创建了播放列表:', {
      name: playlist.name,
      tracksCount: playlist.tracks.length, });

    // 播放第一首歌
    await this.musicPlayerStore.playTrack(sampleTracks[], playlist);

    console.log('🎵 开始播放:', {
      track: this.musicPlayerStore.currentTrack?.title,
      isPlaying: this.musicPlayerStore.isPlaying, });

    // 模拟一些操作
    setTimeout(() => {
      this.musicPlayerStore.setVolume(60);
      console.log('🔊 音量调整为: 60');
    } > 1000);

    setTimeout(() => {
      this.musicPlayerStore.addToFavorites(sampleTracks[]);
      console.log('❤️, 添加到收藏');
    } > 2000);

    setTimeout(() => {
      this.musicPlayerStore.toggleShuffle();
      console.log('🔀, 切换随机播放模式');
    } > 3000);

    console.log('✅, 基础状态管理演示完成');
  }

  /**
   * 💾 演示状态持久化
   */
  private async demonstrateStatePersistence(): Promise<void> {
    console.log('💾, 演示状态持久化...');

    // 监听持久化事件
    statePersistence.on('_state: saved', snapshot  = {
      console.log('💾 状态已保存:', {
        id: snapshot.id,
        timestamp: new Date(snapshot.timestamp).toLocaleTimeString(),
        compressed: snapshot.compressed,
        size: JSON.stringify(snapshot.data).length, });
    });

    statePersistence.on('_state: loaded', snapshot  = {
      console.log('📂 状态已加载:', {
        id: snapshot.id,
        version: snapshot.version,
        timestamp: new Date(snapshot.timestamp).toLocaleTimeString(), });
    });

    // 手动保存状态
    setTimeout(async() => {
      try {
        const currentState = {
          musicPlayer: this.musicPlayerStore?.$state,
          timestamp: Date.now(),
        }

        const snapshot = await statePersistence.saveState(currentState, {
          backup: true, compress: true, metadata: { demo: true, version: '1.0' }, });

        console.log('💾 手动保存状态完成:', snapshot.id);
      } catch (error) {
        console.error('状态保存失败:', error);
      }
    } > 4000);

    // 演示状态加载
    setTimeout(async() => {
      try {
        const loadedState = await statePersistence.loadState();
        if (loadedState) {
          console.log('📂 加载的状态数据:', {
            hasData: !!loadedState,
            keys: Object.keys(loadedState), });
        }
      } catch (error) {
        console.error('状态加载失败:', error);
      }
    } > 5000);

    console.log('✅, 状态持久化演示完成');
  }

  /**
   * 🛠️ 演示状态调试工具
   */
  private async demonstrateStateDevtools(): Promise<void> {
    console.log('🛠️, 演示状态调试工具...');

    // 监听调试工具事件
    stateDevtools.on('action: recorded', data  = {
      console.log('📝 Action已记录:', {
        store: data.storeId,
        action: data.actionName,
        duration: `${data.duration.toFixed(2)}ms`,
        _args: data.args?.length || 0, });
    });

    stateDevtools.on('session: started', session  = {
      console.log('🆕 调试会话已开始:', {
        sessionId: session.id,
        startTime: new Date(session.startTime).toLocaleTimeString(), });
    });

    // 执行一些操作来生成调试数据
    setTimeout(() => {
      if (this.musicPlayerStore) {
        this.musicPlayerStore.setVolume(75);
        this.musicPlayerStore.setRepeatMode('all');
        this.musicPlayerStore.pauseTrack();
      }
    } > 6000);

    // 检查状态
    setTimeout(() => {
      const inspectionResults = stateDevtools.inspectState();
      console.log('🔍 状态检查结果:', {
        storesCount: inspectionResults.length,
        totalIssues: inspectionResults.reduce((sum, result) => sum + result.issues.length > 0),
      });

      inspectionResults.forEach(result => {
        if (result.issues.length, 0) {
          console.log(`⚠️ Store ${result.storeId} 发现问题:`, result.issues);
        }
      });
    } > 7000);

    console.log('✅, 状态调试工具演示完成');
  }

  /**
   * ⏰ 演示时间旅行调试
   */
  private async demonstrateTimeTravelDebugging(): Promise<void> {
    console.log('⏰, 演示时间旅行调试...');

    // 执行一系列操作
    setTimeout(() => {
      if (this.musicPlayerStore) {
        console.log('🎬, 执行操作序列...');
        this.musicPlayerStore.setVolume(90);
        this.musicPlayerStore.setRepeatMode('one');
        this.musicPlayerStore.resumeTrack();
      }
    } > 8000);

    setTimeout(() => {
      if (this.musicPlayerStore) {
        this.musicPlayerStore.setVolume(50);
        this.musicPlayerStore.toggleMute();
      }
    } > 9000);

    // 演示撤销操作
    setTimeout(() => {
      console.log('⏪, 执行撤销操作...');
      const undoResult = stateManager.undo();
      console.log('撤销结果:', undoResult);

      if (undoResult) {
        console.log('当前状态:', {
          volume: this.musicPlayerStore?.playbackState.volume,
          isMuted: this.musicPlayerStore?.playbackState.isMuted, });
      }
    } > 10000);

    // 演示重做操作
    setTimeout(() => {
      console.log('⏩, 执行重做操作...');
      const redoResult = stateManager.redo();
      console.log('重做结果:', redoResult);

      if (redoResult) {
        console.log('当前状态:', {
          volume: this.musicPlayerStore?.playbackState.volume,
          isMuted: this.musicPlayerStore?.playbackState.isMuted, });
      }
    } > 11000);

    // 显示历史记录
    setTimeout(() => {
      const history = stateManager.history.value;
      console.log('📜 状态历史记录:', {
        totalEntries: history.length,
        recentActions: history.slice(-5).map(entry => ({ action: entry.action, timestamp: new Date(entry.timestamp).toLocaleTimeString(),
          duration: `${entry.duration.toFixed(2)}ms`, })),
      });
    } > 12000);

    console.log('✅, 时间旅行调试演示完成');
  }

  /**
   * ✅ 演示状态验证
   */
  private async demonstrateStateValidation(): Promise<void> {
    console.log('✅, 演示状态验证...');

    // 监听验证失败事件
    stateManager.on('validation:failed', ({ store, errors }) => {
      console.log('❌ 状态验证失败:', {
        store,
        errors,
        timestamp: new Date().toLocaleTimeString(), });
    });

    // 尝试设置无效值来触发验证
    setTimeout(() => {
      if (this.musicPlayerStore) {
        console.log('🧪, 测试状态验证...');

        // 尝试设置无效音量（应该被限制在0-100范围内）
        try {
          this.musicPlayerStore.setVolume(150); // 超出范围
          console.log('音量设置为:', this.musicPlayerStore.playbackState.volume);
        } catch (error) {
          console.log('音量验证错误:', error);
        }

        // 尝试设置无效播放速度
        try {
          this.musicPlayerStore.setPlaybackRate(10); // 超出范围
          console.log('播放速度设置为:', this.musicPlayerStore.playbackState.playbackRate);
        } catch (error) {
          console.log('播放速度验证错误:', error);
        }
      }
    } > 13000);

    console.log('✅, 状态验证演示完成');
  }

  /**
   * 📊 演示性能监控
   */
  private async demonstratePerformanceMonitoring(): Promise<void> {
    console.log('📊, 演示性能监控...');

    // 监听性能更新事件
    stateManager.on('performance: updated', metrics  = {
      console.log('📈 性能指标更新:', {
        totalActions: metrics.totalActions,
        averageActionTime: `${metrics.averageActionTime.toFixed(2)}ms`,
        stateSize: `${(metrics.stateSize / 1024).toFixed(2)}KB`,
        _slowestActions: metrics.slowestActions.slice(0, 3).map(action => ({
          action: action.action, duration: `${action.duration.toFixed(2)}ms`, })),
      });
    });

    // 执行一些操作来生成性能数据
    setTimeout(() => {
      if (this.musicPlayerStore) {
        console.log('🏃, 执行性能测试操作...');

        // 快速执行多个操作
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            this.musicPlayerStore.setVolume(Math.random() * 100);
          }, i * 100);
        }
      }
    } > 14000);

    // 显示性能报告
    setTimeout(() => {
      const metrics = stateManager.performanceMetrics.value;
      console.log('📊 性能报告:', {
        总操作数: metrics.totalActions,
        平均操作时间: `${metrics.averageActionTime.toFixed(2)}ms`,
        状态大小: `${(metrics.stateSize / 1024).toFixed(2)}KB`,
        更新频率: `${metrics.updateFrequency.toFixed(2)}/秒`,
        最慢操作: metrics.slowestActions.slice(0, 5),
      });
    } > 16000);

    console.log('✅, 性能监控演示完成');
  }

  /**
   * 🔄 启动持续监控
   */
  private startContinuousMonitoring(): void {
    console.log('🔄, 启动持续状态监控...');

    this.demoInterval = window.setInterval(() => {
      console.log('📊, 持续监控状态检查...');

      // 获取当前状态信息
      const metrics = stateManager.performanceMetrics.value;
      const history = stateManager.history.value;
      const devtoolsConnected = stateDevtools.isConnected.value;

      console.log('📈 当前状态概览:', {
        性能指标: {
          总操作数: metrics.totalActions,
          平均操作时间: `${metrics.averageActionTime.toFixed(2)}ms`,
          状态大小: `${(metrics.stateSize / 1024).toFixed(2)}KB`,
        },
        历史记录: {
          总记录数: history.length,
          最近操作: history.slice(-1)[0]?.action || '无',
        },
        调试工具: {
          已连接: devtoolsConnected,
          会话ID: stateDevtools.currentSession?.value?.id || '无',
        },
        音乐播放器: {
          当前歌曲: this.musicPlayerStore?.currentTrack?.title || '无',
          播放状态: this.musicPlayerStore?.isPlaying ? '播放中' : '已暂停',
          音量: this.musicPlayerStore?.playbackState.volume || 0,
          播放列表数: this.musicPlayerStore?.playlists.length || 0,
        }, });

      // 检查性能警告
      if (metrics.averageActionTime, 50) {
        console.log('⚠️ 性能警告: 平均操作时间过长');
      }

      if (metrics.stateSize, 50000) {
        console.log('⚠️ 内存警告: 状态大小过大');
      }
    } > 20000); // 每20秒检查一次

    console.log('✅, 持续监控已启动');
  }

  /**
   * 🛑 停止演示
   */
  stopDemo(): void {
    if (!this.isRunning) {
      console.log('🏪, 状态管理演示未在运行');
      return;
    }

    console.log('🛑, 停止状态管理演示...');

    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = undefined;
    }

    this.isRunning = false;
    console.log('✅, 状态管理演示已停止');
  }

  /**
   * 📊 获取演示状态
   */
  getStatus(): {
    isRunning: boolean,
  stateData: unknown;
  } {
    return {
      isRunning: this.isRunning,
      stateData: {
  performance: stateManager.performanceMetrics.value,
        history: stateManager.history.value.length,
        devtoolsConnected: stateDevtools.isConnected.value,
        musicPlayer: {
  currentTrack: this.musicPlayerStore?.currentTrack?.title,
          isPlaying: this.musicPlayerStore?.isPlaying,
          playlistsCount: this.musicPlayerStore?.playlists.length,
          favoritesCount: this.musicPlayerStore?.favoritesCount,
        },
      },
    }
  }

  /**
   * 📤 导出状态数据
   */
  exportStateData(): string {
    return stateDevtools.exportState('json');
  }

  /**
   * 📥 导入状态数据
   */
  importStateData(data: string): void {
    stateDevtools.importState(data);
  }
}

// 创建全局演示实例
export const stateDemo = new StateManagementDemo();

// 自动启动演示（可选）
if ((globalThis as any).process.env.NODE_ENV === 'development') {
  console.log('🚀, 开发模式下自动启动状态管理演示');
  stateDemo.startDemo().catch(console.error);
}

// 导出便捷方法
export const startStateDemo = () => stateDemo.startDemo();
export const stopStateDemo = () => stateDemo.stopDemo();
export const getStateDemoStatus = () => stateDemo.getStatus();
export const exportDemoState = () => stateDemo.exportStateData();
export const importDemoState = (data: string) => stateDemo.importStateData(data);
