#!/usr/bin/env node
const path = require('path');

/**
 * 综合测试报告生成脚本
 * 运行所有测试并生成详细的测试报告
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 开始综合测试验证...\n');

// 测试结果收集
const testResults = {
  unit: { passed: false, coverage: 0, duration: 0 },
  integration: { passed: false, coverage: 0, duration: 0 },
  e2e: { passed: false, coverage: 0, duration: 0 },
  overall: { passed: false, totalCoverage: 0, totalDuration: 0 },
};

/**
 * 执行命令并返回结果
 */
function executeCommand(command, options = {}) {
  try {
    const startTime = Date.now();
    const result = execSync(command, {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: 'pipe',
      ...options,
    });
    const duration = Date.now() - startTime;
    return { success: true, output: result, duration };
  } catch (_error) {
    const duration = Date.now() - (_error.startTime || Date.now());
    return {
      success: false,
      output: _error.stdout || _error.message,
      _error,
      duration,
    };
  }
}

/**
 * 解析测试覆盖率
 */
function parseCoverage(output) {
  const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
  return coverageMatch ? parseFloat(coverageMatch[1]) : 0;
}

/**
 * 测试1: 单元测试
 */
function runUnitTests() {
  console.log('📋 测试1: 单元测试');

  const result = executeCommand('npm run test:unit');
  testResults.unit.duration = result.duration;

  if (result.success) {
    testResults.unit.passed = true;
    testResults.unit.coverage = parseCoverage(result.output);
    console.log(`✅ 单元测试通过，耗时 ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`📊 单元测试覆盖率: ${testResults.unit.coverage}%`);
  } else {
    console.log(`❌ 单元测试失败，耗时 ${(result.duration / 1000).toFixed(2)}s`);
    console.log('错误信息:', result.output.slice(0, 300));
  }
  console.log('');
}

/**
 * 测试2: 集成测试
 */
function runIntegrationTests() {
  console.log('📋 测试2: 集成测试');

  const result = executeCommand('npm run test:integration');
  testResults.integration.duration = result.duration;

  if (result.success) {
    testResults.integration.passed = true;
    testResults.integration.coverage = parseCoverage(result.output);
    console.log(`✅ 集成测试通过，耗时 ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`📊 集成测试覆盖率: ${testResults.integration.coverage}%`);
  } else {
    console.log(`❌ 集成测试失败，耗时 ${(result.duration / 1000).toFixed(2)}s`);
    console.log('错误信息:', result.output.slice(0, 300));
  }
  console.log('');
}

/**
 * 测试3: 端到端测试
 */
