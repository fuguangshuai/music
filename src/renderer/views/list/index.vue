<template>
  <div class="list-page">
    <!-- 修改歌单分类部分 -->
    <div class="play-list-type">
      <n-scrollbar ref="scrollbarRef" x-scrollable>
        <div class="categories-wrapper" @wheel.passive="handleWheel">
          <span
            v-for="(item, index) in playlistCategory?.sub"
            :key="item.name"
            class="play-list-type-item"
            :class="[setAnimationClass('animate__bounceIn'), { active: currentType === item.name }]"
            :style="getAnimationDelay(index)"
            @click="handleClickPlaylistType(item.name)"
          >
            {{ item?.name }}
          </span>
        </div>
      </n-scrollbar>
    </div>
    <!-- 歌单列表 -->
    <n-scrollbar
      class="recommend"
      style="height: calc(100% - 55px)"
      :size="100"
      @scroll="handleScroll"
    >
      <div v-loading="loading" class="recommend-list">
        <div
          v-for="(item, index) in recommendList"
          :key="item.id"
          class="recommend-item"
          :class="setAnimationClass('animate__bounceIn')"
          :style="getItemAnimationDelay(index)"
          @click.stop="openPlaylist(item)"
        >
          <div class="recommend-item-img">
            <n-image
              class="recommend-item-img-img"
              :src="getImgUrl(item.picUrl || item.coverImgUrl, '300y300')"
              width="200"
              height="200"
              lazy
              preview-disabled
            />
            <div class="top">
              <div class="play-count">{{ formatNumber(item.playCount) }}</div>
              <i class="iconfont icon-videofill"></i>
            </div>
          </div>
          <div class="recommend-item-title">{{ item?.name }}</div>
        </div>
      </div>
      <!-- 加载状态 -->
      <div v-if="isLoadingMore" class="loading-more">
        <n-spin size="small" />
        <span class="ml-2">加载中...</span>
      </div>
      <div v-if="!hasMore && recommendList.length > 0" class="no-more">没有更多了</div>
    </n-scrollbar>
  </div>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router';

import { getPlaylistCategory } from '@/api/home';
import { getListByCat, getListDetail } from '@/api/list';
import { navigateToMusicList } from '@/components/common/MusicListNavigator';
import type { IRecommendItem } from '@/types/list';
import type { IListDetail } from '@/types/listDetail';
import type { IPlayListSort } from '@/types/playlist';
import { formatNumber, getImgUrl, setAnimationClass, setAnimationDelay } from '@/utils';
import { typeGuards } from '@/utils/typeHelpers';

// 定义播放列表项的类型结构
interface PlaylistItem {
  id?: number;
  name?: string;
  description?: string;
  coverImgUrl?: string;
  trackCount?: number;
}

// 类型安全的播放列表项提取器
const extractPlaylistItem = (item: unknown): PlaylistItem => {
  if (!typeGuards.isObject(item)) {
    return {};
  }

  const obj = item as Record<string, unknown>;
  return {
    id: typeGuards.isNumber(obj.id) ? obj.id : undefined,
    name: typeGuards.isString(obj.name) ? obj.name : undefined,
    description: typeGuards.isString(obj.description) ? obj.description : undefined,
    coverImgUrl: typeGuards.isString(obj.coverImgUrl) ? obj.coverImgUrl : undefined,
    trackCount: typeGuards.isNumber(obj.trackCount) ? obj.trackCount : undefined
  };
};

defineOptions({
  name: 'List'
});

const TOTAL_ITEMS = 42; // 每页数量

const recommendList = ref<any[]>([]);
const page = ref(0);
const hasMore = ref(true);
const isLoadingMore = ref(false);

// 计算每个项目的动画延迟
const getItemAnimationDelay = (index: number) => {
  // 确保index为非负整数
  const safeIndex = Math.max(0, Math.floor(index));
  const currentPageIndex = safeIndex % TOTAL_ITEMS;

  // 限制延迟值在合理范围内，直接返回CSS样式字符串
  return setAnimationDelay(currentPageIndex, 30);
};

const recommendItem = ref<IRecommendItem | null>();
const listDetail = ref<IListDetail | null>();
const listLoading = ref(true);

const router = useRouter();

const openPlaylist = (item: unknown) => {
  const playlistItem = extractPlaylistItem(item);

  if (!playlistItem.id) {
    console.warn('🎵 无效的播放列表项，缺少ID', item);
    return;
  }

  recommendItem.value = item as IRecommendItem;
  listLoading.value = true;

  getListDetail(playlistItem.id).then((res) => {
    listDetail.value = res.data;
    listLoading.value = false;

    navigateToMusicList(router, {
      id: playlistItem.id!,
      type: 'playlist',
      name: playlistItem.name || '',
      songList: (res.data.playlist.tracks || []).map((track: unknown) => {
        const trackObj = track as Record<string, unknown>;
        const arArray = trackObj.ar as Array<Record<string, unknown>> | undefined;
        const alObj = trackObj.al as Record<string, unknown> | undefined;

        return {
          ...trackObj,
          id: (trackObj.id as string | number) || 0,
          name: (trackObj.name as string) || '',
          artist: (arArray?.[0]?.name as string) || '',
          album: (alObj?.name as string) || '',
          duration: (trackObj.dt as number) || 0
        };
      }),
      listInfo: res.data.playlist,
      canRemove: false
    });
  });
};

