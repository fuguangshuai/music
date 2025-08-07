import { ElectronAPI } from '@electron-toolkit/preload';

interface API {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  dragStart: (data: any) => void;
  miniTray: () => void;
  miniWindow: () => void;
  restore: () => void;
  restart: () => void;
  resizeWindow: (width: number, height: number) => void;
  resizeMiniWindow: (showPlaylist: boolean) => void;
  openLyric: () => void;
  sendLyric: (data: any) => void;
  sendSong: (data: any) => void;
  unblockMusic: (id: number, data: any, enabledSources?: string[]) => Promise<any>;
  onLyricWindowClosed: (callback: () => void) => void;
  startDownload: (url: string) => void;
  onDownloadProgress: (callback: (progress: number, status: string) => void) => void;
  onDownloadComplete: (callback: (success: boolean, filePath: string) => void) => void;
  onLanguageChanged: (callback: (locale: string) => void) => void;
  removeDownloadListeners: () => void;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}

// 🔒 安全IPC渲染进程通信接口 - 仅允许白名单通道
interface SecureIpcRenderer {
  send: (channel: string, ...args: any[]) => void;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  on: (channel: string, listener: (...args: any[]) => void) => () => void;
  cleanup: () => void;
}

// IPC通道常量类型定义
interface IPCChannels {
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

declare global {
  interface Window {
    electron: ElectronAPI;
    api: API;
    ipcRenderer: SecureIpcRenderer; // 🔒 使用安全的IPC接口
    IPC_CHANNELS: IPCChannels; // 🔒 暴露通道常量
    $message: any;
  }
}
