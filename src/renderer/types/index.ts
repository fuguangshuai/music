// 音乐相关类型定义
export interface Artist {
  id: number;
  name: string;
  picUrl?: string;
  alias?: string[];
}

export interface Album {
  id: number;
  name: string;
  picUrl?: string;
  artist?: Artist;
  publishTime?: number;
}

export interface SongResult {
  id: number;
  name: string;
  picUrl: string;
  ar: Artist[];
  al: Album;
  dt?: number;
  mv?: number;
  fee?: number;
  playMusicUrl?: string;
  lyric?: ILyric;
  song?: {
    artists?: Artist[];
    album?: Album;
  };
  count?: number;
  source?: string;
}

export interface ILyric {
  time: number;
  text: string;
}

export interface Track {
  [key: string]: unknown;
  id: string | number;
  name: string;
  artist?: string;
  album?: string;
  duration?: number;
  ar?: Artist[];
  al?: Album;
  artists?: Artist[];
  picUrl?: string;
}

// 推荐项目类型
export interface IRecommendItem {
  id: number;
  name: string;
  picUrl?: string;
  playCount?: number;
  description?: string;
  creator?: {
    nickname: string;
    avatarUrl: string;
  };
}

// 搜索结果类型
export interface SearchResult {
  songs?: SongResult[];
  albums?: Album[];
  artists?: Artist[];
  playlists?: IRecommendItem[];
  mvs?: any[];
}

// 播放列表信息类型
export interface PlaylistInfo {
  id: number;
  name: string;
  description?: string;
  coverImgUrl?: string;
  trackIds?: Array<{ id: number }>;
  creator?: {
    nickname: string;
    avatarUrl: string;
  };
  subscribed?: boolean;
  tracks?: Track[];
}

// 用户信息类型
export interface UserProfile {
  userType: number;
  accountType: number;
  nickname: string;
  avatarUrl: string;
}

// 默认导出所有类型 - 避免重复导出冲突
