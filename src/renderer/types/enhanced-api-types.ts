/**
 * 🎯 增强型API类型定义
 * 基于现有API响应结构，提供更精确的类型定义
 *
 * 设计原则：
 * - 核心业务类型：精确定义
 * - 临时/不稳定API：使用SafeAny
 * - 第三方库集成：使用ThirdPartyData
 */

// 导入基础类型工具
import type { SafeAny } from '../utils/typeHelpers';

// ==================== 基础响应结构 ====================

/**
 * 标准API响应结构
 */
export interface StandardApiResponse<T = unknown> {
  code: number;
  message?: string;
  data?: T;
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
  originSongSimpleData?: SafeAny; // 复杂嵌套结构，使用SafeAny
  tagPicList?: SafeAny; // 标签图片列表，结构可能变化
  resourceState?: boolean;
  version?: number;
  songJumpInfo?: SafeAny; // 跳转信息，结构不稳定
  entertainmentTags?: SafeAny; // 娱乐标签，第三方数据
  awardTags?: SafeAny; // 奖项标签，第三方数据
  single?: number;
  noCopyrightRcmd?: SafeAny; // 版权推荐，结构复杂
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
  recommendInfo?: SafeAny; // 推荐信息，结构可能变化
  relateResType?: SafeAny; // 相关资源类型，第三方数据
  subscribers?: SafeAny[]; // 订阅者列表，结构复杂
  tracks?: EnhancedSong[];
  trackIds?: Array<{
    id: number;
    v?: number;
    t?: number;
    at?: number;
    alg?: string;
    uid?: number;
    rcmdReason?: string;
    sc?: SafeAny; // 来源信息，结构不稳定
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
  expertTags?: SafeAny; // 专家标签，第三方数据
  experts?: SafeAny; // 专家信息，结构复杂
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
  profile?: SafeAny; // 档案信息，结构可能变化
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
  bindings?: SafeAny[]; // 绑定信息，第三方数据
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
    mvs: SafeAny[]; // MV结构复杂，使用SafeAny,
    mvCount: number;
    hasMore: boolean;
  };
  djRadios?: {
    djRadios: SafeAny[]; // 电台结构复杂，使用SafeAny,
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
  privileges: SafeAny[]; // 权限信息，结构复杂
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
    uf: SafeAny; // 用户标识，结构不稳定,
    payed: number;
    flag: number;
    canExtend: boolean;
    freeTrialInfo: SafeAny | null; // 试听信息，第三方数据,
    level: string;
    encodeType: string;
    freeTrialPrivilege: SafeAny; // 试听权限，结构复杂,
    freeTimeTrialPrivilege: SafeAny; // 时长试听权限，结构复杂,
    urlSource: number;
    rightSource: number;
    podcastCtrp: SafeAny | null; // 播客控制，第三方数据,
    effectTypes: SafeAny | null; // 音效类型，结构可能变化,
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
export type ApiResponse<T = unknown> = StandardApiResponse<T>;
export type PaginatedResponse<T> = PaginatedApiResponse<T>;
