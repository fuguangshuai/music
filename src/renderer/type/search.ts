export interface ISearchKeyword {
  code: number;
  message?: string;
  data: SearchKeywordData;
}

interface SearchKeywordData {
  showKeyword: string,
  realkeyword: string,
  searchType: number,
  action: number,
  alg: string,
  gap: number;
  source?: unknown;
  bizQueryInfo: string;
}

export interface IHotSearch {
  code: number,
  data: Datum[],
  message: string;
}

interface Datum {
  searchWord: string,
  score: number,
  content: string,
  source: number,
  iconType: number;
  iconUrl?: string;
  url: string,
  alg: string;
}

export interface ISearchDetail {
  result: Result,
  code: number;
}

interface Result {
  song: Song2,
  code: number,
  mlog: Mlog2,
  playList: PlayList2,
  artist: Artist3,
  album: Album3,
  video: Video2,
  sim_query: Simquery2,
  djRadio: DjRadio2;
  rec_type?: unknown;
  talk: Talk2,
  rec_query: null[],
  user: User2,
  order: string[];
}

interface User2 {
  moreText: string,
  more: boolean,
  users: User[],
  resourceIds: number[];
}

interface User {
  defaultAvatar: boolean,
  province: number,
  authStatus: number,
  followed: boolean,
  avatarUrl: string,
  accountStatus: number,
  gender: number,
  city: number,
  birthday: number,
  userId: number,
  userType: number,
  nickname: string,
  signature: string,
  description: string,
  detailDescription: string,
  avatarImgId: number,
  backgroundImgId: number,
  backgroundUrl: string,
  authority: number,
  mutual: boolean;
  expertTags?: unknown;
  experts?: unknown;
  djStatus: number,
  vipType: number;
  remarkName?: string | null;
  authenticationTypes: number;
  avatarDetail?: unknown;
  anchor: boolean,
  avatarImgIdStr: string,
  backgroundImgIdStr: string,
  avatarImgId_str: string,
  alg: string;
}

interface Talk2 {
  more: boolean,
  talks: Talk[],
  resourceIds: number[];
}

interface Talk {
  talkId: number,
  shareUrl: string,
  talkName: string,
  shareCover: ShareCover,
  showCover: ShareCover,
  talkDes: string,
  follows: number,
  participations: number,
  showParticipations: number,
  status: number;
  time?: number;
  hasTag: boolean,
  alg: string,
  mlogCount: number,
  commentCount: number;
}

interface ShareCover {
  picKey: string,
  nosKey: string,
  width: number,
  height: number,
  url: string;
}

interface DjRadio2 {
  moreText: string,
  djRadios: DjRadio[],
  more: boolean,
  resourceIds: number[];
}

interface DjRadio {
  id: number,
  dj: Dj,
  name: string,
  picUrl: string,
  desc: string,
  subCount: number,
  programCount: number,
  createTime: number,
  categoryId: number,
  category: string,
  radioFeeType: number,
  feeScope: number,
  buyed: boolean;
  videos?: Record<string, unknown>[0];
  finished: boolean,
  underShelf: boolean,
  purchaseCount: number,
  price: number,
  originalPrice: number;
  discountPrice?: number;
  lastProgramCreateTime: number;
  lastProgramName?: string;
  lastProgramId: number,
  picId: number;
  rcmdText?: string;
  hightQuality: boolean,
  whiteList: boolean;
  liveInfo?: Record<string, unknown>;
  playCount: number;
  icon?: string;
  composeVideo: boolean,
  shareCount: number,
  likedCount: number,
  alg: string,
  commentCount: number;
}

interface Dj {
  defaultAvatar: boolean,
  province: number,
  authStatus: number,
  followed: boolean,
  avatarUrl: string,
  accountStatus: number,
  gender: number,
  city: number,
  birthday: number,
  userId: number,
  userType: number,
  nickname: string,
  signature: string,
  description: string,
  detailDescription: string,
  avatarImgId: number,
  backgroundImgId: number,
  backgroundUrl: string,
  authority: number,
  mutual: boolean;
  expertTags?: string[];
  experts?: Record<string, unknown>;
  djStatus: number,
  vipType: number;
  remarkName?: string;
  authenticationTypes: number;
  avatarDetail?: Record<string, unknown>;
  anchor: boolean,
  avatarImgIdStr: string,
  backgroundImgIdStr: string,
  avatarImgId_str: string;
}

