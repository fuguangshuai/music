// 重新导出所有类型定义，避免重复
export * from './api-responses';
export * from './music';

// 从common选择性导出，避免冲突
export type { AppConfig, MessageOptions, ProxyConfig } from './common';

// 从enhanced-api-types选择性导出，避免冲突
export type {
  Album,
  Artist,
  EnhancedAlbum,
  EnhancedArtist,
  EnhancedPlaylist,
  EnhancedSong,
  EnhancedUser,
  Playlist,
  Song as SongResult,
  User
} from './enhanced-api-types';

// 从旧的 type/ 目录迁移的类型定义
export interface IData<T> {
  code: number;
  data: T;
  result: T;
}
