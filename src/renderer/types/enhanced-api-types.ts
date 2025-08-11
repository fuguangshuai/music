/**
 * 🎯 增强型API类型定义 - 企业级类型安全版本
 * 基于现有API响应结构，提供更精确的类型定义
 *
 * 设计原则：
 * - 核心业务类型：精确定义
 * - 临时/不稳定API：使用UnknownData和JsonValue
 * - 第三方库集成：使用ThirdPartyData
 * - 类型安全优先：避免any类型，使用联合类型和泛型
 */

// 导入基础类型工具
import type { JsonValue, ThirdPartyData, UnknownData } from '../utils/typeHelpers';

// ==================== 基础响应结构 ====================

/**
 * 标准API响应结构
 */
/**
 * 标准API响应接口
 *
 * @template T 响应数据的类型
 *
 * @example
 * ```typescript
 * // 歌曲API响应
 * type SongResponse = StandardApiResponse<EnhancedSong>;
 *
 * // 搜索API响应
 * type SearchResponse = StandardApiResponse<EnhancedSearchResult>;
 * ```
 *
 * @since v4.11.0
 * @see {@link https://docs.example.com/api-response} API响应规范
 */
export interface StandardApiResponse<T> {
  /** 响应状态码，200表示成功 */
  code: number;
  /** 响应消息，通常在错误时提供详细信息 */
  message?: string;
  /** 响应数据，具体类型由泛型T决定 */
  data?: T;
  /** 响应时间戳，Unix时间戳格式 */
  timestamp?: number;
}

/**
 * 分页响应结构
 */
export interface PaginatedApiResponse<T> extends StandardApiResponse<T[]> {
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

// ==================== 音乐相关类型 ====================

/**
 * 艺术家信息
 */
export interface EnhancedArtist {
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
}

/**
 * 专辑信息
 */
export interface EnhancedAlbum {
  id: number;
  name: string;
  picUrl?: string;
  artist?: EnhancedArtist;
  artists?: EnhancedArtist[];
  publishTime?: number;
  size?: number;
  status?: number;
  copyrightId?: number;
  commentThreadId?: string;
  blurPicUrl?: string;
  companyId?: number;
  pic?: number;
  tags?: string;
  company?: string;
  briefDesc?: string;
  description?: string;
  subType?: string;
  alias?: string[];
  transName?: string;
}

/**
 * 歌曲信息（增强版）
 */
export interface EnhancedSong {
  id: number;
  name: string;
  artists: EnhancedArtist[];
  album: EnhancedAlbum;
  duration: number;
  copyrightId?: number;
  status?: number;
  alias?: string[];
  rtype?: number;
  ftype?: number;
  mvid?: number;
  fee?: number;
  rUrl?: string | null;
  mark?: number;
  originCoverType?: number;
  originSongSimpleData?: ThirdPartyData; // 复杂嵌套结构，使用ThirdPartyData
  tagPicList?: JsonValue[]; // 标签图片列表，结构可能变化
  resourceState?: boolean;
  version?: number;
  songJumpInfo?: UnknownData; // 跳转信息，结构不稳定
  entertainmentTags?: ThirdPartyData; // 娱乐标签，第三方数据
  awardTags?: ThirdPartyData; // 奖项标签，第三方数据
  single?: number;
  noCopyrightRcmd?: ThirdPartyData; // 版权推荐，结构复杂
  mst?: number;
  cp?: number;
  mv?: number;
  publishTime?: number;
  tns?: string[];
  // 播放相关
  playMusicUrl?: string;
  rtUrl?: string | null;
  rtUrls?: string[];
  // 扩展信息
  transName?: string | null;
  count?: number;
}

/**
 * 播放列表信息
 */
export interface EnhancedPlaylist {
  id: number;
  name: string;
  coverImgUrl?: string;
  creator?: {
    userId: number;
    nickname: string;
    avatarUrl?: string;
    signature?: string;
    userType?: number;
    vipType?: number;
  };
  description?: string;
  tags?: string[];
  playCount?: number;
  trackCount?: number;
  subscribedCount?: number;
  shareCount?: number;
  commentCount?: number;
  subscribed?: boolean;
  createTime?: number;
  updateTime?: number;
  userId?: number;
  status?: number;
  privacy?: number;
  newImported?: boolean;
  specialType?: number;
  anonimous?: boolean;
  coverStatus?: number;
  recommendInfo?: ThirdPartyData; // 推荐信息，结构可能变化
  relateResType?: ThirdPartyData; // 相关资源类型，第三方数据
  subscribers?: ThirdPartyData[]; // 订阅者列表，结构复杂
  tracks?: EnhancedSong[];
  trackIds?: Array<{
    id: number;
    v?: number;
    t?: number;
    at?: number;
    alg?: string;
    uid?: number;
    rcmdReason?: string;
    sc?: UnknownData; // 来源信息，结构不稳定
  }>;
}

// ==================== 用户相关类型 ====================

/**
 * 用户信息（增强版）
 */
export interface EnhancedUser {
  userId: number;
  nickname: string;
  avatarUrl?: string;
  backgroundUrl?: string;
  signature?: string;
  gender?: number;
  birthday?: number;
  province?: number;
  city?: number;
  userType?: number;
  vipType?: number;
  accountStatus?: number;
  authStatus?: number;
  djStatus?: number;
  defaultAvatar?: boolean;
  expertTags?: ThirdPartyData; // 专家标签，第三方数据
  experts?: ThirdPartyData; // 专家信息，结构复杂
  mutual?: boolean;
  followed?: boolean;
  authority?: number;
  description?: string;
  detailDescription?: string;
  avatarImgId?: number;
  backgroundImgId?: number;
  avatarImgIdStr?: string;
  backgroundImgIdStr?: string;
  anchor?: boolean;
  // 统计信息
  followeds?: number;
  follows?: number;
  playlistCount?: number;
  playlistBeSubscribedCount?: number;
  // 扩展信息（可能来自第三方）
  profile?: ThirdPartyData; // 档案信息，结构可能变化
  level?: number;
  listenSongs?: number;
  createTime?: number;
  createDays?: number;
  pcSign?: boolean;
  mobileSign?: boolean;
}

/**
 * 登录响应
 */
export interface EnhancedLoginResponse {
  code: number;
  message?: string;
  loginType?: number;
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
    viptypeVersion: number;
    anonimousUser: boolean;
    uninitialized: boolean;
  };
  token?: string;
  profile?: EnhancedUser;
  bindings?: ThirdPartyData[]; // 绑定信息，第三方数据
  cookie?: string;
}

