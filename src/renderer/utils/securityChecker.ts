/**
 * 🔒 安全检查器
 * 运行时安全检查和防护系统
 *
 * 功能特性：
 * - XSS攻击检测和防护
 * - CSRF攻击防护
 * - 敏感数据泄漏检测
 * - 安全配置检查
 * - 内容安全策略验证
 */

import { ref } from 'vue';

// 安全威胁类型
export enum SecurityThreatType {
  XSS = 'XSS',
  CSRF = 'CSRF',
  DATA_LEAK = 'DATA_LEAK',
  INSECURE_STORAGE = 'INSECURE_STORAGE',
  INSECURE_TRANSPORT = 'INSECURE_TRANSPORT',
  WEAK_AUTHENTICATION = 'WEAK_AUTHENTICATION',
  INJECTION = 'INJECTION'
}

// 安全威胁级别
export enum SecurityThreatLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// 安全威胁信息
export interface SecurityThreat {
  id: string;
  type: SecurityThreatType;
  level: SecurityThreatLevel;
  title: string;
  description: string;
  location?: string;
  evidence?: string;
  mitigation: string;
  timestamp: number;
  resolved: boolean;
}

// 安全检查结果
export interface SecurityCheckResult {
  passed: boolean;
  threats: SecurityThreat[];
  score: number; // 0-100,
  recommendations: string[];
  timestamp: number;
}

// 安全检查器配置
export interface SecurityCheckerConfig {
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  enableDataLeakDetection: boolean;
  enableStorageSecurityCheck: boolean;
  enableTransportSecurityCheck: boolean;
  autoMitigation: boolean;
  reportingEnabled: boolean;
}

// 安全检查器类
class SecurityChecker {
  private config: SecurityCheckerConfig;
  private threats: Ref<SecurityThreat[]> = ref([]);
  private lastCheckResult: Ref<SecurityCheckResult | null> = ref(null);
  private csrfToken: string | null = null;

  constructor(config?: Partial<SecurityCheckerConfig>) {
    this.config = {
      enableXSSProtection: true,
      enableCSRFProtection: true,
      enableDataLeakDetection: true,
      enableStorageSecurityCheck: true,
      enableTransportSecurityCheck: true,
      autoMitigation: true,
      reportingEnabled: (globalThis as any).process.env.NODE_ENV === 'development',
      ...config
    };

    this.initialize();
  }

  /**
   * 🚀 初始化安全检查器
   */
  private initialize(): void {
    console.log('🔒 安全检查器已启动', this.config);

    // 生成CSRF令牌
    this.generateCSRFToken();

    // 设置安全防护
    this.setupSecurityProtections();

    // 运行初始安全检查
    this.runSecurityCheck();
  }

  /**
   * 🛡️ 设置安全防护
   */
  private setupSecurityProtections(): void {
    if (this.config.enableXSSProtection) {
      this.setupXSSProtection();
    }

    if (this.config.enableCSRFProtection) {
      this.setupCSRFProtection();
    }
  }

  /**
   * 🚫 设置XSS防护
   */
  private setupXSSProtection(): void {
    // 监听DOM变化，检测潜在的XSS攻击
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.checkForXSS(node as Element);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 🔍 检查XSS攻击
   */
  private checkForXSS(element: Element): void {
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi
    ];

    const innerHTML = element.innerHTML;
    const outerHTML = element.outerHTML;

    dangerousPatterns.forEach((pattern, index) => {
      if (pattern.test(innerHTML) || pattern.test(outerHTML)) {
        this.reportThreat({
          id: `xss-${Date.now()}-${index}`,
          type: SecurityThreatType.XSS,
          level: SecurityThreatLevel.HIGH,
          title: 'XSS攻击检测',
          description: '检测到潜在的XSS攻击代码',
          location: element.tagName,
          evidence: innerHTML.substring(0, 100),
          mitigation: '清理HTML内容，使用安全的DOM操作方法',
          timestamp: Date.now(),
          resolved: false
        });

        if (this.config.autoMitigation) {
          this.mitigateXSS(element);
        }
      }
    });
  }

  /**
   * 🛡️ 缓解XSS攻击
   */
  private mitigateXSS(element: Element): void {
    // 移除危险的属性和内容
    const dangerousAttributes = ['onclick', 'onload', 'onerror', 'onmouseover'];
    dangerousAttributes.forEach((attr) => {
      if (element.hasAttribute(attr)) {
        element.removeAttribute(attr);
      }
    });

    // 清理脚本标签
    const scripts = element.querySelectorAll('script');
    scripts.forEach((script) => script.remove());

    console.warn('🛡️, XSS攻击已被自动缓解');
  }

