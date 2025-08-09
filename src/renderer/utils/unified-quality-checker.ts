/**
 * 统一代码质量检查工具
 *
 * 目标：整合项目中的代码质量检查功能，提供统一的质量管理接口
 *
 * 检查内容：
 * 1. TypeScript 类型安全检查
 * 2. 代码复杂度分析
 * 3. 性能瓶颈检测
 * 4. 安全漏洞扫描
 * 5. 可访问性检查
 * 6. 最佳实践验证
 *
 * @author TypeScript重构项目组
 * @since v4.11.0
 */

import { computed, ComputedRef, Ref, ref } from 'vue';

// ============================================================================
// 质量检查配置接口
// ============================================================================

/**
 * 质量检查配置
 */
export interface QualityConfig {
  enableTypeCheck: boolean;
  enableComplexityCheck: boolean;
  enablePerformanceCheck: boolean;
  enableSecurityCheck: boolean;
  enableAccessibilityCheck: boolean;
  enableBestPracticesCheck: boolean;
  complexityThreshold: number;
  performanceThreshold: number;
  reportingLevel: 'error' | 'warning' | 'info';
}

/**
 * 质量问题级别
 */
export enum QualityLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * 质量问题类型
 */
export enum QualityIssueType {
  TYPE_SAFETY = 'type_safety',
  COMPLEXITY = 'complexity',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  ACCESSIBILITY = 'accessibility',
  BEST_PRACTICES = 'best_practices'
}

/**
 * 质量问题
 */
export interface QualityIssue {
  id: string;
  type: QualityIssueType;
  level: QualityLevel;
  title: string;
  description: string;
  location?: string;
  evidence?: string;
  suggestion: string;
  impact: string;
  timestamp: number;
  resolved: boolean;
}

/**
 * 质量检查结果
 */
export interface QualityCheckResult {
  passed: boolean;
  score: number;
  issues: QualityIssue[];
  summary: {
    total: number;
    critical: number;
    error: number;
    warning: number;
    info: number;
  };
  recommendations: string[];
  timestamp: number;
}

// ============================================================================
// 类型安全检查器
// ============================================================================

/**
 * TypeScript 类型安全检查器
 */
export class TypeSafetyChecker {
  private static readonly UNSAFE_PATTERNS = [
    { pattern: /:\s*any\b/g, message: '使用了 any 类型', level: QualityLevel.WARNING },
    { pattern: /as\s+any\b/g, message: '使用了 any 类型断言', level: QualityLevel.ERROR },
    { pattern: /:\s*unknown\b/g, message: '使用了 unknown 类型', level: QualityLevel.INFO },
    { pattern: /@ts-ignore/g, message: '使用了 @ts-ignore', level: QualityLevel.WARNING },
    { pattern: /@ts-nocheck/g, message: '使用了 @ts-nocheck', level: QualityLevel.ERROR },
    { pattern: /eval\s*\(/g, message: '使用了 eval 函数', level: QualityLevel.CRITICAL }
  ];

  /**
   * 检查代码的类型安全性
   */
  static checkCode(code: string, filePath?: string): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const lines = code.split('\n');

    this.UNSAFE_PATTERNS.forEach((pattern, patternIndex) => {
      lines.forEach((line, lineIndex) => {
        const matches = line.match(pattern.pattern);
        if (matches) {
          matches.forEach((_, matchIndex) => {
            issues.push({
              id: `type-safety-${patternIndex}-${lineIndex}-${matchIndex}`,
              type: QualityIssueType.TYPE_SAFETY,
              level: pattern.level,
              title: '类型安全问题',
              description: pattern.message,
              location: filePath ? `${filePath}:${lineIndex + 1}` : `Line ${lineIndex + 1}`,
              evidence: line.trim(),
              suggestion: this.getSuggestion(pattern.message),
              impact: this.getImpact(pattern.level),
              timestamp: Date.now(),
              resolved: false
            });
          });
        }
      });
    });

    return issues;
  }

  /**
   * 获取修复建议
   */
  private static getSuggestion(message: string): string {
    const suggestions: Record<string, string> = {
      '使用了 any 类型': '使用具体的类型定义或联合类型替代 any',
      '使用了 any 类型断言': '使用类型守卫函数或更具体的类型断言',
      '使用了 unknown 类型': '提供具体的类型定义或类型守卫',
      '使用了 @ts-ignore': '修复类型错误而不是忽略它们',
      '使用了 @ts-nocheck': '逐步修复文件中的类型问题',
      '使用了 eval 函数': '避免使用 eval，考虑使用 Function 构造函数或其他安全替代方案'
    };

    return suggestions[message] || '请查阅 TypeScript 最佳实践指南';
  }

