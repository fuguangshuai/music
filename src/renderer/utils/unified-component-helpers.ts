/**
 * 🔧 统一组件辅助工具
 * 整合项目中重复的组件操作和类型安全的引用访问
 *
 * 功能特性：
 * - 类型安全的组件引用访问
 * - DOM元素操作的类型安全包装
 * - 事件处理的类型改进
 * - Vue组件实例的安全访问
 *
 * @author TypeScript重构项目组
 * @since v4.11.0
 */

import { unifiedTypeGuards } from './unified-type-guards';

// ============================================================================
// 类型安全的组件引用访问器
// ============================================================================

/**
 * Vue组件引用类型
 */
export interface SafeComponentRef {
  value?: {
    $el?: HTMLElement;
    [key: string]: any;
  };
}

/**
 * 类型安全的组件引用工具
 * 用于替代项目中的 (ref.value as any).$el 模式
 */
export class SafeComponentRefHelper {
  /**
   * 安全获取组件的DOM元素
   */
  static getElement(ref: SafeComponentRef): HTMLElement | null {
    if (!ref?.value) {
      console.warn('🔧 组件引用为空');
      return null;
    }

    const element = ref.value.$el;
    if (element instanceof HTMLElement) {
      return element;
    }

    console.warn('🔧 组件引用不包含有效的DOM元素');
    return null;
  }

  /**
   * 安全调用组件方法
   */
  static callMethod<T = any>(
    ref: SafeComponentRef,
    methodName: string,
    ...args: any[]
  ): T | undefined {
    if (!ref?.value) {
      console.warn('🔧 组件引用为空，无法调用方法', methodName);
      return undefined;
    }

    const method = ref.value[methodName];
    if (!unifiedTypeGuards.isFunction(method)) {
      console.warn('🔧 组件方法不存在或不是函数', methodName);
      return undefined;
    }

    try {
      return method.apply(ref.value, args);
    } catch (error) {
      console.error('🔧 调用组件方法失败', methodName, error);
      return undefined;
    }
  }

  /**
   * 安全获取组件属性
   */
  static getProperty<T = any>(ref: SafeComponentRef, propertyName: string): T | undefined {
    if (!ref?.value) {
      console.warn('🔧 组件引用为空，无法获取属性', propertyName);
      return undefined;
    }

    return ref.value[propertyName];
  }

  /**
   * 安全设置组件属性
   */
  static setProperty(ref: SafeComponentRef, propertyName: string, value: any): boolean {
    if (!ref?.value) {
      console.warn('🔧 组件引用为空，无法设置属性', propertyName);
      return false;
    }

    try {
      ref.value[propertyName] = value;
      return true;
    } catch (error) {
      console.error('🔧 设置组件属性失败', propertyName, error);
      return false;
    }
  }
}

// ============================================================================
// 类型安全的DOM操作工具
// ============================================================================

/**
 * 类型安全的DOM操作工具
 * 用于替代项目中不安全的DOM操作
 */
export class SafeDOMHelper {
  /**
   * 安全的滚动操作
   */
  static scrollTo(element: HTMLElement | null, options: ScrollToOptions): boolean {
    if (!element) {
      console.warn('🔧 DOM元素为空，无法执行滚动');
      return false;
    }

    if (!('scrollTo' in element)) {
      console.warn('🔧 DOM元素不支持scrollTo方法');
      return false;
    }

    try {
      element.scrollTo(options);
      return true;
    } catch (error) {
      console.error('🔧 滚动操作失败', error);
      return false;
    }
  }

  /**
   * 安全的事件监听器添加
   */
  static addEventListener(
    element: HTMLElement | null,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): boolean {
    if (!element) {
      console.warn('🔧 DOM元素为空，无法添加事件监听器');
      return false;
    }

    try {
      element.addEventListener(event, handler, options);
      return true;
    } catch (error) {
      console.error('🔧 添加事件监听器失败', error);
      return false;
    }
  }

  /**
   * 安全的事件监听器移除
   */
  static removeEventListener(
    element: HTMLElement | null,
    event: string,
    handler: EventListener,
    options?: EventListenerOptions
  ): boolean {
    if (!element) {
      console.warn('🔧 DOM元素为空，无法移除事件监听器');
      return false;
    }

    try {
      element.removeEventListener(event, handler, options);
      return true;
    } catch (error) {
      console.error('🔧 移除事件监听器失败', error);
      return false;
    }
  }

  /**
   * 安全的样式设置
   */
  static setStyle(element: HTMLElement | null, property: string, value: string): boolean {
    if (!element) {
      console.warn('🔧 DOM元素为空，无法设置样式');
      return false;
    }

    try {
      element.style.setProperty(property, value);
      return true;
    } catch (error) {
      console.error('🔧 设置样式失败', error);
      return false;
    }
  }

