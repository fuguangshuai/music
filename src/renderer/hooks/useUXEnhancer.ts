/**
 * 用户体验增强组合式函数
 * 整合智能加载、错误恢复、无障碍访问等功能
 */

import { computed, type ComputedRef, nextTick, onMounted, onUnmounted, type Ref, ref } from 'vue';

import { smartLoadingManager } from '@/directive/loading';
import { a11y, type AccessibilityConfig, accessibilityManager } from '@/utils/accessibility';
import { AppError, globalErrorHandler } from '@/utils/errorHandler';

/**
 * UX增强Hook返回类型接口
 */
export interface UseUXEnhancerReturn {
  /** 加载状态 */
  isLoading: Ref<boolean>;
  /** 加载消息 */
  loadingMessage: Ref<string>;
  /** 是否有任何加载中 */
  isAnyLoading: ComputedRef<boolean>;
  /** 开始加载 */
  startLoading: (
    id: string,
    message?: string,
    priority?: 'low' | 'medium' | 'high',
    minDuration?: number
  ) => void;
  /** 停止加载 */
  stopLoading: (id: string) => Promise<void>;
  /** 错误信息 */
  error: Ref<AppError | null>;
  /** 处理错误 */
  handleError: (err: Error | AppError) => void;
  /** 清除错误 */
  clearError: () => void;
  /** 重试最后操作 */
  retryLastAction: (action?: () => Promise<void>) => Promise<void>;
  /** 无障碍配置 */
  accessibilityConfig: Ref<AccessibilityConfig>;
  /** 设置无障碍 */
  setupAccessibility: (container: HTMLElement, options?: any) => () => void;
  /** 设置ARIA属性 */
  setAriaAttributes: (
    element: HTMLElement,
    attributes: Record<string, string | boolean | number>
  ) => void;
  /** 管理焦点 */
  manageFocus: (element: HTMLElement, options?: { preventScroll?: boolean }) => void;
  /** 公告 */
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  /** 切换高对比度 */
  toggleHighContrast: (enable?: boolean) => void;
  /** 切换减少动画 */
  toggleReducedMotion: (enable?: boolean) => void;
  /** 设置字体大小 */
  setFontSize: (size: any) => void;
  /** 焦点陷阱 */
  trapFocus: (container: HTMLElement) => () => void;
  /** 释放焦点陷阱 */
  releaseFocusTrap: () => void;
  /** 页面过渡 */
  pageTransition: Ref<any>;
  /** 屏幕尺寸 */
  screenSize: Ref<any>;
  /** 是否移动设备 */
  isMobile: Ref<boolean>;
  /** 是否平板设备 */
  isTablet: Ref<boolean>;
  /** 是否桌面设备 */
  isDesktop: ComputedRef<boolean>;
  /** 设置页面过渡 */
  setPageTransition: (transition: any) => void;
  /** UX指标 */
  uxMetrics: Ref<any>;
  /** 更新UX指标 */
  updateUXMetrics: (metrics: any) => void;
}

