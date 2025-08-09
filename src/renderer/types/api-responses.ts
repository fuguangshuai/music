/**
 * API响应类型定义
 * 核心业务类型定义，临时/不稳定API建议使用any
 *
 * 使用原则：
 * ✅ 核心业务数据 - 使用详细类型
 * ✅ 组件Props/Events - 使用详细类型
 * ✅ Store状态 - 使用详细类型
 * 🔄 临时API - 使用any，快速开发
 * 🔄 第三方库 - 使用any，避免过度工程化
 */

import type { StandardApiResponse } from './enhanced-api-types';

// 基础响应结构
/**
 * @deprecated 使用 StandardApiResponse 替代
 * @see StandardApiResponse in enhanced-api-types.ts
 *
 * 迁移指南：
 * - 旧用法: BaseApiResponse<SomeType>
 * - 新用法: StandardApiResponse<SomeType>
 *
 * 此接口将在下个版本中移除
 */
export interface BaseApiResponse<T = unknown> {
  code: number;
  message?: string;
  data?: T;
}

/**
 * 推荐的API响应类型别名
 * 使用StandardApiResponse替代BaseApiResponse
 */
export type RecommendedApiResponse<T> = StandardApiResponse<T>;

// 分页响应结构
export interface PaginatedResponse<T> extends StandardApiResponse<T> {
  total?: number;
  hasMore?: boolean;
  offset?: number;
  limit?: number;
}

// 用户相关类型
export interface UserProfile {
  userId: number;
  nickname: string;
  avatarUrl: string;
  backgroundUrl?: string;
  signature?: string;
  gender: number;
  birthday: number;
  province: number;
  city: number;
  vipType: number;
  userType: number;
  createTime: number;
  followeds: number;
  follows: number;
  playlistCount: number;
  eventCount: number;
  mutual: boolean;
  followed: boolean;
  djStatus: number;
  authStatus: number;
  description?: string;
  detailDescription?: string;
  defaultAvatar: boolean;
  expertTags?: string[];
  remarkName?: string;
  avatarImgId: number;
  backgroundImgId: number;
  avatarImgIdStr: string;
  backgroundImgIdStr: string;
}

export interface LoginResponse extends StandardApiResponse<any> {
  data: {
    code: number;
    account?: {
      id: number;
      userName: string;
      type: number;
      status: number;
      whitelistAuthority: number;
      createTime: number;
      tokenVersion: number;
      ban: number;
      baoyueVersion: number;
      donateVersion: number;
      vipType: number;
      anonimousUser: boolean;
      paidFee: boolean;
    };
    token?: string;
    profile?: UserProfile;
    bindings?: Array<{
      userId: number;
      url: string;
      expired: boolean;
      bindingTime: number;
      tokenJsonStr?: string;
      expiresIn: number;
      refreshTime: number;
      id: number;
      type: number;
    }>;
  };
}

// 音乐相关类型
export interface Artist {
  id: number;
  name: string;
  picUrl?: string;
  alias?: string[];
  briefDesc?: string;
  albumSize?: number;
  musicSize?: number;
  mvSize?: number;
  followed?: boolean;
  trans?: string;
  picId?: number;
  img1v1Url?: string;
  img1v1?: number;
}

export interface Album {
  id: number;
  name: string;
  picUrl?: string;
  artist?: Artist;
  artists?: Artist[];
  publishTime?: number;
  size?: number;
  copyrightId?: number;
  status?: number;
  picId?: number;
  mark?: number;
  transName?: string;
}

export interface Song {
  id: number;
  name: string;
  artists: Artist[];
  album: Album;
  duration: number;
  copyrightId: number;
  status: number;
  alias: string[];
  rtype: number;
  ftype: number;
  mvid: number;
  fee: number;
  rUrl?: string;
  mark: number;
  originCoverType: number;
  originSongSimpleData?: any;
  single: number;
  noCopyrightRcmd?: any;
  rtUrls: string[];
  mst: number;
  cp: number;
  publishTime: number;
  dt: number;
  h?: {
    br: number;
    fid: number;
    size: number;
    vd: number;
  };
  m?: {
    br: number;
    fid: number;
    size: number;
    vd: number;
  };
  l?: {
    br: number;
    fid: number;
    size: number;
    vd: number;
  };
  sq?: {
    br: number;
    fid: number;
    size: number;
    vd: number;
  };
  hr?: {
    br: number;
    fid: number;
    size: number;
    vd: number;
  };
}