function runE2ETests() {
  console.log('📋 测试3: 端到端测试');

  const result = executeCommand('npm run test:e2e');
  testResults.e2e.duration = result.duration;

  if (result.success) {
    testResults.e2e.passed = true;
    testResults.e2e.coverage = parseCoverage(result.output);
    console.log(`✅ 端到端测试通过，耗时 ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`📊 端到端测试覆盖率: ${testResults.e2e.coverage}%`);
  } else {
    console.log(`❌ 端到端测试失败，耗时 ${(result.duration / 1000).toFixed(2)}s`);
    console.log('错误信息:', result.output.slice(0, 300));
  }
  console.log('');
}

/**
 * 测试4: 整体覆盖率测试
 */
function runCoverageTest() {
  console.log('📋 测试4: 整体覆盖率测试');

  const result = executeCommand('npm run test:coverage');

  if (result.success) {
    testResults.overall.totalCoverage = parseCoverage(result.output);
    console.log(`✅ 覆盖率测试完成`);
    console.log(`📊 整体测试覆盖率: ${testResults.overall.totalCoverage}%`);
  } else {
    console.log(`❌ 覆盖率测试失败`);
    console.log('错误信息:', result.output.slice(0, 300));
  }
  console.log('');
}

/**
 * 测试5: 代码质量验证
 */
function runQualityCheck() {
  console.log('📋 测试5: 代码质量验证');

  // ESLint检查
  const eslintResult = executeCommand('npm run lint');
  const eslintPassed = eslintResult.success || eslintResult.output.includes('0 errors');

  // TypeScript检查
  const tscResult = executeCommand('npm run typecheck');
  const tscPassed = tscResult.success;

  // 构建测试
  const _buildResult = executeCommand('npm run build');
  const buildPassed = _buildResult.success;

  console.log(`${eslintPassed ? '✅' : '❌'} ESLint检查: ${eslintPassed ? '通过' : '失败'}`);
  console.log(`${tscPassed ? '✅' : '❌'} TypeScript检查: ${tscPassed ? '通过' : '失败'}`);
  console.log(`${buildPassed ? '✅' : '❌'} 构建测试: ${buildPassed ? '通过' : '失败'}`);

  testResults.overall.passed = eslintPassed && tscPassed && buildPassed;
  console.log('');
}

/**
 * 生成测试报告
 */
function generateReport() {
  console.log('📊 生成测试报告');

  // 计算总体指标
  const passedTests = [
    testResults.unit.passed,
    testResults.integration.passed,
    testResults.e2e.passed,
    testResults.overall.passed,
  ].filter(Boolean).length;

  const totalTests = 4;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  testResults.overall.totalDuration =
    testResults.unit.duration + testResults.integration.duration + testResults.e2e.duration;

  // 生成报告
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests,
      passedTests,
      passRate: `${passRate}%`,
      totalDuration: `${(testResults.overall.totalDuration / 1000).toFixed(2)}s`,
      overallCoverage: `${testResults.overall.totalCoverage}%`,
    },
    details: {
      unitTests: {
        passed: testResults.unit.passed,
        coverage: `${testResults.unit.coverage}%`,
        duration: `${(testResults.unit.duration / 1000).toFixed(2)}s`,
      },
      integrationTests: {
        passed: testResults.integration.passed,
        coverage: `${testResults.integration.coverage}%`,
        duration: `${(testResults.integration.duration / 1000).toFixed(2)}s`,
      },
      e2eTests: {
        passed: testResults.e2e.passed,
        coverage: `${testResults.e2e.coverage}%`,
        duration: `${(testResults.e2e.duration / 1000).toFixed(2)}s`,
      },
      qualityCheck: {
        passed: testResults.overall.passed,
      },
    },
  };

  // 保存报告
  fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));

  // 输出报告
  console.log('');
  console.log('🎯 综合测试报告');
  console.log('==================================================');
  console.log(`总体通过率: ${passedTests}/${totalTests} (${passRate}%)`);
  console.log('');
  console.log('详细结果:');
  console.log(
    `• 单元测试: ${testResults.unit.passed ? '✅ 通过' : '❌ 失败'} (覆盖率: ${testResults.unit.coverage}%)`
  );
  console.log(
    `• 集成测试: ${testResults.integration.passed ? '✅ 通过' : '❌ 失败'} (覆盖率: ${testResults.integration.coverage}%)`
  );
  console.log(
    `• 端到端测试: ${testResults.e2e.passed ? '✅ 通过' : '❌ 失败'} (覆盖率: ${testResults.e2e.coverage}%)`
  );
  console.log(`• 代码质量: ${testResults.overall.passed ? '✅ 通过' : '❌ 失败'}`);
  console.log('');
  console.log('性能指标:');
  console.log(`• 总测试时间: ${(testResults.overall.totalDuration / 1000).toFixed(2)}s`);
  console.log(`• 整体覆盖率: ${testResults.overall.totalCoverage}%`);
  console.log('');
  console.log(`📄 详细报告已保存至: test-report.json`);
}

/**
 * 主测试流程
 */
async function runTests() {
  try {
    runUnitTests();
    runIntegrationTests();
    runE2ETests();
    runCoverageTest();
    runQualityCheck();
    generateReport();

    console.log('');
    console.log('🎉 综合测试验证完成！');

    // 根据结果设置退出码
    const allPassed =
      testResults.unit.passed &&
      testResults.integration.passed &&
      testResults.e2e.passed &&
      testResults.overall.passed;

    process.exit(allPassed ? 0 : 1);
  } catch (_error) {
    console._error('❌ 测试过程中发生错误:', _error.message);
    process.exit(1);
  }
}

// 运行测试
runTests();
