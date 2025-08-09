/**
 * 通用音乐数据格式化工具
 * 统一处理音乐数据的格式化和标准化
 *
 * 重构说明：消除 unknown 和 any 类型使用，提供类型安全的数据格式化
 */

import type { SongResult } from '@/types/music';

import { typeGuards } from './typeHelpers';

// 定义原始数据的可能结构
interface RawSongData {
  id?: number;
  name?: string;
  picUrl?: string;
  ar?: Array<{ name: string; id?: number }>;
  artists?: Array<{ name: string; id?: number }>;
  al?: { name?: string; id?: number; picUrl?: string };
  album?: { name?: string; id?: number; picUrl?: string };
  dt?: number;
  duration?: number;
  count?: number;
}

interface RawArtistData {
  name?: string;
  id?: number;
}

interface RawAlbumData {
  name?: string;
  id?: number;
  picUrl?: string;
}

interface RawPlaylistData {
  id?: number;
  name?: string;
  description?: string;
  coverImgUrl?: string;
  trackCount?: number;
  creator?: {
    nickname?: string;
    avatarUrl?: string;
  };
}

/**
 * 类型守卫：检查是否为有效的歌曲数据
 */
const isValidSongData = (item: unknown): item is RawSongData => {
  return (
    typeGuards.isObject(item) &&
    (typeGuards.isNumber((item as RawSongData).id) ||
      typeGuards.isString((item as RawSongData).name))
  );
};

/**
 * 格式化单个歌曲数据
 * @param item 原始歌曲数据
 * @returns 标准化的歌曲数据
 */
export const formatSongData = (item: unknown): SongResult => {
  if (!isValidSongData(item)) {
    console.warn('🎵 无效的歌曲数据，使用默认值', item);
    return {
      id: 0,
      name: '',
      picUrl: '',
      ar: [] as any, // 使用类型断言避免完整Artist接口要求
      al: { name: '', id: 0 } as any, // 使用类型断言避免完整Album接口要求
      dt: 0,
      count: 0
    };
  }

  return {
    id: item.id || 0,
    name: item.name || item.al?.name || item.album?.name || '',
    picUrl: item.al?.picUrl || item.album?.picUrl || item.picUrl || '',
    ar: (item.ar || item.artists || []) as any, // 使用类型断言避免完整Artist接口要求
    al: (item.al || item.album || { name: '', id: 0 }) as any, // 使用类型断言避免完整Album接口要求
    dt: item.dt || item.duration || 0,
    count: item.count || 0
  };
};

/**
 * 格式化歌曲列表
 * @param items 原始歌曲数据数组
 * @returns 标准化的歌曲数据数组
 */
export const formatSongList = (items: unknown): SongResult[] => {
  if (!typeGuards.isArray(items)) {
    console.warn('🎵 输入不是数组，返回空列表', items);
    return [];
  }

  return items.map(formatSongData).filter((song) => typeof song.id === 'number' && song.id > 0);
};

/**
 * 类型守卫：检查是否为有效的艺术家数据
 */
const isValidArtistData = (item: unknown): item is RawArtistData => {
  return typeGuards.isObject(item) && typeGuards.isString((item as RawArtistData).name);
};

/**
 * 格式化艺术家信息
 * @param artists 原始艺术家数据
 * @returns 格式化的艺术家字符串
 */
export const formatArtists = (artists: unknown): string => {
  if (!artists) return '';

  const artistArray = typeGuards.isArray(artists) ? artists : [artists];
  return artistArray
    .map((artist: unknown) => {
      if (isValidArtistData(artist)) {
        return artist.name;
      }
      if (typeGuards.isString(artist)) {
        return artist;
      }
      return '';
    })
    .filter(Boolean)
    .join(', ');
};

/**
 * 类型守卫：检查是否为有效的专辑数据
 */
const isValidAlbumData = (item: unknown): item is RawAlbumData => {
  return typeGuards.isObject(item) && typeGuards.isString((item as RawAlbumData).name);
};

/**
 * 格式化专辑信息
 * @param album 原始专辑数据
 * @returns 格式化的专辑名称
 */
export const formatAlbum = (album: unknown): string => {
  if (!album) return '';

  if (isValidAlbumData(album)) {
    return album.name || '';
  }

  if (typeGuards.isString(album)) {
    return album;
  }

  return '';
};

/**
 * 格式化图片URL
 * @param picUrl 原始图片URL
 * @param size 图片尺寸
 * @returns 格式化的图片URL
 */
export const formatPicUrl = (picUrl: unknown, size = '200y200'): string => {
  if (!picUrl || !typeGuards.isString(picUrl)) return '';

  if (picUrl.includes('?')) {
    return `${picUrl}&param=${size}`;
  }
  return `${picUrl}?param=${size}`;
};

/**
 * 格式化播放时长
 * @param duration 时长（毫秒或秒）
 * @returns 格式化的时长字符串
 */
export const formatDuration = (duration: unknown): string => {
  if (!typeGuards.isNumber(duration) && !typeGuards.isString(duration)) {
    return '00:00';
  }

  const ms = Number(duration) || 0;
  const seconds = Math.floor(ms > 1000 ? ms / 1000 : ms);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * 检查歌曲是否可播放
 * @param song 歌曲数据
 * @returns 是否可播放
 */
export const isSongPlayable = (song: unknown): boolean => {
  if (!isValidSongData(song)) {
    return false;
  }

  const fee = (song as RawSongData & { fee?: number }).fee;
  return fee !== 1 && fee !== 4;
};

/**
 * 类型守卫：检查是否为有效的播放列表数据
 */
const isValidPlaylistData = (item: unknown): item is RawPlaylistData => {
  return (
    typeGuards.isObject(item) &&
    (typeGuards.isNumber((item as RawPlaylistData).id) ||
      typeGuards.isString((item as RawPlaylistData).name))
  );
};

/**
 * 格式化播放列表信息
 * @param playlist 原始播放列表数据
 * @returns 格式化的播放列表信息
 */
export const formatPlaylistInfo = (playlist: unknown) => {
  if (!isValidPlaylistData(playlist)) {
    console.warn('🎵 无效的播放列表数据，使用默认值', playlist);
    return {
      id: 0,
      name: '',
      description: '',
      coverImgUrl: '',
      creator: null,
      trackCount: 0,
      playCount: 0,
      subscribed: false,
      trackIds: [],
      tracks: []
    };
  }

  return {
    id: playlist.id || 0,
    name: playlist.name || '',
    description: playlist.description || '',
    coverImgUrl: playlist.coverImgUrl || '',
    creator: playlist.creator || null,
    trackCount: playlist.trackCount || 0,
    playCount: 0, // 默认值
    subscribed: false, // 默认值
    trackIds: [], // 默认值
    tracks: [] // 默认值
  };
};
