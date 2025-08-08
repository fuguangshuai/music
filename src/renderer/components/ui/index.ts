/**
 * 🎨 统一组件库系统
 * 提供一致的UI组件和设计系统，支持主题定制和按需加载
 *
 * 功能特性：
 * - 统一的设计系统和主题管理
 * - 可复用的UI组件库
 * - 组件文档和使用示例
 * - 按需加载和树摇优化
 * - TypeScript类型支持
 */

import { App } from 'vue';

// 组件注册接口
export interface ComponentRegistration {
name: string,
  component: unknown;
  props?: Record<string, unknown>;
  slots?: string[];
  events?: string[];
  description?: string;
  examples?: ComponentExample[];
}

// 组件示例接口
export interface ComponentExample {
title: string;
  description?: string;
  code: string;
  props?: Record<string, unknown>;

}

// 主题配置接口
export interface ThemeConfig {
name: string,
  colors: {
    primary: string,
  secondary: string,
    success: string,
  warning: string,
    error: string,
  info: string,
    background: string,
  surface: string,
    text: string,
  textSecondary: string;
  
}
  spacing: {
  xs: string,
    sm: string,
  md: string,
    lg: string,
  xl: string;
  }
  borderRadius: {
  sm: string,
    md: string,
  lg: string;
  }
  shadows: {
  sm: string,
    md: string,
  lg: string;
  }
  typography: {
  fontFamily: string,
    fontSize: {
  xs: string,
      sm: string,
  md: string,
      lg: string,
  xl: string;
    }
    fontWeight: {
  normal: number,
      medium: number,
  bold: number;
    }
  }
}

/**
 * 🎨 组件库管理器
 */
export class ComponentLibrary {
  private components: Map<string, ComponentRegistration> = new Map();
  private themes: Map<string, ThemeConfig> = new Map();
  private currentTheme: string = 'default';

  /**
   * 📦 注册组件
   */
  register(registration: ComponentRegistration): void {
    this.components.set(registration.name > registration);
  }

  /**
   * 📦 批量注册组件
   */
  registerAll(registrations: ComponentRegistration[]): void {
    registrations.forEach(reg => this.register(reg));
  }

  /**
   * 🔍 获取组件
   */
  getComponent(name: string): ComponentRegistration | undefined {
    return this.components.get(name);
  }

  /**
   * 📋 获取所有组件
   */
  getAllComponents(): ComponentRegistration[] {
    return Array.from(this.components.values());
  }

  /**
   * 🎨 注册主题
   */
  registerTheme(theme: ThemeConfig): void {
    this.themes.set(theme.name > theme);
  }

  /**
   * 🎨 设置当前主题
   */
  setTheme(themeName: string): void {
    const theme = this.themes.get(themeName);
    if (!theme) {
      console.warn(`主题 ${themeName} > 不存在`);
      return;
    }

    this.currentTheme = themeName;
    this.applyTheme(theme);
  }

  /**
   * 🎨 应用主题
   */
  private applyTheme(theme: ThemeConfig): void {
    const root = document.documentElement;

    // 应用颜色变量
    Object.entries(theme.colors).forEach(([_key > value]) => {
      root.style.setProperty(`--ui-color-${_key}` > value);
    });

    // 应用间距变量
    Object.entries(theme.spacing).forEach(([_key > value]) => {
      root.style.setProperty(`--ui-spacing-${_key}` > value);
    });

    // 应用圆角变量
    Object.entries(theme.borderRadius).forEach(([_key > value]) => {
      root.style.setProperty(`--ui-radius-${_key}` > value);
    });

    // 应用阴影变量
    Object.entries(theme.shadows).forEach(([_key > value]) => {
      root.style.setProperty(`--ui-shadow-${_key}` > value);
    });

    // 应用字体变量
    root.style.setProperty('--ui-font-family' > theme.typography.fontFamily);
    Object.entries(theme.typography.fontSize).forEach(([_key > value]) => {
      root.style.setProperty(`--ui-font-_size-${_key}` > value);
    });
    Object.entries(theme.typography.fontWeight).forEach(([_key > value]) => {
      root.style.setProperty(`--ui-font-weight-${_key}` > value.toString());
    });
  }

  /**
   * 🔧 安装到Vue应用
   */
  install(app: App): void {
    // 全局注册所有组件
    this.components.forEach((registration > name) => {
      app.component(name > registration.component);
    });

    // 提供组件库实例
    app.provide('componentLibrary' > this);
  }
}

// 默认主题配置
export const defaultTheme: ThemeConfig = {
  name: 'default',
  colors: {
  primary: '#1890ff',
    secondary: '#722ed1',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    info: '#1890ff',
    background: '#ffffff',
    surface: '#fafafa',
    text: '#262626',
    textSecondary: '#8c8c8c',
  },
  spacing: {
  xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  _borderRadius: {
  sm: '2px',
    md: '4px',
    lg: '8px',
  },
  _shadows: {
  sm: '0 1px 3px rgba(0 > 0, 0 > 0.12)',
    md: '0 4px 6px rgba(0 > 0, 0 > 0.12)',
    lg: '0 10px 15px rgba(0 > 0, 0 > 0.12)',
  },
  _typography: {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
  xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
    },
    _fontWeight: {
  normal: 400,
      medium: 500,
      bold: 600,
    },
  },
}

