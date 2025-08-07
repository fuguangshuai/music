#!/usr/bin/env node

/**
 * 🔍 代码质量自动化检查脚本
 * 用于验证代码质量、构建状态和功能完整性
 * 
 * 使用方法:
 * node scripts/quality-check.js
 * npm run quality-check
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出工具
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.cyan}🔍 ${msg}${colors.reset}\n`)
};

// 质量检查结果
const results = {
  typescript: { passed: false, errors: 0 },
  eslint: { passed: false, warnings: 0, errors: 0 },
  build: { passed: false, time: 0 },
  fileStructure: { passed: false, issues: [] },
  dependencies: { passed: false, vulnerabilities: 0 }
};

/**
 * 执行命令并返回结果
 */
function runCommand(command, options = {}) {
  try {
    const startTime = Date.now();
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    const endTime = Date.now();
    return { 
      success: true, 
      output, 
      time: endTime - startTime 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
}

/**
 * 1. TypeScript类型检查
 */
async function checkTypeScript() {
  log.title('TypeScript 类型检查');
  
  const result = runCommand('npx tsc --noEmit', { silent: true });
  
  if (result.success) {
    results.typescript.passed = true;
    log.success('TypeScript 类型检查通过');
  } else {
    results.typescript.passed = false;
    const errorCount = (result.stderr.match(/error TS/g) || []).length;
    results.typescript.errors = errorCount;
    log.error(`TypeScript 类型检查失败: ${errorCount} 个错误`);
    console.log(result.stderr);
  }
}

/**
 * 2. ESLint代码质量检查
 */
async function checkESLint() {
  log.title('ESLint 代码质量检查');
  
  const result = runCommand('npm run lint', { silent: true });
  
  // ESLint可能有警告但仍然成功
  const output = result.output || result.stderr || '';
  const warningMatch = output.match(/(\d+) problems? \(\d+ errors?, (\d+) warnings?\)/);
  
  if (warningMatch) {
    const totalProblems = parseInt(warningMatch[1]);
    const warnings = parseInt(warningMatch[2]);
    results.eslint.warnings = warnings;
    results.eslint.errors = totalProblems - warnings;
    
    if (results.eslint.errors === 0) {
      results.eslint.passed = true;
      log.success(`ESLint 检查通过: ${warnings} 个警告`);
    } else {
      results.eslint.passed = false;
      log.error(`ESLint 检查失败: ${results.eslint.errors} 个错误, ${warnings} 个警告`);
    }
  } else if (result.success) {
    results.eslint.passed = true;
    log.success('ESLint 检查完全通过，无警告无错误');
  } else {
    results.eslint.passed = false;
    log.error('ESLint 检查失败');
    console.log(output);
  }
}

/**
 * 3. 构建验证
 */
async function checkBuild() {
  log.title('项目构建验证');
  
  const result = runCommand('npm run build', { silent: true });
  
  if (result.success) {
    results.build.passed = true;
    results.build.time = result.time;
    log.success(`构建成功，耗时: ${(result.time / 1000).toFixed(2)}s`);
  } else {
    results.build.passed = false;
    log.error('构建失败');
    console.log(result.stderr);
  }
}

/**
 * 4. 文件结构检查
 */
async function checkFileStructure() {
  log.title('项目文件结构检查');
  
  const issues = [];
  
  // 检查是否存在无用文件
  const unwantedFiles = [
    '1panel.sh',
    'electron-builder.yml',
    '.DS_Store',
    'Thumbs.db'
  ];
  
  unwantedFiles.forEach(file => {
    if (fs.existsSync(file)) {
      issues.push(`发现无用文件: ${file}`);
    }
  });
  
  // 检查关键文件是否存在
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'eslint.config.mjs',
    'src/main/index.ts',
    'src/renderer/main.ts',
    'src/preload/index.ts'
  ];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      issues.push(`缺少关键文件: ${file}`);
    }
  });
  
  // 检查项目文档
  const docFiles = [
    'README.md',
    'CHANGELOG.md',
    'DEV.md'
  ];
  
  docFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      issues.push(`建议添加文档: ${file}`);
    }
  });
  
  results.fileStructure.issues = issues;
  results.fileStructure.passed = issues.length === 0;
  
  if (results.fileStructure.passed) {
    log.success('文件结构检查通过');
  } else {
    log.warning(`文件结构检查发现 ${issues.length} 个问题:`);
    issues.forEach(issue => log.warning(`  - ${issue}`));
  }
}

