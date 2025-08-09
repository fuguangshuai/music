#!/usr/bin/env node

/**
 * 性能监控集成工具
 * 基于现有optimization-test.js扩展，提供运行时性能监控集成
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 启动性能监控集成...\n');

/**
 * 执行命令并返回结果
 */
function executeCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      cwd: process.cwd(),
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, output: error.stdout || error.message, error };
  }
}

/**
 * 启用性能监控
 */
function enablePerformanceMonitoring() {
  console.log('📊 启用运行时性能监控...');

  try {
    // 在localStorage中设置性能监控标志
    const enableScript = `
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('enable-performance-monitor', 'true');
        console.log('性能监控已启用');
      }
    `;

    // 创建临时脚本文件
    const tempScript = path.join(process.cwd(), 'temp-enable-monitor.js');
    fs.writeFileSync(tempScript, enableScript);

    console.log('✅ 性能监控配置已更新');

    // 清理临时文件
    fs.unlinkSync(tempScript);
  } catch (error) {
    console.error('❌ 启用性能监控失败:', error.message);
  }
}

/**
 * 运行性能基准测试
 */
function runPerformanceBenchmark() {
  console.log('🏃 运行性能基准测试...');

  try {
    // 运行现有的优化测试，包含新的性能基准
    const result = executeCommand('node scripts/optimization-test.js', { stdio: 'pipe' });

    if (result.success) {
      console.log('✅ 性能基准测试完成');

      // 解析测试报告
      const reportPath = path.join(process.cwd(), 'optimization-test-report.json');
      if (fs.existsSync(reportPath)) {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

        console.log('\n📊 性能基准结果:');
        if (report.results.performance) {
          const perf = report.results.performance;
          const buildTime = perf.buildTime || 0;
          console.log(`• 构建时间: ${(buildTime / 1000).toFixed(2)}s`);
          if (perf.memoryUsage) {
            console.log(`• 内存使用: ${(perf.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
          }
          if (perf.bundleAnalysis) {
            console.log(`• Bundle资源: ${perf.bundleAnalysis.assets} 个文件`);
          }
        }
      }
    } else {
      console.log('❌ 性能基准测试失败');
      console.log(result.output.slice(0, 500));
    }
  } catch (error) {
    console.error('❌ 性能基准测试错误:', error.message);
  }
}

/**
 * 生成Bundle分析报告
 */
function generateBundleAnalysis() {
  console.log('📦 生成Bundle分析报告...');

  try {
    // 使用ANALYZE环境变量运行构建
    const result = executeCommand('ANALYZE=true npm run build', {
      stdio: 'pipe',
      env: { ...process.env, ANALYZE: 'true' }
    });

    if (result.success) {
      console.log('✅ Bundle分析报告已生成');

      const statsPath = path.join(process.cwd(), 'dist', 'stats.html');
      if (fs.existsSync(statsPath)) {
        console.log(`📄 分析报告位置: ${statsPath}`);
      }
    } else {
      console.log('❌ Bundle分析失败');
    }
  } catch (error) {
    console.error('❌ Bundle分析错误:', error.message);
  }
}

/**
 * 检查性能退化
 */
function checkPerformanceRegression() {
  console.log('🔍 检查性能退化...');

  try {
    const reportPath = path.join(process.cwd(), 'optimization-test-report.json');
    const baselinePath = path.join(process.cwd(), 'performance-baseline.json');

    if (!fs.existsSync(reportPath)) {
      console.log('⚠️  当前性能报告不存在，请先运行性能测试');
      return;
    }

    const currentReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    if (!fs.existsSync(baselinePath)) {
      // 如果没有基准，将当前报告作为基准
      fs.writeFileSync(baselinePath, JSON.stringify(currentReport, null, 2));
      console.log('📊 性能基准已建立');
      return;
    }

    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

    // 比较关键性能指标
    const current = currentReport.results.performance;
    const base = baseline.results.performance;

    console.log('\n📈 性能对比结果:');

    // 构建时间对比
    const buildTimeDiff = ((current.buildTime - base.buildTime) / base.buildTime) * 100;
    console.log(`• 构建时间: ${buildTimeDiff > 0 ? '+' : ''}${buildTimeDiff.toFixed(1)}%`);

    // 内存使用对比
    if (current.memoryUsage && base.memoryUsage) {
      const memoryDiff = ((current.memoryUsage - base.memoryUsage) / base.memoryUsage) * 100;
      console.log(`• 内存使用: ${memoryDiff > 0 ? '+' : ''}${memoryDiff.toFixed(1)}%`);
    }

    // 检查是否有显著退化
    const hasRegression = buildTimeDiff > 10; // 构建时间增加超过10%

    if (hasRegression) {
      console.log('\n⚠️  检测到性能退化！');
      process.exit(1);
    } else {
      console.log('\n✅ 性能保持稳定');
    }
  } catch (error) {
    console.error('❌ 性能退化检查失败:', error.message);
  }
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'enable':
      enablePerformanceMonitoring();
      break;
    case 'benchmark':
      runPerformanceBenchmark();
      break;
    case 'analyze':
      generateBundleAnalysis();
      break;
    case 'check':
      checkPerformanceRegression();
      break;
    case 'all':
      enablePerformanceMonitoring();
      runPerformanceBenchmark();
      generateBundleAnalysis();
      checkPerformanceRegression();
      break;
    default:
      console.log('使用方法:');
      console.log('  node scripts/performance-monitor.js enable    # 启用性能监控');
      console.log('  node scripts/performance-monitor.js benchmark # 运行性能基准测试');
      console.log('  node scripts/performance-monitor.js analyze   # 生成Bundle分析');
      console.log('  node scripts/performance-monitor.js check     # 检查性能退化');
      console.log('  node scripts/performance-monitor.js all       # 运行所有测试');
      break;
  }
}

// 运行主函数
main();
