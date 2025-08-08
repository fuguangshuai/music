#!/usr/bin/env node
const path = require('path');

/**
 * 优化成果测试脚本
 * 用于验证代码优化的效果和质量提升
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 开始优化成果测试...\n');

// 测试结果收集
const testResults = {
  eslint: { passed: false, errors: 0, warnings: 0 },
  typescript: { passed: false, errors: 0 },
  build: { passed: false, time: 0 },
  security: { passed: false, vulnerabilities: 0 },
  performance: {
    buildSize: 0,
    startTime: 0,
    memoryUsage: 0,
    bundleAnalysis: null,
    runtimeMetrics: null,
  },
};

/**
 * 执行命令并返回结果
 */
function executeCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      cwd: process.cwd(),
      ...options,
    });
    return { success: true, output: result };
  } catch (_error) {
    return { success: false, output: _error.stdout || _error.message, _error };
  }
}

/**
 * 测试1: ESLint代码质量检查
 */
function testESLint() {
  console.log('📋 测试1: ESLint代码质量检查');

  const result = executeCommand('npm run lint', { stdio: 'pipe' });

  if (result.success) {
    testResults.eslint.passed = true;
    testResults.eslint.errors = 0;
    testResults.eslint.warnings = 0;
    console.log('✅ ESLint检查通过，无错误和警告');
  } else {
    // 解析错误和警告数量
    const output = result.output;
    const errorMatch = output.match(/(\d+) error/);
    const warningMatch = output.match(/(\d+) warning/);

    testResults.eslint.errors = errorMatch ? parseInt(errorMatch[1]) : 0;
    testResults.eslint.warnings = warningMatch ? parseInt(warningMatch[1]) : 0;

    if (testResults.eslint.errors === 0) {
      testResults.eslint.passed = true;
      console.log(`✅ ESLint检查通过，仅有 ${testResults.eslint.warnings} 个警告`);
    } else {
      console.log(
        `❌ ESLint检查失败，${testResults.eslint.errors} 个错误，${testResults.eslint.warnings} 个警告`
      );
    }
  }
  console.log('');
}

/**
 * 测试2: TypeScript类型检查
 */
function testTypeScript() {
  console.log('📋 测试2: TypeScript类型检查');

  const result = executeCommand('npx tsc --noEmit', { stdio: 'pipe' });

  if (result.success) {
    testResults.typescript.passed = true;
    testResults.typescript.errors = 0;
    console.log('✅ TypeScript类型检查通过');
  } else {
    const output = result.output;
    const errorMatch = output.match(/Found (\d+) error/);
    testResults.typescript.errors = errorMatch ? parseInt(errorMatch[1]) : 1;
    console.log(`❌ TypeScript类型检查失败，${testResults.typescript.errors} 个错误`);
  }
  console.log('');
}

/**
 * 测试3: 项目构建测试
 */