// ==================== 搜索相关类型 ====================

/**
 * 搜索结果
 */
export interface EnhancedSearchResult {
  songs?: {
    songs: EnhancedSong[];
    songCount: number;
    hasMore: boolean;
  };
  artists?: {
    artists: EnhancedArtist[];
    artistCount: number;
    hasMore: boolean;
  };
  albums?: {
    albums: EnhancedAlbum[];
    albumCount: number;
    hasMore: boolean;
  };
  playlists?: {
    playlists: EnhancedPlaylist[];
    playlistCount: number;
    hasMore: boolean;
  };
  mvs?: {
    mvs: ThirdPartyData[]; // MV结构复杂，使用ThirdPartyData
    mvCount: number;
    hasMore: boolean;
  };
  djRadios?: {
    djRadios: ThirdPartyData[]; // 电台结构复杂，使用ThirdPartyData
    djRadiosCount: number;
    hasMore: boolean;
  };
  users?: {
    users: EnhancedUser[];
    userCount: number;
    hasMore: boolean;
  };
  order?: string[];
}

// ==================== API响应类型 ====================

/**
 * 歌曲详情响应
 */
export type SongDetailResponse = StandardApiResponse<{
  songs: EnhancedSong[];
  privileges: ThirdPartyData[]; // 权限信息，结构复杂
}>;

/**
 * 歌曲URL响应
 */
export type SongUrlResponse = StandardApiResponse<{
  data: Array<{
    id: number;
    url: string | null;
    br: number;
    size: number;
    md5: string;
    code: number;
    expi: number;
    type: string;
    gain: number;
    fee: number;
    uf: UnknownData; // 用户标识，结构不稳定
    payed: number;
    flag: number;
    canExtend: boolean;
    freeTrialInfo: ThirdPartyData | null; // 试听信息，第三方数据
    level: string;
    encodeType: string;
    freeTrialPrivilege: ThirdPartyData; // 试听权限，结构复杂
    freeTimeTrialPrivilege: ThirdPartyData; // 时长试听权限，结构复杂
    urlSource: number;
    rightSource: number;
    podcastCtrp: ThirdPartyData | null; // 播客控制，第三方数据
    effectTypes: UnknownData | null; // 音效类型，结构可能变化
    time: number;
  }>;
}>;

/**
 * 搜索响应
 */
export type SearchResponse = StandardApiResponse<{
  result: EnhancedSearchResult;
}>;

/**
 * 用户播放记录响应
 */
export type UserRecordResponse = StandardApiResponse<{
  weekData?: Array<{
    song: EnhancedSong;
    playCount: number;
    score: number;
  }>;
  allData?: Array<{
    song: EnhancedSong;
    playCount: number;
    score: number;
  }>;
}>;

// ==================== 导出类型别名 ====================

/**
 * 常用类型别名
 */
export type Song = EnhancedSong;
export type Artist = EnhancedArtist;
export type Album = EnhancedAlbum;
export type Playlist = EnhancedPlaylist;
export type User = EnhancedUser;
export type SearchResult = EnhancedSearchResult;
export type LoginResponse = EnhancedLoginResponse;

/**
 * API响应类型别名
 */
export type ApiResponse<T = any> = StandardApiResponse<T>;
export type PaginatedResponse<T> = PaginatedApiResponse<T>;
