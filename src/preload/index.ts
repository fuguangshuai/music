import { electronAPI } from '@electron-toolkit/preload';
import { contextBridge, ipcRenderer } from 'electron';

// Custom APIs for renderer
const api = {
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),
  dragStart: (data: unknown) => ipcRenderer.send('drag-start', data),
  miniTray: () => ipcRenderer.send('mini-tray'),
  miniWindow: () => ipcRenderer.send('mini-window'),
  restore: () => ipcRenderer.send('restore-window'),
  restart: () => ipcRenderer.send('restart'),
  resizeWindow: (width: number, height: number) => ipcRenderer.send('resize-window', width, height),
  resizeMiniWindow: (showPlaylist: boolean) => ipcRenderer.send('resize-mini-window', showPlaylist),
  openLyric: () => ipcRenderer.send('open-lyric'),
  sendLyric: (data: unknown) => ipcRenderer.send('send-lyric', data),
  sendSong: (data: unknown) => ipcRenderer.send('update-current-song', data),
  unblockMusic: (id: unknown, data: unknown, enabledSources: unknown) =>
    ipcRenderer.invoke('unblock-music', id, data, enabledSources),
  // 歌词窗口关闭事件
  onLyricWindowClosed: (callback: () => void) => {
    ipcRenderer.on('lyric-window-closed', () => callback());
  },
  // 更新相关
  startDownload: (url: string) => ipcRenderer.send('start-download', url),
  onDownloadProgress: (callback: (progress: number, status: string) => void) => {
    ipcRenderer.on('download-progress', (_event, progress, status) => callback(progress, status));
  },
  onDownloadComplete: (callback: (success: boolean, filePath: string) => void) => {
    ipcRenderer.on('download-complete', (_event, success, filePath) => callback(success, filePath));
  },
  // 语言相关
  onLanguageChanged: (callback: (locale: string) => void) => {
    ipcRenderer.on('language-changed', (_event, locale) => {
      callback(locale);
    });
  },
  removeDownloadListeners: () => {
    ipcRenderer.removeAllListeners('download-progress');
    ipcRenderer.removeAllListeners('download-complete');
  },
  // 歌词缓存相关
  invoke: (channel: string, ...args: unknown[]) => {
    const validChannels = [
      'get-lyrics',
      'clear-lyrics-cache',
      'get-system-fonts',
      'get-cached-lyric',
      'cache-lyric',
      'clear-lyric-cache'
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    return Promise.reject(new Error(`未授权的 IPC 通道: ${channel}`));
  }
};

// 跟踪活跃的监听器
const activeListeners = new Map<
  string,
  Set<(event: Electron.IpcRendererEvent, ...args: unknown[]) => void>
>();

// 🔒 安全重构: 创建专用的安全API，替代通用IPC暴露
// 定义允许的IPC通道白名单
const ALLOWED_CHANNELS = {
  // 窗口控制相关
  WINDOW_MINIMIZE: 'minimize-window',
  WINDOW_MAXIMIZE: 'maximize-window',
  WINDOW_CLOSE: 'close-window',
  WINDOW_RESTORE: 'restore-window',
  WINDOW_MINI_TRAY: 'mini-tray',
  WINDOW_MINI_MODE: 'mini-window',
  WINDOW_RESIZE: 'resize-window',
  WINDOW_RESIZE_MINI: 'resize-mini-window',

  // 音乐相关
  MUSIC_UNBLOCK: 'unblock-music',
  MUSIC_UPDATE_SONG: 'update-current-song',
  MUSIC_UPDATE_PLAY_STATE: 'update-play-state',

  // 歌词相关
  LYRIC_OPEN: 'open-lyric',
  LYRIC_SEND: 'send-lyric',
  LYRIC_GET: 'get-lyrics',
  LYRIC_CACHE: 'cache-lyric',
  LYRIC_GET_CACHED: 'get-cached-lyric',
  LYRIC_CLEAR_CACHE: 'clear-lyric-cache',

  // 系统相关
  SYSTEM_RESTART: 'restart',
  SYSTEM_DRAG_START: 'drag-start',
  SYSTEM_GET_FONTS: 'get-system-fonts',
  SYSTEM_SHORTCUTS_UPDATE: 'update-shortcuts',
  SYSTEM_LANGUAGE_CHANGE: 'change-language',

  // 下载相关
  DOWNLOAD_START: 'start-download'
} as const;

// 验证通道是否在白名单中
const isChannelAllowed = (channel: string): boolean => {
  return Object.values(ALLOWED_CHANNELS).includes(
    channel as (typeof ALLOWED_CHANNELS)[keyof typeof ALLOWED_CHANNELS]
  );
};

// 创建安全的IPC接口
const secureIPC = {
  // 🔒 安全的发送方法 - 仅允许白名单通道
  send: (channel: string, ...args: unknown[]) => {
    if (!isChannelAllowed(channel)) {
      console.error(`🚫 IPC通道未授权: ${channel}`);
      throw new Error(`未授权的IPC通道: ${channel}`);
    }
    ipcRenderer.send(channel, ...args);
  },

  // 🔒 安全的调用方法 - 仅允许白名单通道
  invoke: (channel: string, ...args: unknown[]) => {
    if (!isChannelAllowed(channel)) {
      console.error(`🚫 IPC通道未授权: ${channel}`);
      return Promise.reject(new Error(`未授权的IPC通道: ${channel}`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },

  // 🔒 安全的监听方法 - 仅允许特定通道
  on: (channel: string, listener: (...args: unknown[]) => void) => {
    // 允许监听的通道（主要是从主进程发送到渲染进程的消息）
    const allowedListenChannels = [
      'language-changed',
      'mini-mode',
      'navigate',
      'download-progress',
      'download-complete',
      'lyric-window-closed'
    ];

    if (!allowedListenChannels.includes(channel)) {
      console.error(`🚫 IPC监听通道未授权: ${channel}`);
      throw new Error(`未授权的IPC监听通道: ${channel}`);
    }

    const wrappedListener = (_: unknown, ...args: unknown[]) => listener(...args);
    ipcRenderer.on(channel, wrappedListener);

    // 跟踪活跃的监听器
    if (!activeListeners.has(channel)) {
      activeListeners.set(channel, new Set());
    }
    activeListeners.get(channel)!.add(wrappedListener);

    return () => {
      ipcRenderer.removeListener(channel, wrappedListener);
      const channelListeners = activeListeners.get(channel);
      if (channelListeners) {
        channelListeners.delete(wrappedListener);
        if (channelListeners.size === 0) {
          activeListeners.delete(channel);
        }
      }
    };
  },

  // 清理方法保持不变
  cleanup: () => {
    for (const [channel, listeners] of activeListeners) {
      for (const listener of listeners) {
        ipcRenderer.removeListener(channel, listener);
      }
    }
    activeListeners.clear();
  }
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
// 🔒 安全暴露: 使用安全的IPC接口替代直接暴露
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
    // 🔒 使用安全的IPC接口
    contextBridge.exposeInMainWorld('ipcRenderer', secureIPC);
    // 🔒 暴露通道常量，便于渲染进程使用
    contextBridge.exposeInMainWorld('IPC_CHANNELS', ALLOWED_CHANNELS);
  } catch (error) {
    console.error('🚫 contextBridge暴露失败:', error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
  // @ts-ignore (define in dts) - 🔒 使用安全的IPC接口
  window.ipcRenderer = secureIPC;
  // @ts-ignore (define in dts)
  window.IPC_CHANNELS = ALLOWED_CHANNELS;
}
