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
export interface PaginatedResponse<T> extends BaseApiResponse<T> {
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

export interface LoginResponse extends BaseApiResponse {
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
  originSongSimpleData?: unknown;
  single: number;
  noCopyrightRcmd?: unknown;
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
  officialPlaylistType?: unknown;
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
    sc?: unknown;
    f?: unknown;
    sr?: unknown;
  }>;
  shareCount: number;
  commentCount: number;
  remixVideo?: unknown;
  sharedUsers?: unknown;
  historySharedUsers?: unknown;
  gradeStatus: string;
  score?: unknown;
  algTags?: unknown;
  trialMode: number;
  displayTags?: unknown;
  playlistType: string;
  bizExtInfo?: unknown;
  distributeTags: unknown[];
  relateResType?: unknown;
  relateResId?: unknown;
  logInfo?: unknown;
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

export interface SearchResponse extends BaseApiResponse {
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
  uf?: unknown;
  payed: number;
  flag: number;
  canExtend: boolean;
  freeTrialInfo?: unknown;
  level: string;
  encodeType: string;
  freeTrialPrivilege: {
    resConsumable: boolean;
    userConsumable: boolean;
    listenType?: unknown;
    cannotListenReason?: unknown;
    playMaxTimeSec?: unknown;
    freeTrialType?: unknown;
  };
  freeTimeTrialPrivilege: {
    resConsumable: boolean;
    userConsumable: boolean;
    type: number;
    remainTime: number;
  };
  urlSource: number;
  rightSource: number;
  podcastCtrp?: unknown;
  effectTypes?: unknown;
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

export interface LyricResponse extends BaseApiResponse {
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
export interface ErrorResponse extends BaseApiResponse {
  code: number;
  message: string;
  data?: null;
}
