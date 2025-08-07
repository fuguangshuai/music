/**
 * 格式化工具函数单元测试
 * 验证统一格式化函数的正确性
 */

import { describe, expect,it } from 'vitest';

import { 
  formatDuration, 
  formatFileSize, 
  formatNumber, 
  formatNumberEn,
  formatPublishTime,
  formatSongName,
  formatTime} from '@/utils/formatters';

describe('formatTime', () => {
  it('should format seconds to mm:ss', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(30)).toBe('00:30');
    expect(formatTime(90)).toBe('01:30');
    expect(formatTime(3661)).toBe('61:01');
  });

  it('should format seconds to hh:mm:ss', () => {
    expect(formatTime(0, 'hh:mm:ss')).toBe('00:00:00');
    expect(formatTime(3661, 'hh:mm:ss')).toBe('01:01:01');
    expect(formatTime(7322, 'hh:mm:ss')).toBe('02:02:02');
  });

  it('should handle negative values', () => {
    expect(formatTime(-10)).toBe('00:00');
    expect(formatTime(-10, 'hh:mm:ss')).toBe('00:00:00');
  });

  it('should handle null/undefined values', () => {
    expect(formatTime(null as any)).toBe('00:00');
    expect(formatTime(undefined as any)).toBe('00:00');
  });
});

describe('formatDuration', () => {
  it('should format milliseconds to time string', () => {
    expect(formatDuration(0)).toBe('--:--');
    expect(formatDuration(30000)).toBe('00:30');
    expect(formatDuration(90000)).toBe('01:30');
    expect(formatDuration(3661000)).toBe('61:01');
  });

  it('should format milliseconds to hh:mm:ss', () => {
    expect(formatDuration(3661000, 'hh:mm:ss')).toBe('01:01:01');
  });

  it('should handle invalid values', () => {
    expect(formatDuration(-1000)).toBe('--:--');
    expect(formatDuration(null as any)).toBe('--:--');
  });
});

describe('formatFileSize', () => {
  it('should format bytes to human readable size', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1048576)).toBe('1.0 MB');
    expect(formatFileSize(1073741824)).toBe('1.0 GB');
  });

  it('should respect precision parameter', () => {
    expect(formatFileSize(1536, 2)).toBe('1.50 KB');
    expect(formatFileSize(1536, 0)).toBe('2 KB');
  });

  it('should handle very large files', () => {
    expect(formatFileSize(1099511627776)).toBe('1.0 TB');
    expect(formatFileSize(1125899906842624)).toBe('1024.0 TB');
  });

  it('should handle null/undefined values', () => {
    expect(formatFileSize(null as any)).toBe('0 B');
    expect(formatFileSize(undefined as any)).toBe('0 B');
  });
});

describe('formatNumber', () => {
  it('should format numbers with Chinese units', () => {
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(10000)).toBe('1.0万');
    expect(formatNumber(15000)).toBe('1.5万');
    expect(formatNumber(100000000)).toBe('1.0亿');
    expect(formatNumber(150000000)).toBe('1.5亿');
  });

  it('should handle string numbers', () => {
    expect(formatNumber('10000')).toBe('1.0万');
    expect(formatNumber('100000000')).toBe('1.0亿');
  });

  it('should handle invalid values', () => {
    expect(formatNumber('invalid')).toBe('0');
    expect(formatNumber(null as any)).toBe('0');
    expect(formatNumber(undefined as any)).toBe('0');
  });
});

describe('formatNumberEn', () => {
  it('should format numbers with English units', () => {
    expect(formatNumberEn(999)).toBe('999');
    expect(formatNumberEn(1000)).toBe('1.0K');
    expect(formatNumberEn(1500)).toBe('1.5K');
    expect(formatNumberEn(1000000)).toBe('1.0M');
    expect(formatNumberEn(1500000)).toBe('1.5M');
  });
});

describe('formatPublishTime', () => {
  it('should format timestamp to date string', () => {
    const timestamp = new Date('2023-01-15').getTime();
    expect(formatPublishTime(timestamp)).toBe('2023-01-15');
    expect(formatPublishTime(timestamp, 'YYYY.MM.DD')).toBe('2023.01.15');
    expect(formatPublishTime(timestamp, 'MM/DD/YYYY')).toBe('01/15/2023');
  });

  it('should handle Date objects', () => {
    const date = new Date('2023-01-15');
    expect(formatPublishTime(date)).toBe('2023-01-15');
  });

  it('should handle string dates', () => {
    expect(formatPublishTime('2023-01-15')).toBe('2023-01-15');
  });

  it('should handle invalid dates', () => {
    expect(formatPublishTime('invalid')).toBe('');
    expect(formatPublishTime(null as any)).toBe('');
    expect(formatPublishTime(undefined as any)).toBe('');
  });
});

describe('formatSongName', () => {
  const mockSong = {
    name: 'Test Song',
    ar: [{ name: 'Artist 1' }, { name: 'Artist 2' }],
    al: { name: 'Test Album' }
  };

  it('should format song name with default template', () => {
    const result = formatSongName(mockSong);
    expect(result).toBe('Test Song - Artist 1/Artist 2');
  });

  it('should format song name with custom template', () => {
    const result = formatSongName(mockSong, '{artistName} - {songName} ({albumName})');
    expect(result).toBe('Artist 1/Artist 2 - Test Song (Test Album)');
  });

  it('should handle missing artist data', () => {
    const songWithoutArtist = { name: 'Test Song', al: { name: 'Test Album' } };
    const result = formatSongName(songWithoutArtist);
    expect(result).toBe('Test Song - 未知艺术家');
  });

  it('should handle missing album data', () => {
    const songWithoutAlbum = { name: 'Test Song', ar: [{ name: 'Artist' }] };
    const result = formatSongName(songWithoutAlbum, '{songName} - {albumName}');
    expect(result).toBe('Test Song - 未知专辑');
  });

  it('should handle null/undefined song info', () => {
    expect(formatSongName(null)).toBe('');
    expect(formatSongName(undefined)).toBe('');
    expect(formatSongName('invalid')).toBe('');
  });

  it('should handle filename fallback', () => {
    const songWithFilename = { filename: 'song.mp3' };
    const result = formatSongName(songWithFilename);
    expect(result).toBe('song.mp3 - 未知艺术家');
  });
});
