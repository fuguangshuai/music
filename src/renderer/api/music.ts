import { cloneDeep } from 'lodash';

import { musicDB } from '@/hooks/MusicHook';
import { isNetworkError } from '@/services/networkMonitor';
import { useSettingsStore, useUserStore } from '@/store';
import type { ILyric } from '@/types/lyric';
import type { SongResult } from '@/types/music';
import { isElectron } from '@/utils';
import request from '@/utils/request';
import requestMusic from '@/utils/request_music';

import { parseFromGDMusic } from './gdmusic';

const { addData, getData, deleteData } = musicDB;

// 获取音乐音质详情
export const getMusicQualityDetail = (id: number) => {
  return request.get('/song/music/detail', { params: { id } });
};

// 根据音乐Id获取音乐播放URl
export const getMusicUrl = async (id: number, isDownloaded: boolean = false) => {
  const userStore = useUserStore();
  const settingStore = useSettingsStore();
  // 判断是否登录
  try {
    if (userStore.user && isDownloaded && userStore.user.vipType !== 0) {
      const url = '/song/download/url/v1';
      const res = await request.get(url, {
        params: {
          id,
          level: settingStore.setData.musicQuality || 'higher',
          cookie: `${localStorage.getItem('token')} os=pc;`
        }
      });

      if (res.data.data.url) {
        return { data: { data: [{ ...res.data.data }] } };
      }
    }
  } catch (error) {
    console.error('error', error);
  }

  return await request.get('/song/url/v1', {
    params: {
      id,
      level: settingStore.setData.musicQuality || 'higher'
    }
  });
};

// 获取歌曲详情
export const getMusicDetail = (ids: Array<number>) => {
  return request.get('/song/detail', { params: { ids: ids.join(', ') } });
};

// 根据音乐Id获取音乐歌词
export const getMusicLrc = async (id: number) => {
  const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000; // 10天的毫秒数

  try {
    // 尝试获取缓存的歌词
    const cachedLyric = await getData('music_lyric', id);
    if (cachedLyric?.createTime && Date.now() - (cachedLyric.createTime as number) < TEN_DAYS_MS) {
      return { ...cachedLyric };
    }

    // 获取新的歌词数据
    const res = await request.get<ILyric>('/lyric', { params: { id } });

    // 只有在成功获取新数据后才删除旧缓存并添加新缓存
    if (res?.data) {
      if (cachedLyric) {
        await deleteData('music_lyric', id);
      }
      addData('music_lyric', { id, data: res.data, createTime: Date.now() });
    }

    return res;
  } catch (error) {
    console.error('获取歌词失败:', error);
    throw error; // 向上抛出错误，让调用者处理
  }
};

/**
 * 从GD音乐台获取音频URL
 * @param id 歌曲ID
 * @param data 歌曲数据
 * @returns 解析结果，失败时返回null
 */
const getGDMusicAudio = async (id: number, data: SongResult) => {
  try {
    const gdResult = await parseFromGDMusic(id, data as unknown as Record<string, unknown>, '999');
    if (gdResult) {
      return gdResult;
    }
  } catch (error) {
    console.error('GD音乐台解析失败:', error);
  }
  return null;
};

/**
 * 使用unblockMusic解析音频URL
 * @param id 歌曲ID
 * @param data 歌曲数据
 * @param sources 音源列表
 * @returns 解析结果
 */
const getUnblockMusicAudio = (id: number, data: SongResult, sources: string[]) => {
  const filteredSources = sources.filter(
    (source) => !['gdmusic', 'stellar', 'cloud'].includes(source)
  );
  console.log(`使用unblockMusic解析，音源:`, filteredSources);
  return window.api.unblockMusic(id, cloneDeep(data), cloneDeep(filteredSources));
};

/**
 * 获取解析后的音乐URL
 * @param id 歌曲ID
 * @param data 歌曲数据
 * @returns 解析结果
 */
