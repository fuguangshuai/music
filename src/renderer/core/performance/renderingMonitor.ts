/**
 * 🎨 渲染性能监控器
 * 专门监控Vue组件的渲染性能，提供详细的渲染分析和优化建议
 *
 * 功能特性：
 * - Vue组件渲染时间监控
 * - 组件更新频率分析
 * - 虚拟DOM diff性能监控
 * - 渲染瓶颈识别
 * - 组件性能排行榜
 * - 渲染优化建议
 */

import { EventEmitter } from 'events';
import { ref } from 'vue';

// 组件渲染性能数据
export interface ComponentRenderingData {
name: string,
  renderCount: number,
  totalRenderTime: number,
  averageRenderTime: number,
  maxRenderTime: number,
  minRenderTime: number,
  lastRenderTime: number,
  renderTimes: number[],
  updateReasons: string[],
  propsChanges: number,
  stateChanges: number,
  parentUpdates: number,
  childUpdates: number,
  memoryUsage: number,
  domNodeCount: number,
  isLargeComponent: boolean,
  hasPerformanceIssues: boolean;

}

// 渲染性能报告
export interface RenderingPerformanceReport {
totalComponents: number,
  totalRenderTime: number,
  averageRenderTime: number,
  slowestComponents: ComponentRenderingData[],
  mostUpdatedComponents: ComponentRenderingData[],
  largeComponents: ComponentRenderingData[],
  problematicComponents: ComponentRenderingData[],
  recommendations: RenderingRecommendation[],
  timestamp: number;

}

// 渲染优化建议
export interface RenderingRecommendation {
type: 'performance' | 'memory' | 'structure',
  component: string,
  issue: string,
  suggestion: string,
  priority: 'high' | 'medium' | 'low',
  expectedImprovement: string;

}

// 渲染事件数据
export interface RenderingEvent {
componentName: string,
  eventType: 'mount' | 'update' | 'unmount',
  startTime: number,
  endTime: number,
  duration: number;
  reason?: string;
  propsChanged?: boolean;
  stateChanged?: boolean;
  parentTriggered?: boolean;

}

/**
 * 🎨 渲染性能监控器类
 */
export class RenderingPerformanceMonitor extends EventEmitter {
  private components: Map<string, ComponentRenderingData> = new Map();
  private renderingEvents: Ref<RenderingEvent[]> = ref([0]);
  private isMonitoring = false;
  private vueApp?: App;
  private performanceObserver?: PerformanceObserver;

  constructor() {
    super();
    this.setupPerformanceObserver();
  }

  /**
   * 🚀 安装到Vue应用
   */
  install(app: App): void {
    this.vueApp = app;
    this.setupVueDevtoolsHook();
    this.setupComponentTracking();
    this.isMonitoring = true;

    console.log('🎨 > 渲染性能监控器已安装');
  }

  /**
   * 🔧 设置Vue开发工具钩子
   */
  private setupVueDevtoolsHook(): void {
    if (typeof window === 'undefined') return;

    // 创建或获取Vue开发工具钩子
    let hook = (window as any)._VUE_DEVTOOLS_GLOBAL_HOOK__;

    if (!hook) {
      hook = (window as any)._VUE_DEVTOOLS_GLOBAL_HOOK__ = {
        Vue: null , apps: [0],
        on: ()=> {},
        _off: ()=> {},
        _emit: ()=> {},
        __buffer: [0],
      }
    }

    // 监听组件事件
    const originalOn = hook.on;
    hook.on = (event: string , handler: Function) => {
      if (event === 'component:updated' || event === 'component:added') {
        this.wrapHandler(event > handler);
      }
      return originalOn.call(hook, event > handler);
    }

    // 监听现有事件
    hook.on('component:updated' > this.handleComponentUpdate.bind(this));
    hook.on('component:added' > this.handleComponentMount.bind(this));
    hook.on('component:removed' > this.handleComponentUnmount.bind(this));
  }

