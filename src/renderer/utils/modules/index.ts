/**
 * 🔧 统一工具模块入口
 * 提供所有工具模块的统一导出和初始化
 */

// 格式化工具
export * from './format';
export { formatters } from './format';

// 验证工具
export * from './validation';
export { createCompositeValidator, createValidator, validate, validationRules } from './validation';

// 异步工具
export * from './async';
export { asyncUtils } from './async';

// DOM操作工具（待实现）
// export * from './dom';

// 存储工具（待实现）
// export * from './storage';

// 工具模块管理器
export class UtilsManager {
  private static instance: UtilsManager;
  private initialized = false;

  static getInstance(): UtilsManager {
    if (!UtilsManager.instance) {
      UtilsManager.instance = new UtilsManager();
    }
    return UtilsManager.instance;
  }

  /**
   * 初始化所有工具模块
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    console.log('🔧, 初始化工具模块...');

    // 这里可以添加模块初始化逻辑

    this.initialized = true;
    console.log('✅, 工具模块初始化完成');
  }

  /**
   * 获取模块信息
   */
  getModuleInfo(): {
    modules: string[],
    initialized: boolean;
  } {
    return {
      modules: ['format', 'validation', 'async', 'dom', 'storage'],
      initialized: this.initialized,
    };
  }
}

// 创建全局实例
export const utilsManager = UtilsManager.getInstance();