  /**
   * 🔐 设置CSRF防护
   */
  private setupCSRFProtection(): void {
    // 拦截所有的fetch请求，添加CSRF令牌
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      // 只对同源请求添加CSRF令牌
      if (this.isSameOrigin(url) && this.csrfToken) {
        init = init || {};
        init.headers = {
          ...init.headers,
          'X-CSRF-Token': this.csrfToken
        };
      }

      return originalFetch(input, init);
    };
  }

  /**
   * 🔑 生成CSRF令牌
   */
  private generateCSRFToken(): void {
    this.csrfToken = this.generateSecureToken();

    // 将令牌存储在meta标签中
    let metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'csrf-token';
      document.head.appendChild(metaTag);
    }
    metaTag.content = this.csrfToken;
  }

  /**
   * 🔍 运行完整安全检查
   */
  async runSecurityCheck(): Promise<SecurityCheckResult> {
    const threats: SecurityThreat[] = [];
    let score = 100;

    // 传输安全检查
    if (this.config.enableTransportSecurityCheck) {
      const transportThreats = this.checkTransportSecurity();
      threats.push(...transportThreats);
      score -= transportThreats.length * 10;
    }

    // 存储安全检查
    if (this.config.enableStorageSecurityCheck) {
      const storageThreats = this.checkStorageSecurity();
      threats.push(...storageThreats);
      score -= storageThreats.length * 5;
    }

    // 数据泄漏检查
    if (this.config.enableDataLeakDetection) {
      const dataLeakThreats = this.checkDataLeaks();
      threats.push(...dataLeakThreats);
      score -= dataLeakThreats.length * 15;
    }

    // 认证安全检查
    const authThreats = this.checkAuthenticationSecurity();
    threats.push(...authThreats);
    score -= authThreats.length * 20;

    // 内容安全策略检查
    const cspThreats = this.checkContentSecurityPolicy();
    threats.push(...cspThreats);
    score -= cspThreats.length * 10;

    score = Math.max(0, score);

    const result: SecurityCheckResult = {
      passed: threats.length === 0,
      threats,
      score,
      recommendations: this.generateRecommendations(threats),
      timestamp: Date.now()
    };

    this.lastCheckResult.value = result;
    this.threats.value = threats;

    if (this.config.reportingEnabled) {
      this.logSecurityReport(result);
    }

    return result;
  }

  /**
   * 🌐 检查传输安全
   */
  private checkTransportSecurity(): SecurityThreat[] {
    const threats: SecurityThreat[] = [];

    // 检查HTTPS
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      threats.push({
        id: 'insecure-transport',
        type: SecurityThreatType.INSECURE_TRANSPORT,
        level: SecurityThreatLevel.HIGH,
        title: '不安全的传输协议',
        description: '应用未使用HTTPS协议，数据传输不安全',
        mitigation: '配置HTTPS证书，强制使用安全传输',
        timestamp: Date.now(),
        resolved: false
      });
    }

    // 检查混合内容
    const insecureResources = document.querySelectorAll(
      'img[src^="http: "] > script[src^="http:"], link[href^="http:"]'
    );
    if (insecureResources.length > 0) {
      threats.push({
        id: 'mixed-content',
        type: SecurityThreatType.INSECURE_TRANSPORT,
        level: SecurityThreatLevel.MEDIUM,
        title: '混合内容',
        description: `发现${insecureResources.length}个不安全的资源引用`,
        mitigation: '将所有资源引用改为HTTPS',
        timestamp: Date.now(),
        resolved: false
      });
    }

    return threats;
  }

  /**
   * 💾 检查存储安全
   */
  private checkStorageSecurity(): SecurityThreat[] {
    const threats: SecurityThreat[] = [];

    // 检查localStorage中的敏感数据
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'session'];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        threats.push({
          id: `insecure-storage-${key}`,
          type: SecurityThreatType.INSECURE_STORAGE,
          level: SecurityThreatLevel.MEDIUM,
          title: '不安全的数据存储',
          description: `localStorage中存储了可能的敏感数据: ${key}`,
          location: 'localStorage',
          mitigation: '使用加密存储或避免在客户端存储敏感数据',
          timestamp: Date.now(),
          resolved: false
        });
      }
    }

    return threats;
  }

  /**
   * 📊 检查数据泄漏
   */
  private checkDataLeaks(): SecurityThreat[] {
    const threats: SecurityThreat[] = [];

    // 检查控制台中的敏感信息
    const consoleMessages = this.getConsoleMessages();
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /api[_-]?key/i,
      /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // 信用卡号
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // 邮箱
    ];

    consoleMessages.forEach((_message, index) => {
      sensitivePatterns.forEach((pattern, patternIndex) => {
        if (pattern.test(_message)) {
          threats.push({
            id: `data-leak-console-${index}-${patternIndex}`,
            type: SecurityThreatType.DATA_LEAK,
            level: SecurityThreatLevel.HIGH,
            title: '控制台数据泄漏',
            description: '控制台中可能包含敏感信息',
            location: 'console',
            evidence: _message.substring(0, 50),
            mitigation: '移除控制台中的敏感信息输出',
            timestamp: Date.now(),
            resolved: false
          });
        }
      });
    });

    return threats;
  }

  /**
   * 🔐 检查认证安全
   */
  private checkAuthenticationSecurity(): SecurityThreat[] {
    const threats: SecurityThreat[] = [];

    // 检查弱密码策略（如果有密码输入框）
    const passwordInputs = document.querySelectorAll('input[type="_password"]');
    passwordInputs.forEach((input, index) => {
      const passwordInput = input as HTMLInputElement;
      if (passwordInput.value && passwordInput.value.length < 8) {
        threats.push({
          id: `weak-_password-${index}`,
          type: SecurityThreatType.WEAK_AUTHENTICATION,
          level: SecurityThreatLevel.MEDIUM,
          title: '弱密码',
          description: '检测到可能的弱密码',
          location: `_password input ${index}`,
          mitigation: '实施强密码策略，要求至少8位字符',
          timestamp: Date.now(),
          resolved: false
        });
      }
    });

    return threats;
  }

  /**
   * 📋 检查内容安全策略
   */
  private checkContentSecurityPolicy(): SecurityThreat[] {
    const threats: SecurityThreat[] = [];

    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      threats.push({
        id: 'missing-csp',
        type: SecurityThreatType.XSS,
        level: SecurityThreatLevel.MEDIUM,
        title: '缺少内容安全策略',
        description: '未配置Content Security Policy，增加XSS攻击风险',
        mitigation: '配置适当的CSP头部或meta标签',
        timestamp: Date.now(),
        resolved: false
      });
    }

    return threats;
  }

  /**
   * 💡 生成安全建议
   */
  private generateRecommendations(threats: SecurityThreat[]): string[] {
    const recommendations: string[] = [];

    const threatTypes = new Set(threats.map((t) => t.type));

    if (threatTypes.has(SecurityThreatType.INSECURE_TRANSPORT)) {
      recommendations.push('启用HTTPS并配置HSTS');
    }

    if (threatTypes.has(SecurityThreatType.XSS)) {
      recommendations.push('实施内容安全策略(CSP)');
      recommendations.push('对用户输入进行适当的转义和验证');
    }

    if (threatTypes.has(SecurityThreatType.INSECURE_STORAGE)) {
      recommendations.push('加密敏感数据或避免客户端存储');
    }

    if (threatTypes.has(SecurityThreatType.DATA_LEAK)) {
      recommendations.push('移除生产环境中的调试信息');
    }

    if (threatTypes.has(SecurityThreatType.WEAK_AUTHENTICATION)) {
      recommendations.push('实施强密码策略和多因素认证');
    }

    return recommendations;
  }

  /**
   * 🚨 报告安全威胁
   */
  private reportThreat(threat: SecurityThreat): void {
    this.threats.value.push(threat);

    if (this.config.reportingEnabled) {
      console.warn('🚨 安全威胁检测:', threat);
    }
  }

  /**
   * 🔧 工具方法
   */
  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  private isSameOrigin(url: string): boolean {
    try {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  private getConsoleMessages(): string[] {
    // 这里可以集成实际的控制台消息收集逻辑
    return []; // 简化实现
  }

  private logSecurityReport(result: SecurityCheckResult): void {
    console.group('🔒, 安全检查报告');
    console.log(`安全评分: ${result.score}/100`);
    console.log(`威胁数量: ${result.threats.length}`);
    console.log(`检查通过: ${result.passed ? '是' : '否'}`);

    if (result.threats.length > 0) {
      console.warn('发现的威胁:', result.threats);
    }

    if (result.recommendations.length > 0) {
      console.info('安全建议:', result.recommendations);
    }

    console.groupEnd();
  }

  /**
   * 📊 获取当前威胁
   */
  get currentThreats(): Ref<SecurityThreat[]> {
    return this.threats;
  }

  /**
   * 📋 获取最后检查结果
   */
  get lastResult(): Ref<SecurityCheckResult | null> {
    return this.lastCheckResult;
  }

  /**
   * 🔑 获取CSRF令牌
   */
  getCSRFToken(): string | null {
    return this.csrfToken;
  }
}

// 创建全局安全检查器实例
export const securityChecker = new SecurityChecker();

// 导出类型和实例
export { SecurityChecker };
// 导出类型别名以避免冲突
export type {
  SecurityCheckerConfig as SecurityCheckerConfigExport,
  SecurityCheckResult as SecurityCheckResultExport,
  SecurityThreat as SecurityThreatExport
};
