<!--
  🦴 智能骨架屏UI组件
  提供多种预设的骨架屏模式，减少加载时的视觉跳跃
-->
<template>
  <div class="skeleton-container" :class="containerClass">
    <!-- 歌曲列表骨架屏 -->
    <template v-if="type === 'song-list'">
      <div v-for="i in count" :key="i" class="skeleton-song-item">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-content">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-subtitle"></div>
        </div>
        <div class="skeleton-actions">
          <div class="skeleton-button"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
    </template>

    <!-- 专辑/歌单卡片骨架屏 -->
    <template v-else-if="type === 'card-grid'">
      <div class="skeleton-grid">
        <div v-for="i in count" :key="i" class="skeleton-card">
          <div class="skeleton-card-image"></div>
          <div class="skeleton-card-content">
            <div class="skeleton-line skeleton-card-title"></div>
            <div class="skeleton-line skeleton-card-subtitle"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- 用户信息骨架屏 -->
    <template v-else-if="type === 'user-profile'">
      <div class="skeleton-profile">
        <div class="skeleton-profile-header">
          <div class="skeleton-avatar-large"></div>
          <div class="skeleton-profile-info">
            <div class="skeleton-line skeleton-username"></div>
            <div class="skeleton-line skeleton-user-desc"></div>
            <div class="skeleton-line skeleton-user-stats"></div>
          </div>
        </div>
        <div class="skeleton-profile-content">
          <div v-for="i in 3" :key="i" class="skeleton-line skeleton-content-line"></div>
        </div>
      </div>
    </template>

    <!-- 歌词骨架屏 -->
    <template v-else-if="type === 'lyrics'">
      <div class="skeleton-lyrics">
        <div v-for="i in count" :key="i" class="skeleton-lyric-line" :style="getLyricLineStyle(i)"></div>
      </div>
    </template>

    <!-- 播放器骨架屏 -->
    <template v-else-if="type === 'player'">
      <div class="skeleton-player">
        <div class="skeleton-player-cover"></div>
        <div class="skeleton-player-info">
          <div class="skeleton-line skeleton-song-name"></div>
          <div class="skeleton-line skeleton-artist-name"></div>
        </div>
        <div class="skeleton-player-controls">
          <div v-for="i in 5" :key="i" class="skeleton-control-button"></div>
        </div>
      </div>
    </template>

    <!-- 通用文本骨架屏 -->
    <template v-else>
      <div class="skeleton-text">
        <div v-for="i in count" :key="i" class="skeleton-line" :style="getTextLineStyle(i)"></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// 骨架屏类型
type SkeletonType = 'song-list' | 'card-grid' | 'user-profile' | 'lyrics' | 'player' | 'text';

// 组件属性
interface Props {
  type?: SkeletonType;
  count?: number;
  animated?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  rounded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  count: 3,
  animated: true,
  theme: 'auto',
  rounded: true
});

// 容器样式类
const containerClass = computed(() => {
  return [
    `skeleton-${props.theme}`,
    {
      'skeleton-animated': props.animated,
      'skeleton-rounded': props.rounded
    }
  ];
});

// 获取歌词行样式
const getLyricLineStyle = (index: number) => {
  const widths = ['85%', '92%', '78%', '88%', '95%', '82%'];
  return {
    width: widths[index % widths.length],
    animationDelay: `${index * 0.1}s`
  };
};

// 获取文本行样式
const getTextLineStyle = (index: number) => {
  const widths = ['100%', '85%', '92%'];
  return {
    width: widths[index % widths.length],
    animationDelay: `${index * 0.1}s`
  };
};
</script>

<style lang="scss" scoped>
.skeleton-container {
  @apply w-full;
}

/* 基础骨架屏样式 */
.skeleton-line {
  @apply h-4 rounded;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  margin-bottom: 8px;
}

.skeleton-avatar {
  @apply w-12 h-12 rounded-full;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
}

.skeleton-avatar-large {
  @apply w-20 h-20 rounded-full;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
}

.skeleton-button {
  @apply w-8 h-8 rounded;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  margin-left: 8px;
}

