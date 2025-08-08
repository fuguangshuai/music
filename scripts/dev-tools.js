#!/usr/bin/env node
const path = require('path');

/**
 * 开发工具链集成脚本
 * 简化版本，统一管理所有开发工具
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');

console.log('🛠️  开发工具链管理器\n');

/**
 * 执行命令
 */
function executeCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
    return { success: true, output: result };
  } catch (_error) {
    return { success: false, _error: _error.message, output: _error.stdout };
  }
}

/**
 * 异步执行命令
 */
function spawnCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });

    child.on('close', code => {
      if (code === 0) {
        resolve({ success: true, code });
      } else {
        reject({ success: false, code });
      }
    });

    child.on('error', error => {
      reject({ success: false, error: error.message });
    });
  });
}

/**
 * 检查项目状态
 */
function checkProjectStatus() {
  console.log('📊 检查项目状态...\n');

  const checks = [
    {
      name: '依赖安装',
      check: () => fs.existsSync('node_modules'),
      fix: 'npm install',
    },
    {
      name: 'TypeScript配置',
      check: () => fs.existsSync('tsconfig.json'),
      fix: '请检查tsconfig.json文件',
    },
    {
      name: 'Vite配置',
      check: () => fs.existsSync('vite.config.ts'),
      fix: '请检查vite.config.ts文件',
    },
    {
      name: '测试配置',
      check: () => fs.existsSync('vitest.config.ts'),
      fix: '请检查vitest.config.ts文件',
    },
  ];

  let allPassed = true;

  checks.forEach(({ name, check, fix }) => {
    const passed = check();
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${name}`);

    if (!passed) {
      console.log(`   修复建议: ${fix}`);
      allPassed = false;
    }
  });

  console.log('');
  return allPassed;
}

/**
 * 运行代码质量检查
 */
async function runQualityCheck() {
  console.log('🔍 运行代码质量检查...\n');

  const tasks = [
    { name: 'ESLint检查', command: 'npm run lint' },
    { name: 'TypeScript检查', command: 'npm run typecheck' },
    { name: '单元测试', command: 'npm run test' },
  ];

  for (const task of tasks) {
    console.log(`📋 ${task.name}...`);
    const result = executeCommand(task.command, { silent: true });

    if (result.success) {
      console.log(`✅ ${task.name} 通过\n`);
    } else {
      console.log(`❌ ${task.name} 失败`);
      console.log(result.output || result._error);
      console.log('');
    }
  }
}

/**
 * 运行性能测试
 */
async function runPerformanceTest() {
  console.log('⚡ 运行性能测试...\n');

  const tasks = [
    { name: '性能基准测试', command: 'npm run bench' },
    { name: '性能监控', command: 'npm run perf:benchmark' },
  ];

  for (const task of tasks) {
    console.log(`📊 ${task.name}...`);
    const result = executeCommand(task.command);

    if (result.success) {
      console.log(`✅ ${task.name} 完成\n`);
    } else {
      console.log(`❌ ${task.name} 失败\n`);
    }
  }
}

/**
 * 运行E2E测试
 */
async function runE2ETest() {
  console.log('🎭 运行E2E测试...\n');

  const result = executeCommand('npm run test:e2e');

  if (result.success) {
    console.log('✅ E2E测试通过\n');
  } else {
    console.log('❌ E2E测试失败\n');
  }
}

/**
 * 构建项目
 */
async function buildProject(incremental = false) {
  console.log(`🔨 ${incremental ? '增量' : '完整'}构建项目...\n`);

  const command = incremental ? 'npm run build:incremental' : 'npm run build';
  const result = executeCommand(command);

  if (result.success) {
    console.log('✅ 项目构建成功\n');
  } else {
    console.log('❌ 项目构建失败\n');
  }

  return result.success;
}

/**
 * 开发模式
 */
async function developmentMode() {
  console.log('🚀 启动开发模式...\n');

  try {
    await spawnCommand('npm', ['run', 'dev']);
  } catch (_error) {
    console._error('❌ 开发服务器启动失败:', _error._error || _error);
  }
}

/**
 * 监听模式
 */
async function watchMode() {
  console.log('👀 启动监听模式...\n');

  try {
    await spawnCommand('npm', ['run', 'build:watch']);
  } catch (_error) {
    console._error('❌ 监听模式启动失败:', _error._error || _error);
  }
}

/**
 * 清理项目
 */
function cleanProject() {
  console.log('🧹 清理项目...\n');

  const cleanTasks = [
    { name: '清理构建产物', command: 'npm run build:clean' },
    { name: '清理依赖', command: 'rm -rf node_modules' },
    { name: '清理缓存', command: 'npm cache clean --force' },
  ];

  cleanTasks.forEach(({ name, command }) => {
    console.log(`🗑️  ${name}...`);
    const result = executeCommand(command);

    if (result.success) {
      console.log(`✅ ${name} 完成`);
    } else {
      console.log(`⚠️  ${name} 跳过`);
    }
  });

  console.log('\n✅ 项目清理完成');
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
🛠️  开发工具链管理器

用法:
  node scripts/dev-tools.js [命令]

命令:
  status      检查项目状态
  quality     运行代码质量检查
  perf        运行性能测试
  e2e         运行E2E测试
  build       完整构建项目
  build:inc   增量构建项目
  dev         启动开发服务器
  watch       启动监听模式
  clean       清理项目
  all         运行所有检查和测试
  help        显示帮助信息

示例:
  node scripts/dev-tools.js status
  node scripts/dev-tools.js quality
  node scripts/dev-tools.js all
`);
}

/**
 * 运行所有检查
 */
async function runAll() {
  console.log('🎯 运行完整的开发工具链检查...\n');

  const startTime = Date.now();

  // 1. 检查项目状态
  const statusOk = checkProjectStatus();
  if (!statusOk) {
    console.log('❌ 项目状态检查失败，请先修复问题');
    return;
  }

  // 2. 代码质量检查
  await runQualityCheck();

  // 3. 性能测试
  await runPerformanceTest();

  // 4. E2E测试
  await runE2ETest();

  // 5. 构建测试
  const buildOk = await buildProject(false);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('📊 完整检查结果:');
  console.log(`⏱️  总耗时: ${duration}s`);
  console.log(`📋 项目状态: ${statusOk ? '✅ 正常' : '❌ 异常'}`);
  console.log(`🔨 构建状态: ${buildOk ? '✅ 成功' : '❌ 失败'}`);

  if (statusOk && buildOk) {
    console.log('\n🎉 所有检查通过，项目状态良好！');
  } else {
    console.log('\n⚠️  发现问题，请检查上述输出');
  }
}

/**
 * 主函数
 */
async function main() {
  const command = process.argv[2] || 'help';

  try {
    switch (command) {
      case 'status':
        checkProjectStatus();
        break;
      case 'quality':
        await runQualityCheck();
        break;
      case 'perf':
        await runPerformanceTest();
        break;
      case 'e2e':
        await runE2ETest();
        break;
      case 'build':
        await buildProject(false);
        break;
      case 'build:inc':
        await buildProject(true);
        break;
      case 'dev':
        await developmentMode();
        break;
      case 'watch':
        await watchMode();
        break;
      case 'clean':
        cleanProject();
        break;
      case 'all':
        await runAll();
        break;
      case 'help':
        showHelp();
        break;
      default:
        console.error(`❌ 未知命令: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (_error) {
    console._error('❌ 执行失败:', _error.message || _error);
    process.exit(1);
  }
}

// 运行主函数
main();