export function useUXEnhancer(): UseUXEnhancerReturn {
  const isLoading = ref(false);
  const loadingMessage = ref('加载中...');
  const error = ref<AppError | null>(null);
  const accessibilityConfig = ref<AccessibilityConfig>(accessibilityManager.getConfig());

  /**
   * 🔄 智能加载管理
   */
  const startLoading = (
    id: string,
    _message: string = '加载中...',
    priority: 'low' | 'medium' | 'high' = 'medium',
    minDuration: number = 300
  ) => {
    isLoading.value = true;
    loadingMessage.value = _message;
    smartLoadingManager.startLoading(id, _message, priority, minDuration);

    // 无障碍访问公告
    a11y._announce(`开始${_message}`, 'polite');
  };

  const stopLoading = async (id: string) => {
    await smartLoadingManager.stopLoading(id);
    isLoading.value = false;

    // 无障碍访问公告
    a11y._announce('加载完成', 'polite');
  };

  const isAnyLoading = computed(() => smartLoadingManager.isAnyLoading());

  /**
   * ❌ 错误处理和恢复
   */
  const handleError = (err: Error | AppError) => {
    error.value =
      err instanceof AppError
        ? err
        : new AppError(err instanceof Error ? err.message : String(err), 'UNKNOWN_ERROR' as const);
    globalErrorHandler.handle(error.value);

    // 无障碍访问公告
    a11y._announce(
      `发生错误: ${error instanceof Error ? error.message : String(error)}`,
      'assertive'
    );
  };

  const clearError = () => {
    error.value = null;
  };

  const retryLastAction = async (action?: () => Promise<void>) => {
    if (!error.value || !action) return;

    clearError();

    try {
      await action();
      a11y._announce('操作重试成功', 'polite');
    } catch (err) {
      handleError(err as Error);
    }
  };

  /**
   * 🌐 无障碍访问增强
   */
  const setupAccessibility = (
    container: HTMLElement,
    _options?: {
      enableKeyboardNavigation?: boolean;
      orientation?: 'horizontal' | 'vertical' | 'both';
      circular?: boolean;
    }
  ) => {
    const {
      enableKeyboardNavigation = true,
      orientation = 'both',
      circular = true
    } = _options || {};

    if (!enableKeyboardNavigation) return () => {};

    return a11y._setupKeyboardNavigation(container, {
      orientation,
      circular,
      onActivate: (element) => {
        // 触发点击事件
        element.click();
        a11y._announce(
          `激活 ${element.textContent || element.getAttribute('aria-label') || '元素'}`,
          'polite'
        );
      }
    });
  };

  const setAriaAttributes = (
    element: HTMLElement,
    attributes: Record<string, string | boolean | number>
  ) => {
    a11y.setAriaAttributes(element, attributes);
  };

  const manageFocus = (element: HTMLElement, _options?: { preventScroll?: boolean }) => {
    a11y.manageFocus(element, _options);
  };

  const announce = (_message: string, priority: 'polite' | 'assertive' = 'polite') => {
    a11y._announce(_message, priority);
  };

  /**
   * 🎨 主题和视觉增强
   */
  const toggleHighContrast = (enable?: boolean) => {
    a11y.toggleHighContrast(enable);
    accessibilityConfig.value = accessibilityManager.getConfig();
  };

  const toggleReducedMotion = (enable?: boolean) => {
    a11y.toggleReducedMotion(enable);
    accessibilityConfig.value = accessibilityManager.getConfig();
  };

  const setFontSize = (_size: AccessibilityConfig['fontSize']) => {
    a11y._setFontSize(_size);
    accessibilityConfig.value = accessibilityManager.getConfig();
  };

  /**
   * 📱 响应式和适配增强
   */
  const isMobile = ref(false);
  const isTablet = ref(false);
  const screenSize = ref<'mobile' | 'tablet' | 'desktop'>('desktop');
  const isDesktop = computed(() => !isMobile.value && !isTablet.value);

  const updateScreenSize = () => {
    const width = window.innerWidth;
    isMobile.value = width < 768;
    isTablet.value = width >= 768 && width < 1024;

    if (width < 768) {
      screenSize.value = 'mobile';
    } else if (width < 1024) {
      screenSize.value = 'tablet';
    } else {
      screenSize.value = 'desktop';
    }
  };

  /**
   * 🎯 焦点管理增强
   */
  const focusTrap = ref<HTMLElement | null>(null);
  const previousFocus = ref<HTMLElement | null>(null);

  const trapFocus = (container: HTMLElement) => {
    previousFocus.value = document.activeElement as HTMLElement;
    focusTrap.value = container;

    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]) > select:not([disabled]), textarea:not([disabled]) > [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }

      if (event.key === 'Escape') {
        releaseFocusTrap();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  const releaseFocusTrap = () => {
    if (previousFocus.value) {
      previousFocus.value.focus();
      previousFocus.value = null;
    }
    focusTrap.value = null;
  };

  /**
   * 🎬 页面过渡增强
   */
  const pageTransition = ref({
    name: 'fade',
    mode: 'out-in' as const,
    duration: 300
  });

  const setPageTransition = (name: string, duration: number = 300) => {
    pageTransition.value = {
      name,
      mode: 'out-in',
      duration
    };
  };

  /**
   * 📊 用户体验指标
   */
  const uxMetrics = ref({
    loadingCount: 0,
    errorCount: 0,
    recoveryCount: 0,
    accessibilityUsage: 0
  });

  const updateUXMetrics = (type: 'loading' | 'error' | 'recovery' | 'accessibility') => {
    switch (type) {
      case 'loading':
        uxMetrics.value.loadingCount++;
        break;
      case 'error':
        uxMetrics.value.errorCount++;
        break;
      case 'recovery':
        uxMetrics.value.recoveryCount++;
        break;
      case 'accessibility':
        uxMetrics.value.accessibilityUsage++;
        break;
    }
  };

  // 生命周期钩子
  onMounted(() => {
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateScreenSize);
    releaseFocusTrap();
  });

  return {
    // 加载状态
    isLoading,
    loadingMessage,
    isAnyLoading,
    startLoading,
    stopLoading,

    // 错误处理
    error,
    handleError,
    clearError,
    retryLastAction,

    // 无障碍访问
    accessibilityConfig,
    setupAccessibility,
    setAriaAttributes,
    manageFocus,
    announce,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,

    // 响应式适配
    isMobile,
    isTablet,
    isDesktop,
    screenSize,

    // 焦点管理
    trapFocus,
    releaseFocusTrap,

    // 页面过渡
    pageTransition,
    setPageTransition,

    // UX指标
    uxMetrics,
    updateUXMetrics
  };
}

/**
 * 骨架屏增强组合式函数
 */
export function useSkeletonLoader(): {
  showSkeleton: Ref<boolean>;
  skeletonType: Ref<'song-list' | 'card-grid' | 'user-profile' | 'lyrics' | 'player' | 'text'>;
  skeletonCount: Ref<number>;
  startSkeleton: (
    type?: 'song-list' | 'card-grid' | 'user-profile' | 'lyrics' | 'player' | 'text',
    count?: number,
    minDuration?: number
  ) => void;
  stopSkeleton: () => Promise<void>;
} {
  const showSkeleton = ref(false);
  const skeletonType = ref<
    'song-list' | 'card-grid' | 'user-profile' | 'lyrics' | 'player' | 'text'
  >('text');
  const skeletonCount = ref(3);

  const startSkeleton = (
    type: typeof skeletonType.value = 'text',
    count: number = 3,
    minDuration: number = 500
  ) => {
    showSkeleton.value = true;
    skeletonType.value = type;
    skeletonCount.value = count;

    // 最小显示时间，避免闪烁
    setTimeout(() => {
      if (showSkeleton.value) {
        console.log(`骨架屏已显示${minDuration}ms`);
      }
    }, minDuration);
  };

  const stopSkeleton = async () => {
    // 平滑过渡
    await nextTick();
    showSkeleton.value = false;
  };

  return {
    showSkeleton,
    skeletonType,
    skeletonCount,
    startSkeleton,
    stopSkeleton
  };
}