/* 动画效果 */
.skeleton-animated {
  .skeleton-line,
  .skeleton-avatar,
  .skeleton-avatar-large,
  .skeleton-button,
  .skeleton-card-image,
  .skeleton-player-cover,
  .skeleton-control-button {
    animation: skeleton-loading 1.5s ease-in-out infinite;
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 主题样式 */
.skeleton-light {
  .skeleton-line,
  .skeleton-avatar,
  .skeleton-avatar-large,
  .skeleton-button,
  .skeleton-card-image,
  .skeleton-player-cover,
  .skeleton-control-button {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
  }
}

.skeleton-dark {
  .skeleton-line,
  .skeleton-avatar,
  .skeleton-avatar-large,
  .skeleton-button,
  .skeleton-card-image,
  .skeleton-player-cover,
  .skeleton-control-button {
    background: linear-gradient(90deg, #2a2a2a 25%, #1a1a1a 50%, #2a2a2a 75%);
    background-size: 200% 100%;
  }
}

.skeleton-auto {
  .skeleton-line,
  .skeleton-avatar,
  .skeleton-avatar-large,
  .skeleton-button,
  .skeleton-card-image,
  .skeleton-player-cover,
  .skeleton-control-button {
    @apply bg-gray-200 dark:bg-gray-700;
    background: linear-gradient(90deg, 
      theme('colors.gray.200') 25%, 
      theme('colors.gray.300') 50%, 
      theme('colors.gray.200') 75%
    );
    
    @media (prefers-color-scheme: dark) {
      background: linear-gradient(90deg, 
        theme('colors.gray.700') 25%, 
        theme('colors.gray.600') 50%, 
        theme('colors.gray.700') 75%
      );
    }
    
    background-size: 200% 100%;
  }
}

/* 歌曲列表骨架屏 */
.skeleton-song-item {
  @apply flex items-center p-3 mb-2;
  
  .skeleton-content {
    @apply flex-1 ml-3;
    
    .skeleton-title {
      @apply h-5 mb-2;
      width: 60%;
    }
    
    .skeleton-subtitle {
      @apply h-4;
      width: 40%;
    }
  }
  
  .skeleton-actions {
    @apply flex items-center;
  }
}

/* 卡片网格骨架屏 */
.skeleton-grid {
  @apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4;
}

.skeleton-card {
  @apply flex flex-col;
  
  .skeleton-card-image {
    @apply w-full aspect-square rounded-lg mb-3;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
  }
  
  .skeleton-card-content {
    .skeleton-card-title {
      @apply h-4 mb-2;
      width: 80%;
    }
    
    .skeleton-card-subtitle {
      @apply h-3;
      width: 60%;
    }
  }
}

/* 用户信息骨架屏 */
.skeleton-profile {
  .skeleton-profile-header {
    @apply flex items-center mb-6;
    
    .skeleton-profile-info {
      @apply ml-4 flex-1;
      
      .skeleton-username {
        @apply h-6 mb-2;
        width: 40%;
      }
      
      .skeleton-user-desc {
        @apply h-4 mb-2;
        width: 60%;
      }
      
      .skeleton-user-stats {
        @apply h-4;
        width: 50%;
      }
    }
  }
  
  .skeleton-profile-content {
    .skeleton-content-line {
      @apply h-4 mb-3;
      
      &:last-child {
        width: 70%;
      }
    }
  }
}

/* 歌词骨架屏 */
.skeleton-lyrics {
  @apply text-center py-8;
  
  .skeleton-lyric-line {
    @apply h-6 mx-auto mb-4 rounded;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
  }
}

/* 播放器骨架屏 */
.skeleton-player {
  @apply flex items-center p-4;
  
  .skeleton-player-cover {
    @apply w-16 h-16 rounded-lg;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
  }
  
  .skeleton-player-info {
    @apply flex-1 ml-4;
    
    .skeleton-song-name {
      @apply h-5 mb-2;
      width: 70%;
    }
    
    .skeleton-artist-name {
      @apply h-4;
      width: 50%;
    }
  }
  
  .skeleton-player-controls {
    @apply flex items-center;
    
    .skeleton-control-button {
      @apply w-10 h-10 rounded-full ml-2;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
    }
  }
}

/* 圆角样式 */
.skeleton-rounded {
  .skeleton-line,
  .skeleton-button {
    @apply rounded-lg;
  }
  
  .skeleton-card-image {
    @apply rounded-xl;
  }
}
</style>