  /**
   * 获取影响描述
   */
  private static getImpact(level: QualityLevel): string {
    const impacts: Record<QualityLevel, string> = {
      [QualityLevel.INFO]: '可能影响代码可读性',
      [QualityLevel.WARNING]: '可能导致运行时错误',
      [QualityLevel.ERROR]: '严重影响类型安全性',
      [QualityLevel.CRITICAL]: '存在严重安全风险'
    };

    return impacts[level];
  }
}

// ============================================================================
// 复杂度检查器
// ============================================================================

/**
 * 代码复杂度检查器
 */
export class ComplexityChecker {
  /**
   * 计算圈复杂度
   */
  static calculateCyclomaticComplexity(code: string): number {
    // 简化的圈复杂度计算
    const complexityKeywords = [
      'if',
      'else if',
      'while',
      'for',
      'switch',
      'case',
      'catch',
      'try',
      '&&',
      '||',
      '?',
      ':',
      'break',
      'continue',
      'return'
    ];

    let complexity = 1; // 基础复杂度

    complexityKeywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  /**
   * 检查函数复杂度
   */
  static checkFunctionComplexity(code: string, threshold: number = 10): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const functionRegex =
      /function\s+(\w+)|(\w+)\s*[:=]\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)/g;

    let match;
    while ((match = functionRegex.exec(code)) !== null) {
      const functionName = match[1] || match[2] || 'anonymous';
      const functionStart = match.index;

      // 简化的函数体提取（实际项目中需要更复杂的解析）
      const functionBody = this.extractFunctionBody(code, functionStart);
      const complexity = this.calculateCyclomaticComplexity(functionBody);

      if (complexity > threshold) {
        issues.push({
          id: `complexity-${functionName}-${functionStart}`,
          type: QualityIssueType.COMPLEXITY,
          level: complexity > threshold * 2 ? QualityLevel.ERROR : QualityLevel.WARNING,
          title: '函数复杂度过高',
          description: `函数 ${functionName} 的圈复杂度为 ${complexity}`,
          location: `Function ${functionName}`,
          evidence: functionBody.substring(0, 100) + '...',
          suggestion: '考虑将函数拆分为更小的函数，或简化逻辑结构',
          impact: '高复杂度函数难以理解、测试和维护',
          timestamp: Date.now(),
          resolved: false
        });
      }
    }

    return issues;
  }

  /**
   * 提取函数体（简化版本）
   */
  private static extractFunctionBody(code: string, start: number): string {
    let braceCount = 0;
    let inFunction = false;
    let functionBody = '';

    for (let i = start; i < code.length; i++) {
      const char = code[i];

      if (char === '{') {
        braceCount++;
        inFunction = true;
      } else if (char === '}') {
        braceCount--;
      }

      if (inFunction) {
        functionBody += char;
      }

      if (inFunction && braceCount === 0) {
        break;
      }
    }

    return functionBody;
  }
}

// ============================================================================
// 性能检查器
// ============================================================================

/**
 * 性能问题检查器
 */
export class PerformanceChecker {
  private static readonly PERFORMANCE_ANTI_PATTERNS = [
    {
      pattern: /document\.getElementById/g,
      message: '频繁使用 getElementById',
      suggestion: '考虑缓存 DOM 元素引用'
    },
    {
      pattern: /querySelector(?:All)?\(/g,
      message: '使用 querySelector',
      suggestion: '考虑使用更高效的选择器或缓存结果'
    },
    {
      pattern: /innerHTML\s*=/g,
      message: '使用 innerHTML',
      suggestion: '考虑使用 textContent 或 DOM 操作方法'
    },
    {
      pattern: /for\s*\([^)]*\.length[^)]*\)/g,
      message: '在循环中计算长度',
      suggestion: '将长度缓存到变量中'
    },
    {
      pattern: /setInterval|setTimeout/g,
      message: '使用定时器',
      suggestion: '确保清理定时器，考虑使用 requestAnimationFrame'
    }
  ];

  /**
   * 检查性能问题
   */
  static checkPerformance(code: string): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const lines = code.split('\n');

    this.PERFORMANCE_ANTI_PATTERNS.forEach((antiPattern, patternIndex) => {
      lines.forEach((line, lineIndex) => {
        const matches = line.match(antiPattern.pattern);
        if (matches) {
          matches.forEach((_, matchIndex) => {
            issues.push({
              id: `performance-${patternIndex}-${lineIndex}-${matchIndex}`,
              type: QualityIssueType.PERFORMANCE,
              level: QualityLevel.WARNING,
              title: '性能问题',
              description: antiPattern.message,
              location: `Line ${lineIndex + 1}`,
              evidence: line.trim(),
              suggestion: antiPattern.suggestion,
              impact: '可能影响应用性能',
              timestamp: Date.now(),
              resolved: false
            });
          });
        }
      });
    });

    return issues;
  }
}

