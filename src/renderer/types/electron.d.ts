/**
 * 音乐解析结果类型定义
 */
export interface UnblockMusicResult {
  data?: {
    data: {
      url: string;
      br: number;
      size: number;
      md5?: string;
      platform?: string;
      gain?: number;
    };
    params: {
      id: number;
      type: 'song';
    };
  };
  error?: string;
}

/**
 * 歌曲数据类型定义
 */
export interface SongData {
  name: string;
  artists: Array<{ name: string }>;
  album?: { name: string };
  ar?: Array<{ name: string }>;
  al?: { name: string };
}

/**
 * 支持的音乐平台类型
 */
export type MusicPlatform = 'qq' | 'migu' | 'kugou' | 'pyncmd' | 'joox' | 'gdmusic' | 'stellar' | 'cloud';

/**
 * Electron API 接口定义
 * 包含所有渲染进程可调用的主进程API
 */
export interface IElectronAPI {
  // 窗口控制相关
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  miniTray: () => void;
  miniWindow: () => void;
  restore: () => void;
  restart: () => void;

  // 窗口大小调整
  resizeWindow: (width: number, height: number) => void;
  resizeMiniWindow: (showPlaylist: boolean) => void;

  // 系统相关
  dragStart: (data: string) => void;

  // 歌词相关
  openLyric: () => void;
  sendLyric: (data: string) => void;
  sendSong: (data: string) => void;
  onLyricWindowClosed: (callback: () => void) => void;

  // 音乐解析
  unblockMusic: (
    id: number,
    songData: SongData,
    enabledSources?: MusicPlatform[]
  ) => Promise<UnblockMusicResult>;

  // 下载相关
  startDownload: (url: string) => void;
  onDownloadProgress: (callback: (progress: number, status: string) => void) => void;
  onDownloadComplete: (callback: (success: boolean, filePath: string) => void) => void;
  removeDownloadListeners: () => void;

  // 语言相关
  onLanguageChanged: (callback: (locale: string) => void) => void;

  // 通用调用接口
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
}

/**
 * 安全IPC渲染进程通信接口
 * 仅允许白名单通道的安全通信
 */
export interface SecureIpcRenderer {
  send: (channel: string, ...args: unknown[]) => void;
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  on: (channel: string, listener: (...args: unknown[]) => void) => () => void;
  cleanup: () => void;
  sendSync: (channel: string, ...args: unknown[]) => unknown;
}

/**
 * Electron主进程API接口
 */
export interface ElectronAPI {
  ipcRenderer: SecureIpcRenderer;
  process: {
    platform: NodeJS.Platform;
    versions: NodeJS.ProcessVersions;
  };
}

/**
 * IPC通道常量类型定义
 */
export interface IPCChannels {
  readonly WINDOW_MINIMIZE: 'minimize-window';
  readonly WINDOW_MAXIMIZE: 'maximize-window';
  readonly WINDOW_CLOSE: 'close-window';
  readonly WINDOW_RESTORE: 'restore-window';
  readonly WINDOW_MINI_TRAY: 'mini-tray';
  readonly WINDOW_MINI_MODE: 'mini-window';
  readonly WINDOW_RESIZE: 'resize-window';
  readonly WINDOW_RESIZE_MINI: 'resize-mini-window';
  readonly MUSIC_UNBLOCK: 'unblock-music';
  readonly MUSIC_UPDATE_SONG: 'update-current-song';
  readonly MUSIC_UPDATE_PLAY_STATE: 'update-play-state';
  readonly LYRIC_OPEN: 'open-lyric';
  readonly LYRIC_SEND: 'send-lyric';
  readonly LYRIC_GET: 'get-lyrics';
  readonly LYRIC_CACHE: 'cache-lyric';
  readonly LYRIC_GET_CACHED: 'get-cached-lyric';
  readonly LYRIC_CLEAR_CACHE: 'clear-lyric-cache';
  readonly SYSTEM_RESTART: 'restart';
  readonly SYSTEM_DRAG_START: 'drag-start';
  readonly SYSTEM_GET_FONTS: 'get-system-fonts';
  readonly SYSTEM_SHORTCUTS_UPDATE: 'update-shortcuts';
  readonly SYSTEM_LANGUAGE_CHANGE: 'change-language';
  readonly DOWNLOAD_START: 'start-download';
}

/**
 * 全局窗口对象类型扩展
 */
declare global {
  interface Window {
    // 主要API接口
    api: IElectronAPI;
    electron: ElectronAPI;

    // 安全IPC和通道常量
    ipcRenderer: SecureIpcRenderer;
    IPC_CHANNELS: IPCChannels;

    // 其他全局对象
    $message: unknown;

    // 播放器相关
    playerRetryTimers?: NodeJS.Timeout[];
  }
}
