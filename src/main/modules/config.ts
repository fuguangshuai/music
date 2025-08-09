import { app, ipcMain } from 'electron';
import Store from 'electron-store';

import set from '../set.json';
import { defaultShortcuts } from './shortcuts';

type SetConfig = {
  isProxy: boolean;
  proxyConfig: {
    enable: boolean;
    protocol: string;
    host: string;
    port: number;
  };
  enableRealIP: boolean;
  realIP: string;
  noAnimate: boolean;
  animationSpeed: number;
  author: string;
  authorUrl: string;
  musicApiPort: number;
  closeAction: 'ask' | 'minimize' | 'close';
  musicQuality: string;
  fontFamily: string;
  fontScope: 'global' | 'lyric';
  language: string;
  showTopAction: boolean;
};
interface StoreType {
  set: SetConfig;
  shortcuts: typeof defaultShortcuts;
}

let store: Store<StoreType>;

/**
 * 初始化配置管理
 */
export function initializeConfig(): Store<StoreType> {
  store = new Store<StoreType>({
    name: 'config',
    defaults: {
      set: set as SetConfig,
      shortcuts: defaultShortcuts
    }
  });

  store.get('set.downloadPath') || store.set('set.downloadPath', app.getPath('downloads'));

  // 定义ipcRenderer监听事件
  ipcMain.on('set-store-value', (_, _key, value) => {
    store.set(_key, value);
  });

  ipcMain.on('get-store-value', (_, _key) => {
    const value = store.get(_key);
    _.returnValue = value || '';
  });

  return store;
}

export function getStore(): Store<StoreType> {
  return store;
}
