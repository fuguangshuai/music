<template>
  <div v-if="isDev" class="dev-panel" :class="{ 'dev-panel--collapsed': collapsed }">
    <!-- 折叠/展开按钮 -->
    <button class="dev-panel__toggle" @click="togglePanel">
      <i class="iconfont" :class="collapsed ? 'icon-expand' : 'icon-collapse'"></i>
      {{ collapsed ? '调试' : '收起' }}
    </button>

    <!-- 主面板内容 -->
    <div v-if="!collapsed" class="dev-panel__content">
      <!-- 标签页 -->
      <div class="dev-panel__tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="dev-panel__tab"
          :class="{ 'dev-panel__tab--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab?.label }}
        </button>
      </div>

      <!-- 内存监控 -->
      <div v-if="activeTab === 'memory'" class="dev-panel__section">
        <h3>内存监控</h3>
        <div v-if="memoryStats" class="memory-stats">
          <div class="stat-item">
            <span class="label">已用内存:</span>
            <span class="value">{{ formatMemory(memoryStats.usedJSHeapSize) }}</span>
          </div>
          <div class="stat-item">
            <span class="label">总内存:</span>
            <span class="value">{{ formatMemory(memoryStats.totalJSHeapSize) }}</span>
          </div>
          <div class="stat-item">
            <span class="label">缓存内存:</span>
            <span class="value">{{ formatMemory(memoryStats.jsHeapSizeLimit) }}</span>
          </div>
          <div class="stat-item">
            <span class="label">音频内存:</span>
            <span class="value">{{ (memoryStats.memoryUsage * 100).toFixed(1) }}%</span>
          </div>
        </div>
        <div class="memory-actions">
          <button @click="performMemoryCleanup" :disabled="isCleaningMemory">
            {{ isCleaningMemory ? '清理中...' : '清理内存' }}
          </button>
          <button @click="refreshMemoryStats">刷新统计</button>
        </div>
      </div>

      <!-- 缓存管理 -->
      <div v-if="activeTab === 'cache'" class="dev-panel__section">
        <h3>缓存管理</h3>
        <div v-if="cacheStats" class="cache-stats">
          <div v-for="(stat, type) in cacheStats" :key="type" class="cache-type">
            <h4>{{ type }}</h4>
            <div class="stat-grid">
              <div class="stat-item">
                <span class="label">项目数:</span>
                <span class="value">{{ (stat as any)?.totalItems }}</span>
              </div>
              <div class="stat-item">
                <span class="label">命中率:</span>
                <span class="value">{{ (stat as any).hitRate.toFixed(1) }}%</span>
              </div>
              <div class="stat-item">
                <span class="label">大小:</span>
                <span class="value">{{ formatMemory((stat as any).totalSize) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="cache-actions">
          <button @click="clearAllCache" :disabled="isClearingCache">
            {{ isClearingCache ? '清理中...' : '清理所有缓存' }}
          </button>
          <button @click="refreshCacheStats">刷新统计</button>
        </div>
      </div>

      <!-- 性能监控 -->
      <div v-if="activeTab === 'performance'" class="dev-panel__section">
        <h3>性能监控</h3>
        <div class="performance-stats">
          <div class="stat-item">
            <span class="label">FPS:</span>
            <span class="value">{{ currentFPS }}</span>
          </div>
          <div class="stat-item">
            <span class="label">渲染时间:</span>
            <span class="value">{{ renderTime }}ms</span>
          </div>
          <div class="stat-item">
            <span class="label">DOM节点:</span>
            <span class="value">{{ domNodeCount }}</span>
          </div>
        </div>
        <div class="performance-chart">
          <!-- 这里可以添加性能图表 -->
          <canvas ref="performanceChart" width="300" height="100"></canvas>
        </div>
      </div>

      <!-- 日志查看 -->
      <div v-if="activeTab === 'logs'" class="dev-panel__section">
        <h3>日志查看</h3>
        <div class="log-controls">
          <select v-model="logLevel">
            <option value="all">所有日志</option>
            <option value="error">错误</option>
            <option value="warn">警告</option>
            <option value="info">信息</option>
          </select>
          <button @click="clearLogs">清空日志</button>
        </div>
        <div class="log-container">
          <div
            v-for="(log, index) in filteredLogs"
            :key="index"
            class="log-item"
            :class="`log-item--${log.level}`"
          >
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            <span class="log-level">{{ log.level.toUpperCase() }}</span>
            <span class="log-message">{{ log?.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { memoryOptimizer, type MemoryStats } from '@/utils/memoryOptimizer';

// 开发环境检测
const isDev = (globalThis as any).process.env.NODE_ENV === 'development';

// 面板状态
const collapsed = ref(true);
const activeTab = ref('memory');

// 标签页配置
const tabs = [
  { key: 'memory', label: '内存' },
  { key: 'cache', label: '缓存' },
  { key: 'performance', label: '性能' },
  { key: 'logs', label: '日志' }
];

// 内存监控
const memoryStats = ref<MemoryStats | null>(null);
const isCleaningMemory = ref(false);

// 缓存管理
const cacheStats = ref<Record<string, unknown> | null>(null);
const isClearingCache = ref(false);

// 性能监控
const currentFPS = ref(0);
const renderTime = ref(0);
const domNodeCount = ref(0);
const performanceChart = ref<HTMLCanvasElement>();

// 日志管理
const logs = ref<Array<{ level: string; message: string; timestamp: number }>>([]);
const logLevel = ref('all');

// 计算属性
const filteredLogs = computed(() => {
  if (logLevel.value === 'all') return logs.value;
  return logs.value.filter((log) => log.level === logLevel.value);
});

// 方法
const togglePanel = () => {
  collapsed.value = !collapsed.value;
};

const formatMemory = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString();
};

const refreshMemoryStats = async () => {
  memoryStats.value = await memoryOptimizer.getMemoryStats();
};

const performMemoryCleanup = async () => {
  isCleaningMemory.value = true;
  try {
    memoryOptimizer.cleanup();
    console.log('内存清理完成');
    await refreshMemoryStats();
  } finally {
    isCleaningMemory.value = false;
  }
};

const refreshCacheStats = async () => {
  // 这里可以集成实际的缓存统计
  cacheStats.value = {};
};

const clearAllCache = async () => {
  isClearingCache.value = true;
  try {
    // 这里可以集成实际的缓存清理
    await refreshCacheStats();
  } finally {
    isClearingCache.value = false;
  }
};

const clearLogs = () => {
  logs.value = [];
};

// 性能监控
let performanceInterval: number | null = null;

const startPerformanceMonitoring = () => {
  performanceInterval = window.setInterval(() => {
    // 计算FPS
    let lastTime = performance.now();
    requestAnimationFrame(() => {
      currentFPS.value = Math.round(1000 / (performance.now() - lastTime));
    });

    // 计算DOM节点数
    domNodeCount.value = document.querySelectorAll('*').length;

    // 计算渲染时间（简化版）
    const start = performance.now();
    requestAnimationFrame(() => {
      renderTime.value = Math.round(performance.now() - start);
    });
  }, 1000);
};

const stopPerformanceMonitoring = () => {
  if (performanceInterval) {
    clearInterval(performanceInterval);
    performanceInterval = null;
  }
};

// 日志拦截
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info
};

const interceptConsole = () => {
  console.log = (...args) => {
    logs.value.push({
      level: 'info',
      message: args.join(', '),
      timestamp: Date.now()
    });
    originalConsole.log(...args);
  };

  console.warn = (...args) => {
    logs.value.push({
      level: 'warn',
      message: args.join(', '),
      timestamp: Date.now()
    });
    originalConsole.warn(...args);
  };

  console.error = (...args) => {
    logs.value.push({
      level: 'error',
      message: args.join(', '),
      timestamp: Date.now()
    });
    originalConsole.error(...args);
  };
};

const restoreConsole = () => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
};

// 生命周期
onMounted(() => {
  if (isDev) {
    refreshMemoryStats();
    refreshCacheStats();
    startPerformanceMonitoring();
    interceptConsole();
  }
});

onUnmounted(() => {
  stopPerformanceMonitoring();
  restoreConsole();
});
</script>

<style scoped>
.dev-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  font-size: 12px;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
}

