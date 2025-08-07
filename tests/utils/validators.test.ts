/**
 * 验证工具函数单元测试
 * 验证统一验证函数的正确性
 */

import { describe, expect, it } from 'vitest';

import {
  isValidAudioUrl,
  isValidColor,
  isValidEmail,
  isValidFilename,
  isValidImageUrl,
  isValidIPv4,
  isValidNumber,
  isValidPort,
  isValidUrl,
  isValidVersion
} from '@/utils/validators';

describe('isValidUrl', () => {
  it('should validate correct URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://localhost:3000')).toBe(true);
    expect(isValidUrl('ftp://files.example.com')).toBe(true);
  });

  it('should reject invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('http://')).toBe(false);
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl(null as unknown as string)).toBe(false);
    expect(isValidUrl(undefined as unknown as string)).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('should validate correct emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    expect(isValidEmail('test+tag@example.org')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(null as unknown as string)).toBe(false);
  });
});

describe('isValidImageUrl', () => {
  it('should validate image URLs', () => {
    expect(isValidImageUrl('https://example.com/image.jpg')).toBe(true);
    expect(isValidImageUrl('https://example.com/image.png')).toBe(true);
    expect(isValidImageUrl('https://example.com/image.gif')).toBe(true);
    expect(isValidImageUrl('https://example.com/image.webp')).toBe(true);
    expect(isValidImageUrl('https://api.example.com/image/123')).toBe(true);
  });

  it('should reject non-image URLs', () => {
    expect(isValidImageUrl('https://example.com/document.pdf')).toBe(false);
    expect(isValidImageUrl('not-a-url')).toBe(false);
  });
});

describe('isValidAudioUrl', () => {
  it('should validate audio URLs', () => {
    expect(isValidAudioUrl('https://example.com/song.mp3')).toBe(true);
    expect(isValidAudioUrl('https://example.com/song.flac')).toBe(true);
    expect(isValidAudioUrl('https://example.com/song.wav')).toBe(true);
    expect(isValidAudioUrl('https://api.example.com/music/123')).toBe(true);
  });

  it('should reject non-audio URLs', () => {
    expect(isValidAudioUrl('https://example.com/video.mp4')).toBe(false);
    expect(isValidAudioUrl('not-a-url')).toBe(false);
  });
});

describe('isValidColor', () => {
  it('should validate hex colors', () => {
    expect(isValidColor('#ff0000')).toBe(true);
    expect(isValidColor('#f00')).toBe(true);
    expect(isValidColor('#FF0000')).toBe(true);
  });

  it('should validate rgb colors', () => {
    expect(isValidColor('rgb(255, 0, 0)')).toBe(true);
    expect(isValidColor('rgba(255, 0, 0, 0.5)')).toBe(true);
  });

  it('should validate hsl colors', () => {
    expect(isValidColor('hsl(0, 100%, 50%)')).toBe(true);
    expect(isValidColor('hsla(0, 100%, 50%, 0.5)')).toBe(true);
  });

  it('should validate color names', () => {
    expect(isValidColor('red')).toBe(true);
    expect(isValidColor('blue')).toBe(true);
    expect(isValidColor('transparent')).toBe(true);
  });

  it('should reject invalid colors', () => {
    expect(isValidColor('invalid-color')).toBe(false);
    expect(isValidColor('#gg0000')).toBe(false);
    expect(isValidColor('')).toBe(false);
    expect(isValidColor(null as unknown as string)).toBe(false);
  });
});

describe('isValidNumber', () => {
  it('should validate numbers', () => {
    expect(isValidNumber(42)).toBe(true);
    expect(isValidNumber(3.14)).toBe(true);
    expect(isValidNumber('42')).toBe(true);
    expect(isValidNumber('3.14')).toBe(true);
  });

  it('should validate with constraints', () => {
    expect(isValidNumber(5, { min: 0, max: 10 })).toBe(true);
    expect(isValidNumber(42, { integer: true })).toBe(true);
    expect(isValidNumber(3.14, { integer: true })).toBe(false);
    expect(isValidNumber(-5, { min: 0 })).toBe(false);
    expect(isValidNumber(15, { max: 10 })).toBe(false);
  });

  it('should reject invalid numbers', () => {
    expect(isValidNumber('not-a-number')).toBe(false);
    expect(isValidNumber(NaN)).toBe(false);
    expect(isValidNumber(Infinity)).toBe(false);
    expect(isValidNumber(null)).toBe(false);
  });
});

describe('isValidFilename', () => {
  it('should validate correct filenames', () => {
    expect(isValidFilename('document.txt')).toBe(true);
    expect(isValidFilename('my-file.pdf')).toBe(true);
    expect(isValidFilename('file_name.jpg')).toBe(true);
  });

  it('should reject invalid filenames', () => {
    expect(isValidFilename('file<name>.txt')).toBe(false);
    expect(isValidFilename('file|name.txt')).toBe(false);
    expect(isValidFilename('CON')).toBe(false);
    expect(isValidFilename('PRN')).toBe(false);
    expect(isValidFilename('file.')).toBe(false);
    expect(isValidFilename('file ')).toBe(false);
    expect(isValidFilename('')).toBe(false);
  });

  it('should reject very long filenames', () => {
    const longName = 'a'.repeat(256) + '.txt';
    expect(isValidFilename(longName)).toBe(false);
  });
});

describe('isValidPort', () => {
  it('should validate correct ports', () => {
    expect(isValidPort(80)).toBe(true);
    expect(isValidPort(443)).toBe(true);
    expect(isValidPort(3000)).toBe(true);
    expect(isValidPort('8080')).toBe(true);
  });

  it('should reject invalid ports', () => {
    expect(isValidPort(0)).toBe(false);
    expect(isValidPort(65536)).toBe(false);
    expect(isValidPort(-1)).toBe(false);
    expect(isValidPort('not-a-port')).toBe(false);
  });
});

describe('isValidIPv4', () => {
  it('should validate correct IPv4 addresses', () => {
    expect(isValidIPv4('192.168.1.1')).toBe(true);
    expect(isValidIPv4('127.0.0.1')).toBe(true);
    expect(isValidIPv4('0.0.0.0')).toBe(true);
    expect(isValidIPv4('255.255.255.255')).toBe(true);
  });

  it('should reject invalid IPv4 addresses', () => {
    expect(isValidIPv4('256.1.1.1')).toBe(false);
    expect(isValidIPv4('192.168.1')).toBe(false);
    expect(isValidIPv4('192.168.1.1.1')).toBe(false);
    expect(isValidIPv4('not-an-ip')).toBe(false);
    expect(isValidIPv4('')).toBe(false);
  });
});

describe('isValidVersion', () => {
  it('should validate semantic versions', () => {
    expect(isValidVersion('1.0.0')).toBe(true);
    expect(isValidVersion('1.2.3')).toBe(true);
    expect(isValidVersion('10.20.30')).toBe(true);
    expect(isValidVersion('1.0.0-alpha')).toBe(true);
    expect(isValidVersion('1.0.0-alpha.1')).toBe(true);
    expect(isValidVersion('1.0.0+build.1')).toBe(true);
  });

  it('should reject invalid versions', () => {
    expect(isValidVersion('1.0')).toBe(false);
    expect(isValidVersion('1')).toBe(false);
    expect(isValidVersion('v1.0.0')).toBe(false);
    expect(isValidVersion('1.0.0.0')).toBe(false);
    expect(isValidVersion('')).toBe(false);
    expect(isValidVersion(null as unknown as string)).toBe(false);
  });
});
