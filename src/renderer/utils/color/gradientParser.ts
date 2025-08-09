/**
 * 🌈 渐变解析工具
 * 专门处理CSS渐变字符串的解析和处理
 */

import tinycolor from 'tinycolor2';

import { validateColor } from './colorValidator';

/**
 * 解析渐变字符串，提取颜色数组
 */
export const parseGradient = (gradient: string): string[] => {
  if (!gradient || typeof gradient !== 'string') {
    return [];
  }

  try {
    // 移除渐变函数名和括号
    const cleanGradient = gradient
      .replace(/linear-gradient\s*\(/, '')
      .replace(/radial-gradient\s*\(/, '')
      .replace(/\)$/, '')
      .trim();

    // 分割颜色值，处理可能包含逗号的颜色值（如 rgba(255,0,0,0.5)）
    const parts = cleanGradient.split(/,(?![^()]*\))/);
    const colors: string[] = [];

    for (const part of parts) {
      const trimmedPart = part.trim();

      // 跳过角度和位置信息
      if (trimmedPart.includes('deg') || trimmedPart.includes('%') || /^\d+$/.test(trimmedPart)) {
        continue;
      }

      // 移除位置信息（如 "red 50%"）
      const colorMatch = trimmedPart.match(/^([^0-9%]+)/);
      if (colorMatch) {
        const color = colorMatch[1].trim();
        if (validateColor(color)) {
          colors.push(color);
        }
      } else if (validateColor(trimmedPart)) {
        colors.push(trimmedPart);
      }
    }

    return colors;
  } catch (error) {
    console.warn('解析渐变失败:', error);
    return [];
  }
};

/**
 * 从渐变中提取主色调
 */
export const extractMainColorFromGradient = (gradient: string): string | null => {
  const colors = parseGradient(gradient);

  if (colors.length === 0) {
    return null;
  }

  // 如果只有一个颜色，直接返回
  if (colors.length === 1) {
    return colors[0];
  }

  // 如果有多个颜色，返回第二个（通常是主要颜色）
  return colors[1] || colors[0];
};

/**
 * 生成简单的线性渐变
 */
export const createLinearGradient = (colors: string[], direction = '45deg'): string => {
  if (!colors || colors.length === 0) {
    return 'linear-gradient(45deg, #000000, #ffffff)';
  }

  const validColors = colors.filter(validateColor);

  if (validColors.length === 0) {
    return 'linear-gradient(45deg, #000000, #ffffff)';
  }

  if (validColors.length === 1) {
    // 如果只有一个颜色，创建该颜色的渐变变体
    const tc = tinycolor(validColors[0]);
    const lighter = tc.lighten(10).toString();
    const darker = tc.darken(10).toString();
    return `linear-gradient(${direction}, ${lighter}, ${darker})`;
  }

  return `linear-gradient(${direction}, ${validColors.join(', ')})`;
};

/**
 * 生成径向渐变
 */
export const createRadialGradient = (colors: string[], shape = 'circle'): string => {
  if (!colors || colors.length === 0) {
    return 'radial-gradient(circle, #000000, #ffffff)';
  }

  const validColors = colors.filter(validateColor);

  if (validColors.length === 0) {
    return 'radial-gradient(circle, #000000, #ffffff)';
  }

  return `radial-gradient(${shape}, ${validColors.join(', ')})`;
};

/**
 * 从图片URL生成渐变（占位符功能）
 */
export const generateGradientFromImage = (_imageUrl: string): Promise<string> => {
  // 这是一个占位符实现
  // 在实际应用中，可以使用 Canvas API 来分析图片的主要颜色
  return Promise.resolve('linear-gradient(45deg, #667eea, #764ba2)');
};

/**
 * 混合两个颜色
 */
export const blendColors = (color1: string, color2: string, ratio = 0.5): string => {
  if (!validateColor(color1) || !validateColor(color2)) {
    return color1 || color2 || '#000000';
  }

  const tc1 = tinycolor(color1);
  const tc2 = tinycolor(color2);

  return tinycolor.mix(tc1, tc2, ratio * 100).toString();
};

/**
 * 生成颜色的渐变序列
 */
export const generateColorSequence = (
  startColor: string,
  endColor: string,
  steps = 5
): string[] => {
  if (!validateColor(startColor) || !validateColor(endColor)) {
    return [startColor, endColor].filter(Boolean);
  }

  const colors: string[] = [];

  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    colors.push(blendColors(startColor, endColor, ratio));
  }

  return colors;
};
