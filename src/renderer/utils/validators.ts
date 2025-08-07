/**
 * 统一的验证工具函数
 * 提供一致的数据验证功能，消除项目中的重复实现
 */

/**
 * URL验证函数
 * 验证字符串是否为有效的URL
 * @param url 待验证的URL字符串
 * @returns 是否为有效URL
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 邮箱验证函数
 * 验证字符串是否为有效的邮箱地址
 * @param email 待验证的邮箱字符串
 * @returns 是否为有效邮箱
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 图片URL验证函数
 * 验证URL是否为有效的图片地址
 * @param url 待验证的URL字符串
 * @returns 是否为有效图片URL
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false;
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const lowerUrl = url.toLowerCase();
  
  return imageExtensions.some(ext => lowerUrl.includes(ext)) || 
         lowerUrl.includes('image') || 
         lowerUrl.includes('img') ||
         lowerUrl.includes('pic');
};

/**
 * 音频URL验证函数
 * 验证URL是否为有效的音频地址
 * @param url 待验证的URL字符串
 * @returns 是否为有效音频URL
 */
export const isValidAudioUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false;
  
  const audioExtensions = ['.mp3', '.flac', '.wav', '.aac', '.ogg', '.m4a', '.wma'];
  const lowerUrl = url.toLowerCase();
  
  return audioExtensions.some(ext => lowerUrl.includes(ext)) ||
         lowerUrl.includes('audio') ||
         lowerUrl.includes('music');
};

/**
 * 颜色值验证函数
 * 验证字符串是否为有效的颜色值
 * @param color 待验证的颜色字符串
 * @returns 是否为有效颜色值
 */
export const isValidColor = (color: string): boolean => {
  if (!color || typeof color !== 'string' || color.trim() === '') {
    return false;
  }

  // 支持的颜色格式：hex, rgb, rgba, hsl, hsla, 颜色名称
  const colorRegex = /^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)|hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)|[a-zA-Z]+)$/;
  
  return colorRegex.test(color.trim());
};

/**
 * 数字验证函数
 * 验证值是否为有效数字
 * @param value 待验证的值
 * @param options 验证选项
 * @returns 是否为有效数字
 */
export const isValidNumber = (
  value: unknown, 
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): boolean => {
  const num = Number(value);
  
  if (isNaN(num) || !isFinite(num)) {
    return false;
  }

  if (options.integer && !Number.isInteger(num)) {
    return false;
  }

  if (options.min !== undefined && num < options.min) {
    return false;
  }

  if (options.max !== undefined && num > options.max) {
    return false;
  }

  return true;
};

/**
 * 文件名验证函数
 * 验证文件名是否合法（不包含非法字符）
 * @param filename 待验证的文件名
 * @returns 是否为合法文件名
 */
export const isValidFilename = (filename: string): boolean => {
  if (!filename || typeof filename !== 'string' || filename.trim() === '') {
    return false;
  }

  // Windows和Unix系统的非法字符
  const illegalChars = /[<>:"/\\|?*]/;
  const controlChars = /[\u0000-\u001f]/;
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  
  return !illegalChars.test(filename) &&
         !controlChars.test(filename) &&
         !reservedNames.test(filename) &&
         filename.length <= 255 &&
         !filename.endsWith('.') &&
         !filename.endsWith(' ');
};

/**
 * 端口号验证函数
 * 验证端口号是否在有效范围内
 * @param port 待验证的端口号
 * @returns 是否为有效端口号
 */
export const isValidPort = (port: number | string): boolean => {
  const portNum = Number(port);
  return isValidNumber(portNum, { min: 1, max: 65535, integer: true });
};

/**
 * IP地址验证函数
 * 验证字符串是否为有效的IP地址（IPv4）
 * @param ip 待验证的IP地址字符串
 * @returns 是否为有效IP地址
 */
export const isValidIPv4 = (ip: string): boolean => {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipRegex);
  
  if (!match) return false;
  
  return match.slice(1).every(octet => {
    const num = parseInt(octet, 10);
    return num >= 0 && num <= 255;
  });
};

/**
 * 版本号验证函数
 * 验证字符串是否为有效的语义化版本号
 * @param version 待验证的版本号字符串
 * @returns 是否为有效版本号
 */
export const isValidVersion = (version: string): boolean => {
  if (!version || typeof version !== 'string') {
    return false;
  }

  const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*)?(\+[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*)?$/;
  return versionRegex.test(version);
};
