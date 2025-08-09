/**
 * 🎨 颜色验证工具
 * 专门处理颜色验证和对比度检查
 */

import tinycolor from 'tinycolor2';

/**
 * 验证颜色是否有效
 */
export const validateColor = (color: string): boolean => {
  if (!color || typeof color !== 'string' || color.trim() === '') {
    return false;
  }

  try {
    const tc = tinycolor(color);
    if (!tc.isValid()) {
      return false;
    }

    const alpha = tc.getAlpha();
    return typeof alpha === 'number' && !Number.isNaN(alpha) && alpha > 0;
  } catch (error) {
    console.warn('颜色验证失败:', error);
    return false;
  }
};

/**
 * 检查颜色对比度是否符合可读性标准
 */
export const validateColorContrast = (color: string, theme: 'light' | 'dark'): boolean => {
  if (!validateColor(color)) return false;

  const backgroundColor = theme === 'dark' ? '#000000' : '#ffffff';
  const contrast = tinycolor.readability(color, backgroundColor);
  return contrast >= 4.5; // WCAG AA 标准
};

/**
 * 获取颜色的亮度值
 */
export const getColorBrightness = (color: string): number => {
  if (!validateColor(color)) return 0;

  const tc = tinycolor(color);
  return tc.getBrightness();
};

/**
 * 检查颜色是否为深色
 */
export const isDarkColor = (color: string): boolean => {
  return getColorBrightness(color) < 128;
};

/**
 * 检查颜色是否为浅色
 */
export const isLightColor = (color: string): boolean => {
  return getColorBrightness(color) >= 128;
};

/**
 * 获取颜色的对比色（黑色或白色）
 */
export const getContrastColor = (color: string): string => {
  return isDarkColor(color) ? '#ffffff' : '#000000';
};

/**
 * 优化颜色以适应特定主题
 */
export const optimizeColorForTheme = (color: string, theme: 'light' | 'dark'): string => {
  if (!validateColor(color)) {
    return theme === 'dark' ? '#ffffff' : '#000000';
  }

  const tc = tinycolor(color);

  if (theme === 'dark') {
    // 在深色主题中，确保颜色足够亮
    if (tc.getBrightness() < 100) {
      return tc.lighten(30).toString();
    }
  } else {
    // 在浅色主题中，确保颜色不会太亮
    if (tc.getBrightness() > 200) {
      return tc.darken(20).toString();
    }
  }

  return color;
};

/**
 * 生成颜色的变体（更亮/更暗的版本）
 */
export const generateColorVariants = (color: string) => {
  if (!validateColor(color)) {
    return {
      lighter: '#ffffff',
      darker: '#000000',
      original: color
    };
  }

  const tc = tinycolor(color);

  return {
    lighter: tc.lighten(20).toString(),
    darker: tc.darken(20).toString(),
    original: color
  };
};
