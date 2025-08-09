#!/usr/bin/env node

/**
 * TypeScript 类型安全详细报告生成器
 *
 * 生成详细的类型安全分析报告，包括：
 * - 项目类型安全概览
 * - 详细的问题分析
 * - 修复建议和最佳实践
 * - 进度跟踪
 *
 * @author TypeScript重构项目组
 * @since v4.11.0
 */

const fs = require('fs');
const path = require('path');
const { scanDirectory } = require('./type-safety-check');

// 配置
const CONFIG = {
  srcDir: path.join(__dirname, '../src/renderer'),
  outputDir: path.join(__dirname, '../reports'),
  reportFile: 'type-safety-report.html'
};

// 确保输出目录存在
function ensureOutputDir() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
}

// 生成HTML报告
function generateHtmlReport(results) {
  const timestamp = new Date().toISOString();
  const totalIssues = results.reduce((sum, file) => sum + file.issues.length, 0);
  const totalFiles = results.length;

  // 统计各类问题
  const issueStats = {};
  results.forEach((file) => {
    file.issues.forEach((issue) => {
      issueStats[issue.type] = (issueStats[issue.type] || 0) + 1;
    });
  });

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TypeScript 类型安全报告</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; color: #333; background: #f5f5f5; 
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px;
            text-align: center;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.1em; opacity: 0.9; }
        .stats { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px; margin-bottom: 30px;
        }
        .stat-card { 
            background: white; padding: 20px; border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center;
        }
        .stat-number { font-size: 2em; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; margin-top: 5px; }
        .section { 
            background: white; padding: 30px; border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 30px;
        }
        .section h2 { color: #333; margin-bottom: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .file-item { 
            border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 20px;
            overflow: hidden;
        }
        .file-header { 
            background: #f8f9fa; padding: 15px; font-weight: bold;
            color: #495057; border-bottom: 1px solid #e0e0e0;
        }
        .issue-item { 
            padding: 15px; border-bottom: 1px solid #f0f0f0;
            transition: background-color 0.2s;
        }
        .issue-item:hover { background: #f8f9fa; }
        .issue-item:last-child { border-bottom: none; }
        .issue-type { 
            display: inline-block; padding: 4px 8px; border-radius: 4px;
            font-size: 0.8em; font-weight: bold; margin-right: 10px;
        }
        .type-high { background: #ffebee; color: #c62828; }
        .type-medium { background: #fff3e0; color: #ef6c00; }
        .type-low { background: #e8f5e8; color: #2e7d32; }
        .issue-line { color: #666; font-size: 0.9em; }
        .issue-content { 
            background: #f8f9fa; padding: 10px; border-radius: 4px;
            font-family: 'Courier New', monospace; margin: 10px 0;
            border-left: 4px solid #667eea;
        }
        .issue-suggestion { color: #28a745; font-style: italic; }
        .progress-bar { 
            background: #e0e0e0; height: 20px; border-radius: 10px;
            overflow: hidden; margin: 10px 0;
        }
        .progress-fill { 
            background: linear-gradient(90deg, #28a745, #20c997);
            height: 100%; transition: width 0.3s ease;
        }
        .footer { 
            text-align: center; color: #666; margin-top: 30px;
            padding: 20px; border-top: 1px solid #e0e0e0;
        }
        .no-issues { 
            text-align: center; padding: 50px; color: #28a745;
            font-size: 1.2em;
        }
        .chart-container { 
            display: flex; justify-content: space-around; align-items: center;
            margin: 20px 0;
        }
        .chart-item { text-align: center; }
        .chart-bar { 
            width: 40px; background: #667eea; margin: 0 auto 10px;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 TypeScript 类型安全报告</h1>
            <p>生成时间: ${timestamp}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${totalIssues}</div>
                <div class="stat-label">总问题数</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalFiles}</div>
                <div class="stat-label">影响文件</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${Object.keys(issueStats).length}</div>
                <div class="stat-label">问题类型</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${Math.round((1 - totalIssues / 1000) * 100)}%</div>
                <div class="stat-label">类型安全度</div>
            </div>
        </div>
        
        ${
          totalIssues === 0
            ? `
        <div class="section">
            <div class="no-issues">
                🎉 恭喜！项目已达到完全类型安全！
            </div>
        </div>
        `
            : `
        <div class="section">
            <h2>📊 问题分布</h2>
            <div class="chart-container">
                ${Object.entries(issueStats)
                  .map(
                    ([type, count]) => `
                <div class="chart-item">
                    <div class="chart-bar" style="height: ${Math.max(20, count * 5)}px;"></div>
                    <div>${type}</div>
                    <div><strong>${count}</strong></div>
                </div>
                `
                  )
                  .join('')}
            </div>
        </div>
        
        <div class="section">
            <h2>📋 详细问题列表</h2>
            ${results
              .map(
                (file) => `
            <div class="file-item">
                <div class="file-header">📁 ${file.file}</div>
                ${file.issues
                  .map(
                    (issue) => `
                <div class="issue-item">
                    <div>
                        <span class="issue-type type-${getSeverity(issue.type)}">${issue.type}</span>
                        <span class="issue-line">第 ${issue.line} 行</span>
                    </div>
                    <div class="issue-content">${escapeHtml(issue.content)}</div>
                    <div class="issue-suggestion">💡 ${getSuggestion(issue.type)}</div>
                </div>
                `
                  )
                  .join('')}
            </div>
            `
              )
              .join('')}
        </div>
        `
        }
        
        <div class="section">
            <h2>🛠️ 修复指南</h2>
            <ol>
                <li><strong>优先级排序</strong>: 先修复 any 类型断言（高风险），再处理 unknown 类型使用</li>
                <li><strong>使用工具函数</strong>: 利用 typeSafeHelpers.ts 中的类型安全工具</li>
                <li><strong>添加类型守卫</strong>: 为复杂数据结构提供运行时验证</li>
                <li><strong>渐进式迁移</strong>: 保持向后兼容，使用 @deprecated 标记过时类型</li>
                <li><strong>文档更新</strong>: 为新类型添加完整的 TSDoc 文档</li>
            </ol>
        </div>
        
        <div class="footer">
            <p>📚 详细指南请参考: <code>docs/type-safety-guide.md</code></p>
            <p>🔧 运行 <code>npm run type-safety:check</code> 进行快速检查</p>
        </div>
    </div>
</body>
</html>
  `;

  return html;
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

// HTML转义
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// 主函数
function main() {
  console.log('🚀 生成 TypeScript 类型安全详细报告...');

  ensureOutputDir();

  const results = scanDirectory(CONFIG.srcDir);
  const html = generateHtmlReport(results);

  const reportPath = path.join(CONFIG.outputDir, CONFIG.reportFile);
  fs.writeFileSync(reportPath, html, 'utf8');

  console.log(`✅ 报告已生成: ${reportPath}`);
  console.log(
    `📊 发现 ${results.reduce((sum, file) => sum + file.issues.length, 0)} 个问题，影响 ${results.length} 个文件`
  );
}

// 运行生成器
if (require.main === module) {
  main();
}