.dev-panel--collapsed {
  width: auto;
}

.dev-panel__toggle {
  background: #007acc;
  color: white;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-size: 12px;
}

.dev-panel__content {
  padding: 16px;
  max-height: 70vh;
  overflow-y: auto;
}

.dev-panel__tabs {
  display: flex;
  margin-bottom: 16px;
  border-bottom: 1px solid #333;
}

.dev-panel__tab {
  background: none;
  border: none;
  color: #ccc;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
}

.dev-panel__tab--active {
  color: #007acc;
  border-bottom: 2px solid #007acc;
}

.dev-panel__section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #007acc;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.label {
  color: #ccc;
}

.value {
  color: white;
  font-weight: bold;
}

.memory-actions,
.cache-actions {
  margin-top: 12px;
}

.memory-actions button,
.cache-actions button {
  background: #007acc;
  color: white;
  border: none;
  padding: 6px 12px;
  margin-right: 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

.memory-actions button:disabled,
  .cache-actions button: disabled {
  background: #555;
  cursor: not-allowed;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  background: #111;
  padding: 8px;
  border-radius: 4px;
}

.log-item {
  margin-bottom: 4px;
  font-family: monospace;
  font-size: 10px;
}

.log-item--error {
  color: #ff6b6b;
}

.log-item--warn {
  color: #ffd93d;
}

.log-item--info {
  color: #6bcf7f;
}

.log-time {
  color: #666;
  margin-right: 8px;
}

.log-level {
  font-weight: bold;
  margin-right: 8px;
}
</style>
