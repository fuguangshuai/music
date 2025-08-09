/**
 * 通用音乐数据格式化工具
 * 统一处理音乐数据的格式化和标准化
 */

import type { SongResult } from '@/types/music';

/**
 * 格式化单个歌曲数据
 * @param item 原始歌曲数据
 * @returns 标准化的歌曲数据
 */
export const formatSongData = (item: unknown): SongResult => {
  const song = item as any;

  return {
    id: song.id || 0,
    name: song.name || song.al?.name || song.album?.name || '',
    picUrl: song.al?.picUrl || song.album?.picUrl || song.picUrl || '',
    ar: song.ar || song.artists || [],
    al: song.al || song.album || { name: '', id: 0 },
    dt: song.dt || song.duration || 0,
    count: song.count || 0
  };
};

/**
 * 格式化歌曲列表
 * @param items 原始歌曲数据数组
 * @returns 标准化的歌曲数据数组
 */
export const formatSongList = (items: unknown[]): SongResult[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map(formatSongData).filter((song) => song.id);
};

/**
 * 格式化艺术家信息
 * @param artists 原始艺术家数据
 * @returns 格式化的艺术家字符串
 */
export const formatArtists = (artists: unknown): string => {
  if (!artists) return '';

  const artistArray = Array.isArray(artists) ? artists : [artists];
  return artistArray
    .map((artist: any) => artist.name || artist)
    .filter(Boolean)
    .join(', ');
};

/**
 * 格式化专辑信息
 * @param album 原始专辑数据
 * @returns 格式化的专辑名称
 */
export const formatAlbum = (album: unknown): string => {
  if (!album) return '';

  const albumData = album as any;
  return albumData.name || albumData.al?.name || '';
};

/**
 * 格式化图片URL
 * @param picUrl 原始图片URL
 * @param size 图片尺寸
 * @returns 格式化的图片URL
 */
export const formatPicUrl = (picUrl: unknown, size = '200y200'): string => {
  if (!picUrl) return '';

  const url = String(picUrl);
  if (url.includes('?')) {
    return `${url}&param=${size}`;
  }
  return `${url}?param=${size}`;
};

/**
 * 格式化播放时长
 * @param duration 时长（毫秒）
 * @returns 格式化的时长字符串
 */
export const formatDuration = (duration: unknown): string => {
  const ms = Number(duration) || 0;
  const seconds = Math.floor(ms / 1000);
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
  const songData = song as any;
  return songData.fee !== 1 && songData.fee !== 4;
};

/**
 * 格式化播放列表信息
 * @param playlist 原始播放列表数据
 * @returns 格式化的播放列表信息
 */
export const formatPlaylistInfo = (playlist: unknown) => {
  const data = playlist as any;

  return {
    id: data.id || 0,
    name: data.name || '',
    description: data.description || '',
    coverImgUrl: data.coverImgUrl || data.picUrl || '',
    creator: data.creator || null,
    trackCount: data.trackCount || data.trackIds?.length || 0,
    playCount: data.playCount || 0,
    subscribed: data.subscribed || false,
    trackIds: data.trackIds || [],
    tracks: data.tracks || []
  };
};