export interface Playlist {
  id: number;
  name: string;
  coverImgUrl: string;
  creator: UserProfile;
  subscribed: boolean;
  trackCount: number;
  userId: number;
  playCount: number;
  bookCount: number;
  specialType: number;
  officialPlaylistType?: any;
  anonimous: boolean;
  createTime: number;
  updateTime: number;
  subscribedCount: number;
  cloudTrackCount: number;
  highQuality: boolean;
  privacy: number;
  newImported: boolean;
  adType: number;
  trackUpdateTime: number;
  commentThreadId: string;
  totalDuration: number;
  tracks: Song[];
  trackIds: Array<{
    id: number;
    v: number;
    t: number;
    at: number;
    alg?: string;
    uid: number;
    rcmdReason: string;
    sc?: any;
    f?: any;
    sr?: any;
  }>;
  shareCount: number;
  commentCount: number;
  remixVideo?: any;
  sharedUsers?: any;
  historySharedUsers?: any;
  gradeStatus: string;
  score?: any;
  algTags?: any;
  trialMode: number;
  displayTags?: any;
  playlistType: string;
  bizExtInfo?: any;
  distributeTags: any[];
  relateResType?: any;
  relateResId?: any;
  logInfo?: any;
  description?: string;
  tags: string[];
}

// 搜索相关类型
export interface SearchResult {
  songs?: {
    songs: Song[];
    songCount: number;
  };
  artists?: {
    artists: Artist[];
    artistCount: number;
  };
  albums?: {
    albums: Album[];
    albumCount: number;
  };
  playlists?: {
    playlists: Playlist[];
    playlistCount: number;
  };
}

export interface SearchResponse extends StandardApiResponse<any> {
  data: {
    result: SearchResult;
  };
}

// 歌曲URL相关类型
export interface SongUrl {
  id: number;
  url: string;
  br: number;
  size: number;
  md5: string;
  code: number;
  expi: number;
  type: string;
  gain: number;
  peak: number;
  fee: number;
  uf?: any;
  payed: number;
  flag: number;
  canExtend: boolean;
  freeTrialInfo?: any;
  level: string;
  encodeType: string;
  freeTrialPrivilege: {
    resConsumable: boolean;
    userConsumable: boolean;
    listenType?: any;
    cannotListenReason?: any;
    playMaxTimeSec?: any;
    freeTrialType?: any;
  };
  freeTimeTrialPrivilege: {
    resConsumable: boolean;
    userConsumable: boolean;
    type: number;
    remainTime: number;
  };
  urlSource: number;
  rightSource: number;
  podcastCtrp?: any;
  effectTypes?: any;
  time: number;
}

export interface SongUrlResponse extends BaseApiResponse {
  data: SongUrl[];
}

// 歌词相关类型
export interface LyricUser {
  id: number;
  status: number;
  demand: number;
  userid: number;
  nickname: string;
  uptime: number;
}

export interface Lyric {
  version: number;
  lyric: string;
}

export interface LyricResponse extends StandardApiResponse<any> {
  data: {
    sgc: boolean;
    sfy: boolean;
    qfy: boolean;
    lrc?: Lyric;
    klyric?: Lyric;
    tlyric?: Lyric;
    romalrc?: Lyric;
    code: number;
  };
}

// 通用错误响应
export interface ErrorResponse extends StandardApiResponse<null> {
  code: number;
  message: string;
  data?: null;
}

// 音乐 API 专用响应类型 - 用于批量修复 unknown 类型
export interface MusicApiResponse {
  data: {
    data?: {
      source?: string;
      [key: string]: any;
    };
    size?: number;
    br?: number;
    url?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// 用户 API 响应类型
export interface UserApiResponse {
  data: {
    playlist?: any[];
    [key: string]: any;
  };
  [key: string]: any;
}

// 播放列表 API 响应类型
export interface PlaylistApiResponse {
  data: {
    playlist?: {
      tracks?: any[];
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}