interface Simquery2 {
  sim_querys: Simquery[],
  more: boolean;
}

interface Simquery {
  keyword: string,
  alg: string;
}

interface Video2 {
  moreText: string,
  more: boolean,
  videos: Video[],
  resourceIds: number[];
}

interface Video {
  coverUrl: string,
  title: string,
  durationms: number,
  playTime: number,
  type: number,
  creator: Creator2[];
  aliaName?: string;
  transName?: string;
  vid: string;
  markTypes?: number[];
  alg: string;
}

interface Creator2 {
  userId: number,
  userName: string;
}

interface Album3 {
  moreText: string,
  albums: Album2[],
  more: boolean,
  resourceIds: number[];
}

interface Album2 {
  name: string,
  id: number,
  type: string,
  size: number,
  picId: number,
  blurPicUrl: string,
  companyId: number,
  pic: number,
  picUrl: string,
  publishTime: number,
  description: string,
  tags: string;
  company?: string;
  briefDesc: string,
  artist: Artist4;
  songs?: Record<string, unknown>[0];
  alias: string[],
  status: number,
  copyrightId: number,
  commentThreadId: string,
  artists: Artist5[],
  paid: boolean,
  onSale: boolean,
  picId_str: string,
  alg: string;
}

interface Artist5 {
  name: string,
  id: number,
  picId: number,
  img1v1Id: number,
  briefDesc: string,
  picUrl: string,
  img1v1Url: string,
  albumSize: number,
  alias: string[],
  trans: string,
  musicSize: number,
  topicPerson: number,
  img1v1Id_str: string;
}

interface Artist4 {
  name: string,
  id: number,
  picId: number,
  img1v1Id: number,
  briefDesc: string,
  picUrl: string,
  img1v1Url: string,
  albumSize: number,
  alias: string[],
  trans: string,
  musicSize: number,
  topicPerson: number,
  picId_str: string,
  img1v1Id_str: string,
  alia: string[];
}

interface Artist3 {
  moreText: string,
  artists: Artist2[],
  more: boolean,
  resourceIds: number[];
}

interface Artist2 {
  id: number,
  name: string,
  picUrl: string,
  alias: string[],
  albumSize: number,
  picId: number,
  img1v1Url: string,
  img1v1: number,
  mvSize: number,
  followed: boolean,
  alg: string;
  alia?: string[];
  trans?: string;
  accountId?: number;
}

interface PlayList2 {
  moreText: string,
  more: boolean,
  playLists: PlayList[],
  resourceIds: number[];
}

interface PlayList {
  id: number,
  name: string,
  coverImgUrl: string,
  creator: Creator,
  subscribed: boolean,
  trackCount: number,
  userId: number,
  playCount: number,
  bookCount: number,
  specialType: number,
  officialTags: string[],
  description: string,
  highQuality: boolean,
  track: Track,
  alg: string;
}

interface Track {
  name: string,
  id: number,
  position: number,
  alias: string[],
  status: number,
  fee: number,
  copyrightId: number,
  disc: string,
  no: number,
  artists: Artist[],
  album: Album,
  starred: boolean,
  popularity: number,
  score: number,
  starredNum: number,
  duration: number,
  playedNum: number,
  dayPlays: number,
  hearTime: number;
  ringtone?: string;
  crbt?: string;
  audition?: string;
  copyFrom: string,
  commentThreadId: string;
  rtUrl?: string;
  ftype: number,
  rtUrls: string[],
  copyright: number,
  mvid: number,
  rtype: number;
  rurl?: string;
  hMusic: HMusic,
  mMusic: HMusic,
  lMusic: HMusic,
  bMusic: HMusic;
  mp3Url?: string;
  transNames?: string[];
}

interface HMusic {
  name?: string;
  id: number,
  size: number,
  extension: string,
  sr: number,
  dfsId: number,
  bitrate: number,
  playTime: number,
  volumeDelta: number;
}

interface Album {
  name: string,
  id: number,
  type: string,
  size: number,
  picId: number,
  blurPicUrl: string,
  companyId: number,
  pic: number,
  picUrl: string,
  publishTime: number,
  description: string,
  tags: string;
  company?: string;
  briefDesc: string,
  artist: Artist,
  songs: Record<string, unknown>[0];
  alias: string[],
  status: number,
  copyrightId: number,
  commentThreadId: string,
  artists: Artist[];
  picId_str?: string;
}

