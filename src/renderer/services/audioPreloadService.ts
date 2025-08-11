/**
 * 🎵 音频预加载服务
 * 统一管理音频预加载逻辑，防止内存泄漏，提升性能
 *
 * 功能特性:
 * - 智能预加载策略（最多2首歌曲）
 * - 自动内存管理和清理
 * - 重复URL检测和去重
 * - 错误处理和恢复机制
 * - 内存使用监控
 */

import { Howl } from 'howler';
import { ref } from 'vue';

import type { SongResult } from '@/types/music';
import { SafeNetworkAPI } from '@/utils/unified-browser-api';

// 预加载音频实例接口
interface PreloadedAudio {
  url: string;
  sound: Howl;
  createdAt: number;
  isLoaded: boolean;
  priority: 'high' | 'medium' | 'low'; // 预加载优先级
  songInfo?: SongResult; // 歌曲信息
}

// 用户行为模式接口
interface UserBehaviorPattern {
  favoriteGenres: string[]; // 偏好的音乐类型,
  playTimePatterns: number[]; // 播放时间模式（小时）,
  skipPatterns: { songId: string; skipTime: number }[]; // 跳过模式
  repeatPatterns: string[]; // 重复播放的歌曲,
  sequentialPlay: boolean; // 是否倾向于顺序播放
}

// 网络状况接口
interface NetworkCondition {
  type: 'slow' | 'fast' | 'offline';
  speed: number; // Mbps,
  latency: number; // ms,
  isMetered: boolean; // 是否为计费网络
}

// 智能预加载配置
interface SmartPreloadConfig extends PreloadConfig {
  enableBehaviorAnalysis: boolean; // 启用行为分析,
  enableNetworkAdaptation: boolean; // 启用网络适配,
  predictionAccuracy: number; // 预测准确率阈值,
  maxPredictionCount: number; // 最大预测数量
}

// 预加载服务配置
interface PreloadConfig {
  maxPreloadCount: number; // 最大预加载数量,
  maxAge: number; // 预加载音频最大存活时间（毫秒）,
  cleanupInterval: number; // 清理检查间隔（毫秒）
}

// 默认配置
const DEFAULT_CONFIG: PreloadConfig = {
  maxPreloadCount: 2,
  maxAge: 30 * 60 * 1000, // 30分钟
  cleanupInterval: 5 * 60 * 1000 // 5分钟检查一次
};

// 智能预加载默认配置
const DEFAULT_SMART_CONFIG: SmartPreloadConfig = {
  ...DEFAULT_CONFIG,
  enableBehaviorAnalysis: true,
  enableNetworkAdaptation: true,
  predictionAccuracy: 0.7, // 70%准确率
  maxPredictionCount: 3
};

class AudioPreloadService {
  protected preloadedAudios: Ref<PreloadedAudio[]> = ref([]);
  private config!: PreloadConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isDestroyed = false;