function testBuild() {
  console.log('📋 测试3: 项目构建测试');

  const startTime = Date.now();
  const result = executeCommand('npm run build', { stdio: 'pipe' });
  const buildTime = Date.now() - startTime;

  testResults.build.time = buildTime;

  if (result.success) {
    testResults.build.passed = true;
    console.log(`✅ 项目构建成功，耗时 ${(buildTime / 1000).toFixed(2)}s`);

    // 检查构建产物大小
    try {
      const distPath = require('path').join(process.cwd(), 'dist');
      if (fs.existsSync(distPath)) {
        const stats = fs.statSync(distPath);
        testResults.performance.buildSize = stats.size;
        console.log(`📦 构建产物大小: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
      }
    } catch (_error) {
      console.log('⚠️  无法获取构建产物大小');
    }
  } else {
    console.log(`❌ 项目构建失败，耗时 ${(buildTime / 1000).toFixed(2)}s`);
    console.log('构建错误:', result.output.slice(0, 500));
  }
  console.log('');
}

/**
 * 测试4: 安全漏洞检查
 */
function testSecurity() {
  console.log('📋 测试4: 安全漏洞检查');

  const result = executeCommand('npm audit --audit-level=moderate', { stdio: 'pipe' });

  if (result.success) {
    testResults.security.passed = true;
    testResults.security.vulnerabilities = 0;
    console.log('✅ 安全检查通过，无中等及以上级别漏洞');
  } else {
    const output = result.output;
    const vulnMatch = output.match(/(\d+) vulnerabilities/);
    testResults.security.vulnerabilities = vulnMatch ? parseInt(vulnMatch[1]) : 1;

    if (output.includes('found 0 vulnerabilities')) {
      testResults.security.passed = true;
      testResults.security.vulnerabilities = 0;
      console.log('✅ 安全检查通过，无漏洞');
    } else {
      console.log(`❌ 发现 ${testResults.security.vulnerabilities} 个安全漏洞`);
    }
  }
  console.log('');
}

/**
 * 测试5: 性能基准测试
 */
function testPerformanceBenchmark() {
  console.log('📋 测试5: 性能基准测试');

  try {
    // 内存使用监控
    if (process.memoryUsage) {
      const memUsage = process.memoryUsage();
      testResults.performance.memoryUsage = memUsage.heapUsed;
      console.log(`💾 内存使用: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`📊 堆内存总量: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`);
    }

    // Bundle分析（如果存在分析文件）
    const bundleAnalysisPath = require('path').join(process.cwd(), 'dist', 'stats.json');
    if (fs.existsSync(bundleAnalysisPath)) {
      try {
        const bundleStats = JSON.parse(fs.readFileSync(bundleAnalysisPath, 'utf8'));
        testResults.performance.bundleAnalysis = {
          assets: bundleStats.assets?.length || 0,
          chunks: bundleStats.chunks?.length || 0,
          modules: bundleStats.modules?.length || 0,
        };
        console.log(`📦 Bundle分析: ${testResults.performance.bundleAnalysis.assets} 个资源文件`);
      } catch (_error) {
        console.log('⚠️  Bundle分析文件解析失败');
      }
    }

    // 运行时性能指标收集（模拟）
    testResults.performance.runtimeMetrics = {
      timestamp: new Date().toISOString(),
      buildTime: testResults.build.time,
      memoryEfficiency:
        testResults.performance.memoryUsage < 100 * 1024 * 1024 ? 'good' : 'needs-optimization',
    };

    console.log('✅ 性能基准测试完成');
  } catch (_error) {
    console.log('⚠️  性能基准测试失败:', _error.message);
  }
  console.log('');
}

/**
 * 测试6: 代码质量统计
 */
function testCodeQuality() {
  console.log('📋 测试6: 代码质量统计');

  try {
    // 统计代码行数
    const result = executeCommand('find src -name "*.ts" -o -name "*.vue" | xargs wc -l', {
      stdio: 'pipe',
    });
    if (result.success) {
      const lines = result.output.trim().split('\n');
      const totalLine = lines[lines.length - 1];
      const totalLines = totalLine.match(/(\d+)/)?.[1];
      console.log(`📊 总代码行数: ${totalLines} 行`);
    }

    // 统计文件数量
    const fileResult = executeCommand('find src -name "*.ts" -o -name "*.vue" | wc -l', {
      stdio: 'pipe',
    });
    if (fileResult.success) {
      const fileCount = fileResult.output.trim();
      console.log(`📁 源代码文件数: ${fileCount} 个`);
    }

    console.log('✅ 代码质量统计完成');
  } catch (_error) {
    console.log('⚠️  代码质量统计失败:', _error.message);
  }
  console.log('');
}

/**
 * 生成测试报告
 */
function generateReport() {
  console.log('📊 优化成果测试报告');
  console.log('='.repeat(50));

  const totalTests = 4;
  const passedTests = [
    testResults.eslint.passed,
    testResults.typescript.passed,
    testResults.build.passed,
    testResults.security.passed,
  ].filter(Boolean).length;

  console.log(
    `总体通过率: ${passedTests}/${totalTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`
  );
  console.log('');

  console.log('详细结果:');
  console.log(
    `• ESLint检查: ${testResults.eslint.passed ? '✅ 通过' : '❌ 失败'} (${testResults.eslint.errors} 错误, ${testResults.eslint.warnings} 警告)`
  );
  console.log(
    `• TypeScript检查: ${testResults.typescript.passed ? '✅ 通过' : '❌ 失败'} (${testResults.typescript.errors} 错误)`
  );
  console.log(
    `• 项目构建: ${testResults.build.passed ? '✅ 通过' : '❌ 失败'} (${(testResults.build.time / 1000).toFixed(2)}s)`
  );
  console.log(
    `• 安全检查: ${testResults.security.passed ? '✅ 通过' : '❌ 失败'} (${testResults.security.vulnerabilities} 漏洞)`
  );

  console.log('');
  console.log('性能指标:');
  console.log(`• 构建时间: ${(testResults.build.time / 1000).toFixed(2)}s`);
  if (testResults.performance.buildSize > 0) {
    console.log(`• 构建大小: ${(testResults.performance.buildSize / 1024 / 1024).toFixed(2)}MB`);
  }
  if (testResults.performance.memoryUsage > 0) {
    console.log(`• 内存使用: ${(testResults.performance.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
  }
  if (testResults.performance.bundleAnalysis) {
    console.log(`• Bundle资源: ${testResults.performance.bundleAnalysis.assets} 个文件`);
  }

  // 保存报告到文件
  const reportData = {
    timestamp: new Date().toISOString(),
    results: testResults,
    summary: {
      totalTests,
      passedTests,
      passRate: ((passedTests / totalTests) * 100).toFixed(1),
    },
  };

  fs.writeFileSync('optimization-test-report.json', JSON.stringify(reportData, null, 2));
  console.log('');
  console.log('📄 详细报告已保存到: optimization-test-report.json');
}

/**
 * 主测试流程
 */
async function runTests() {
  try {
    testESLint();
    testTypeScript();
    testBuild();
    testSecurity();
    testPerformanceBenchmark();
    testCodeQuality();
    generateReport();

    console.log('');
    console.log('🎉 优化成果测试完成！');
  } catch (_error) {
    console._error('❌ 测试过程中发生错误:', _error.message);
    process.exit(1);
  }
}

// 运行测试
runTests();