interface Artist {
  name: string,
  id: number,
  picId: number,
  img1v1Id: number,
  briefDesc: string,
  picUrl: string,
  img1v1Url: string,
  albumSize: number,
  alias: string[],
  trans: string,
  musicSize: number;
}

interface Creator {
  nickname: string,
  userId: number,
  userType: number,
  avatarUrl: string,
  authStatus: number;
  expertTags?: string[];
  experts?: Record<string, unknown>;
}

interface Mlog2 {
  moreText: string,
  more: boolean,
  mlogs: Mlog[],
  resourceIds: number[];
}

interface Mlog {
  id: string,
  type: number,
  mlogBaseDataType: number;
  position?: number;
  resource: Resource,
  alg: string;
  reason?: string;
  matchField: number,
  matchFieldContent: string,
  sameCity: boolean;
}

interface Resource {
  mlogBaseData: MlogBaseData,
  mlogExtVO: MlogExtVO,
  userProfile: UserProfile,
  status: number,
  shareUrl: string;
}

interface UserProfile {
  userId: number,
  nickname: string,
  avatarUrl: string,
  followed: boolean,
  userType: number,
  isAnchor: boolean;
}

interface MlogExtVO {
  likedCount: number,
  commentCount: number,
  playCount: number;
  song?: Record<string, unknown>;
  canCollect?: boolean;
  artistName?: string;
  rcmdInfo?: Record<string, unknown>;
  strongPushMark?: number;
  strongPushIcon?: string;
  specialTag?: string;
  channelTag: string,
  artists: Record<string, unknown>[0];
}

interface MlogBaseData {
  id: string,
  type: number,
  text: string;
  interveneText?: string;
  pubTime: number,
  coverUrl: string,
  coverHeight: number,
  coverWidth: number,
  coverColor: number,
  coverPicKey: string;
  coverDynamicUrl?: string;
  audio?: Record<string, unknown>;
  threadId: string,
  duration: number;
}

interface Song2 {
  moreText: string,
  songs: Song[],
  more: boolean,
  ksongInfos: KsongInfos,
  resourceIds: number[];
}

interface KsongInfos {
  '347230': _347230;
}

interface _347230 {
  androidDownloadUrl: string,
  accompanyId: string,
  deeplinkUrl: string;
}

interface Song {
  name: string,
  id: number,
  pst: number,
  t: number,
  ar: Ar[],
  alia: string[],
  pop: number,
  st: number,
  rt: string,
  fee: number,
  v: number;
  crbt?: string;
  cf: string,
  al: Al,
  dt: number,
  h: H,
  m: H,
  l: H;
  a?: Record<string, unknown>;
  cd: string,
  no: number;
  rtUrl?: string;
  ftype: number,
  rtUrls: string[],
  djId: number,
  copyright: number,
  s_id: number,
  mark: number,
  originCoverType: number;
  originSongSimpleData?: Record<string, unknown>;
  resourceState: boolean,
  version: number,
  single: number;
  noCopyrightRcmd?: Record<string, unknown>;
  rtype: number;
  rurl?: string;
  mst: number,
  cp: number,
  mv: number,
  publishTime: number,
  showRecommend: boolean,
  recommendText: string;
  tns?: string[];
  officialTags: string[],
  privilege: Privilege,
  alg: string,
  specialTags: string[];
}

interface Privilege {
  id: number,
  fee: number,
  payed: number,
  st: number,
  pl: number,
  dl: number,
  sp: number,
  cp: number,
  subp: number,
  cs: boolean,
  maxbr: number,
  fl: number,
  toast: boolean,
  flag: number,
  preSell: boolean,
  playMaxbr: number,
  downloadMaxbr: number;
  rscl?: unknown;
  freeTrialPrivilege: FreeTrialPrivilege,
  chargeInfoList: ChargeInfoList[];
}

interface ChargeInfoList {
  rate: number;
  chargeUrl?: string;
  chargeMessage?: string;
  chargeType: number;
}

interface FreeTrialPrivilege {
  resConsumable: boolean,
  userConsumable: boolean;
}

interface H {
  br: number,
  fid: number,
  size: number,
  vd: number;
}

interface Al {
  id: number,
  name: string,
  picUrl: string,
  tns: string[];
  pic_str?: string;
  pic: number;
}

interface Ar {
  id: number,
  name: string,
  tns: string[],
  alias: string[];
  alia?: string[];
}