export const getParsingMusicUrl = async (id: number, data: SongResult) => {
  const settingStore = useSettingsStore();

  // 如果禁用了音乐解析功能，则直接返回空结果
  if (!settingStore.setData.enableMusicUnblock) {
    return Promise.resolve({ data: { code: 404, _message: '音乐解析功能已禁用' } });
  }

  // 1. 确定使用的音源列表(自定义或全局)
  const songId = String(id);
  const savedSourceStr = localStorage.getItem(`song_source_${songId}`);
  let musicSources: string[] = [];

  try {
    if (savedSourceStr) {
      // 使用自定义音源
      musicSources = JSON.parse(savedSourceStr);
      console.log(`使用歌曲 ${id} 自定义音源:`, musicSources);
    } else {
      // 使用全局音源设置
      musicSources = (settingStore.setData.enabledMusicSources as string[]) || [];
      console.log(`使用全局音源设置:`, musicSources);
      if (isElectron && musicSources.length > 0) {
        return getUnblockMusicAudio(id, data, musicSources);
      }
    }
  } catch (e) {
    console.error('解析音源设置失败，使用全局设置', e);
    musicSources = (settingStore.setData.enabledMusicSources as string[]) || [];
  }

  // 2. 按优先级解析：UnblockMusic → 星辰音乐 → 云端音乐 → GD音乐台
  // 2.1 UnblockMusic解析（优先级最高）
  if (isElectron && musicSources.length > 0) {
    // const unblockSources = musicSources.filter(//   source => ['migu', 'kugou', 'pyncmd'].includes(source)
    // );
    console.log('🎵 使用UnblockMusic解析，音源:', musicSources);
    try {
      const result = await getUnblockMusicAudio(id, data, musicSources);
      if (result) {
        console.log(`🎵 UnblockMusic解析成功 - 歌曲ID: ${id}, 歌曲: ${data.name || '未知'}`);
        return result;
      } else {
        console.log('❌, UnblockMusic解析失败');
      }
    } catch (error) {
      console.log('❌ UnblockMusic解析失败:', error);
    }
  }

  /**
   * 通用音乐解析尝试函数 - 使用指定的API索引
   * @param apiIndex API索引
   * @param apiName API名称（用于日志）
   * @param id 歌曲ID
   * @param data 歌曲元数据
   * @returns axios响应或null
   */
  async function tryParseMusic(apiIndex: number, apiName: string, id: string, data: SongResult) {
    console.log(`🎵 使用${apiName}音乐解析 (API索引: ${apiIndex})`);
    try {
      // 使用指定的API索引，不进行自动切换
      const result =
        apiIndex === 0
          ? await requestMusic(apiIndex).get<unknown>(`?songs=${encodeURIComponent(songId)}`)
          : await requestMusic(apiIndex).get<unknown>('/music', { params: { id } });
      if (apiIndex === 0 && (result.data as any).解锁成功 > 0) {
        result.data = {
          params: {},
          data: {
            size: (result.data as any).成功列表.文件大小 || 0,
            br: (result.data as any).成功列表.音质 || 320000,
            url: (result.data as any).成功列表.播放链接 || '',
            md5: '',
            source:
              (result.data as any).成功列表.音源ID ||
              (result.data as any).成功列表.音源名称 ||
              apiName
          }
        };
      }
      if (result?.data) {
        console.log(
          `🎵 ${apiName}音乐解析成功 - 歌曲ID: ${id}, 歌曲: ${(data as any).name || '未知'}, 音源: ${(result as any).data.data?.source || apiName}`
        );
        return result;
      } else {
        console.log(`❌ ${apiName}音乐解析失败 - 无有效数据`);
      }
    } catch (error) {
      // 根据错误类型提供不同的处理
      if (isNetworkError(error)) {
        console.warn(`🌐 ${apiName}网络连接失败:`, error);
      } else if ((error as any)?.response?.status === 410) {
        console.warn(`⏰ ${apiName}资源已过期:`, error);
      } else {
        console.error(`❌ ${apiName}音乐解析失败:`, error);
      }
    }
    return null;
  }

  // 按用户启用的音源顺序解析，不进行自动切换
  const sourceMap = [
    { key: 'stellar', index: 0, name: '星辰' },
    { key: 'cloud', index: 1, name: '云端' }
  ];

  for (const src of sourceMap) {
    if (musicSources.includes(src.key)) {
      console.log(`🎵 尝试使用用户启用的音源: ${src.name}`);
      const result = await tryParseMusic(src.index, src.name, String(id), data);
      if (result) return result;
    }
  }
  // 2.4 GD音乐台解析（优先级最低）
  if (musicSources.includes('gdmusic')) {
    console.log('🎵, 使用GD音乐台解析');
    try {
      const gdResult = await getGDMusicAudio(id, data);
      if (gdResult) {
        console.log(`🎵 GD音乐台解析成功 - 歌曲ID: ${id}, 歌曲: ${data.name || '未知'}`);
        return gdResult;
      } else {
        console.log('❌, GD音乐台解析失败');
      }
    } catch (error) {
      console.log('❌ GD音乐台解析失败:', error);
    }
  }
  // 所有音源解析失败
  console.log(`❌ 所有音源解析失败 - 歌曲ID: ${id}, 歌曲: ${data.name || '未知'}`);
};

// 收藏歌曲
export const likeSong = (id: number, like: boolean = true) => {
  return request.get('/like', { params: { id, like } });
};

// 获取用户喜欢的音乐列表
export const getLikedList = (uid: number) => {
  return request.get('/likelist', {
    params: { uid, noLogin: true }
  });
};

// 创建歌单
export const createPlaylist = (params: { name: string; privacy: number }) => {
  return request.post('/playlist/create', params);
};

// 添加或删除歌单歌曲
export const updatePlaylistTracks = (params: {
  op: 'add' | 'del';
  pid: number;
  tracks: string;
}) => {
  return request.post('/playlist/tracks', params);
};

/**
 * 根据类型获取列表数据
 * @param type 列表类型 album/playlist
 * @param id 列表ID
 */
export function getMusicListByType(type: string, id: string) {
  if (type === 'album') {
    return getAlbumDetail(id);
  } else if (type === 'playlist') {
    return getPlaylistDetail(id);
  }
  return Promise.reject(new Error('未知列表类型'));
}

/**
 * 获取专辑详情
 * @param id 专辑ID
 */
export function getAlbumDetail(id: string) {
  return request({
    url: '/album',
    method: 'get',
    params: {
      id
    }
  });
}

/**
 * 获取歌单详情
 * @param id 歌单ID
 */
export function getPlaylistDetail(id: string) {
  return request({
    url: '/playlist/detail',
    method: 'get',
    params: {
      id
    }
  });
}

export function subscribePlaylist(params: { t: number; id: number }) {
  return request({
    url: '/playlist/subscribe',
    method: 'post',
    params
  });
}
