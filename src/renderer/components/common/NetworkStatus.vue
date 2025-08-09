<!--
  网络状态指示器组件
  提供网络连接状态的可视化反馈和用户指导
  
  @author TypeScript企业级开发团队
  @version 1.0.0
  @since Vue 3.0+ TypeScript 5.0+
-->

<template>
  <div class="network-status-container">
    <!-- 网络状态指示器 -->
    <Transition name="slide-down" appear>
      <div v-if="shouldShowStatus" class="network-status-bar" :class="statusClass">
        <div class="status-content">
          <div class="status-icon">
            <Icon v-if="isOnline" name="wifi" />
            <Icon v-else name="wifi-off" />
          </div>

          <div class="status-text">
            <span class="status-title">{{ statusTitle }}</span>
            <span v-if="statusDescription" class="status-description">
              {{ statusDescription }}
            </span>
          </div>

          <div v-if="showRetryButton" class="status-actions">
            <n-button size="small" type="primary" ghost @click="handleRetry" :loading="isRetrying">
              {{ t('common.retry') }}
            </n-button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 服务状态详情（开发模式） -->
    <div v-if="showServiceDetails && isDevelopment" class="service-details">
      <div class="service-item" v-for="(service, name) in services" :key="name">
        <div class="service-name">{{ name }}</div>
        <div class="service-status" :class="service.status">
          {{ service.status }}
        </div>
        <div class="service-response-time">{{ service.responseTime }}ms</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { NButton } from 'naive-ui';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { NetworkStatus, useNetworkMonitor } from '@/services/networkMonitor';

/**
 * 组件属性接口
 */
interface Props {
  /** 是否显示服务详情（开发模式） */
  showServiceDetails?: boolean;
  /** 是否自动隐藏正常状态 */
  autoHideOnline?: boolean;
  /** 自动隐藏延迟（毫秒） */
  autoHideDelay?: number;
}

/**
 * 组件事件接口
 */
interface Emits {
  (e: 'retry'): void;
  (e: 'statusChange', status: NetworkStatus): void;
}

const props = withDefaults(defineProps<Props>(), {
  showServiceDetails: false,
  autoHideOnline: true,
  autoHideDelay: 3000
});

const emit = defineEmits<Emits>();

const { t } = useI18n();
const { networkStatus, isOnline, isSlow } = useNetworkMonitor();

// 组件状态
const isRetrying = ref(false);
const showOnlineStatus = ref(false);
const autoHideTimer = ref<number | null>(null);

/**
 * 是否为开发环境
 */
const isDevelopment = computed(() => import.meta.env.DEV || import.meta.env.MODE === 'development');

/**
 * 是否应该显示状态栏
 */
const shouldShowStatus = computed(() => {
  if (!isOnline.value) return true; // 离线时总是显示
  if (isSlow.value) return true; // 网络缓慢时显示
  if (showOnlineStatus.value) return true; // 临时显示在线状态
  return false;
});

/**
 * 状态栏样式类
 */
const statusClass = computed(() => ({
  'status-offline': !isOnline.value,
  'status-slow': isSlow.value && isOnline.value,
  'status-online': isOnline.value && !isSlow.value
}));

/**
 * 状态标题
 */
const statusTitle = computed(() => {
  if (!isOnline.value) return t('network.offline');
  if (isSlow.value) return t('network.slow');
  return t('network.online');
});

/**
 * 状态描述
 */
const statusDescription = computed(() => {
  if (!isOnline.value) return t('network.offlineDescription');
  if (isSlow.value) return t('network.slowDescription');
  return t('network.onlineDescription');
});

/**
 * 是否显示重试按钮
 */
const showRetryButton = computed(() => !isOnline.value);

/**
 * 服务状态（开发模式）
 */
const services = ref<Record<string, any>>({});

/**
 * 处理重试
 */
const handleRetry = async () => {
  isRetrying.value = true;
  try {
    emit('retry');
    // 这里可以添加具体的重试逻辑
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } finally {
    isRetrying.value = false;
  }
};

/**
 * 监听网络状态变化
 */
watch(
  networkStatus,
  (newStatus, oldStatus) => {
    emit('statusChange', newStatus);

    // 网络恢复时显示短暂的在线提示
    if (oldStatus !== NetworkStatus.ONLINE && newStatus === NetworkStatus.ONLINE) {
      showOnlineStatus.value = true;

      if (props.autoHideOnline) {
        if (autoHideTimer.value) {
          clearTimeout(autoHideTimer.value);
        }

        autoHideTimer.value = window.setTimeout(() => {
          showOnlineStatus.value = false;
          autoHideTimer.value = null;
        }, props.autoHideDelay);
      }
    }
  },
  { immediate: true }
);

/**
 * 组件卸载时清理定时器
 */
onBeforeUnmount(() => {
  if (autoHideTimer.value) {
    clearTimeout(autoHideTimer.value);
  }
});
</script>

<style lang="scss" scoped>
.network-status-container {
  position: relative;
  z-index: 1000;
}

.network-status-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 8px 16px;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
  transition: all 0.3s ease;

  &.status-offline {
    background: rgba(239, 68, 68, 0.9);
    color: white;
  }

  &.status-slow {
    background: rgba(245, 158, 11, 0.9);
    color: white;
  }

  &.status-online {
    background: rgba(34, 197, 94, 0.9);
    color: white;
  }
}

.status-content {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto;
}

.status-icon {
  display: flex;
  align-items: center;
  font-size: 18px;
}

.status-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-title {
  font-weight: 600;
  font-size: 14px;
}

.status-description {
  font-size: 12px;
  opacity: 0.9;
}

.status-actions {
  display: flex;
  gap: 8px;
}

.service-details {
  position: fixed;
  top: 60px;
  right: 16px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  min-width: 200px;
}

.service-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }
}

.service-name {
  font-weight: 500;
}

.service-status {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  text-transform: uppercase;

  &.available {
    background: rgba(34, 197, 94, 0.2);
    color: #16a34a;
  }

  &.unavailable {
    background: rgba(239, 68, 68, 0.2);
    color: #dc2626;
  }

  &.degraded {
    background: rgba(245, 158, 11, 0.2);
    color: #d97706;
  }

  &.checking {
    background: rgba(156, 163, 175, 0.2);
    color: #6b7280;
  }
}

.service-response-time {
  color: var(--text-color-secondary);
  font-family: monospace;
}

/* 动画效果 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
