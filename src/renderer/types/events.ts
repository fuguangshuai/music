/**
 * 通用事件类型定义
 * 为项目中常用的DOM事件和自定义事件提供类型安全支持
 *
 * @author PM (项目总控)
 * @date 2025-01-09
 * @version 1.0.0
 */

// DOM 事件相关类型
export interface ScrollEventTarget extends EventTarget {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  scrollLeft?: number;
  scrollWidth?: number;
  clientWidth?: number;
}

export interface ScrollEvent extends Event {
  target: ScrollEventTarget;
  currentTarget: ScrollEventTarget;
}

export interface ResizeEventTarget extends EventTarget {
  clientWidth: number;
  clientHeight: number;
  offsetWidth: number;
  offsetHeight: number;
}

export interface ResizeEvent extends Event {
  target: ResizeEventTarget;
  currentTarget: ResizeEventTarget;
}

// 键盘事件类型
export interface KeyboardEventHandler {
  (event: KeyboardEvent): void;
}

export interface MouseEventHandler {
  (event: MouseEvent): void;
}

// 错误处理相关类型
export interface ErrorInfo {
  message: string;
  stack?: string;
  code?: string | number;
  name?: string;
}

export interface NetworkError extends ErrorInfo {
  status?: number;
  statusText?: string;
  url?: string;
}

export interface ApiError extends ErrorInfo {
  code: number;
  data?: any;
  response?: any;
}

// 自定义事件类型
export interface CustomEventData<T = any> {
  type: string;
  data?: T;
  timestamp?: number;
  source?: string;
}

export interface PluginEvent<T = any> extends CustomEventData<T> {
  pluginId: string;
  version?: string;
}

// 音乐播放相关事件
export interface AudioEvent extends Event {
  target: HTMLAudioElement;
  currentTarget: HTMLAudioElement;
}

export interface AudioLoadEvent extends AudioEvent {
  duration?: number;
  buffered?: TimeRanges;
}

export interface AudioProgressEvent extends AudioEvent {
  currentTime: number;
  duration: number;
  buffered: TimeRanges;
}

export interface AudioErrorEvent extends AudioEvent {
  error: MediaError | null;
  message?: string;
}

// Vue 组件事件类型
export interface VueComponentEvent<T = any> {
  (eventName: string, ...args: T[]): void;
}

export interface VueEmitFunction {
  <T extends any[]>(event: string, ...args: T): void;
}

// 文件上传事件
export interface FileUploadEvent extends Event {
  target: HTMLInputElement & {
    files: FileList | null;
  };
}

export interface DragDropEvent extends DragEvent {
  dataTransfer: DataTransfer;
}

// 表单事件
export interface FormSubmitEvent extends Event {
  target: HTMLFormElement;
  preventDefault(): void;
}

export interface InputChangeEvent extends Event {
  target: HTMLInputElement;
  currentTarget: HTMLInputElement;
}

