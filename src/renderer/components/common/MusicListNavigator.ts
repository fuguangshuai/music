import { Router } from 'vue-router';

import { useMusicStore } from '@/store/modules/music';

/**
 * 导航到音乐列表页面的通用方法
 * @param router Vue路由实例
 * @param options 导航选项
 */
export function navigateToMusicList(
  router: Router,
  _options: {
    id?: string | number;
    type?: 'album' | 'playlist' | 'dailyRecommend' | string;
    name: string;
    songList: Array<{
      id: string | number;
      name: string;
      artist?: string;
      album?: string;
      duration?: number;
      [key: string]: any;
    }>;
    listInfo?: any;
    canRemove?: boolean;
  }
) {
  const musicStore = useMusicStore();
  const { id, type, name, songList, listInfo, canRemove = false } = _options;

  // 保存数据到状态管理
  musicStore.setCurrentMusicList(songList, name, listInfo as Record<string, unknown>, canRemove);

  // 路由跳转
  if (id) {
    router.push({
      name: 'musicList',
      params: { id },
      query: { type }
    });
  } else {
    router.push({
      name: 'musicList'
    });
  }
}
