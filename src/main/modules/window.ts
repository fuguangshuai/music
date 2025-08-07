import { is } from '@electron-toolkit/utils';
import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  nativeImage,
  screen,
  session,
  shell
} from 'electron';
import Store from 'electron-store';
import { join } from 'path';

import {
  applyContentZoom,
  applyInitialState,
  DEFAULT_MAIN_HEIGHT,
  DEFAULT_MAIN_WIDTH,
  DEFAULT_MINI_HEIGHT,
  DEFAULT_MINI_WIDTH,
  getWindowOptions,
  getWindowState,
  initWindowSizeHandlers,
  saveWindowState,
  WindowState
} from './window-size';

const store = new Store();

// 保存主窗口引用，以便在 activate 事件中使用
let mainWindowInstance: BrowserWindow | null = null;
let isPlaying = false;
let isAppQuitting = false;
// 保存迷你模式前的窗口状态
let preMiniModeState: WindowState = {
  width: DEFAULT_MAIN_WIDTH,
  height: DEFAULT_MAIN_HEIGHT,
  x: undefined,
  y: undefined,
  isMaximized: false
};

/**
 * 设置应用退出状态
 */
export function setAppQuitting(quitting: boolean) {
  isAppQuitting = quitting;
}

/**
 * 初始化代理设置
 */
function initializeProxy() {
  const defaultConfig = {
    enable: false,
    protocol: 'http',
    host: '127.0.0.1',
    port: 7890
  };

  const proxyConfig = store.get('set.proxyConfig', defaultConfig) as {
    enable: boolean;
    protocol: string;
    host: string;
    port: number;
  };

  if (proxyConfig?.enable) {
    const proxyRules = `${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`;
    session.defaultSession.setProxy({ proxyRules });
  } else {
    session.defaultSession.setProxy({ proxyRules: '' });
  }
}

function setThumbarButtons(window: BrowserWindow) {
  window.setThumbarButtons([
    {
      tooltip: 'prev',
      icon: nativeImage.createFromPath(join(app.getAppPath(), 'resources/icons', 'prev.png')),
      click() {
        window.webContents.send('global-shortcut', 'prevPlay');
      }
    },

    {
      tooltip: isPlaying ? 'pause' : 'play',
      icon: nativeImage.createFromPath(
        join(app.getAppPath(), 'resources/icons', isPlaying ? 'pause.png' : 'play.png')
      ),
      click() {
        window.webContents.send('global-shortcut', 'togglePlay');
      }
    },

    {
      tooltip: 'next',
      icon: nativeImage.createFromPath(join(app.getAppPath(), 'resources/icons', 'next.png')),
      click() {
        window.webContents.send('global-shortcut', 'nextPlay');
      }
    }
  ]);
}

/**
 * 初始化窗口管理相关的IPC监听
 */
export function initializeWindowManager() {
  // 初始化代理设置
  initializeProxy();

  ipcMain.on('minimize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.minimize();
    }
  });

  ipcMain.on('maximize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
      // 状态保存在事件监听器中处理
    }
  });

  ipcMain.on('close-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      // 在 macOS 上，关闭窗口不应该退出应用，而是隐藏窗口
      if (process.platform === 'darwin') {
        win.hide();
      } else {
        win.destroy();
        app.quit();
      }
    }
  });

  ipcMain.on('mini-tray', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.hide();
    }
  });

  ipcMain.on('mini-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      // 保存当前窗口状态，以便之后恢复
      preMiniModeState = saveWindowState(win);
      console.log('保存正常模式状态用于恢复:', JSON.stringify(preMiniModeState));

      // 获取屏幕工作区尺寸
      const display = screen.getDisplayMatching(win.getBounds());
      const { width: screenWidth, x: screenX } = display.workArea;

      // 设置迷你窗口的大小和位置
      win.unmaximize();
      win.setMinimumSize(DEFAULT_MINI_WIDTH, DEFAULT_MINI_HEIGHT);
      win.setMaximumSize(DEFAULT_MINI_WIDTH, DEFAULT_MINI_HEIGHT);
      win.setSize(DEFAULT_MINI_WIDTH, DEFAULT_MINI_HEIGHT, false); // 禁用动画
      // 将迷你窗口放在工作区的右上角，留出一些边距
      win.setPosition(
        screenX + screenWidth - DEFAULT_MINI_WIDTH - 20,
        display.workArea.y + 20,
        false
      );
      win.setAlwaysOnTop(true);
      win.setSkipTaskbar(false);
      win.setResizable(false);

      // 导航到迷你模式路由
      win.webContents.send('navigate', '/mini');

      // 发送事件到渲染进程，通知切换到迷你模式
      win.webContents.send('mini-mode', true);

      // 迷你窗口使用默认的缩放比
      win.webContents.setZoomFactor(1);
    }
  });

  // 恢复窗口
  ipcMain.on('restore-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      // 恢复窗口的大小调整功能
      win.setResizable(true);
      win.setMaximumSize(0, 0); // 取消最大尺寸限制

      console.log('从迷你模式恢复，使用保存的状态:', JSON.stringify(preMiniModeState));

      // 设置适当的最小尺寸
      win.setMinimumSize(
        Math.max(DEFAULT_MAIN_WIDTH * 0.5, 600),
        Math.max(DEFAULT_MAIN_HEIGHT * 0.5, 400)
      );

      // 恢复窗口状态
      win.setAlwaysOnTop(false);
      win.setSkipTaskbar(false);

      // 导航回主页面
      win.webContents.send('navigate', '/');

      // 发送事件到渲染进程，通知退出迷你模式
      win.webContents.send('mini-mode', false);

      // 应用保存的状态
      setTimeout(() => {
        // 如果有保存的位置，则应用
        if (preMiniModeState.x !== undefined && preMiniModeState.y !== undefined) {
          win.setPosition(preMiniModeState.x, preMiniModeState.y, false);
        } else {
          win.center();
        }

        // 使用存储的迷你模式前的状态
        if (preMiniModeState.isMaximized) {
          win.maximize();
        } else {
          // 设置正确的窗口大小
          win.setSize(preMiniModeState.width, preMiniModeState.height, false);
        }

        // 应用页面缩放
        applyContentZoom(win);

        // 确保窗口大小被正确应用
        setTimeout(() => {
          if (!win.isDestroyed() && !win.isMaximized() && !win.isMinimized()) {
            // 再次验证窗口大小
            const [width, height] = win.getSize();
            if (
              Math.abs(width - preMiniModeState.width) > 2 ||
              Math.abs(height - preMiniModeState.height) > 2
            ) {
              console.log(
                `恢复后窗口大小不一致，再次调整: 当前=${width}x${height}, 目标=${preMiniModeState.width}x${preMiniModeState.height}`
              );
              win.setSize(preMiniModeState.width, preMiniModeState.height, false);
            }
          }
        }, 150);
      }, 50);
    }
  });

  ipcMain.on('update-play-state', (_, playing: boolean) => {
    isPlaying = playing;
    if (mainWindowInstance) {
      setThumbarButtons(mainWindowInstance);
    }
  });

  // 监听代理设置变化
  store.onDidChange('set.proxyConfig', () => {
    initializeProxy();
  });

  // 初始化窗口大小和缩放相关的IPC处理程序
  initWindowSizeHandlers(mainWindowInstance);
  // 监听 macOS 下点击 Dock 图标的事件
  app.on('activate', () => {
    // 当应用被激活时，检查主窗口是否存在
    if (mainWindowInstance && !mainWindowInstance.isDestroyed()) {
      // 如果窗口存在但被隐藏，则显示窗口
      if (!mainWindowInstance.isVisible()) {
        mainWindowInstance.show();
      }
    }
  });
}

