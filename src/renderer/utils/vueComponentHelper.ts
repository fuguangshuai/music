/**
 * 通用Vue组件引用工具
 * 统一处理Vue组件引用的类型问题
 *
 * 重构说明：消除 any 类型使用，提供类型安全的组件操作
 */

import type { ComponentPublicInstance, Ref } from 'vue';

// 定义Vue组件引用的可能类型
type VueComponentRef =
  | Ref<HTMLElement | null>
  | Ref<ComponentPublicInstance | null>
  | HTMLElement
  | ComponentPublicInstance
  | null
  | undefined;

// 定义组件实例的基本结构
interface ComponentInstance {
  $el?: HTMLElement;
  value?: HTMLElement | ComponentInstance;
}

/**
 * 类型守卫：检查是否为有效的组件实例
 */
const isComponentInstance = (value: unknown): value is ComponentInstance => {
  return typeof value === 'object' && value !== null && '$el' in value;
};

/**
 * 类型守卫：检查是否为Ref对象
 */
const isRefObject = (value: unknown): value is { value: unknown } => {
  return typeof value === 'object' && value !== null && 'value' in value;
};

/**
 * 获取组件的DOM元素
 * @param ref Vue组件引用
 * @returns HTMLElement或null
 */
export const getComponentElement = (ref: VueComponentRef): HTMLElement | null => {
  if (!ref) return null;

  // 如果是Ref对象
  if (isRefObject(ref)) {
    const refValue = ref.value;

    // 如果是Vue组件实例，获取$el
    if (isComponentInstance(refValue) && refValue.$el instanceof HTMLElement) {
      return refValue.$el;
    }

    // 如果是直接的DOM元素
    if (refValue instanceof HTMLElement) {
      return refValue;
    }
  }

  // 如果ref本身就是DOM元素
  if (ref instanceof HTMLElement) {
    return ref;
  }

  // 如果ref本身就是组件实例
  if (isComponentInstance(ref) && ref.$el instanceof HTMLElement) {
    return ref.$el;
  }

  return null;
};

/**
 * 安全地滚动到指定位置
 * @param ref Vue组件引用
 * @param options 滚动选项
 */
export const scrollToPosition = (ref: VueComponentRef, options: ScrollToOptions): void => {
  const element = getComponentElement(ref);

  if (element && typeof element.scrollTo === 'function') {
    element.scrollTo(options);
  }
};

/**
 * 安全地获取组件的scrollTop
 * @param ref Vue组件引用
 * @returns scrollTop值
 */
export const getScrollTop = (ref: VueComponentRef): number => {
  const element = getComponentElement(ref);
  return element?.scrollTop || 0;
};

/**
 * 安全地设置组件的scrollTop
 * @param ref Vue组件引用
 * @param scrollTop 滚动位置
 */
export const setScrollTop = (ref: VueComponentRef, scrollTop: number): void => {
  const element = getComponentElement(ref);
  if (element) {
    element.scrollTop = scrollTop;
  }
};

/**
 * 获取组件的客户端高度
 * @param ref Vue组件引用
 * @returns 客户端高度
 */
export const getClientHeight = (ref: VueComponentRef): number => {
  const element = getComponentElement(ref);
  return element?.clientHeight || 0;
};

/**
 * 获取组件的滚动高度
 * @param ref Vue组件引用
 * @returns 滚动高度
 */
export const getScrollHeight = (ref: VueComponentRef): number => {
  const element = getComponentElement(ref);
  return element?.scrollHeight || 0;
};

/**
 * 检查是否滚动到底部
 * @param ref Vue组件引用
 * @param threshold 阈值（默认10px）
 * @returns 是否接近底部
 */
export const isNearBottom = (ref: VueComponentRef, threshold = 10): boolean => {
  const element = getComponentElement(ref);
  if (!element) return false;

  const { scrollTop, scrollHeight, clientHeight } = element;
  return scrollTop + clientHeight >= scrollHeight - threshold;
};

/**
 * 安全地调用组件方法
 * @param ref Vue组件引用
 * @param methodName 方法名
 * @param args 参数
 * @returns 方法返回值
 */
export const callComponentMethod = (
  ref: VueComponentRef,
  methodName: string,
  ...args: unknown[]
): unknown => {
  if (!isRefObject(ref) || !ref.value) return undefined;

  const component = ref.value as unknown as Record<string, unknown>;
  const method = component[methodName];

  if (typeof method === 'function') {
    return (method as Function).apply(component, args);
  }

  return undefined;
};

/**
 * 安全地获取组件属性
 * @param ref Vue组件引用
 * @param propertyName 属性名
 * @returns 属性值
 */
export const getComponentProperty = (ref: VueComponentRef, propertyName: string): unknown => {
  if (!isRefObject(ref) || !ref.value) return undefined;

  const component = ref.value as unknown as Record<string, unknown>;
  return component[propertyName];
};

/**
 * 安全地设置组件属性
 * @param ref Vue组件引用
 * @param propertyName 属性名
 * @param value 属性值
 */
export const setComponentProperty = (
  ref: VueComponentRef,
  propertyName: string,
  value: unknown
): void => {
  if (!isRefObject(ref) || !ref.value) return;

  const component = ref.value as unknown as Record<string, unknown>;
  component[propertyName] = value;
};

/**
 * 获取事件目标的滚动信息
 * @param event 滚动事件
 * @returns 滚动信息对象
 */
export const getScrollInfo = (event: Event) => {
  const target = event.target;

  if (!target || !(target instanceof HTMLElement)) {
    return {
      scrollTop: 0,
      scrollHeight: 0,
      clientHeight: 0,
      offsetHeight: 0
    };
  }

  return {
    scrollTop: target.scrollTop,
    scrollHeight: target.scrollHeight,
    clientHeight: target.clientHeight,
    offsetHeight: target.offsetHeight
  };
};
