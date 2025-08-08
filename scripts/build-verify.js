#!/usr/bin/env node
const path = require('path');

/**
 * 🏗️ 构建验证脚本
 * 验证所有目标平台的构建产物
 *
 * 使用方法:
 * node scripts/build-verify.js
 * npm run build:verify
 */

const { execSync } = require('child_process');
const fs = require('fs');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: msg => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: msg => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: msg => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: msg => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  title: msg => console.log(`\n${colors.cyan}🏗️ ${msg}${colors.reset}\n`),
};

/**
 * 执行命令
 */
function runCommand(command, options = {}) {
  try {
    const startTime = Date.now();
    log.info(`执行: ${command}`);

    const output = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });

    const endTime = Date.now();
    return {
      success: true,
      output,
      time: endTime - startTime,
    };
  } catch (_error) {
    return {
      success: false,
      _error: _error.message,
      output: _error.stdout || '',
      stderr: _error.stderr || '',
    };
  }
}

/**
 * 检查文件大小
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * 格式化文件大小
 * 注意：这是Node.js脚本，不能使用ES6模块导入，保留独立实现
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 验证构建产物
 */
function verifyBuildOutput() {
  log.title('验证构建产物');

  const buildPaths = [
    'out/main/index.js',
    'out/preload/index.js',
    'out/renderer/index.html',
    'out/renderer/assets',
  ];

  let allExists = true;
  const sizes = {};

  buildPaths.forEach(buildPath => {
    if (fs.existsSync(buildPath)) {
      const size = getFileSize(buildPath);
      sizes[buildPath] = size;
      log.success(`${buildPath} - ${formatSize(size)}`);
    } else {
      log.error(`缺少构建产物: ${buildPath}`);
      allExists = false;
    }
  });

  // 检查renderer assets目录
  if (fs.existsSync('out/renderer/assets')) {
    const assets = fs.readdirSync('out/renderer/assets');
    log.info(`Assets文件数量: ${assets.length}`);

    // 检查关键资源
    const hasJS = assets.some(file => file.endsWith('.js'));
    const hasCSS = assets.some(file => file.endsWith('.css'));

    if (hasJS && hasCSS) {
      log.success('关键资源文件存在 (JS + CSS)');
    } else {
      log.warning('可能缺少关键资源文件');
    }
  }

  return allExists;
}

/**
 * 主构建验证
 */
async function verifyMainBuild() {
  log.title('主构建验证');

  // 清理之前的构建
  if (fs.existsSync('out')) {
    log.info('清理之前的构建产物...');
    runCommand('rm -rf out', { silent: true });
  }

  // 执行构建
  const _buildResult = runCommand('npm run build');

  if (!_buildResult.success) {
    log.error('主构建失败');
    return false;
  }

  log.success(`主构建成功，耗时: ${(_buildResult.time / 1000).toFixed(2)}s`);

  // 验证构建产物
  return verifyBuildOutput();
}

/**
 * 平台特定构建验证
 */
async function verifyPlatformBuilds() {
  log.title('平台构建验证');

  const platforms = [
    { name: 'Windows', command: 'npm run build:win' },
    { name: 'macOS', command: 'npm run build:mac' },
    { name: 'Linux', command: 'npm run build:linux' },
  ];

  const results = {};

  for (const platform of platforms) {
    log.info(`验证 ${platform.name} 构建...`);

    try {
      const result = runCommand(platform.command, { silent: true });

      if (result.success) {
        results[platform.name] = {
          success: true,
          time: result.time,
        };
        log.success(`${platform.name} 构建成功 (${(result.time / 1000).toFixed(2)}s)`);
      } else {
        results[platform.name] = {
          success: false,
          error: result.error,
        };
        log.error(`${platform.name} 构建失败: ${result.error}`);
      }
    } catch (_error) {
      results[platform.name] = {
        success: false,
        _error: _error.message,
      };
      log.warning(`${platform.name} 构建跳过: ${_error.message}`);
    }
  }

  return results;
}

/**
 * 性能基准测试
 */