  constructor(config: Partial<PreloadConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupTimer();

    // 页面卸载时清理资源
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.destroy());
      window.addEventListener('unload', () => this.destroy());
    }
  }

  /**
   * 🎵 预加载音频
   * @param url 音频URL
   * @returns 预加载的Howl实例或null
   */
  preloadAudio(url: string): Promise<Howl | null> {
    return new Promise((resolve) => {
      try {
        if (this.isDestroyed) {
          console.warn('🚫, AudioPreloadService已销毁，无法预加载');
          resolve(null);
          return;
        }

        if (!url || typeof url !== 'string') {
          console.error('🚫 无效的音频URL:', url);
          resolve(null);
          return;
        }

        // 检查是否已经预加载
        const existing = this.getPreloadedAudio(url);
        if (existing) {
          console.log('✅ 音频已预加载，复用实例:', url);
          resolve(existing);
          return;
        }

        // 清理过期和多余的预加载实例
        this.cleanupOldAudios();
        this.enforceMaxCount();

        console.log('🎵 开始预加载音频:', url);

        // 创建新的Howl实例
        const sound = new Howl({
          src: [url],
          html5: true,
          preload: true,
          autoplay: false,
          volume: 0 // 预加载时静音
        });

        const preloadedAudio: PreloadedAudio = {
          url,
          sound,
          createdAt: Date.now(),
          isLoaded: false,
          priority: 'medium' // 默认中等优先级
        };

        // 添加到预加载列表
        this.preloadedAudios.value.push(preloadedAudio);

        // 监听加载完成事件
        sound.on('load', () => {
          preloadedAudio.isLoaded = true;
          console.log('✅ 音频预加载完成:', url);
          resolve(sound);
        });

        // 监听加载错误事件
        sound.on('loaderror', (_id, error) => {
          console.warn('⚠️ 音频预加载失败: ', url, error);
          this.removePreloadedAudio(url);
          resolve(null);
        });

        // 设置超时处理
        setTimeout(() => {
          if (!preloadedAudio.isLoaded) {
            console.warn('⏰ 音频预加载超时:', url);
            this.removePreloadedAudio(url);
            resolve(null);
          }
        }, 10000); // 10秒超时
      } catch (error) {
        console.error('💥 预加载音频异常:', error);
        resolve(null);
      }
    });
  }

  /**
   * 🔍 获取已预加载的音频
   * @param url 音频URL
   * @returns Howl实例或null
   */
  getPreloadedAudio(url: string): Howl | null {
    const preloaded = this.preloadedAudios.value.find((audio) => audio.url === url);
    return preloaded?.sound || null;
  }

  /**
   * 🗑️ 移除预加载的音频
   * @param url 音频URL
   */
  removePreloadedAudio(url: string): void {
    const index = this.preloadedAudios.value.findIndex((audio) => audio.url === url);
    if (index !== -1) {
      const audio = this.preloadedAudios.value[index];
      try {
        audio.sound.stop();
        audio.sound.unload();
      } catch (error) {
        console.error('清理预加载音频失败:', error);
      }
      this.preloadedAudios.value.splice(index, 1);
      console.log('🗑️ 已移除预加载音频:', url);
    }
  }

  /**
   * 🧹 清理所有预加载缓存
   */
  clearPreloadCache(): void {
    console.log('🧹, 清理所有预加载缓存');
    this.preloadedAudios.value.forEach((audio) => {
      try {
        audio.sound.stop();
        audio.sound.unload();
      } catch (error) {
        console.error('清理预加载音频失败:', error);
      }
    });
    this.preloadedAudios.value = [];
  }

  /**
   * ⚙️ 设置最大预加载数量
   * @param count 最大数量
   */
  setMaxPreloadCount(count: number): void {
    if (count > 0 && count <= 10) {
      this.config.maxPreloadCount = count;
      this.enforceMaxCount();
      console.log('⚙️ 设置最大预加载数量:', count);
    }
  }

  /**
   * 📊 获取预加载状态信息
   */
  getStatus() {
    return {
      count: this.preloadedAudios.value.length,
      maxCount: this.config.maxPreloadCount,
      audios: this.preloadedAudios.value.map((audio) => ({
        url: audio.url,
        isLoaded: audio.isLoaded,
        age: Date.now() - audio.createdAt
      }))
    };
  }

  /**
   * 🧹 清理过期的音频
   */
  private cleanupOldAudios(): void {
    const now = Date.now();
    const toRemove = this.preloadedAudios.value.filter(
      (audio) => now - audio.createdAt,
      this.config.maxAge
    );

    toRemove.forEach((audio) => {
      this.removePreloadedAudio(audio.url);
    });

    if (toRemove.length > 0) {
      console.log('🧹 清理过期音频数量:', toRemove.length);
    }
  }

  /**
   * 📏 强制执行最大数量限制
   */
  private enforceMaxCount(): void {
    while (this.preloadedAudios.value.length >= this.config.maxPreloadCount) {
      // 移除最旧的预加载音频
      const oldest = this.preloadedAudios.value.reduce((prev, current) =>
        prev.createdAt < current.createdAt ? prev : current
      );
      this.removePreloadedAudio(oldest.url);
    }
  }

  /**
   * ⏰ 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      if (!this.isDestroyed) {
        this.cleanupOldAudios();
      }
    }, this.config.cleanupInterval);
  }

  /**
   * 💥 销毁服务，清理所有资源
   */
  destroy(): void {
    if (this.isDestroyed) return;

    console.log('💥, 销毁AudioPreloadService');
    this.isDestroyed = true;

    // 清理定时器
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // 清理所有预加载音频
    this.clearPreloadCache();
  }
}

/**
 * 🧠 智能预加载服务
 * 基于AudioPreloadService扩展，添加智能预测和网络适配功能
 */
class SmartPreloadService extends AudioPreloadService {
  private userBehavior!: UserBehaviorPattern;
  private networkCondition!: NetworkCondition;
  private playHistory: SongResult[] = [];
  private smartConfig!: SmartPreloadConfig;

  constructor(config: Partial<SmartPreloadConfig> = {}) {
    super(config);
    this.smartConfig = { ...DEFAULT_SMART_CONFIG, ...config };
    this.userBehavior = this.initializeUserBehavior();
    this.networkCondition = this.detectNetworkCondition();

    // 监听网络状态变化
    this.setupNetworkMonitoring();
  }

