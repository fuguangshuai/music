/**
 * 🎵 统一音频API类型安全工具
 * 整合项目中重复的音频API调用和类型安全包装
 *
 * 功能特性：
 * - Howler.js的类型安全包装
 * - Web Audio API的类型安全操作
 * - 音频上下文的安全管理
 * - 音频节点的类型安全创建
 * - 音频事件的类型安全处理
 *
 * @author TypeScript重构项目组
 * @since v4.11.0
 */

import { unifiedTypeGuards } from './unified-type-guards';

// ============================================================================
// Howler.js类型安全包装器
// ============================================================================

/**
 * 安全的Howl实例接口
 */
export interface SafeHowlInstance {
  play(): number | undefined;
  pause(): SafeHowlInstance | undefined;
  stop(): SafeHowlInstance | undefined;
  volume(vol?: number): number | SafeHowlInstance | undefined;
  seek(seek?: number): number | SafeHowlInstance | undefined;
  duration(): number;
  state(): string;
  playing(): boolean;
  on(event: string, callback: (...args: any[]) => void): SafeHowlInstance | undefined;
  off(event?: string, callback?: (...args: any[]) => void): SafeHowlInstance | undefined;
  once(event: string, callback: (...args: any[]) => void): SafeHowlInstance | undefined;
}

/**
 * Howler.js类型安全工具
 * 用于替代项目中的 (this as any).howl 模式
 */
export class SafeHowlerAPI {
  /**
   * 安全创建Howl实例
   */
  static createHowl(options: {
    src: string | string[];
    volume?: number;
    loop?: boolean;
    autoplay?: boolean;
    mute?: boolean;
    preload?: boolean | 'metadata';
    rate?: number;
    pool?: number;
    format?: string[];
    onload?: () => void;
    onloaderror?: (id: number, error: any) => void;
    onplay?: () => void;
    onpause?: () => void;
    onstop?: () => void;
    onend?: () => void;
  }): SafeHowlInstance | null {
    if (typeof window === 'undefined' || !(window as any).Howl) {
      console.warn('🎵 Howler.js不可用');
      return null;
    }

    try {
      const HowlClass = (window as any).Howl;
      const howl = new HowlClass(options);
      return this.wrapHowlInstance(howl);
    } catch (error) {
      console.error('🎵 创建Howl实例失败', error);
      return null;
    }
  }

  /**
   * 包装Howl实例为类型安全的接口
   */
  private static wrapHowlInstance(howl: any): SafeHowlInstance | null {
    if (!unifiedTypeGuards.isObject(howl)) {
      return null;
    }

    return {
      play: () => {
        try {
          return unifiedTypeGuards.isFunction(howl.play) ? howl.play() : undefined;
        } catch (error) {
          console.error('🎵 播放失败', error);
          return undefined;
        }
      },

      pause: () => {
        try {
          if (unifiedTypeGuards.isFunction(howl.pause)) {
            const result = this.wrapHowlInstance(howl.pause());
            return result || undefined;
          }
          return undefined;
        } catch (error) {
          console.error('🎵 暂停失败', error);
          return undefined;
        }
      },

      stop: () => {
        try {
          if (unifiedTypeGuards.isFunction(howl.stop)) {
            const result = this.wrapHowlInstance(howl.stop());
            return result ?? undefined;
          }
          return undefined;
        } catch (error) {
          console.error('🎵 停止失败', error);
          return undefined;
        }
      },

      volume: (vol?: number) => {
        try {
          if (!unifiedTypeGuards.isFunction(howl.volume)) return undefined;

          if (vol !== undefined) {
            return this.wrapHowlInstance(howl.volume(vol));
          } else {
            return howl.volume();
          }
        } catch (error) {
          console.error('🎵 音量操作失败', error);
          return undefined;
        }
      },

      seek: (seekTime?: number) => {
        try {
          if (!unifiedTypeGuards.isFunction(howl.seek)) return undefined;

          if (seekTime !== undefined) {
            return this.wrapHowlInstance(howl.seek(seekTime));
          } else {
            return howl.seek();
          }
        } catch (error) {
          console.error('🎵 定位操作失败', error);
          return undefined;
        }
      },

      duration: () => {
        try {
          return unifiedTypeGuards.isFunction(howl.duration) ? howl.duration() : 0;
        } catch (error) {
          console.error('🎵 获取时长失败', error);
          return 0;
        }
      },

      state: () => {
        try {
          return unifiedTypeGuards.isFunction(howl.state) ? howl.state() : 'unloaded';
        } catch (error) {
          console.error('🎵 获取状态失败', error);
          return 'unloaded';
        }
      },

      playing: () => {
        try {
          return unifiedTypeGuards.isFunction(howl.playing) ? howl.playing() : false;
        } catch (error) {
          console.error('🎵 检查播放状态失败', error);
          return false;
        }
      },

      on: (event: string, callback: (...args: any[]) => void) => {
        try {
          if (unifiedTypeGuards.isFunction(howl.on)) {
            const result = this.wrapHowlInstance(howl.on(event, callback));
            return result || undefined;
          }
          return undefined;
        } catch (error) {
          console.error('🎵 添加事件监听失败', error);
          return undefined;
        }
      },

      off: (event?: string, callback?: (...args: any[]) => void) => {
        try {
          if (unifiedTypeGuards.isFunction(howl.off)) {
            const result = this.wrapHowlInstance(howl.off(event, callback));
            return result || undefined;
          }
          return undefined;
        } catch (error) {
          console.error('🎵 移除事件监听失败', error);
          return undefined;
        }
      },

      once: (event: string, callback: (...args: any[]) => void) => {
        try {
          if (unifiedTypeGuards.isFunction(howl.once)) {
            const result = this.wrapHowlInstance(howl.once(event, callback));
            return result || undefined;
          }
          return undefined;
        } catch (error) {
          console.error('🎵 添加一次性事件监听失败', error);
          return undefined;
        }
      }
    };
  }