async function performanceBenchmark() {
  log.title('性能基准测试');

  const benchmarks = {};

  // 构建时间基准
  log.info('测试构建时间...');
  const buildStart = Date.now();
  const _buildResult = runCommand('npm run build', { silent: true });
  const buildTime = Date.now() - buildStart;

  benchmarks.buildTime = buildTime;
  log.info(`构建时间: ${(buildTime / 1000).toFixed(2)}s`);

  // 构建产物大小
  if (fs.existsSync('out')) {
    const getDirectorySize = dirPath => {
      let totalSize = 0;
      const files = fs.readdirSync(dirPath);

      files.forEach(file => {
        const filePath = require('path').join(dirPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          totalSize += getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      });

      return totalSize;
    };

    const totalSize = getDirectorySize('out');
    benchmarks.buildSize = totalSize;
    log.info(`构建产物总大小: ${formatSize(totalSize)}`);
  }

  // TypeScript编译时间
  log.info('测试TypeScript编译时间...');
  const tscStart = Date.now();
  runCommand('npx tsc --noEmit', { silent: true });
  const tscTime = Date.now() - tscStart;

  benchmarks.tscTime = tscTime;
  log.info(`TypeScript编译时间: ${(tscTime / 1000).toFixed(2)}s`);

  return benchmarks;
}

/**
 * 生成构建报告
 */
function generateBuildReport(mainBuild, platformBuilds, benchmarks) {
  log.title('构建验证报告');

  const report = {
    timestamp: new Date().toISOString(),
    mainBuild: {
      success: mainBuild,
      timestamp: new Date().toISOString(),
    },
    platformBuilds,
    benchmarks,
    summary: {
      totalPlatforms: Object.keys(platformBuilds).length,
      successfulPlatforms: Object.values(platformBuilds).filter(p => p.success).length,
      overallSuccess: mainBuild && Object.values(platformBuilds).some(p => p.success),
    },
  };

  // 输出摘要
  console.log('📊 构建验证摘要:');
  console.log(`  主构建: ${mainBuild ? '✅ 成功' : '❌ 失败'}`);
  console.log(
    `  平台构建: ${report.summary.successfulPlatforms}/${report.summary.totalPlatforms} 成功`
  );
  console.log(`  构建时间: ${(benchmarks.buildTime / 1000).toFixed(2)}s`);
  console.log(`  产物大小: ${formatSize(benchmarks.buildSize)}`);
  console.log(`  TS编译: ${(benchmarks.tscTime / 1000).toFixed(2)}s`);

  // 平台详情
  console.log('\n🖥️ 平台构建详情:');
  Object.entries(platformBuilds).forEach(([platform, result]) => {
    const status = result.success ? '✅' : '❌';
    const time = result.time ? `(${(result.time / 1000).toFixed(2)}s)` : '';
    console.log(`  ${platform}: ${status} ${time}`);
  });

  // 保存报告
  fs.writeFileSync('build-report.json', JSON.stringify(report, null, 2));
  log.info('详细报告已保存到 build-report.json');

  return report.summary.overallSuccess;
}

/**
 * 主函数
 */
async function main() {
  console.log(`${colors.cyan}🏗️ Alger音乐播放器 - 构建验证${colors.reset}\n`);

  const startTime = Date.now();

  try {
    // 1. 主构建验证
    const mainBuildSuccess = await verifyMainBuild();

    // 2. 平台构建验证 (可选)
    const platformResults = await verifyPlatformBuilds();

    // 3. 性能基准测试
    const benchmarks = await performanceBenchmark();

    // 4. 生成报告
    const overallSuccess = generateBuildReport(mainBuildSuccess, platformResults, benchmarks);

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    console.log(`\n⏱️ 总验证时间: ${totalTime.toFixed(2)}s`);

    if (overallSuccess) {
      log.success('构建验证通过！所有构建正常 🎉');
      process.exit(0);
    } else {
      log.error('构建验证失败，请检查构建配置');
      process.exit(1);
    }
  } catch (_error) {
    log._error(`构建验证过程中发生错误: ${_error.message}`);
    process.exit(1);
  }
}

// 运行验证
if (require.main === module) {
  main();
}

module.exports = { main };
