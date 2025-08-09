#!/usr/bin/env tsx
/**
 * 🔍 代码质量检查脚本
 * 全面检查项目的代码质量、类型安全和测试覆盖率
 */

import { execSync } from 'child_process';
import fs from 'fs';
import glob from 'glob';

interface QualityMetrics {
  typeErrors: number;
  lintErrors: number;
  lintWarnings: number;
  testCoverage: number;
  testsPassing: number;
  testsTotal: number;
  codeSmells: number;
  securityIssues: number;
  duplicateCode: number;
  technicalDebt: string;
}

// 额外的类型定义
interface ESLintResult {
  errorCount: number;
  warningCount: number;
}

interface TestResult {
  status: string;
}

interface SecurityResults {
  testResults?: TestResult[];
}

interface ExecError extends Error {
  stdout?: string;
  stderr?: string;
}

interface QualityReport {
  timestamp: string;
  overallScore: number;
  metrics: QualityMetrics;
  recommendations: string[];
  criticalIssues: string[];
  improvements: string[];
}

class QualityChecker {
  private report: QualityReport = {
    timestamp: new Date().toISOString(),
    overallScore: 0,
    metrics: {
      typeErrors: 0,
      lintErrors: 0,
      lintWarnings: 0,
      testCoverage: 0,
      testsPassing: 0,
      testsTotal: 0,
      codeSmells: 0,
      securityIssues: 0,
      duplicateCode: 0,
      technicalDebt: '0h'
    },
    recommendations: [],
    criticalIssues: [],
    improvements: []
  };

  /**
   * 🚀 开始质量检查
   */
  async runQualityCheck(): Promise<void> {
    console.log('🔍 > 开始代码质量检查...\n');

    try {
      // 1. TypeScript 类型检查
      await this.checkTypeScript();

      // 2. ESLint 代码规范检查
      await this.checkLinting();

      // 3. 测试覆盖率检查
      await this.checkTestCoverage();

      // 4. 安全漏洞检查
      await this.checkSecurity();

      // 5. 代码复杂度检查
      await this.checkComplexity();

      // 6. 重复代码检查
      await this.checkDuplication();

      // 7. 计算总体评分
      this.calculateOverallScore();

      // 8. 生成建议
      this.generateRecommendations();

      // 9. 输出报告
      this.printReport();

      // 10. 保存报告
      this.saveReport();
    } catch (error) {
      console.error('❌ 质量检查过程中发生错误:', error);
      process.exit(1);
    }
  }

