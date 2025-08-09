import { createVNode, render, VNode } from 'vue';

import Loading from './index.vue';

// 智能加载管理器接口
interface LoadingState {
  isLoading: boolean;
  startTime: number;
  minDuration: number;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

// 全局加载状态管理
class SmartLoadingManager {
  private loadingStates: Map<string, LoadingState> = new Map();
  private loadingQueue: Array<{ id: string; priority: number }> = [];

  /**
   * 开始加载
   */
  startLoading(
    id: string,
    _message: string = '加载中...',
    priority: 'low' | 'medium' | 'high' = 'medium',
    minDuration: number = 300
  ): void {
    const _state: LoadingState = {
      isLoading: true,
      startTime: Date.now(),
      minDuration,
      message: _message,
      priority
    };

    this.loadingStates.set(id, _state);
    this.updateLoadingQueue();

    console.log(`🔄 开始加载 [${id}] 优先级: ${priority}`);
  }

  /**
   * 结束加载（智能延迟）
   */
  async stopLoading(id: string): Promise<void> {
    const _state = this.loadingStates.get(id);
    if (!_state) return;

    const elapsed = Date.now() - _state.startTime;
    const remainingTime = Math.max(0, _state.minDuration - elapsed);

    if (remainingTime > 0) {
      console.log(`⏳ 智能延迟 [${id}], ${remainingTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, remainingTime));
    }

    _state.isLoading = false;
    this.loadingStates.delete(id);
    this.updateLoadingQueue();

    console.log(`✅ 加载完成, [${id}]`);
  }

  /**
   * 更新加载队列
   */
  private updateLoadingQueue(): void {
    this.loadingQueue = Array.from(this.loadingStates.entries())
      .filter(([_, state]) => state.isLoading)
      .map(([id, _state]) => ({
        id,
        priority: _state.priority === 'high' ? 3 : _state.priority === 'medium' ? 2 : 1
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * 获取当前最高优先级的加载状态
   */
  getCurrentLoadingState(): LoadingState | null {
    if (this.loadingQueue.length === 0) return null;

    const topPriorityId = this.loadingQueue[0].id;
    return this.loadingStates.get(topPriorityId) || null;
  }

  /**
   * 检查是否有加载中的任务
   */
  isAnyLoading(): boolean {
    return this.loadingQueue.length > 0;
  }
}

// 全局智能加载管理器实例
const smartLoadingManager = new SmartLoadingManager();

const vnode: VNode = createVNode(Loading) as VNode;

// 智能loading指令
export const vLoading = {
  // 在绑定元素的父组件 及他自己的所有子节点都挂载完成后调用
  mounted: (el: HTMLElement, _binding: { value: boolean | LoadingOptions }) => {
    const elementId = generateElementId(el);
    el.dataset.loadingId = elementId;
    render(vnode, el);
  },

  // 在绑定元素的父组件 及他自己的所有子节点都更新后调用
  _updated: async (el: HTMLElement, binding: { value: boolean | LoadingOptions }) => {
    const elementId = el.dataset.loadingId || generateElementId(el);
    const options = normalizeLoadingOptions(binding.value);

    if (options.show) {
      // 开始智能加载
      smartLoadingManager.startLoading(
        elementId,
        options.message,
        options.priority,
        options.minDuration
      );

      // 更新loading组件的显示文本
      if (vnode?.component?.exposed) {
        vnode.component.exposed.show();
        // 如果loading组件支持动态更新文本
        if (vnode.component.props) {
          vnode.component.props.tip = options.message;
        }
      }
    } else {
      // 智能结束加载
      await smartLoadingManager.stopLoading(elementId);
      vnode?.component?.exposed?.hide();
    }

    // 动态添加删除自定义class: loading-parent
    formatterClass(el, { value: options.show });
  },

  // 绑定元素的父组件卸载后调用
  _unmounted: async (el: HTMLElement) => {
    const elementId = el.dataset.loadingId;
    if (elementId) {
      await smartLoadingManager.stopLoading(elementId);
    }
    vnode?.component?.exposed?.hide();
  }
};

// 加载选项接口
interface LoadingOptions {
  show: boolean;
  message?: string;
  priority?: 'low' | 'medium' | 'high';
  minDuration?: number;
}

// 标准化加载选项
function normalizeLoadingOptions(value: boolean | LoadingOptions): LoadingOptions {
  if (typeof value === 'boolean') {
    return {
      show: value,
      message: '加载中...',
      priority: 'medium',
      minDuration: 300
    };
  }

  return {
    show: value.show,
    message: value.message || '加载中...',
    priority: value.priority || 'medium',
    minDuration: value.minDuration || 300
  };
}

// 生成元素唯一ID
function generateElementId(_el: HTMLElement): string {
  return `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatterClass(el: HTMLElement, binding: { value: boolean }): void {
  const classStr = el.getAttribute('class') || '';
  const targetClass = classStr.indexOf('loading-parent');

  if (binding.value) {
    // 添加 loading-parent 类
    if (targetClass === -1) {
      el.setAttribute('class', `${classStr} loading-parent`.trim());
    }
  } else if (targetClass !== -1) {
    // 移除 loading-parent 类
    const newClassStr = classStr.replace(/\s*loading-parent\s*/g, ' ').trim();
    el.setAttribute('class', newClassStr);
  }
}

// 导出智能加载管理器和类型
export { type LoadingOptions, type LoadingState, smartLoadingManager };
