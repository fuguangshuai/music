/**
 * 统一播放控制服务
 * 使用互斥锁避免重复调用和代码重复
 */

import { usePlayerStore } from '@/store';
import type { SongResult } from '@/types/music';

class PlayControlService {
  private static instance: PlayControlService;
  private mutex = false; // 互斥锁
  private lastClickTime = 0;
  private readonly CLICK_DEBOUNCE_TIME = 100; // 减少到100ms防抖时间，提升响应速度

  private constructor() {}

  /**
   * 条件性日志输出，只在开发环境输出
   */
  private log(level: 'info' | 'warn' | 'error', _message: string, ...args: unknown[]) {
    if ((globalThis as any).process.env.NODE_ENV === 'development') {
      console[level](_message, ...args);
    }
  }

  public static getInstance(): PlayControlService {
    if (!PlayControlService.instance) {
      PlayControlService.instance = new PlayControlService();
    }
    return PlayControlService.instance;
  }

  /**
   * 统一的播放控制方法
   * @param song 要播放的歌曲，如果为空则控制当前歌曲
   * @param source 调用来源，用于日志记录
   * @param skipDebounce 是否跳过防抖检查（用于底部播放器等需要快速响应的场景）
   * @returns Promise<boolean> 操作是否成功
   */
  public async playControl(
    song?: SongResult,
    source = 'unknown',
    skipDebounce = false
  ): Promise<boolean> {
    try {
      const currentTime = Date.now();
      this.log('info', `🎵 播放控制被调用 - 来源: ${source}`);

      // 防抖检查（可选跳过）
      if (!skipDebounce && currentTime - this.lastClickTime < this.CLICK_DEBOUNCE_TIME) {
        this.log('warn', `⚠️ 防抖检测 - 来源: ${source}，忽略此次调用`);
        return false;
      }

      // 互斥锁检查
      if (this.mutex) {
        this.log('warn', `⚠️ 互斥锁检测 - 来源: ${source}，操作正在进行中，忽略此次调用`);
        return false;
      }

      // 更新最后点击时间
      this.lastClickTime = currentTime;

      // 获取互斥锁
      this.mutex = true;
      this.log('info', `🔒 获取互斥锁 - 来源: ${source}`);

      try {
        const playerStore = usePlayerStore();

        // 如果没有传入歌曲，使用当前播放的歌曲
        const targetSong = song || playerStore.playMusic;

        if (!targetSong || !targetSong.id) {
          this.log('warn', `❌ 没有有效的歌曲可以播放 - 来源: ${source}`);
          return false;
        }

        this.log('info', `🎶 开始播放控制逻辑 - 歌曲: ${targetSong.name} - 来源: ${source}`);

        // 调用 playerStore 的 setPlay 方法
        const result = await playerStore.setPlay(targetSong);

        this.log('info', `✅ 播放控制完成 - 结果: ${result} - 来源: ${source}`);
        return result;
      } finally {
        // 立即释放互斥锁，提升响应速度
        this.mutex = false;
        this.log('info', `🔓 释放互斥锁 - 来源: ${source}`);
      }
    } catch (error) {
      this.log('error', `❌ 播放控制出错 - 来源: ${source}:`, error);
      this.mutex = false; // 出错时立即释放锁
      return false;
    }
  }

  /**
   * 检查是否正在操作中
   */
  public isOperating(): boolean {
    return this.mutex;
  }

  /**
   * 重置服务状态（用于调试或特殊情况）
   */
  public reset(): void {
    this.mutex = false;
    this.lastClickTime = 0;
    this.log('info', '🔄 播放控制服务已重置');
  }

  /**
   * 获取服务状态信息
   */
  public getStatus() {
    return {
      mutex: this.mutex,
      lastClickTime: this.lastClickTime,
      timeSinceLastClick: Date.now() - this.lastClickTime
    };
  }
}

// 导出单例实例
export const playControlService = PlayControlService.getInstance();

// 便捷方法
export const playControl = (song?: SongResult, source = 'unknown', skipDebounce = false) =>
  playControlService.playControl(song, source, skipDebounce);

// 快速播放控制方法（用于底部播放器等需要快速响应的场景）
export const fastPlayControl = (song?: SongResult, source = 'unknown') =>
  playControlService.playControl(song, source, true);

export default playControlService;