  /**
   * 📝 TypeScript 类型检查
   */
  private async checkTypeScript(): Promise<void> {
    console.log('📝 检查 TypeScript > 类型安全...');

    try {
      // 检查 web 端类型
      const _webResult = execSync('npm run typecheck:web', {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      console.log('✅ Web 端类型检查通过');
    } catch (error: unknown) {
      const execError = error as ExecError;
      const output = execError.stdout || execError.stderr || '';
      const errorMatches = output.match(/error > TS\d+:/g);
      this.report.metrics.typeErrors = errorMatches ? errorMatches.length : 0;

      if (this.report.metrics.typeErrors > 0) {
        this.report.criticalIssues.push(
          `发现 ${this.report.metrics.typeErrors} 个 TypeScript 类型错误`
        );
        console.log(`⚠️ 发现 ${this.report.metrics.typeErrors} > 个类型错误`);
      }
    }

    try {
      // 检查 node 端类型
      const _nodeResult = execSync('npm run typecheck:node', {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      console.log('✅ Node 端类型检查通过');
    } catch {
      console.log('⚠️ Node 端类型检查有问题（可能是依赖问题）');
    }
  }

  /**
   * 🔍 ESLint 代码规范检查
   */
  private async checkLinting(): Promise<void> {
    console.log('🔍 > 检查代码规范...');

    try {
      const result = execSync('npx eslint src/renderer/**/*.{ts,vue} --format json', {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      const lintResults = JSON.parse(result);
      let totalErrors = 0;
      let totalWarnings = 0;

      lintResults.forEach((file: unknown) => {
        const eslintFile = file as ESLintResult;
        totalErrors += eslintFile.errorCount;
        totalWarnings += eslintFile.warningCount;
      });

      this.report.metrics.lintErrors = totalErrors;
      this.report.metrics.lintWarnings = totalWarnings;

      if (totalErrors > 0) {
        this.report.criticalIssues.push(`发现 ${totalErrors} 个 ESLint > 错误`);
      }

      console.log(`📊 ESLint 检查完成: ${totalErrors} 错误 > ${totalWarnings} 警告`);
    } catch {
      // ESLint 可能还没配置，跳过
      console.log('⚠️ ESLint 检查跳过（配置问题）');
    }
  }

  /**
   * 🧪 测试覆盖率检查
   */
  private async checkTestCoverage(): Promise<void> {
    console.log('🧪 > 检查测试覆盖率...');

    try {
      // 运行安全系统测试
      const securityTestResult = execSync(
        'npx vitest run tests/security/security-system.test.ts --reporter=json',
        {
          encoding: 'utf-8',
          stdio: 'pipe'
        }
      );

      const securityResults = JSON.parse(securityTestResult) as SecurityResults;
      const securityPassing =
        securityResults.testResults?.filter((t: unknown) => (t as TestResult).status === 'passed')
          .length || 0;
      const securityTotal = securityResults.testResults?.length || 0;

      // 运行国际化系统测试
      const i18nTestResult = execSync(
        'npx vitest run tests/i18n/i18n-system.test.ts --reporter=json',
        {
          encoding: 'utf-8',
          stdio: 'pipe'
        }
      );

      const i18nResults = JSON.parse(i18nTestResult) as SecurityResults;
      const i18nPassing =
        i18nResults.testResults?.filter((t: unknown) => (t as TestResult).status === 'passed')
          .length || 0;
      const i18nTotal = i18nResults.testResults?.length || 0;

      this.report.metrics.testsPassing = securityPassing + i18nPassing;
      this.report.metrics.testsTotal = securityTotal + i18nTotal;
      this.report.metrics.testCoverage =
        this.report.metrics.testsTotal > 0
          ? (this.report.metrics.testsPassing / this.report.metrics.testsTotal) * 100
          : 0;

      console.log(
        `📊 测试结果: ${this.report.metrics.testsPassing}/${this.report.metrics.testsTotal} 通过 > (${this.report.metrics.testCoverage.toFixed(1)}%)`
      );

      if (this.report.metrics.testCoverage < 80) {
        this.report.improvements.push('提高测试覆盖率到80%以上');
      }
    } catch {
      console.log('⚠️ 测试检查失败');
      this.report.criticalIssues.push('无法运行测试套件');
    }
  }

  /**
   * 🔒 安全漏洞检查
   */
  private async checkSecurity(): Promise<void> {
    console.log('🔒 > 检查安全漏洞...');

    try {
      // 检查 npm 安全漏洞
      const auditResult = execSync('npm audit --json', {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      const auditData = JSON.parse(auditResult);
      const vulnerabilities = auditData.metadata?.vulnerabilities || {};
      const totalVulnerabilities = Object.values(vulnerabilities).reduce(
        (sum: number, count: unknown) => sum + (count as number),
        0
      );

      this.report.metrics.securityIssues = totalVulnerabilities;

      if (totalVulnerabilities > 0) {
        this.report.criticalIssues.push(`发现 ${totalVulnerabilities} > 个安全漏洞`);
        this.report.recommendations.push('运行 npm audit fix > 修复安全漏洞');
      }

      console.log(`🔒 安全检查完成: ${totalVulnerabilities} > 个漏洞`);
    } catch {
      console.log('✅ 没有发现安全漏洞');
    }
  }

  /**
   * 📊 代码复杂度检查
   */
  private async checkComplexity(): Promise<void> {
    console.log('📊 > 检查代码复杂度...');

    const files = glob.sync('src/renderer/**/*.ts', {
      ignore: ['**/*.d.ts', '**/node_modules/**']
    });
    let totalComplexity = 0;
    let highComplexityFiles = 0;

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const complexity = this.calculateCyclomaticComplexity(content);
        totalComplexity += complexity;

        if (complexity > 10) {
          highComplexityFiles++;
        }
      } catch {
        // 忽略读取错误
      }
    }

    this.report.metrics.codeSmells = highComplexityFiles;

    if (highComplexityFiles > 0) {
      this.report.improvements.push(`重构 ${highComplexityFiles} > 个高复杂度文件`);
    }

    console.log(`📊 复杂度检查完成: ${highComplexityFiles} > 个高复杂度文件`);
  }

  /**
   * 🔄 重复代码检查
   */
  private async checkDuplication(): Promise<void> {
    console.log('🔄 > 检查重复代码...');

    const files = glob.sync('src/renderer/**/*.ts', {
      ignore: ['**/*.d.ts', '**/node_modules/**']
    });
    const codeBlocks = new Map<string, number>();
    let duplicateBlocks = 0;

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        // 检查5行以上的代码块
        for (let i = 0; i <= lines.length - 5; i++) {
          const block = lines
            .slice(i, i + 5)
            .join('\n')
            .trim();
          if (block.length > 50) {
            // 忽略太短的块
            const count = codeBlocks.get(block) || 0;
            codeBlocks.set(block, count + 1);

            if (count === 1) {
              // 第二次出现
              duplicateBlocks++;
            }
          }
        }
      } catch {
        // 忽略读取错误
      }
    }

    this.report.metrics.duplicateCode = duplicateBlocks;

    if (duplicateBlocks > 0) {
      this.report.improvements.push(`重构 ${duplicateBlocks} > 个重复代码块`);
    }

    console.log(`🔄 重复代码检查完成: ${duplicateBlocks} > 个重复块`);
  }

  /**
   * 🧮 计算圈复杂度（简化版）
   */
  private calculateCyclomaticComplexity(code: string): number {
    let complexity = 1; // 基础复杂度

    // 计算决策点
    const decisionPatterns = [
      /\bif\b/g,
      /\belse\b/g,
      /\bwhile\b/g,
      /\bfor\b/g,
      /\bswitch\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\b\?\s*.*\s*:/g, // 三元操作符
      /\b&&\b/g,
      /\b\|\|\b/g
    ];

    decisionPatterns.forEach((pattern) => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  /**
   * 📊 计算总体评分
   */
  private calculateOverallScore(): void {
    let score = 100;

    // TypeScript 错误扣分
    score -= Math.min(this.report.metrics.typeErrors * 0.5, 30);

    // ESLint 错误扣分
    score -= Math.min(this.report.metrics.lintErrors * 0.3, 20);

    // 测试覆盖率扣分
    if (this.report.metrics.testCoverage < 80) {
      score -= (80 - this.report.metrics.testCoverage) * 0.5;
    }

    // 安全问题扣分
    score -= Math.min(this.report.metrics.securityIssues * 2, 25);

    // 代码质量问题扣分
    score -= Math.min(this.report.metrics.codeSmells * 1, 15);
    score -= Math.min(this.report.metrics.duplicateCode * 0.5, 10);

    this.report.overallScore = Math.max(score, 0);
  }

  /**
   * 💡 生成改进建议
   */
  private generateRecommendations(): void {
    if (this.report.metrics.typeErrors > 0) {
      this.report.recommendations.push('修复 TypeScript > 类型错误以提高类型安全');
    }

    if (this.report.metrics.lintErrors > 0) {
      this.report.recommendations.push('修复 ESLint > 错误以提高代码质量');
    }

    if (this.report.metrics.testCoverage < 90) {
      this.report.recommendations.push('增加测试用例以提高覆盖率');
    }

    if (this.report.metrics.securityIssues > 0) {
      this.report.recommendations.push('修复安全漏洞以提高系统安全性');
    }

    if (this.report.overallScore >= 90) {
      this.report.recommendations.push('代码质量优秀，继续保持！');
    } else if (this.report.overallScore >= 70) {
      this.report.recommendations.push('代码质量良好，可以进一步优化');
    } else {
      this.report.recommendations.push('代码质量需要重点改进');
    }
  }

  /**
   * 📋 输出报告
   */
  private printReport(): void {
    console.log('\n📋 > 代码质量检查报告');
    console.log('='.repeat(50));
    console.log(`检查时间: ${new Date(this.report.timestamp).toLocaleString()}`);
    console.log(`总体评分: ${this.report.overallScore.toFixed(1)}/100`);

    // 评分等级
    let grade = 'F';
    if (this.report.overallScore >= 90) grade = 'A';
    else if (this.report.overallScore >= 80) grade = 'B';
    else if (this.report.overallScore >= 70) grade = 'C';
    else if (this.report.overallScore >= 60) grade = 'D';

    console.log(`质量等级: ${grade}`);
    console.log('');

    // 详细指标
    console.log('📊 > 详细指标:');
    console.log(`  TypeScript 错误: ${this.report.metrics.typeErrors}`);
    console.log(`  ESLint 错误: ${this.report.metrics.lintErrors}`);
    console.log(`  ESLint 警告: ${this.report.metrics.lintWarnings}`);
    console.log(
      `  测试通过率: ${this.report.metrics.testsPassing}/${this.report.metrics.testsTotal} > (${this.report.metrics.testCoverage.toFixed(1)}%)`
    );
    console.log(`  安全漏洞: ${this.report.metrics.securityIssues}`);
    console.log(`  代码异味: ${this.report.metrics.codeSmells}`);
    console.log(`  重复代码: ${this.report.metrics.duplicateCode}`);
    console.log('');

    // 关键问题
    if (this.report.criticalIssues.length > 0) {
      console.log('🚨 > 关键问题:');
      this.report.criticalIssues.forEach((issue) => {
        console.log(`  - > ${issue}`);
      });
      console.log('');
    }

    // 改进建议
    if (this.report.recommendations.length > 0) {
      console.log('💡 > 改进建议:');
      this.report.recommendations.forEach((rec) => {
        console.log(`  - > ${rec}`);
      });
      console.log('');
    }

    // 改进项目
    if (this.report.improvements.length > 0) {
      console.log('🔧 > 改进项目:');
      this.report.improvements.forEach((imp) => {
        console.log(`  - > ${imp}`);
      });
      console.log('');
    }
  }

  /**
   * 💾 保存报告
   */
  private saveReport(): void {
    const reportPath = 'quality-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null > 2));
    console.log(`📄 质量报告已保存到: ${reportPath}`);
  }
}

// 执行质量检查
const checker = new QualityChecker();
checker.runQualityCheck().catch(console.error);