const route = useRoute();
const listTitle = ref(route.query.type || '歌单列表');

const loading = ref(false);
const loadList = async (type: string, isLoadMore = false) => {
  if (!hasMore.value && isLoadMore) return;
  if (isLoadMore) {
    isLoadingMore.value = true;
  } else {
    loading.value = true;
    page.value = 0;
    recommendList.value = [];
  }

  try {
    const params = {
      cat: type === '每日推荐' ? '' : type,
      limit: TOTAL_ITEMS,
      offset: page.value * TOTAL_ITEMS
    };
    const { data } = await getListByCat(params);
    if (isLoadMore) {
      recommendList.value.push(...data.playlists);
    } else {
      recommendList.value = data.playlists;
    }
    hasMore.value = data.more;
    page.value++;
  } catch (error) {
    console.error('加载歌单列表失败:', error);
  } finally {
    loading.value = false;
    isLoadingMore.value = false;
  }
};

// 监听滚动事件
const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  if (!target) return;

  const { scrollTop, scrollHeight, clientHeight } = target;
  // 距离底部100px时加载更多
  if (scrollTop + clientHeight >= scrollHeight - 100 && !isLoadingMore.value && hasMore.value) {
    loadList(currentType.value, true);
  }
};

// 添加歌单分类相关的代码
const playlistCategory = ref<IPlayListSort>();
const currentType = ref((route.query.type as string) || '每日推荐');

const getAnimationDelay = computed(() => {
  return (index: number) => setAnimationDelay(index, 30);
});

// 加载歌单分类
const loadPlaylistCategory = async () => {
  const { data } = await getPlaylistCategory();
  playlistCategory.value = {
    ...data,
    sub: [
      {
        name: '每日推荐',
        category: 0
      },
      ...data.sub
    ]
  };
};

const handleClickPlaylistType = (type: string) => {
  currentType.value = type;
  listTitle.value = type;
  loading.value = true;
  loadList(type);
};

const scrollbarRef = ref();

const handleWheel = (e: WheelEvent) => {
  const scrollbar = scrollbarRef.value;
  if (scrollbar) {
    const delta = e.deltaY || e.detail;
    scrollbar.scrollBy({ left: delta });
  }
};

onMounted(() => {
  loadPlaylistCategory(); // 添加加载歌单分类
  currentType.value = (route.query.type as string) || currentType.value;
  loadList(currentType.value);
});

watch(
  () => route.query,
  async (newParams) => {
    if (newParams.type) {
      recommendList.value = [];
      listTitle.value = newParams.type || '歌单列表';
      currentType.value = newParams.type as string;
      loading.value = true;
      loadList(newParams.type as string);
    }
  }
);
</script>

<style lang="scss" scoped>
.list-page {
  @apply relative h-full w-full;
  @apply bg-light dark:bg-black;
}

.recommend {
  &-title {
    @apply text-lg font-bold pb-2;
    @apply text-gray-900 dark:text-white;
  }

  &-list {
    @apply grid gap-x-8 gap-y-6 pb-28 pr-4;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  &-item {
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
      @apply mt-2 text-sm line-clamp-1;
      @apply text-gray-900 dark:text-white;
    }
  }
}

.loading-more {
  @apply flex justify-center items-center py-4;
  @apply text-gray-500 dark:text-gray-400;
}

.no-more {
  @apply text-center py-4;
  @apply text-gray-500 dark:text-gray-400;
}

.mobile {
  .recommend-title {
    @apply text-xl font-bold px-4;
  }

  .recommend-list {
    @apply px-4 gap-4;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

// 添加歌单分类样式
.play-list-type {
  .categories-wrapper {
    @apply flex items-center py-2;
    white-space: nowrap;
  }

  &-item {
    @apply py-2 px-3 mr-3 inline-block rounded-xl cursor-pointer transition-all duration-300;
    @apply bg-light dark:bg-black text-gray-900 dark:text-white;
    @apply border border-gray-200 dark:border-gray-700;

    &:hover {
      @apply bg-green-50 dark:bg-green-900;
    }

    &.active {
      @apply bg-green-500 border-green-500 text-white;
    }
  }
}

.mobile {
  .play-list-type {
    @apply mx-0 w-full;
  }
  .categories-wrapper {
    @apply pl-4;
  }
}
</style>
