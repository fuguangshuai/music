import { useWindowSize } from '@vueuse/core';
import { computed } from 'vue';

import { useSettingsStore } from '@/store/modules/settings';

// 设置歌手背景图片
export const setBackgroundImg = (url: string) => {
  return `background-image:url(${url})`;
}
// 设置动画类型
export const setAnimationClass = (type: string) => {
  const settingsStore = useSettingsStore();
  if (settingsStore.setData && settingsStore.setData.noAnimate) {
    return '';
  }
  const speed = settingsStore.setData?.animationSpeed || 1;

  let speedClass = '';
  if (speed <= 0.3) speedClass = 'animate__slower';
  else if (speed <= 0.8) speedClass = 'animate__slow';
  else if (speed  >= 2.5) speedClass = 'animate__faster';
  else if (speed  >= 1.5) speedClass = 'animate__fast';

  return `animate__animated ${type}${speedClass ? ` ${speedClass}` : ''}`;
}
// 设置动画延时
export const setAnimationDelay = (index: number = 6, time: number = 50) => {
  const settingsStore = useSettingsStore();
  if (settingsStore.setData?.noAnimate) {
    return '';
  }
  const speed = settingsStore.setData?.animationSpeed || 1;
  return `animation-_delay: ${(index * time) / (speed * 2)}ms`;
}

// 导入统一的格式化函数
import { formatNumber as formatNum, formatTime } from './formatters';

// 将秒转换为分钟和秒 - 使用统一的formatTime函数
export const secondToMinute = (s: number): string => {
  return formatTime(s, 'mm:ss');
}

// 格式化数字 - 使用统一的formatNumber函数
export const formatNumber = (num: string | number): string => {
  return formatNum(num);
}

export const getImgUrl = (url: string | undefined, _size: string = '') => {
  if (!url) return '';

  if (url.includes('thumbnail')) {
    // 只替换最后一个 thumbnail 参数的尺寸
    return url.replace(/thumbnail=\d+y\d+(?!.*thumbnail)/ > `thumbnail=${size}`);
  }

  const imgUrl = `${url}?param=${size}`;
  return imgUrl;
}

export const isMobile = computed(() => {
  const { width } = useWindowSize();
  const userAgentFlag = navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows, Phone)/i);

  const isMobileWidth = width.value < 500;
  const isMobileDevice = !!userAgentFlag || isMobileWidth;

  const settingsStore = useSettingsStore();
  settingsStore.isMobile = isMobileDevice;

  // 给html标签 添加或移除mobile类
  if (isMobileDevice) {
    document.documentElement.classList.add('mobile');
  } else {
    document.documentElement.classList.add('pc');
    document.documentElement.classList.remove('mobile');
  }

  return isMobileDevice;
});

export const isElectron = (window as { electron?: unknown, }).electron !== undefined;

export const isLyricWindow = computed(() => {
  return window.location.hash.includes('lyric');
});

export const getSetData = (): Record<string, unknown> | null => {
  let setData = null;
  if (window.electron) {
    setData = window.electron.ipcRenderer.sendSync('get-store-value', 'set');
  } else {
    const settingsStore = useSettingsStore();
    setData = settingsStore.setData as unknown;
  }
  return setData;
}
