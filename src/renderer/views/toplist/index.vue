<template>
  <div class="toplist-page">
    <n-scrollbar class="toplist-container" style="height: 100%" :size="100">
      <div v-loading="loading" class="toplist-list">
        <div
          v-for="(item, index) in topList"
          :key="item.id"
          class="toplist-item"
          :class="setAnimationClass('animate__bounceIn')"
          :style="getItemAnimationDelay(index)"
          @click.stop="openToplist(item)"
        >
          <div class="toplist-item-img">
            <n-image
              class="toplist-item-img-img"
              :src="getImgUrl(item.coverImgUrl, '300y300')"
              width="200"
              height="200"
              lazy
              preview-disabled
            />
            <div class="top">
              <div class="play-count">{{ formatNumber(item.playCount || 0) }}</div>
              <i class="iconfont icon-videofill"></i>
            </div>
          </div>
          <div class="toplist-item-title">{{ item?.name }}</div>
          <div class="toplist-item-desc">{{ item.updateFrequency || '' }}</div>
        </div>
      </div>
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-more">
        <n-spin size="small" />
        <span class="ml-2">加载中...</span>
      </div>
    </n-scrollbar>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { getListDetail, getToplist } from '@/api/list';
import { navigateToMusicList } from '@/components/common/MusicListNavigator';
import type { IListDetail } from '@/types/listDetail';
import { formatNumber, getImgUrl, setAnimationClass, setAnimationDelay } from '@/utils';
import { typeGuards } from '@/utils/typeHelpers';

// 定义榜单项的类型结构
interface ToplistItem {
  id?: number;
  name?: string;
  description?: string;
  coverImgUrl?: string;
  trackCount?: number;
  playCount?: number;
  updateFrequency?: string;
}

// 类型安全的榜单项提取器
const extractToplistItem = (item: Record<string, any>): ToplistItem => {
  return {
    id: item.id || undefined,
    name: item.name || undefined,
    description: item.description || undefined,
    coverImgUrl: item.coverImgUrl || undefined,
    trackCount: item.trackCount || undefined,
    playCount: item.playCount || undefined,
    updateFrequency: item.updateFrequency || undefined
  };
};

defineOptions({
  name: 'Toplist'
});

const topList = ref<ToplistItem[]>([]);

// 计算每个项目的动画延迟
const getItemAnimationDelay = (index: number) => {
  return setAnimationDelay(index, 30);
};

const listDetail = ref<IListDetail | null>();
const listLoading = ref(true);

const router = useRouter();

const openToplist = (item: ToplistItem) => {
  if (!item.id) {
    console.warn('🎵 无效的榜单项，缺少ID', item);
    return;
  }

  listLoading.value = true;

  getListDetail(item.id).then((res) => {
    listDetail.value = res.data;
    listLoading.value = false;

    navigateToMusicList(router, {
      id: item.id!,
      type: 'playlist',
      name: item.name || '',
      songList: (res.data.playlist.tracks || []).map((track: Record<string, any>) => ({
        ...track,
        id: track.id || 0,
        name: track.name || '',
        artist: track.ar?.[0]?.name || '',
        album: track.al?.name || '',
        duration: track.dt || 0
      })),
      listInfo: res.data.playlist,
      canRemove: false
    });
  });
};

const loading = ref(false);
const loadToplist = async () => {
  loading.value = true;
  try {
    const response = await getToplist();
    console.log('🎵 原始API响应:', response);

    // 处理Axios响应对象
    let data: any;
    if (typeGuards.isObject(response)) {
      // 检查是否是Axios响应对象
      if ('data' in response && 'status' in response) {
        // 这是Axios响应对象，提取data字段
        const axiosData = (response as any).data;
        console.log('🎵 Axios响应数据:', axiosData);

        // 检查是否是标准API响应格式
        if (typeGuards.isObject(axiosData) && 'code' in axiosData) {
          if (axiosData.code === 200) {
            data = axiosData.data || axiosData;
          } else {
            throw new Error(`API请求失败，状态码: ${axiosData.code}`);
          }
        } else {
          // 直接使用Axios数据
          data = axiosData;
        }
      } else if ('code' in response && 'data' in response) {
        // 这是标准API响应格式
        if ((response as any).code === 200) {
          data = (response as any).data;
        } else {
          throw new Error(`API请求失败，状态码: ${(response as any).code}`);
        }
      } else {
        // 直接使用响应数据
        data = response;
      }
    } else {
      throw new Error('API响应不是对象格式');
    }

    console.log('🎵 最终处理的数据:', data);

    if (typeGuards.isObject(data) && typeGuards.isArray((data as Record<string, unknown>).list)) {
      const rawList = (data as Record<string, unknown>).list as Record<string, any>[];
      console.log('🎵 榜单列表数据:', rawList);
      topList.value = rawList.map((item) => extractToplistItem(item));
      console.log('🎵 转换后的榜单数据:', topList.value);
    } else {
      topList.value = [];
      console.warn('🎵 榜单数据格式不正确，期望包含list数组', data);
    }
  } catch (error) {
    console.error('加载榜单列表失败:', error);
    topList.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadToplist();
});
</script>

<style lang="scss" scoped>
.toplist-page {
  @apply relative h-full w-full;
  @apply bg-light dark:bg-black;
}

.toplist-container {
  @apply p-4;
}

.toplist-list {
  @apply grid gap-x-8 gap-y-6 pb-28 pr-4;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.toplist-item {
  @apply flex flex-col;

  &-img {
    @apply rounded-xl overflow-hidden relative w-full aspect-square;

    &-img {
      @apply block w-full h-full;
    }

    img {
      @apply absolute top-0 left-0 w-full h-full object-cover rounded-xl;
    }

    &:hover img {
      @apply hover:scale-110 transition-all duration-300 ease-in-out;
    }

    .top {
      @apply absolute w-full h-full top-0 left-0 flex justify-center items-center transition-all duration-300 ease-in-out cursor-pointer;
      @apply bg-black bg-opacity-50;
      opacity: 0;

      i {
        @apply text-5xl text-white transition-all duration-500 ease-in-out opacity-0;
      }

      &:hover {
        @apply opacity-100;
      }

      &:hover i {
        @apply transform scale-150 opacity-100;
      }

      .play-count {
        @apply absolute top-2 left-2 text-sm text-white;
      }
    }
  }

  &-title {
    @apply mt-2 text-sm line-clamp-1 font-bold;
    @apply text-gray-900 dark:text-white;
  }

  &-desc {
    @apply mt-1 text-xs line-clamp-1;
    @apply text-gray-500 dark:text-gray-400;
  }
}

.loading-more {
  @apply flex justify-center items-center py-4;
  @apply text-gray-500 dark:text-gray-400;
}

.mobile {
  .toplist-list {
    @apply px-4 gap-4;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