  /**
   * 安全获取Howler全局状态
   */
  static getGlobalState(): {
    volume: number;
    mute: boolean;
    codecs: Record<string, boolean>;
  } | null {
    if (typeof window === 'undefined' || !(window as any).Howler) {
      return null;
    }

    try {
      const Howler = (window as any).Howler;
      return {
        volume: unifiedTypeGuards.isFunction(Howler.volume) ? Howler.volume() : 1,
        mute: unifiedTypeGuards.isFunction(Howler.mute) ? Howler.mute() : false,
        codecs: unifiedTypeGuards.isObject(Howler._codecs) ? Howler._codecs : {}
      };
    } catch (error) {
      console.error('🎵 获取Howler全局状态失败', error);
      return null;
    }
  }

  /**
   * 安全设置全局音量
   */
  static setGlobalVolume(volume: number): boolean {
    if (typeof window === 'undefined' || !(window as any).Howler) {
      return false;
    }

    try {
      const Howler = (window as any).Howler;
      if (unifiedTypeGuards.isFunction(Howler.volume)) {
        Howler.volume(Math.max(0, Math.min(1, volume)));
        return true;
      }
      return false;
    } catch (error) {
      console.error('🎵 设置全局音量失败', error);
      return false;
    }
  }

  /**
   * 安全设置全局静音
   */
  static setGlobalMute(mute: boolean): boolean {
    if (typeof window === 'undefined' || !(window as any).Howler) {
      return false;
    }

    try {
      const Howler = (window as any).Howler;
      if (unifiedTypeGuards.isFunction(Howler.mute)) {
        Howler.mute(mute);
        return true;
      }
      return false;
    } catch (error) {
      console.error('🎵 设置全局静音失败', error);
      return false;
    }
  }
}

// ============================================================================
// Web Audio API类型安全包装器
// ============================================================================

/**
 * Web Audio API类型安全工具
 * 用于替代项目中不安全的Web Audio API操作
 */
export class SafeWebAudioAPI {
  /**
   * 安全创建音频上下文
   */
  static createAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        return new AudioContextClass();
      }
      return null;
    } catch (error) {
      console.error('🎵 创建音频上下文失败', error);
      return null;
    }
  }

  /**
   * 安全恢复音频上下文
   */
  static async resumeAudioContext(context: AudioContext): Promise<boolean> {
    if (!context || context.state === 'running') {
      return true;
    }

    try {
      await context.resume();
      return true;
    } catch (error) {
      console.error('🎵 恢复音频上下文失败', error);
      return false;
    }
  }

  /**
   * 安全创建增益节点
   */
  static createGainNode(context: AudioContext): GainNode | null {
    if (!context) {
      return null;
    }

    try {
      return context.createGain();
    } catch (error) {
      console.error('🎵 创建增益节点失败', error);
      return null;
    }
  }

  /**
   * 安全创建分析器节点
   */
  static createAnalyserNode(context: AudioContext): AnalyserNode | null {
    if (!context) {
      return null;
    }

    try {
      return context.createAnalyser();
    } catch (error) {
      console.error('🎵 创建分析器节点失败', error);
      return null;
    }
  }

  /**
   * 安全连接音频节点
   */
  static connectNodes(source: AudioNode, destination: AudioNode): boolean {
    if (!source || !destination) {
      return false;
    }

    try {
      source.connect(destination);
      return true;
    } catch (error) {
      console.error('🎵 连接音频节点失败', error);
      return false;
    }
  }

  /**
   * 安全断开音频节点
   */
  static disconnectNode(node: AudioNode): boolean {
    if (!node) {
      return false;
    }

    try {
      node.disconnect();
      return true;
    } catch (error) {
      console.error('🎵 断开音频节点失败', error);
      return false;
    }
  }
}

// ============================================================================
// 便捷的工具函数
// ============================================================================

/**
 * 快速创建Howl实例
 */
export const createSafeHowl = (
  options: Parameters<typeof SafeHowlerAPI.createHowl>[0]
): SafeHowlInstance | null => {
  return SafeHowlerAPI.createHowl(options);
};

/**
 * 快速获取Howler状态
 */
export const getHowlerState = () => {
  return SafeHowlerAPI.getGlobalState();
};

/**
 * 快速创建音频上下文
 */
export const createSafeAudioContext = (): AudioContext | null => {
  return SafeWebAudioAPI.createAudioContext();
};

/**
 * 默认导出
 */
export default {
  SafeHowlerAPI,
  SafeWebAudioAPI,
  createSafeHowl,
  getHowlerState,
  createSafeAudioContext
};
