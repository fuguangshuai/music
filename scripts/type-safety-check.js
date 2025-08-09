#!/usr/bin/env node

/**
 * TypeScript 类型安全检查脚本
 *
 * 检查项目中的类型安全问题，包括：
 * - unknown 类型的使用
 * - any 类型断言
 * - 缺失的类型定义
 *
 * @author TypeScript重构项目组
 * @since v4.11.0
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  srcDir: path.join(__dirname, '../src/renderer'),
  excludePatterns: [/node_modules/, /\.d\.ts$/, /test/, /__tests__/],
  checkPatterns: {
    unknownUsage: /:\s*unknown\b/g,
    anyAssertion: /as\s+any\b/g,
    anyType: /:\s*any\b/g,
    deprecatedTypes: /(ApiResponse|BaseApiResponse|BaseResponse)<.*unknown.*>/g
  }
};

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// 扫描文件
function scanDirectory(dir) {
  const results = [];

  function scanFile(filePath) {
    const relativePath = path.relative(CONFIG.srcDir, filePath);

    // 跳过排除的文件
    if (CONFIG.excludePatterns.some((pattern) => pattern.test(relativePath))) {
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      const fileIssues = {
        file: relativePath,
        issues: []
      };

      // 检查每种模式
      Object.entries(CONFIG.checkPatterns).forEach(([type, pattern]) => {
        lines.forEach((line, index) => {
          const matches = line.match(pattern);
          if (matches) {
            matches.forEach((match) => {
              fileIssues.issues.push({
                type,
                line: index + 1,
                content: line.trim(),
                match
              });
            });
          }
        });
      });

      if (fileIssues.issues.length > 0) {
        results.push(fileIssues);
      }
    } catch (error) {
      console.warn(`警告: 无法读取文件 ${filePath}: ${error.message}`);
    }
  }

  function walkDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);

    items.forEach((item) => {
      const itemPath = path.join(currentDir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        walkDirectory(itemPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.vue'))) {
        scanFile(itemPath);
      }
    });
  }

  walkDirectory(dir);
  return results;
}

// 生成报告
function generateReport(results) {
  console.log(colorize('\n🔍 TypeScript 类型安全检查报告', 'bold'));
  console.log(colorize('='.repeat(50), 'blue'));

  if (results.length === 0) {
    console.log(colorize('\n✅ 恭喜！未发现类型安全问题。', 'green'));
    return;
  }

  let totalIssues = 0;
  const issueStats = {};

  results.forEach((fileResult) => {
    console.log(colorize(`\n📁 ${fileResult.file}`, 'yellow'));

    fileResult.issues.forEach((issue) => {
      totalIssues++;
      issueStats[issue.type] = (issueStats[issue.type] || 0) + 1;

      const severity = getSeverity(issue.type);
      const severityColor = severity === 'high' ? 'red' : severity === 'medium' ? 'yellow' : 'blue';

      console.log(`  ${colorize('●', severityColor)} 第${issue.line}行: ${issue.type}`);
      console.log(`    ${colorize(issue.content, 'reset')}`);
      console.log(`    ${colorize('匹配:', 'blue')} ${issue.match}`);
      console.log(`    ${colorize('建议:', 'green')} ${getSuggestion(issue.type)}`);
    });
  });

  // 统计信息
  console.log(colorize('\n📊 统计信息', 'bold'));
  console.log(colorize('-'.repeat(30), 'blue'));
  console.log(`总问题数: ${colorize(totalIssues, 'red')}`);
  console.log(`影响文件: ${colorize(results.length, 'yellow')}`);

  Object.entries(issueStats).forEach(([type, count]) => {
    console.log(`${type}: ${colorize(count, 'yellow')}`);
  });

  // 建议
  console.log(colorize('\n💡 修复建议', 'bold'));
  console.log(colorize('-'.repeat(30), 'blue'));
  console.log('1. 查阅 docs/type-safety-guide.md 获取详细指南');
  console.log('2. 使用 npm run type-safety:report 生成详细报告');
  console.log('3. 优先修复 any 类型断言和 unknown 类型使用');

  process.exit(totalIssues > 0 ? 1 : 0);
}

// 获取问题严重程度
function getSeverity(type) {
  const severityMap = {
    anyAssertion: 'high',
    unknownUsage: 'medium',
    anyType: 'medium',
    deprecatedTypes: 'low'
  };
  return severityMap[type] || 'low';
}

// 获取修复建议
function getSuggestion(type) {
  const suggestions = {
    anyAssertion: '使用类型守卫函数替代 as any',
    unknownUsage: '提供具体的类型定义',
    anyType: '使用具体的类型或联合类型',
    deprecatedTypes: '迁移到 StandardApiResponse'
  };
  return suggestions[type] || '查阅类型安全指南';
}

// 主函数
function main() {
  console.log(colorize('🚀 开始 TypeScript 类型安全检查...', 'blue'));

  if (!fs.existsSync(CONFIG.srcDir)) {
    console.error(colorize(`❌ 源码目录不存在: ${CONFIG.srcDir}`, 'red'));
    process.exit(1);
  }

  const results = scanDirectory(CONFIG.srcDir);
  generateReport(results);
}

// 运行检查
if (require.main === module) {
  main();
}

module.exports = { scanDirectory, generateReport };