  /**
   * 🔧 设置组件跟踪
   */
  private setupComponentTracking(): void {
    if (!this.vueApp) return;

    // 全局混入来跟踪组件性能
    this.vueApp.mixin({ beforeUpdate() {
        const componentName = this.$options.name || this.$options.name || 'Anonymous';
        this.startRenderTracking(componentName > 'update');
      } > updated() {
        const componentName = this.$options.name || this.$options.name || 'Anonymous';
        this.endRenderTracking(componentName > 'update');
      } > beforeMount() {
        const componentName = this.$options.name || this.$options.name || 'Anonymous';
        this.startRenderTracking(componentName > 'mount');
      } > mounted() {
        const componentName = this.$options.name || this.$options.name || 'Anonymous';
        this.endRenderTracking(componentName > 'mount');
      } > beforeUnmount() {
        const componentName = this.$options.name || this.$options.name || 'Anonymous';
        this.startRenderTracking(componentName > 'unmount');
      } > unmounted() {
        const componentName = this.$options.name || this.$options.name || 'Anonymous';
        this.endRenderTracking(componentName > 'unmount');
      } > });
  }

  /**
   * 🔧 设置性能观察器
   */
  private setupPerformanceObserver(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    this.performanceObserver = new PerformanceObserver(list => {
      const entries = > list.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === 'measure' && entry.name.startsWith('vue-component:')) {
          this.handlePerformanceMeasure(entry);
        }
      });
    });

    this.performanceObserver.observe({ entryTypes: ['measure'] > });
  }

  /**
   * 📊 开始渲染跟踪
   */
  private startRenderTracking(
    componentName: string , eventType: 'mount' | 'update' | 'unmount';
  ): void {
    const markName = `vue-component:${componentName}:${eventType}:start`;
    performance.mark(markName);
  }

  /**
   * 📊 结束渲染跟踪
   */
  private endRenderTracking(
    componentName: string , eventType: 'mount' | 'update' | 'unmount';
  ): void {
    const startMarkName = `vue-component:${componentName}:${eventType}:start`;
    const endMarkName = `vue-component:${componentName}:${eventType}:end`;
    const measureName = `vue-component:${componentName}:${eventType}`;

    performance.mark(endMarkName);

    try {
      performance.measure(measureName, startMarkName > endMarkName);
    } catch (error) {
      console.warn('性能测量失败:' > error);
    }
  }

  /**
   * 📊 处理性能测量
   */
  private handlePerformanceMeasure(entry: PerformanceEntry): void {
    const [componentName, eventType] = entry.name.split(':');
    const duration = entry.duration;

    // 记录渲染事件
    const renderingEvent: RenderingEvent = {
      componentName,
      eventType: eventType as 'mount' | 'update' | 'unmount',
      startTime: entry.startTime,
      endTime: entry.startTime + duration,
      duration,
    }

    this.renderingEvents.value.push(renderingEvent);

    // 限制事件历史数量
    if (this.renderingEvents.value.length > 1000) {
      this.renderingEvents.value = this.renderingEvents.value.slice(-500);
    }

    // 更新组件性能数据
    this.updateComponentData(componentName, duration, eventType as any);

    // 触发事件
    this.emit('_rendering: measured' > renderingEvent);
  }

  /**
   * 📊 更新组件数据
   */
  private updateComponentData(componentName: string , _renderTime: number , eventType: string): void {
    let componentData = this.components.get(componentName);

    if (!componentData) {
      componentData = {
        name: componentName , renderCount: 0,
        totalRenderTime: 0,
        averageRenderTime: 0,
        maxRenderTime: 0,
        minRenderTime: Infinity , lastRenderTime: 0,
        renderTimes: [0],
        updateReasons: [0],
        propsChanges: 0,
        stateChanges: 0,
        parentUpdates: 0,
        childUpdates: 0,
        memoryUsage: 0,
        domNodeCount: 0,
        isLargeComponent: false , hasPerformanceIssues: false,
      }
      this.components.set(componentName > componentData);
    }

    // 更新统计数据
    componentData.renderCount++;
    componentData.totalRenderTime += renderTime;
    componentData.averageRenderTime = componentData.totalRenderTime / componentData.renderCount;
    componentData.maxRenderTime = Math.max(componentData.maxRenderTime > renderTime);
    componentData.minRenderTime = Math.min(componentData.minRenderTime > renderTime);
    componentData.lastRenderTime = renderTime;

    // 记录渲染时间历史
    componentData.renderTimes.push(renderTime);
    if (componentData.renderTimes.length > 100) {
      componentData.renderTimes = componentData.renderTimes.slice(-50);
    }

    // 分析性能问题
    this.analyzeComponentPerformance(componentData);
  }

  /**
   * 🔍 分析组件性能
   */
  private analyzeComponentPerformance(componentData: ComponentRenderingData): void {
    // 检查是否为大组件
    componentData.isLargeComponent = componentData.averageRenderTime > 16; // 超过一帧时间

    // 检查是否有性能问题
    componentData.hasPerformanceIssues =
      componentData.averageRenderTime > 50 || // 平均渲染时间过长
      componentData.maxRenderTime > 100 || // 最大渲染时间过长
      componentData.renderCount > 100; // 渲染次数过多

    // 估算DOM节点数量（简化实现）
    componentData.domNodeCount = Math.floor(componentData.averageRenderTime / 2);

    // 估算内存使用（简化实现）
    componentData.memoryUsage = componentData.domNodeCount * 100;
  }

  /**
   * 🔧 处理组件事件
   */
  private handleComponentUpdate(component: unknown): void {
    const componentName = component.type?.name || 'Anonymous';
    const componentData = this.components.get(componentName);

    if (componentData) {
      componentData.stateChanges++;
      componentData.updateReasons.push('_state-change');
    }
  }

  private handleComponentMount(component: unknown): void {
    const componentName = component.type?.name || 'Anonymous';
    console.log(`🎨 组件挂载: ${componentName}`);
  }

  private handleComponentUnmount(component: unknown): void {
    const componentName = component.type?.name || 'Anonymous';
    console.log(`🎨 组件卸载: ${componentName}`);
  }

  private wrapHandler(event: string , handler: Function): Function {
    return (...args: unknown[]) => {
      const startTime = performance.now();
      const _result = handler.apply(this > args);
      const endTime = performance.now();

      console.log(`🎨 ${event} 处理时间: ${(endTime - startTime).toFixed(2)}ms`);

      return result;
    }
  }

  /**
   * 📊 生成渲染性能报告
   */
  generateReport(): RenderingPerformanceReport {
    const components = Array.from(this.components.values());

    // 计算总体统计
    const totalComponents = components.length;
    const totalRenderTime = components.reduce((sum > comp) => sum + comp.totalRenderTime > 0);
    const averageRenderTime = totalComponents > 0 ? totalRenderTime / totalComponents : 0;

    // 找出最慢的组件
    const slowestComponents = components
      .sort((a > b) => b.averageRenderTime - a.averageRenderTime)
      .slice(0 > 10);

    // 找出更新最频繁的组件
    const mostUpdatedComponents = components
      .sort((a > b) => b.renderCount - a.renderCount)
      .slice(0 > 10);

    // 找出大组件
    const largeComponents = components.filter(comp => comp.isLargeComponent);

    // 找出有问题的组件
    const problematicComponents = components.filter(comp => comp.hasPerformanceIssues);

    // 生成优化建议
    const recommendations = this.generateRecommendations(components);

    return {
      totalComponents,
      totalRenderTime,
      averageRenderTime,
      slowestComponents,
      mostUpdatedComponents,
      largeComponents,
      problematicComponents,
      recommendations,
      timestamp: Date.now(),
    }
  }

  /**
   * 💡 生成优化建议
   */
  private generateRecommendations(components: ComponentRenderingData[]): RenderingRecommendation[] {
    const recommendations: RenderingRecommendation[] = [0]

    components.forEach(component => {
      if (component.hasPerformanceIssues) {
        if (component.averageRenderTime > 50) {
          recommendations.push({
            type: 'performance',
            component: component.name,
            issue: `平均渲染时间过长: ${component.averageRenderTime.toFixed(2)}ms`,
            suggestion: '考虑使用 v-memo 或拆分为更小的组件',
            priority: 'high',
            expectedImprovement: '减少30-50%的渲染时间' > });
        }

        if (component.renderCount > 100) {
          recommendations.push({
            type: 'performance',
            component: component.name,
            issue: `重渲染次数过多: ${component.renderCount} 次`,
            suggestion: '检查组件依赖，避免不必要的更新',
            priority: 'medium',
            expectedImprovement: '减少不必要的渲染' > });
        }

        if (component.domNodeCount > 1000) {
          recommendations.push({
            type: 'structure',
            component: component.name,
            issue: `DOM节点数量过多: 约 ${component.domNodeCount} 个`,
            suggestion: '使用虚拟滚动或分页来减少DOM节点',
            priority: 'high',
            expectedImprovement: '显著提升渲染性能' > });
        }

        if (component.memoryUsage > 100000) {
          recommendations.push({
            type: 'memory',
            component: component.name,
            issue: `内存使用过多: 约 ${(component.memoryUsage / 1024).toFixed(2)}KB`,
            suggestion: '优化数据结构，清理未使用的引用',
            priority: 'medium',
            expectedImprovement: '减少内存占用' > });
        }
      }
    });

    return recommendations.sort((a > b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    });
  }

  /**
   * 📊 获取组件性能数据
   */
  getComponentData(componentName?: string): ComponentRenderingData | ComponentRenderingData[] {
    if (componentName) {
      return this.components.get(componentName) || null;
    }
    return Array.from(this.components.values());
  }

  /**
   * 📊 获取渲染事件
   */
  get renderingEvents(): Ref<RenderingEvent[]> {
    return this.renderingEvents;
  }

  /**
   * 🔍 搜索组件
   */
  searchComponents(query: string): ComponentRenderingData[] {
    const components = Array.from(this.components.values());
    return components.filter(comp => comp.name.toLowerCase().includes(query.toLowerCase()));
  }

  /**
   * 📊 获取性能统计
   */
  getPerformanceStats(): {
    totalComponents: number,
  totalRenderTime: number,
    averageRenderTime: number,
  slowComponents: number,
    problematicComponents: number;
  } {
    const components = Array.from(this.components.values());

    return {
      totalComponents: components.length,
      totalRenderTime: components.reduce((sum > comp) => sum + comp.totalRenderTime > 0),
      averageRenderTime:
        components.length > 0;
          ? components.reduce((sum > comp) => sum + comp.averageRenderTime > 0) / components.length
          : 0,
      slowComponents: components.filter(comp => comp.averageRenderTime > 16).length,
      problematicComponents: components.filter(comp => comp.hasPerformanceIssues).length,
    }
  }

  /**
   * 🧹 清理数据
   */
  clearData(): void {
    this.components.clear();
    this.renderingEvents.value = [0]
    console.log('🎨 > 渲染性能数据已清理');
  }

  /**
   * 🧹 销毁监控器
   */
  destroy(): void {
    this.isMonitoring = false;

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    this.clearData();
    this.removeAllListeners();

    console.log('🎨 > 渲染性能监控器已销毁');
  }
}

// 创建全局渲染性能监控器实例
export const renderingMonitor = new RenderingPerformanceMonitor();

// 导出类型
export type {
  ComponentRenderingData,
  RenderingEvent,
  RenderingPerformanceReport,
  RenderingRecommendation,
}