  /**
   * 安全的类名操作
   */
  static toggleClass(element: HTMLElement | null, className: string, force?: boolean): boolean {
    if (!element) {
      console.warn('🔧 DOM元素为空，无法切换类名');
      return false;
    }

    try {
      return element.classList.toggle(className, force);
    } catch (error) {
      console.error('🔧 切换类名失败', error);
      return false;
    }
  }
}

// ============================================================================
// 类型安全的事件处理工具
// ============================================================================

/**
 * 类型安全的事件处理工具
 * 用于改进事件处理函数的类型定义
 */
export class SafeEventHelper {
  /**
   * 检查是否为滚动事件目标
   */
  static isScrollTarget(target: EventTarget | null): target is HTMLElement {
    return (
      target instanceof HTMLElement &&
      'scrollTop' in target &&
      'scrollHeight' in target &&
      'clientHeight' in target
    );
  }

  /**
   * 检查是否为输入事件目标
   */
  static isInputTarget(target: EventTarget | null): target is HTMLInputElement {
    return target instanceof HTMLInputElement;
  }

  /**
   * 检查是否为表单事件目标
   */
  static isFormTarget(target: EventTarget | null): target is HTMLFormElement {
    return target instanceof HTMLFormElement;
  }

  /**
   * 检查是否为按钮事件目标
   */
  static isButtonTarget(target: EventTarget | null): target is HTMLButtonElement {
    return target instanceof HTMLButtonElement;
  }

  /**
   * 检查是否为链接事件目标
   */
  static isLinkTarget(target: EventTarget | null): target is HTMLAnchorElement {
    return target instanceof HTMLAnchorElement;
  }

  /**
   * 检查是否为选择框事件目标
   */
  static isSelectTarget(target: EventTarget | null): target is HTMLSelectElement {
    return target instanceof HTMLSelectElement;
  }

  /**
   * 检查是否为文本区域事件目标
   */
  static isTextAreaTarget(target: EventTarget | null): target is HTMLTextAreaElement {
    return target instanceof HTMLTextAreaElement;
  }

  /**
   * 安全的事件目标类型转换
   */
  static asHTMLElement(target: EventTarget | null): HTMLElement | null {
    return target instanceof HTMLElement ? target : null;
  }

  /**
   * 安全获取事件目标的数据属性
   */
  static getDataAttribute(target: EventTarget | null, attributeName: string): string | null {
    const element = this.asHTMLElement(target);
    if (!element) return null;

    return element.getAttribute(`data-${attributeName}`);
  }

  /**
   * 安全获取事件目标的类名
   */
  static getClassName(target: EventTarget | null): string {
    const element = this.asHTMLElement(target);
    return element?.className || '';
  }

  /**
   * 检查事件目标是否包含指定类名
   */
  static hasClass(target: EventTarget | null, className: string): boolean {
    const element = this.asHTMLElement(target);
    return element?.classList.contains(className) || false;
  }

  /**
   * 安全获取滚动信息
   */
  static getScrollInfo(target: EventTarget | null): {
    scrollTop: number;
    scrollLeft: number;
    scrollHeight: number;
    scrollWidth: number;
    clientHeight: number;
    clientWidth: number;
  } | null {
    if (!this.isScrollTarget(target)) return null;

    return {
      scrollTop: target.scrollTop,
      scrollLeft: target.scrollLeft,
      scrollHeight: target.scrollHeight,
      scrollWidth: target.scrollWidth,
      clientHeight: target.clientHeight,
      clientWidth: target.clientWidth
    };
  }

  /**
   * 检查是否滚动到底部
   */
  static isScrolledToBottom(target: EventTarget | null, threshold: number = 10): boolean {
    const scrollInfo = this.getScrollInfo(target);
    if (!scrollInfo) return false;

    return scrollInfo.scrollTop + scrollInfo.clientHeight >= scrollInfo.scrollHeight - threshold;
  }

  /**
   * 检查是否滚动到顶部
   */
  static isScrolledToTop(target: EventTarget | null, threshold: number = 10): boolean {
    const scrollInfo = this.getScrollInfo(target);
    if (!scrollInfo) return false;

    return scrollInfo.scrollTop <= threshold;
  }

