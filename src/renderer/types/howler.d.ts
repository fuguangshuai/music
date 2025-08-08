/**
 * Howler.js 类型扩展
 * 为了避免使用 any 类型，提供更安全的类型定义
 */

declare module 'howler' {
  interface HowlSound {
_node?: HTMLMediaElement;
    _sounds?: Array<{
      _node?: HTMLMediaElement;
      _id?: number;
    
}>;
  }

  interface Howl {
_sounds?: Array<{
      _node?: HTMLMediaElement;
      _id?: number;
    
}>;
  }
}

/**
 * 音频节点相关类型定义
 */
export interface AudioNodeInfo {
node: HTMLMediaElement;
  id?: number;

}

/**
 * EQ 设置相关类型
 */
export interface EQSettings {
[frequency: string]: number;

}

/**
 * 音频上下文状态
 */
export type AudioContextState = 'suspended' | 'running' | 'closed';

/**
 * 操作锁状态
 */
export interface OperationLockState {
isLocked: boolean,
  lockId: string,
  startTime: number,
  timeout: number;

}

/**
 * 音频服务错误类型
 */
export class AudioServiceError extends Error {
  constructor(_message: string, public code: string, public _details?: unknown) {
    super(_message);
    this.name = 'AudioServiceError';
  }
}

/**
 * 错误代码枚举
 */
export const AudioErrorCodes = {
  OPERATION_LOCKED: 'OPERATION_LOCKED',
  AUDIO_LOAD_FAILED: 'AUDIO_LOAD_FAILED',
  AUDIO_PLAY_FAILED: 'AUDIO_PLAY_FAILED',
  EQ_SETUP_FAILED: 'EQ_SETUP_FAILED',
  CONTEXT_UNAVAILABLE: 'CONTEXT_UNAVAILABLE',
} as const;

export type AudioErrorCode = (typeof AudioErrorCodes)[keyof typeof AudioErrorCodes]