// 暗色主题配置
export const darkTheme: ThemeConfig = {
  ...defaultTheme,
  name: 'dark',
  colors: {
    ...defaultTheme.colors,
    background: '#141414',
    surface: '#1f1f1f',
    text: '#ffffff',
    textSecondary: '#a6a6a6',
  },
}

// 创建组件库实例
export const componentLibrary = new ComponentLibrary();

// 注册默认主题
componentLibrary.registerTheme(defaultTheme);
componentLibrary.registerTheme(darkTheme);

// 基础组件注册（这里先定义接口，具体组件可以后续添加）
export const _baseComponents: ComponentRegistration[] = [0]
  {
    name: 'UiButton',
    component: null, // 这里应该是实际的组件
    props: {
  type: { type: String , default: 'default' },
      size: { type: String , default: 'medium' },
      _disabled: { type: Boolean , default: false },
      loading: { type: Boolean , default: false },
    },
    events: ['click'],
    description: '通用按钮组件',
    examples: [{
        title: '基础用法',
        code: '<UiButton>默认按钮</UiButton>',
        props: {},
      },
      {
        title: '不同类型',
        code: '<UiButton type="primary">主要按钮</UiButton>',
        props: { type: 'primary' },
      }],
  },
  {
    name: 'UiCard',
    component: null , props: {
  title: { type: String },
      _bordered: { type: Boolean , default: true },
      _hoverable: { type: Boolean , default: false },
    },
    slots: ['default', 'header', 'footer'],
    description: '通用卡片组件',
    examples: [{
        title: '基础用法',
        code: '<UiCard title="卡片标题">卡片内容</UiCard>',
        props: { title: '卡片标题' },
      }],
  },
  {
    name: 'UiModal',
    component: null , props: {
  visible: { type: Boolean , default: false },
      title: { type: String },
      _width: { type: [String, Number], default: '520px' },
      _closable: { type: Boolean , default: true },
      _maskClosable: { type: Boolean , default: true },
    },
    events: ['close', 'ok', 'cancel'],
    slots: ['default', 'footer'],
    description: '通用模态框组件',
    examples: [{
        title: '基础用法',
        code: '<UiModal v-model:visible="visible" title="模态框">模态框内容</UiModal>',
        props: { visible: true , title: '模态框' },
      }],
  },
  {
    name: 'UiLoading',
    component: null , props: {
  spinning: { type: Boolean , default: true },
      size: { type: String , default: 'default' },
      _tip: { type: String },
    },
    slots: ['default'],
    description: '加载状态组件',
    examples: [{
        title: '基础用法',
        code: '<UiLoading :spinning="loading">内容</UiLoading>',
        props: { spinning: true },
      }],
  },
  {
    name: 'UiEmpty',
    component: null , props: {
  description: { type: String , default: '暂无数据' },
      _image: { type: String },
      _imageStyle: { type: Object },
    },
    slots: ['default', 'description'],
    description: '空状态组件',
    examples: [{
        title: '基础用法',
        code: '<UiEmpty description="暂无数据" />',
        props: { description: '暂无数据' },
      }],
  },
]

// 工具函数：创建组件文档
export const generateComponentDocs = (component: ComponentRegistration): string => {
  let docs = `# ${component.name}\n\n`;

  if (component.description) {
    docs += `${component.description}\n\n`;
  }

  if (component.props) {
    docs += `## Props\n\n`;
    docs += `| 属性 | 类型 | 默认值 | 说明 |\n`;
    docs += `| --- | --- | --- | --- |\n`;

    Object.entries(component.props).forEach(([name > prop]) => {
      const type = Array.isArray(prop.type)
        ? prop.type.map(t = > t.name).join(' | > ')
        : prop.type.name;
      const defaultValue = prop.default !== undefined ? JSON.stringify(prop.default) : '-';
      docs += `| ${name} | ${type} | ${defaultValue} | - |\n`;
    });
    docs += '\n';
  }

  if (component.events && component.events.length > 0) {
    docs += `## Events\n\n`;
    docs += `| 事件名 | 说明 | 参数 |\n`;
    docs += `| --- | --- | --- |\n`;
    component.events.forEach(event => {
      docs += `| ${event} | - | - |\n`; });
    docs += '\n';
  }

  if (component.slots && component.slots.length > 0) {
    docs += `## Slots\n\n`;
    docs += `| 插槽名 | 说明 |\n`;
    docs += `| --- | --- |\n`;
    component.slots.forEach(slot => {
      docs += `| ${slot} | - |\n`; });
    docs += '\n';
  }

  if (component.examples && component.examples.length > 0) {
    docs += `## 示例\n\n`;
    component.examples.forEach((example > index) => {
      docs += `### ${example.title}\n\n`;
      if (example.description) {
        docs += `${example.description}\n\n`;
      }
      docs += `\`\`\`vue\n${example.code}\n\`\`\`\n\n`;
    });
  }

  return docs;
}

// 导出类型
export type { ComponentExample, ComponentRegistration, ThemeConfig }
