/**
 * 通用Vue组件引用工具
 * 统一处理Vue组件引用的类型问题
 */

/**
 * 获取组件的DOM元素
 * @param ref Vue组件引用
 * @returns HTMLElement或null
 */
export const getComponentElement = (ref: any): HTMLElement | null => {
  if (!ref) return null;

  // 如果是Vue组件实例，获取$el
  if (ref.value?.$el) {
    return ref.value.$el;
  }

  // 如果是直接的DOM元素
  if (ref.value instanceof HTMLElement) {
    return ref.value;
  }

  // 如果ref本身就是DOM元素
  if (ref instanceof HTMLElement) {
    return ref;
  }

  return null;
};

/**
 * 安全地滚动到指定位置
 * @param ref Vue组件引用
 * @param options 滚动选项
 */
export const scrollToPosition = (ref: any, options: ScrollToOptions) => {
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
export const getScrollTop = (ref: any): number => {
  const element = getComponentElement(ref);
  return element?.scrollTop || 0;
};

/**
 * 安全地设置组件的scrollTop
 * @param ref Vue组件引用
 * @param scrollTop 滚动位置
 */
export const setScrollTop = (ref: any, scrollTop: number) => {
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
export const getClientHeight = (ref: any): number => {
  const element = getComponentElement(ref);
  return element?.clientHeight || 0;
};

/**
 * 获取组件的滚动高度
 * @param ref Vue组件引用
 * @returns 滚动高度
 */
export const getScrollHeight = (ref: any): number => {
  const element = getComponentElement(ref);
  return element?.scrollHeight || 0;
};

/**
 * 检查是否滚动到底部
 * @param ref Vue组件引用
 * @param threshold 阈值（默认10px）
 * @returns 是否接近底部
 */
export const isNearBottom = (ref: any, threshold = 10): boolean => {
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
export const callComponentMethod = (ref: any, methodName: string, ...args: any[]): any => {
  if (!ref?.value) return undefined;

  const component = ref.value;
  const method = component[methodName];

  if (typeof method === 'function') {
    return method.apply(component, args);
  }

  return undefined;
};

/**
 * 安全地获取组件属性
 * @param ref Vue组件引用
 * @param propertyName 属性名
 * @returns 属性值
 */
export const getComponentProperty = (ref: any, propertyName: string): any => {
  if (!ref?.value) return undefined;

  return ref.value[propertyName];
};

/**
 * 安全地设置组件属性
 * @param ref Vue组件引用
 * @param propertyName 属性名
 * @param value 属性值
 */
export const setComponentProperty = (ref: any, propertyName: string, value: any): void => {
  if (!ref?.value) return;

  ref.value[propertyName] = value;
};

/**
 * 获取事件目标的滚动信息
 * @param event 滚动事件
 * @returns 滚动信息对象
 */
export const getScrollInfo = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target) {
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
