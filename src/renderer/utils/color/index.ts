/**
 * 🎨 颜色工具统一入口
 * 重构后的模块化颜色处理工具集
 */

// 导出所有颜色验证功能
export {
  generateColorVariants,
  getColorBrightness,
  getContrastColor,
  isDarkColor,
  isLightColor,
  optimizeColorForTheme,
  validateColor,
  validateColorContrast
} from './colorValidator';

// 导出所有渐变处理功能
export {
  blendColors,
  createLinearGradient,
  createRadialGradient,
  extractMainColorFromGradient,
  generateColorSequence,
  generateGradientFromImage,
  parseGradient
} from './gradientParser';

// 导出所有主题管理功能
export {
  detectThemeFromBackground,
  generateThemePalette,
  getCurrentLyricThemeColor,
  getCurrentTheme,
  getDefaultHighlightColor,
  getThemeTextColors,
  type ITextColors,
  loadLyricThemeColor,
  resetLyricThemeColor,
  saveLyricThemeColor,
  switchTheme
} from './themeManager';

// 兼容性导出 - 保持向后兼容
import tinycolor from 'tinycolor2';

import { parseGradient } from './gradientParser';
import { type ITextColors } from './themeManager';

/**
 * 获取文本颜色（兼容性函数）
 * @deprecated 请使用 getThemeTextColors 替代
 */
export const getTextColors = (gradient: string = ''): ITextColors => {
  const defaultColors = {
    primary: 'rgba(255, 255, 255, 0.54)',
    active: '#ffffff',
    theme: 'light' as const
  };

  if (!gradient) return defaultColors;

  const colors = parseGradient(gradient);
  if (!colors.length) return defaultColors;

  const mainColor = colors.length === 1 ? colors[0] : colors[1] || colors[0];
  const tc = tinycolor(mainColor);
  const isDark = tc.getBrightness() > 155; // tinycolor 的亮度范围是 0-255

  return {
    primary: isDark ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.54)',
    active: isDark ? '#000000' : '#ffffff',
    theme: isDark ? 'dark' : 'light'
  };
};

// 重新导出 tinycolor 以保持兼容性
export { default as tinycolor } from 'tinycolor2';