/**
 * 5. 依赖安全检查
 */
async function checkDependencies() {
  log.title('依赖安全检查');
  
  const result = runCommand('npm audit --audit-level=moderate', { silent: true });
  
  if (result.success) {
    results.dependencies.passed = true;
    log.success('依赖安全检查通过');
  } else {
    const output = result.output || result.stderr || '';
    const vulnMatch = output.match(/(\d+) vulnerabilities/);
    
    if (vulnMatch) {
      results.dependencies.vulnerabilities = parseInt(vulnMatch[1]);
      results.dependencies.passed = false;
      log.warning(`发现 ${results.dependencies.vulnerabilities} 个安全漏洞`);
      log.info('运行 "npm audit fix" 尝试自动修复');
    } else {
      results.dependencies.passed = false;
      log.error('依赖检查失败');
    }
  }
}

/**
 * 生成质量报告
 */
function generateReport() {
  log.title('质量检查报告');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(r => r.passed).length;
  const score = Math.round((passedChecks / totalChecks) * 100);
  
  console.log(`📊 总体评分: ${score}/100`);
  console.log(`✅ 通过检查: ${passedChecks}/${totalChecks}`);
  console.log('');
  
  // 详细结果
  console.log('📋 详细结果:');
  console.log(`  TypeScript: ${results.typescript.passed ? '✅ 通过' : `❌ 失败 (${results.typescript.errors} 错误)`}`);
  console.log(`  ESLint: ${results.eslint.passed ? '✅ 通过' : `❌ 失败`} (${results.eslint.warnings} 警告, ${results.eslint.errors} 错误)`);
  console.log(`  构建: ${results.build.passed ? '✅ 通过' : '❌ 失败'} ${results.build.time ? `(${(results.build.time/1000).toFixed(2)}s)` : ''}`);
  console.log(`  文件结构: ${results.fileStructure.passed ? '✅ 通过' : `⚠️ ${results.fileStructure.issues.length} 个问题`}`);
  console.log(`  依赖安全: ${results.dependencies.passed ? '✅ 通过' : `⚠️ ${results.dependencies.vulnerabilities} 个漏洞`}`);
  
  // 建议
  console.log('\n💡 改进建议:');
  if (!results.typescript.passed) {
    console.log('  - 修复 TypeScript 类型错误');
  }
  if (!results.eslint.passed || results.eslint.warnings > 50) {
    console.log('  - 减少 ESLint 警告，目标 <50 个');
  }
  if (!results.build.passed) {
    console.log('  - 修复构建错误');
  }
  if (!results.fileStructure.passed) {
    console.log('  - 清理无用文件，补充缺失文档');
  }
  if (!results.dependencies.passed) {
    console.log('  - 修复安全漏洞: npm audit fix');
  }
  
  // 保存报告到文件
  const reportData = {
    timestamp: new Date().toISOString(),
    score,
    results,
    summary: {
      total: totalChecks,
      passed: passedChecks,
      failed: totalChecks - passedChecks
    }
  };
  
  fs.writeFileSync('quality-report.json', JSON.stringify(reportData, null, 2));
  log.info('详细报告已保存到 quality-report.json');
  
  return score >= 80;
}

/**
 * 主函数
 */
async function main() {
  console.log(`${colors.cyan}🔍 Alger音乐播放器 - 代码质量自动化检查${colors.reset}\n`);
  
  const startTime = Date.now();
  
  try {
    await checkTypeScript();
    await checkESLint();
    await checkBuild();
    await checkFileStructure();
    await checkDependencies();
    
    const success = generateReport();
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    console.log(`\n⏱️ 总检查时间: ${totalTime.toFixed(2)}s`);
    
    if (success) {
      log.success('质量检查通过！项目状态良好 🎉');
      process.exit(0);
    } else {
      log.warning('质量检查发现问题，请查看上述建议进行改进');
      process.exit(1);
    }
    
  } catch (error) {
    log.error(`检查过程中发生错误: ${error.message}`);
    process.exit(1);
  }
}

// 运行检查
if (require.main === module) {
  main();
}

module.exports = { main, results };
