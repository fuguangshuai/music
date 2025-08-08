export interface IUserDetail {
  level: number,
  listenSongs: number,
  userPoint: UserPoint,
  mobileSign: boolean,
  pcSign: boolean,
  profile: Profile,
  peopleCanSeeMyPlayRecord: boolean,
  bindings: Binding[],
  adValid: boolean,
  code: number,
  createTime: number,
  createDays: number,
  profileVillageInfo: ProfileVillageInfo;
}

export interface IUserFollow {
  followed: boolean,
  follows: boolean,
  nickname: string,
  avatarUrl: string,
  userId: number,
  gender: number,
  signature: string,
  backgroundUrl: string,
  vipType: number,
  userType: number,
  accountType: number;
}

interface ProfileVillageInfo {
  title: string;
  imageUrl?: string | null;
  targetUrl: string;
}

interface Binding {
  userId: number,
  url: string,
  expiresIn: number,
  refreshTime: number,
  bindingTime: number;
  tokenJsonStr?: string | null;
  expired: boolean,
  id: number,
  type: number;
}

interface Profile {
  avatarDetail?: Record<string, unknown>;
  userId: number,
  avatarImgIdStr: string,
  backgroundImgIdStr: string,
  description: string,
  vipType: number,
  userType: number,
  createTime: number,
  nickname: string,
  avatarUrl: string,
  experts: Record<string, unknown> | null;
  expertTags?: Record<string, unknown> | null;
  djStatus: number,
  accountStatus: number,
  birthday: number,
  gender: number,
  province: number,
  city: number,
  defaultAvatar: boolean,
  avatarImgId: number,
  backgroundImgId: number,
  backgroundUrl: string,
  mutual: boolean,
  followed: boolean;
  remarkName?: string | null;
  authStatus: number,
  detailDescription: string,
  signature: string,
  authority: number,
  followeds: number,
  follows: number,
  blacklist: boolean,
  eventCount: number,
  allSubscribedCount: number,
  playlistBeSubscribedCount: number,
  avatarImgId_str: string;
  followTime?: number;
  followMe: boolean,
  artistIdentity: Record<string, unknown>[0];
  cCount: number,
  sDJPCount: number,
  playlistCount: number,
  sCount: number,
  newFollows: number;
}

interface UserPoint {
  userId: number,
  balance: number,
  updateTime: number,
  version: number,
  status: number,
  blockBalance: number;
}