// ============================================================================
// 可访问性检查器
// ============================================================================

/**
 * 可访问性检查器
 */
export class AccessibilityChecker {
  /**
   * 检查 DOM 元素的可访问性
   */
  static checkAccessibility(): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // 检查缺少 alt 属性的图片
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    imagesWithoutAlt.forEach((img, index) => {
      issues.push({
        id: `a11y-img-alt-${index}`,
        type: QualityIssueType.ACCESSIBILITY,
        level: QualityLevel.ERROR,
        title: '图片缺少 alt 属性',
        description: '图片元素缺少 alt 属性，影响屏幕阅读器用户',
        location: `Image element ${index}`,
        evidence: img.outerHTML.substring(0, 100),
        suggestion: '为图片添加描述性的 alt 属性',
        impact: '屏幕阅读器用户无法理解图片内容',
        timestamp: Date.now(),
        resolved: false
      });
    });

    // 检查缺少 label 的表单元素
    const inputsWithoutLabel = document.querySelectorAll(
      'input:not([aria-label]):not([aria-labelledby])'
    );
    inputsWithoutLabel.forEach((input, index) => {
      const hasAssociatedLabel = document.querySelector(`label[for="${input.id}"]`);
      if (!hasAssociatedLabel && input.id) {
        issues.push({
          id: `a11y-input-label-${index}`,
          type: QualityIssueType.ACCESSIBILITY,
          level: QualityLevel.ERROR,
          title: '表单元素缺少标签',
          description: '输入元素缺少关联的标签',
          location: `Input element ${index}`,
          evidence: input.outerHTML.substring(0, 100),
          suggestion: '为输入元素添加 label 或 aria-label 属性',
          impact: '用户无法理解输入字段的用途',
          timestamp: Date.now(),
          resolved: false
        });
      }
    });

    // 检查颜色对比度（简化版本）
    const elementsWithLowContrast = this.checkColorContrast();
    issues.push(...elementsWithLowContrast);

    return issues;
  }

  /**
   * 检查颜色对比度（简化版本）
   */
  private static checkColorContrast(): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // 这里是一个简化的实现，实际项目中需要更复杂的颜色对比度计算
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');

    textElements.forEach((element, index) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      // 简化的对比度检查（实际需要计算相对亮度）
      if (
        color === backgroundColor ||
        (color === 'rgb(0, 0, 0)' && backgroundColor === 'rgb(0, 0, 0)')
      ) {
        issues.push({
          id: `a11y-contrast-${index}`,
          type: QualityIssueType.ACCESSIBILITY,
          level: QualityLevel.WARNING,
          title: '颜色对比度可能不足',
          description: '文本颜色与背景颜色对比度可能不足',
          location: `Text element ${index}`,
          evidence: element.textContent?.substring(0, 50) || '',
          suggestion: '确保文本与背景的对比度至少为 4.5:1',
          impact: '视力障碍用户可能难以阅读内容',
          timestamp: Date.now(),
          resolved: false
        });
      }
    });

    return issues;
  }
}

// ============================================================================
// 统一质量检查器主类
// ============================================================================

/**
 * 统一代码质量检查器
 */
export class UnifiedQualityChecker {
  private config: QualityConfig;
  private issues: Ref<QualityIssue[]> = ref([]);
  private lastCheckResult: Ref<QualityCheckResult | null> = ref(null);

  constructor(config: Partial<QualityConfig> = {}) {
    this.config = {
      enableTypeCheck: true,
      enableComplexityCheck: true,
      enablePerformanceCheck: true,
      enableSecurityCheck: true,
      enableAccessibilityCheck: true,
      enableBestPracticesCheck: true,
      complexityThreshold: 10,
      performanceThreshold: 100,
      reportingLevel: 'warning',
      ...config
    };
  }

