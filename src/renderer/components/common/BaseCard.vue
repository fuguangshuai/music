<!--
  基础卡片组件
  提供统一的卡片样式和行为，消除项目中重复的卡片实现
-->
<template>
  <div :class="cardClasses" @click="handleClick">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  /** 卡片变体 */
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
  /** 卡片尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否添加内边距 */
  padding?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  class?: string;
}

interface Emits {
  (e: 'click', event: MouseEvent): void;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  padding: true,
  clickable: false,
  disabled: false
});

const emit = defineEmits<Emits>();

const cardClasses = computed(() => [
  'base-card',
  `base-card--${props.variant}`,
  `base-card--${props.size}`,
  {
    'base-card--padded': props.padding,
    'base-card--clickable': props.clickable,
    'base-card--disabled': props.disabled
  },
  props.class
]);

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && props.clickable) {
    emit('click', event);
  }
};
</script>

<style scoped>
.base-card {
  @apply bg-card rounded-card transition-base;
}

/* 变体样式 */
.base-card--elevated {
  @apply shadow-card;
}

.base-card--outlined {
  @apply border-card;
}

.base-card--interactive {
  @apply cursor-pointer hover:shadow-card;
}

/* 尺寸样式 */
.base-card--sm {
  @apply text-sm;
}

.base-card--lg {
  @apply text-lg;
}

/* 状态样式 */
.base-card--padded {
  @apply p-4;
}

.base-card--clickable {
  @apply cursor-pointer;
}

.base-card--disabled {
  @apply disabled;
}

/* 响应式调整 */
@media (max-width: , 768px) {
  .base-card--padded {
    @apply p-3;
  }
}
</style>