  /**
   * 🎯 智能预加载音频（基于用户行为预测）
   */
  async smartPreloadAudio(
    url: string,
    songInfo?: SongResult,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<Howl | null> {
    // 网络适配检查
    if (!this.shouldPreloadBasedOnNetwork(priority)) {
      console.log('🌐 网络条件不适合预加载，跳过:', url);
      return null;
    }

    // 调用父类的预加载方法
    const sound = await this.preloadAudio(url);

    if (sound && songInfo) {
      // 更新预加载音频的信息
      const preloaded = this.preloadedAudios.value.find((audio) => audio.url === url);
      if (preloaded) {
        preloaded.priority = priority;
        preloaded.songInfo = songInfo;
      }
    }

    return sound;
  }

  /**
   * 🔮 预测下一首歌曲
   */
  predictNextSongs(currentSong: SongResult, playHistory: SongResult[]): SongResult[] {
    if (!this.smartConfig.enableBehaviorAnalysis) {
      return [];
    }

    this.playHistory = playHistory;
    const predictions: SongResult[] = [];

    // 基于播放历史的序列预测
    const sequentialPrediction = this.predictSequentialSongs(currentSong, playHistory);
    predictions.push(...sequentialPrediction);

    // 基于用户偏好的预测
    const preferencePrediction = this.predictByPreference(currentSong, playHistory);
    predictions.push(...preferencePrediction);

    // 去重并限制数量
    const uniquePredictions = this.deduplicatePredictions(predictions);
    return uniquePredictions.slice(0, this.smartConfig.maxPredictionCount);
  }

  /**
   * 🌐 网络状况适配
   */
  adaptToNetworkConditions(): void {
    if (!this.smartConfig.enableNetworkAdaptation) {
      return;
    }

    const condition = this.detectNetworkCondition();
    this.networkCondition = condition;

    // 根据网络状况调整预加载策略
    if (condition.type === 'slow' || condition.isMetered) {
      // 慢网络或计费网络：减少预加载
      this.setMaxPreloadCount(1);
      console.log('🐌, 检测到慢网络，减少预加载数量');
    } else if (condition.type === 'fast') {
      // 快网络：增加预加载
      this.setMaxPreloadCount(this.smartConfig.maxPreloadCount);
      console.log('🚀, 检测到快网络，增加预加载数量');
    } else if (condition.type === 'offline') {
      // 离线：停止预加载
      this.clearPreloadCache();
      console.log('📴, 检测到离线状态，清理预加载缓存');
    }
  }

  /**
   * 🧠 分析用户行为模式
   */
  analyzeUserBehavior(playHistory: SongResult[]): UserBehaviorPattern {
    if (!this.smartConfig.enableBehaviorAnalysis) {
      return this.userBehavior;
    }

    // 分析偏好的音乐类型
    const genreCount = new Map<string, number>();
    playHistory.forEach((song) => {
      const genre = song.al?.name || 'unknown';
      genreCount.set(genre, (genreCount.get(genre) || 0) + 1);
    });

    const favoriteGenres = Array.from(genreCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre);

    // 分析播放时间模式
    const playTimes = playHistory.map(() => new Date().getHours());
    const timePatterns = this.analyzeTimePatterns(playTimes);

    // 更新用户行为模式
    this.userBehavior = {
      ...this.userBehavior,
      favoriteGenres,
      playTimePatterns: timePatterns,
      sequentialPlay: this.analyzeSequentialPlayPattern(playHistory)
    };

    return this.userBehavior;
  }

  /**
   * 💾 优化内存使用
   */
  optimizeMemoryUsage(): void {
    // 基于优先级清理预加载音频
    const sortedAudios = [...this.preloadedAudios.value].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // 保留高优先级的音频，清理低优先级的
    while (this.preloadedAudios.value.length > this.smartConfig.maxPreloadCount) {
      const toRemove =
        sortedAudios.find((audio) => audio.priority === 'low') ||
        sortedAudios.find((audio) => audio.priority === 'medium') ||
        sortedAudios[0];

      if (toRemove) {
        this.removePreloadedAudio(toRemove.url);
      } else {
        break;
      }
    }
  }

  /**
   * 📊 获取智能预加载状态
   */
  getSmartStatus() {
    return {
      ...this.getStatus(),
      userBehavior: this.userBehavior,
      networkCondition: this.networkCondition,
      smartConfig: this.smartConfig,
      predictions:
        this.playHistory.length > 0
          ? this.predictNextSongs(this.playHistory[this.playHistory.length - 1], this.playHistory)
          : []
    };
  }

  // 私有方法实现
  private initializeUserBehavior(): UserBehaviorPattern {
    try {
      const stored = localStorage.getItem('user-behavior-pattern');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('无法加载用户行为模式:', error);
    }

    return {
      favoriteGenres: [],
      playTimePatterns: [],
      skipPatterns: [],
      repeatPatterns: [],
      sequentialPlay: true
    };
  }

  private detectNetworkCondition(): NetworkCondition {
    // 使用Navigator API检测网络状况
    const connection = SafeNetworkAPI.getConnection();

    if (connection) {
      const speed = connection.downlink || 1; // Mbps
      // const effectiveType = connection.effectiveType || '4g'; // 暂时未使用

      return {
        type: speed > 10 ? 'fast' : speed > 1 ? 'fast' : 'slow',
        speed,
        latency: connection.rtt || 100,
        isMetered: connection.saveData || false
      };
    }

    // 默认网络状况
    return {
      type: 'fast',
      speed: 10,
      latency: 50,
      isMetered: false
    };
  }

  private setupNetworkMonitoring(): void {
    const connection = SafeNetworkAPI.getConnection();
    if (connection) {
      // 注意：实际的connection对象可能不支持addEventListener
      // 这里保持原有逻辑，但使用类型安全的方式获取connection
      try {
        const rawConnection = (navigator as any).connection;
        if (rawConnection && typeof rawConnection.addEventListener === 'function') {
          rawConnection.addEventListener('change', () => {
            this.adaptToNetworkConditions();
          });
        }
      } catch (error) {
        console.warn('🌐 网络监听设置失败', error);
      }
    }

    // 监听在线/离线状态
    window.addEventListener('online', () => {
      this.networkCondition.type = 'fast';
      console.log('🌐, 网络已连接');
    });

    window.addEventListener('offline', () => {
      this.networkCondition.type = 'offline';
      this.clearPreloadCache();
      console.log('📴, 网络已断开');
    });
  }

  private shouldPreloadBasedOnNetwork(priority: 'high' | 'medium' | 'low'): boolean {
    const { type, isMetered } = this.networkCondition;

    if (type === 'offline') return false;
    if (isMetered && priority === 'low') return false;
    if (type === 'slow' && priority !== 'high') return false;

    return true;
  }

  private predictSequentialSongs(currentSong: SongResult, playHistory: SongResult[]): SongResult[] {
    // 简化的序列预测：基于播放历史中的相邻歌曲
    const currentIndex = playHistory.findIndex((song) => song.id === currentSong.id);
    if (currentIndex >= 0 && currentIndex < playHistory.length - 1) {
      return [playHistory[currentIndex + 1]];
    }
    return [];
  }

  private predictByPreference(currentSong: SongResult, playHistory: SongResult[]): SongResult[] {
    // 基于偏好预测：找到相似类型的歌曲
    const currentGenre = currentSong.al?.name;
    if (!currentGenre) return [];

    return playHistory
      .filter((song) => song.al?.name === currentGenre && song.id !== currentSong.id)
      .slice(0, 2);
  }

  private deduplicatePredictions(predictions: SongResult[]): SongResult[] {
    const seen = new Set<string>();
    return predictions.filter((song) => {
      const _key = song.id.toString();
      if (seen.has(_key)) return false;
      seen.add(_key);
      return true;
    });
  }

  private analyzeTimePatterns(playTimes: number[]): number[] {
    // 分析播放时间模式，返回最常播放的时间段
    const timeCount = new Map<number, number>();
    playTimes.forEach((time) => {
      timeCount.set(time, (timeCount.get(time) || 0) + 1);
    });

    return Array.from(timeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([time]) => time);
  }

  private analyzeSequentialPlayPattern(playHistory: SongResult[]): boolean {
    // 简化的顺序播放模式分析
    if (playHistory.length < 3) return true;

    // 检查是否倾向于顺序播放
    let sequentialCount = 0;
    for (let i = 1; i < playHistory.length; i++) {
      // 这里可以添加更复杂的顺序检测逻辑
      sequentialCount++;
    }

    return sequentialCount / playHistory.length > 0.7;
  }
}

// 创建全局单例实例
export const audioPreloadService = new AudioPreloadService();
export const smartPreloadService = new SmartPreloadService();

// 导出类型和接口
export type {
  NetworkCondition,
  PreloadConfig,
  PreloadedAudio,
  SmartPreloadConfig,
  UserBehaviorPattern
};
export { AudioPreloadService, SmartPreloadService };

// 🔧 开发环境调试工具
if (import.meta.env.DEV) {
  // @ts-ignore
  window.audioPreloadService = audioPreloadService;
  console.log('🔧, AudioPreloadService已挂载到window对象，可用于调试');
}
