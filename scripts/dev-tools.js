#!/usr/bin/env node
/**
 * 🛠️ 开发工具链管理器
 * 提供开发过程中常用的工具和检查功能
 * 重构后使用共享工具函数，避免重复代码
 */

const { executeCommand, spawnCommand, checkProjectHealth, errorHandler } = require('./utils');

console.log('🛠️ 开发工具链管理器启动...\n');

/**
 * 运行代码质量检查 - 调用专门的质量检查工具
 */
async function runQualityCheck() {
  console.log('🔍 运行代码质量检查...\n');

  // 调用专门的质量检查工具，避免重复实现
  const result = executeCommand('npx tsx scripts/quality-check.ts');

  if (result.success) {
    console.log('✅ 质量检查完成\n');
  } else {
    console.log('❌ 质量检查失败\n');
    console.log(result.output || result.error);
  }

  return result.success;
}

/**
 * 运行性能测试
 */
async function runPerformanceTest() {
  console.log('⚡ 运行性能测试...\n');

  const tasks = [
    { name: '性能基准测试', command: 'npm run bench' },
    { name: '性能监控', command: 'npm run perf:benchmark' }
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

  await errorHandler.safeExecute(() => spawnCommand('npm', ['run', 'dev']), {
    context: '开发服务器启动',
    exitOnError: false
  });
}

/**
 * 监听模式
 */
async function watchMode() {
  console.log('👀 启动监听模式...\n');

  await errorHandler.safeExecute(() => spawnCommand('npm', ['run', 'build:watch']), {
    context: '监听模式启动',
    exitOnError: false
  });
}

/**
 * 清理项目
 */
function cleanProject() {
  console.log('🧹 清理项目...\n');

  const cleanTasks = [
    { name: '清理构建产物', command: 'npm run build:clean' },
    { name: '清理依赖', command: 'rm -rf node_modules' },
    { name: '清理缓存', command: 'npm cache clean --force' }
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
  const statusOk = checkProjectHealth();
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

  await errorHandler.safeExecute(
    async () => {
      switch (command) {
        case 'status':
          checkProjectHealth();
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
    },
    { context: '开发工具执行', exitOnError: true }
  );
}

// 运行主函数
main();
