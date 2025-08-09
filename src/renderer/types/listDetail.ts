export interface IListDetail {
  code: number;
  relatedVideos?: Record<string, unknown>[];
  playlist: Playlist;
  urls?: Record<string, unknown>[];
  privileges: Privilege[];
  sharedPrivilege?: Record<string, unknown>;
  resEntrance?: Record<string, unknown>;
}

interface Privilege {
  id: number;
  fee: number;
  payed: number;
  realPayed: number;
  st: number;
  pl: number;
  dl: number;
  sp: number;
  cp: number;
  subp: number;
  cs: boolean;
  maxbr: number;
  fl: number;
  pc?: unknown;
  toast: boolean;
  flag: number;
  paidBigBang: boolean;
  preSell: boolean;
  playMaxbr: number;
  downloadMaxbr: number;
  rscl?: unknown;
  freeTrialPrivilege: FreeTrialPrivilege;
  chargeInfoList: ChargeInfoList[];
}

interface ChargeInfoList {
  rate: number;
  chargeUrl?: string;
  chargeMessage?: string;
  chargeType: number;
}

interface FreeTrialPrivilege {
  resConsumable: boolean;
  userConsumable: boolean;
}

export interface Playlist {
  id: number;
  name: string;
  coverImgId: number;
  coverImgUrl: string;
  coverImgId_str: string;
  adType: number;
  userId: number;
  createTime: number;
  status: number;
  opRecommend: boolean;
  highQuality: boolean;
  newImported: boolean;
  updateTime: number;
  trackCount: number;
  specialType: number;
  privacy: number;
  trackUpdateTime: number;
  commentThreadId: string;
  playCount: number;
  trackNumberUpdateTime: number;
  subscribedCount: number;
  cloudTrackCount: number;
  ordered: boolean;
  description: string;
  tags: string[];
  updateFrequency?: string;
  backgroundCoverId: number;
  backgroundCoverUrl?: string;
  titleImage: number;
  titleImageUrl?: string;
  englishTitle?: string;
  officialPlaylistType?: string;
  subscribers: Subscriber[];
  subscribed: boolean;
  creator: Subscriber;
  tracks: Track[];
  videoIds?: number[];
  videos?: Record<string, unknown>[];
  trackIds: TrackId[];
  shareCount: number;
  commentCount: number;
  remixVideo?: Record<string, unknown>;
  sharedUsers?: Record<string, unknown>[];
  historySharedUsers?: Record<string, unknown>[];
}

interface TrackId {
  id: number;
  v: number;
  t: number;
  at: number;
  alg?: string;
  uid: number;
  rcmdReason: string;
}

interface Track {
  name: string;
  id: number;
  pst: number;
  t: number;
  ar: Ar[];
  alia: string[];
  pop: number;
  st: number;
  rt?: string;
  fee: number;
  v: number;
  crbt?: string;
  cf: string;
  al: Al;
  dt: number;
  h: H;
  m: H;
  l?: H;
  a?: Record<string, unknown>;
  cd: string;
  no: number;
  rtUrl?: string;
  ftype: number;
  rtUrls: string[];
  djId: number;
  copyright: number;
  s_id: number;
  mark: number;
  originCoverType: number;
  originSongSimpleData?: Record<string, unknown>;
  single: number;
  noCopyrightRcmd?: Record<string, unknown>;
  mst: number;
  cp: number;
  mv: number;
  rtype: number;
  rurl?: string;
  publishTime: number;
  tns?: string[];
}

interface H {
  br: number;
  fid: number;
  size: number;
  vd: number;
}

interface Al {
  id: number;
  name: string;
  picUrl: string;
  tns: string[];
  pic_str?: string;
  pic: number;
}

interface Ar {
  id: number;
  name: string;
  tns: string[];
  alias: string[];
}

interface Subscriber {
  defaultAvatar: boolean;
  province: number;
  authStatus: number;
  followed: boolean;
  avatarUrl: string;
  accountStatus: number;
  gender: number;
  city: number;
  birthday: number;
  userId: number;
  userType: number;
  nickname: string;
  signature: string;
  description: string;
  detailDescription: string;
  avatarImgId: number;
  backgroundImgId: number;
  backgroundUrl: string;
  authority: number;
  mutual: boolean;
  expertTags?: string[];
  experts?: Record<string, unknown>;
  djStatus: number;
  vipType: number;
  remarkName?: string;
  authenticationTypes: number;
  avatarDetail?: Record<string, unknown>;
  backgroundImgIdStr: string;
  anchor: boolean;
  avatarImgIdStr: string;
  avatarImgId_str: string;
}