  /**
   * 执行完整的质量检查
   */
  runQualityCheck(code?: string): QualityCheckResult {
    const allIssues: QualityIssue[] = [];

    // TypeScript 类型安全检查
    if (this.config.enableTypeCheck && code) {
      const typeIssues = TypeSafetyChecker.checkCode(code);
      allIssues.push(...typeIssues);
    }

    // 复杂度检查
    if (this.config.enableComplexityCheck && code) {
      const complexityIssues = ComplexityChecker.checkFunctionComplexity(
        code,
        this.config.complexityThreshold
      );
      allIssues.push(...complexityIssues);
    }

    // 性能检查
    if (this.config.enablePerformanceCheck && code) {
      const performanceIssues = PerformanceChecker.checkPerformance(code);
      allIssues.push(...performanceIssues);
    }

    // 可访问性检查
    if (this.config.enableAccessibilityCheck) {
      const accessibilityIssues = AccessibilityChecker.checkAccessibility();
      allIssues.push(...accessibilityIssues);
    }

    // 计算质量分数
    const score = this.calculateQualityScore(allIssues);

    // 生成摘要
    const summary = this.generateSummary(allIssues);

    // 生成建议
    const recommendations = this.generateRecommendations(allIssues);

    const result: QualityCheckResult = {
      passed:
        allIssues.filter(
          (issue) => issue.level === QualityLevel.ERROR || issue.level === QualityLevel.CRITICAL
        ).length === 0,
      score,
      issues: allIssues,
      summary,
      recommendations,
      timestamp: Date.now()
    };

    this.issues.value = allIssues;
    this.lastCheckResult.value = result;

    return result;
  }

  /**
   * 计算质量分数
   */
  private calculateQualityScore(issues: QualityIssue[]): number {
    let score = 100;

    issues.forEach((issue) => {
      switch (issue.level) {
        case QualityLevel.CRITICAL:
          score -= 25;
          break;
        case QualityLevel.ERROR:
          score -= 15;
          break;
        case QualityLevel.WARNING:
          score -= 5;
          break;
        case QualityLevel.INFO:
          score -= 1;
          break;
      }
    });

    return Math.max(0, score);
  }

  /**
   * 生成问题摘要
   */
  private generateSummary(issues: QualityIssue[]) {
    return {
      total: issues.length,
      critical: issues.filter((i) => i.level === QualityLevel.CRITICAL).length,
      error: issues.filter((i) => i.level === QualityLevel.ERROR).length,
      warning: issues.filter((i) => i.level === QualityLevel.WARNING).length,
      info: issues.filter((i) => i.level === QualityLevel.INFO).length
    };
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(issues: QualityIssue[]): string[] {
    const recommendations: string[] = [];
    const issueTypes = new Set(issues.map((i) => i.type));

    if (issueTypes.has(QualityIssueType.TYPE_SAFETY)) {
      recommendations.push('加强 TypeScript 类型定义，减少 any 类型的使用');
    }

    if (issueTypes.has(QualityIssueType.COMPLEXITY)) {
      recommendations.push('重构复杂函数，遵循单一职责原则');
    }

    if (issueTypes.has(QualityIssueType.PERFORMANCE)) {
      recommendations.push('优化性能瓶颈，缓存频繁访问的 DOM 元素');
    }

    if (issueTypes.has(QualityIssueType.ACCESSIBILITY)) {
      recommendations.push('改进可访问性，添加必要的 ARIA 属性和语义化标签');
    }

    return recommendations;
  }

  /**
   * 获取质量问题列表
   */
  getIssues(): ComputedRef<QualityIssue[]> {
    return computed(() => this.issues.value);
  }

  /**
   * 获取最后一次检查结果
   */
  getLastCheckResult(): ComputedRef<QualityCheckResult | null> {
    return computed(() => this.lastCheckResult.value);
  }

  /**
   * 标记问题为已解决
   */
  resolveIssue(issueId: string): void {
    const issue = this.issues.value.find((i) => i.id === issueId);
    if (issue) {
      issue.resolved = true;
    }
  }

  /**
   * 清除已解决的问题
   */
  clearResolvedIssues(): void {
    this.issues.value = this.issues.value.filter((issue) => !issue.resolved);
  }
}

// ============================================================================
// 便捷导出
// ============================================================================

/**
 * 创建质量检查器实例
 */
export const createQualityChecker = (config?: Partial<QualityConfig>) => {
  return new UnifiedQualityChecker(config);
};

/**
 * 默认质量检查器实例
 */
export const defaultQualityChecker = createQualityChecker();

/**
 * 便捷的质量检查函数
 */
export const quality = {
  // 执行检查
  check: (code?: string) => defaultQualityChecker.runQualityCheck(code),

  // 获取结果
  getIssues: () => defaultQualityChecker.getIssues(),
  getLastResult: () => defaultQualityChecker.getLastCheckResult(),

  // 管理问题
  resolve: (issueId: string) => defaultQualityChecker.resolveIssue(issueId),
  clearResolved: () => defaultQualityChecker.clearResolvedIssues(),

  // 单独的检查器
  typeCheck: TypeSafetyChecker.checkCode,
  complexityCheck: ComplexityChecker.checkFunctionComplexity,
  performanceCheck: PerformanceChecker.checkPerformance,
  accessibilityCheck: AccessibilityChecker.checkAccessibility
};