  /**
   * 创建防抖事件处理器
   */
  static createDebouncedHandler<T extends Event>(
    handler: (event: T) => void,
    delay: number = 300
  ): (event: T) => void {
    let timeoutId: number | undefined;

    return (event: T) => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        handler(event);
        timeoutId = undefined;
      }, delay);
    };
  }

  /**
   * 创建节流事件处理器
   */
  static createThrottledHandler<T extends Event>(
    handler: (event: T) => void,
    delay: number = 100
  ): (event: T) => void {
    let lastCall = 0;

    return (event: T) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        handler(event);
      }
    };
  }

  /**
   * 创建一次性事件处理器
   */
  static createOnceHandler<T extends Event>(handler: (event: T) => void): (event: T) => void {
    let called = false;

    return (event: T) => {
      if (!called) {
        called = true;
        handler(event);
      }
    };
  }

  /**
   * 安全的键盘事件处理
   */
  static isKeyPressed(event: KeyboardEvent, key: string): boolean {
    return event.key === key || event.code === key;
  }

  /**
   * 检查修饰键状态
   */
  static getModifierKeys(event: KeyboardEvent): {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
  } {
    return {
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey
    };
  }

  /**
   * 安全的鼠标事件处理
   */
  static getMousePosition(event: MouseEvent): {
    clientX: number;
    clientY: number;
    pageX: number;
    pageY: number;
    screenX: number;
    screenY: number;
  } {
    return {
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY,
      screenX: event.screenX,
      screenY: event.screenY
    };
  }

  /**
   * 检查鼠标按键状态
   */
  static getMouseButton(event: MouseEvent): 'left' | 'middle' | 'right' | 'unknown' {
    switch (event.button) {
      case 0:
        return 'left';
      case 1:
        return 'middle';
      case 2:
        return 'right';
      default:
        return 'unknown';
    }
  }
}

// ============================================================================
// 便捷的工具函数
// ============================================================================

/**
 * 快速获取组件DOM元素
 */
export const getComponentElement = (ref: SafeComponentRef): HTMLElement | null => {
  return SafeComponentRefHelper.getElement(ref);
};

/**
 * 快速调用组件方法
 */
export const callComponentMethod = <T = any>(
  ref: SafeComponentRef,
  methodName: string,
  ...args: any[]
): T | undefined => {
  return SafeComponentRefHelper.callMethod<T>(ref, methodName, ...args);
};

/**
 * 快速安全滚动
 */
export const safeScrollTo = (element: HTMLElement | null, options: ScrollToOptions): boolean => {
  return SafeDOMHelper.scrollTo(element, options);
};

/**
 * 快速安全事件监听
 */
export const safeAddEventListener = (
  element: HTMLElement | null,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
): boolean => {
  return SafeDOMHelper.addEventListener(element, event, handler, options);
};

/**
 * 快速安全事件移除
 */
export const safeRemoveEventListener = (
  element: HTMLElement | null,
  event: string,
  handler: EventListener,
  options?: EventListenerOptions
): boolean => {
  return SafeDOMHelper.removeEventListener(element, event, handler, options);
};

/**
 * 快速检查滚动目标
 */
export const isScrollTarget = (target: EventTarget | null): target is HTMLElement => {
  return SafeEventHelper.isScrollTarget(target);
};

/**
 * 快速检查输入目标
 */
export const isInputTarget = (target: EventTarget | null): target is HTMLInputElement => {
  return SafeEventHelper.isInputTarget(target);
};

/**
 * 快速获取滚动信息
 */
export const getScrollInfo = (target: EventTarget | null) => {
  return SafeEventHelper.getScrollInfo(target);
};

/**
 * 快速检查是否滚动到底部
 */
export const isScrolledToBottom = (target: EventTarget | null, threshold?: number): boolean => {
  return SafeEventHelper.isScrolledToBottom(target, threshold);
};

/**
 * 快速创建防抖处理器
 */
export const createDebouncedHandler = <T extends Event>(
  handler: (event: T) => void,
  delay?: number
): ((event: T) => void) => {
  return SafeEventHelper.createDebouncedHandler(handler, delay);
};

/**
 * 快速创建节流处理器
 */
export const createThrottledHandler = <T extends Event>(
  handler: (event: T) => void,
  delay?: number
): ((event: T) => void) => {
  return SafeEventHelper.createThrottledHandler(handler, delay);
};

/**
 * 快速获取鼠标位置
 */
export const getMousePosition = (event: MouseEvent) => {
  return SafeEventHelper.getMousePosition(event);
};

/**
 * 快速检查按键
 */
export const isKeyPressed = (event: KeyboardEvent, key: string): boolean => {
  return SafeEventHelper.isKeyPressed(event, key);
};

/**
 * 默认导出
 */
export default {
  SafeComponentRefHelper,
  SafeDOMHelper,
  SafeEventHelper,
  getComponentElement,
  callComponentMethod,
  safeScrollTo,
  safeAddEventListener,
  safeRemoveEventListener
};