// 网络状态事件
export interface NetworkStatusEvent extends CustomEventData {
  online: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

// 性能监控事件
export interface PerformanceEvent extends CustomEventData {
  metric: string;
  value: number;
  unit?: string;
  category?: 'memory' | 'timing' | 'navigation' | 'resource';
}

// 缓存事件
export interface CacheEvent extends CustomEventData {
  action: 'hit' | 'miss' | 'set' | 'delete' | 'clear';
  key?: string;
  size?: number;
  ttl?: number;
}

// 下载事件
export interface DownloadEvent extends CustomEventData {
  filename: string;
  progress?: number;
  status: 'started' | 'progress' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  url?: string;
  size?: number;
}

// 播放列表事件
export interface PlaylistEvent extends CustomEventData {
  action: 'add' | 'remove' | 'reorder' | 'clear' | 'shuffle';
  songId?: number;
  playlistId?: number;
  position?: number;
}

// 用户交互事件
export interface UserInteractionEvent extends CustomEventData {
  action: string;
  element?: string;
  value?: any;
  timestamp: number;
}

// 主题变更事件
export interface ThemeChangeEvent extends CustomEventData {
  theme: string;
  colors?: Record<string, string>;
  mode?: 'light' | 'dark' | 'auto';
}

// 语言变更事件
export interface LanguageChangeEvent extends CustomEventData {
  language: string;
  locale: string;
  direction?: 'ltr' | 'rtl';
}

// 设置变更事件
export interface SettingsChangeEvent extends CustomEventData {
  key: string;
  value: any;
  oldValue?: any;
  category?: string;
}

// 类型守卫函数
export const isScrollEvent = (event: Event): event is ScrollEvent => {
  return (
    event.target !== null &&
    'scrollTop' in (event.target as any) &&
    'scrollHeight' in (event.target as any) &&
    'clientHeight' in (event.target as any)
  );
};

export const isResizeEvent = (event: Event): event is ResizeEvent => {
  return (
    event.target !== null &&
    'clientWidth' in (event.target as any) &&
    'clientHeight' in (event.target as any)
  );
};

export const isAudioEvent = (event: Event): event is AudioEvent => {
  return event.target instanceof HTMLAudioElement;
};

export const isFileUploadEvent = (event: Event): event is FileUploadEvent => {
  return event.target instanceof HTMLInputElement && event.target.type === 'file';
};

export const isFormSubmitEvent = (event: Event): event is FormSubmitEvent => {
  return event.target instanceof HTMLFormElement && event.type === 'submit';
};

export const isInputChangeEvent = (event: Event): event is InputChangeEvent => {
  return (
    event.target instanceof HTMLInputElement && (event.type === 'change' || event.type === 'input')
  );
};

// 错误类型守卫
export const isNetworkError = (error: any): error is NetworkError => {
  return (
    error &&
    typeof error === 'object' &&
    ('status' in error || 'statusText' in error || 'url' in error)
  );
};

export const isApiError = (error: any): error is ApiError => {
  return error && typeof error === 'object' && 'code' in error && typeof error.code === 'number';
};

export const isErrorInfo = (error: any): error is ErrorInfo => {
  return (
    error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
  );
};

// 事件处理器工厂函数
export const createScrollHandler = (
  callback: (event: ScrollEvent) => void
): ((event: Event) => void) => {
  return (event: Event) => {
    if (isScrollEvent(event)) {
      callback(event);
    }
  };
};

export const createErrorHandler = (
  callback: (error: ErrorInfo) => void
): ((error: any) => void) => {
  return (error: any) => {
    if (error instanceof Error) {
      callback({
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } else if (isErrorInfo(error)) {
      callback(error);
    } else if (typeof error === 'string') {
      callback({ message: error });
    } else {
      callback({ message: String(error) });
    }
  };
};

export const createAudioHandler = (
  callback: (event: AudioEvent) => void
): ((event: Event) => void) => {
  return (event: Event) => {
    if (isAudioEvent(event)) {
      callback(event);
    }
  };
};

// 事件类型常量
export const EVENT_TYPES = {
  // DOM 事件
  SCROLL: 'scroll',
  RESIZE: 'resize',
  CLICK: 'click',
  KEYDOWN: 'keydown',
  KEYUP: 'keyup',

  // 音频事件
  AUDIO_LOAD: 'loadeddata',
  AUDIO_PLAY: 'play',
  AUDIO_PAUSE: 'pause',
  AUDIO_END: 'ended',
  AUDIO_ERROR: 'error',
  AUDIO_PROGRESS: 'timeupdate',

  // 自定义事件
  THEME_CHANGE: 'theme:change',
  LANGUAGE_CHANGE: 'language:change',
  SETTINGS_CHANGE: 'settings:change',
  NETWORK_STATUS: 'network:status',
  PERFORMANCE_METRIC: 'performance:metric',
  CACHE_EVENT: 'cache:event',
  DOWNLOAD_EVENT: 'download:event',
  PLAYLIST_EVENT: 'playlist:event',
  USER_INTERACTION: 'user:interaction',

  // 插件事件
  PLUGIN_LOADED: 'plugin:loaded',
  PLUGIN_ERROR: 'plugin:error',
  PLUGIN_ACTIVATED: 'plugin:activated',
  PLUGIN_DEACTIVATED: 'plugin:deactivated'
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];