/**
 * 创建主窗口
 */
export function createMainWindow(icon: Electron.NativeImage): BrowserWindow {
  console.log('开始创建主窗口...');

  // 获取窗口创建选项
  const options = getWindowOptions();

  // 添加图标和预加载脚本
  options.icon = icon;
  options.webPreferences = {
    preload: join(__dirname, '../preload/index.js'),
    sandbox: false,
    contextIsolation: true,
    webSecurity: true, // 🔒 安全修复: 启用webSecurity以符合Electron安全最佳实践
    nodeIntegration: false, // 🔒 安全加固: 明确禁用nodeIntegration
    nodeIntegrationInWorker: false, // 🔒 安全加固: 禁用Worker中的Node.js集成
    allowRunningInsecureContent: false // 🔒 安全加固: 禁止运行不安全内容
  };

  console.log(
    `创建窗口，使用选项: ${JSON.stringify({
      width: options.width,
      height: options.height,
      x: options.x,
      y: options.y,
      minWidth: options.minWidth,
      minHeight: options.minHeight
    })}`
  );

  // 创建窗口
  const mainWindow = new BrowserWindow(options);

  // 🔒 安全配置: 设置内容安全策略 (CSP)
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: https: http:; " +
          "media-src 'self' data: https: http: blob:; " +
          "connect-src 'self' https: http: ws: wss:; " +
          "font-src 'self' data:;"
        ]
      }
    });
  });

  // 移除菜单
  mainWindow.removeMenu();

  // 应用初始状态 (例如最大化状态)
  applyInitialState(mainWindow);

  // 更新 preMiniModeState，以便迷你模式可以正确恢复
  const savedState = getWindowState();
  if (savedState) {
    preMiniModeState = { ...savedState };
  }

  mainWindow.on('show', () => {
    setThumbarButtons(mainWindow);
  });

  // 处理窗口关闭事件
  mainWindow.on('close', (event) => {
    // 在 macOS 上，阻止默认的关闭行为，改为隐藏窗口
    if (process.platform === 'darwin') {
      // 检查是否是应用正在退出
      if (!isAppQuitting) {
        event.preventDefault();
        mainWindow.hide();
        return;
      }
    }
    // 在其他平台上，或者应用正在退出时，允许正常关闭
  });

  mainWindow.on('ready-to-show', () => {
    const [width, height] = mainWindow.getSize();
    console.log(`窗口显示前的大小: ${width}x${height}`);

    // 强制确保窗口使用正确的大小
    if (savedState && !savedState.isMaximized) {
      mainWindow.setSize(savedState.width, savedState.height, false);
    }

    // 显示窗口
    mainWindow.show();
    // 应用页面内容缩放
    applyContentZoom(mainWindow);

    // 再次检查窗口大小是否正确应用
    setTimeout(() => {
      if (!mainWindow.isDestroyed() && !mainWindow.isMaximized()) {
        const [currentWidth, currentHeight] = mainWindow.getSize();
        if (savedState && !savedState.isMaximized) {
          if (
            Math.abs(currentWidth - savedState.width) > 2 ||
            Math.abs(currentHeight - savedState.height) > 2
          ) {
            console.log(
              `窗口大小不匹配，再次调整: 当前=${currentWidth}x${currentHeight}, 目标=${savedState.width}x${savedState.height}`
            );
            mainWindow.setSize(savedState.width, savedState.height, false);
          }
        }
      }
    }, 100);
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);

    // 注册快捷键 打开开发者工具
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    });
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  initWindowSizeHandlers(mainWindow);

  // 保存主窗口引用
  mainWindowInstance = mainWindow;

  return mainWindow;
}
