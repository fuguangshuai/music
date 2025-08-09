/**
 * 🎨 主题色管理器
 * 专门处理主题色的保存、加载和管理
 */

import { optimizeColorForTheme, validateColor } from './colorValidator';

// 主题色设置接口
interface ThemeColorSettings {
  highlightColor?: string;
  theme: 'light' | 'dark';
  autoTheme?: boolean;
}

// 文本颜色接口
export interface ITextColors {
  primary: string;
  active: string;
  theme: 'light' | 'dark';
}

// 默认主题色配置
const DEFAULT_COLORS = {
  light: {
    highlight: '#1976d2',
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.54)'
  },
  dark: {
    highlight: '#90caf9',
    primary: 'rgba(255, 255, 255, 0.87)',
    secondary: 'rgba(255, 255, 255, 0.54)'
  }
};

/**
 * 安全地加载歌词设置
 */
const safeLoadLyricSettings = (): ThemeColorSettings => {
  try {
    const stored = localStorage.getItem('lyric-settings');
    if (stored) {
      const settings = JSON.parse(stored);
      return {
        theme: settings.theme || 'light',
        highlightColor: settings.highlightColor,
        autoTheme: settings.autoTheme || false
      };
    }
  } catch (error) {
    console.warn('加载歌词设置失败:', error);
  }

  return {
    theme: 'light',
    autoTheme: false
  };
};

/**
 * 安全地保存歌词设置
 */
const safeSaveLyricSettings = (settings: ThemeColorSettings): void => {
  try {
    localStorage.setItem('lyric-settings', JSON.stringify(settings));
  } catch (error) {
    console.warn('保存歌词设置失败:', error);
  }
};

/**
 * 获取默认高亮颜色
 */
export const getDefaultHighlightColor = (theme: 'light' | 'dark'): string => {
  return DEFAULT_COLORS[theme].highlight;
};

/**
 * 保存歌词主题色
 */
export const saveLyricThemeColor = (color: string): void => {
  if (!validateColor(color)) {
    console.warn('无效的颜色值:', color);
    return;
  }

  const settings = safeLoadLyricSettings();
  settings.highlightColor = color;
  safeSaveLyricSettings(settings);
};

/**
 * 加载歌词主题色
 */
export const loadLyricThemeColor = (): string => {
  const settings = safeLoadLyricSettings();

  if (settings.highlightColor && validateColor(settings.highlightColor)) {
    return settings.highlightColor;
  }

  // 如果没有保存的颜色或颜色无效，返回默认颜色
  return getDefaultHighlightColor(settings.theme);
};

/**
 * 重置歌词主题色到默认值
 */
export const resetLyricThemeColor = (): void => {
  const settings = safeLoadLyricSettings();
  delete settings.highlightColor;
  safeSaveLyricSettings(settings);
};

/**
 * 获取当前有效的歌词主题色
 */
export const getCurrentLyricThemeColor = (theme: 'light' | 'dark'): string => {
  const savedColor = loadLyricThemeColor();

  if (savedColor && validateColor(savedColor)) {
    return optimizeColorForTheme(savedColor, theme);
  }

  return getDefaultHighlightColor(theme);
};

/**
 * 获取主题对应的文本颜色
 */
export const getThemeTextColors = (theme: 'light' | 'dark'): ITextColors => {
  const colors = DEFAULT_COLORS[theme];

  return {
    primary: colors.primary,
    active: colors.primary,
    theme
  };
};

/**
 * 根据背景色自动确定主题
 */
export const detectThemeFromBackground = (backgroundColor: string): 'light' | 'dark' => {
  if (!validateColor(backgroundColor)) {
    return 'light';
  }

  // 使用简单的亮度检测
  const rgb = backgroundColor.match(/\d+/g);
  if (!rgb || rgb.length < 3) {
    return 'light';
  }

  const brightness =
    (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
  return brightness > 128 ? 'light' : 'dark';
};

/**
 * 生成主题色调色板
 */
export const generateThemePalette = (baseColor: string, theme: 'light' | 'dark') => {
  if (!validateColor(baseColor)) {
    return DEFAULT_COLORS[theme];
  }

  const optimizedColor = optimizeColorForTheme(baseColor, theme);

  return {
    primary: optimizedColor,
    secondary: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    accent: optimizedColor,
    background: theme === 'dark' ? '#121212' : '#ffffff',
    surface: theme === 'dark' ? '#1e1e1e' : '#f5f5f5'
  };
};

/**
 * 切换主题
 */
export const switchTheme = (newTheme: 'light' | 'dark'): void => {
  const settings = safeLoadLyricSettings();
  settings.theme = newTheme;
  safeSaveLyricSettings(settings);
};

/**
 * 获取当前主题
 */
export const getCurrentTheme = (): 'light' | 'dark' => {
  const settings = safeLoadLyricSettings();
  return settings.theme;
};
