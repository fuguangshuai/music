#!/usr/bin/env node
const path = require('path');

/**
 * 增量构建脚本
 * 简化版本，专注于实用功能，避免复杂类型定义
 */

const { execSync } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');

console.log('🔨 启动增量构建系统...\n');

// 构建配置
const buildConfig = {
  cacheDir: '.build-cache',
  hashFile: '.build-cache/file-hashes.json',
  buildCommand: 'npm run build',
  watchDirs: ['src', 'public'],
  excludePatterns: ['.git', 'node_modules', 'dist', '.build-cache'],
};

/**
 * 执行命令
 */
function executeCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'inherit',
      ...options,
    });
    return { success: true, output: result };
  } catch (_error) {
    return { success: false, _error: _error.message };
  }
}

/**
 * 计算文件哈希
 */
function calculateFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (_error) {
    return null;
  }
}

/**
 * 获取目录下所有文件
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = require('path').join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 跳过排除的目录
      if (!buildConfig.excludePatterns.some(pattern => file.includes(pattern))) {
        getAllFiles(filePath, fileList);
      }
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * 加载文件哈希缓存
 */
function loadHashCache() {
  try {
    if (fs.existsSync(buildConfig.hashFile)) {
      const content = fs.readFileSync(buildConfig.hashFile, 'utf8');
      return JSON.parse(content);
    }
  } catch (_error) {
    console.warn('⚠️  无法加载哈希缓存:', _error.message);
  }
  return {};
}

/**
 * 保存文件哈希缓存
 */
function saveHashCache(hashes) {
  try {
    // 确保缓存目录存在
    if (!fs.existsSync(buildConfig.cacheDir)) {
      fs.mkdirSync(buildConfig.cacheDir, { recursive: true });
    }

    fs.writeFileSync(buildConfig.hashFile, JSON.stringify(hashes, null, 2));
    console.log('💾 文件哈希缓存已保存');
  } catch (_error) {
    console._error('❌ 保存哈希缓存失败:', _error.message);
  }
}

/**
 * 检查文件变更
 */
function checkFileChanges() {
  console.log('🔍 检查文件变更...');

  const oldHashes = loadHashCache();
  const newHashes = {};
  const changedFiles = [];

  // 获取所有监控目录的文件
  const allFiles = [];
  buildConfig.watchDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      getAllFiles(dir, allFiles);
    }
  });

  console.log(`📁 扫描到 ${allFiles.length} 个文件`);

  // 计算新哈希并比较
  allFiles.forEach(file => {
    const hash = calculateFileHash(file);
    if (hash) {
      newHashes[file] = hash;

      if (oldHashes[file] !== hash) {
        changedFiles.push(file);
      }
    }
  });

  // 检查删除的文件
  Object.keys(oldHashes).forEach(file => {
    if (!newHashes[file]) {
      changedFiles.push(file);
      console.log(`🗑️  文件已删除: ${file}`);
    }
  });

  return { changedFiles, newHashes };
}

/**
 * 执行增量构建
 */
function performIncrementalBuild() {
  const startTime = Date.now();

  const { changedFiles, newHashes } = checkFileChanges();

  if (changedFiles.length === 0) {
    console.log('✅ 没有文件变更，跳过构建');
    return true;
  }

  console.log(`\n📝 检测到 ${changedFiles.length} 个文件变更:`);
  changedFiles.slice(0, 10).forEach(file => {
    console.log(`  • ${file}`);
  });

  if (changedFiles.length > 10) {
    console.log(`  ... 还有 ${changedFiles.length - 10} 个文件`);
  }

  console.log('\n🔨 开始构建...');

  const _buildResult = executeCommand(buildConfig.buildCommand);

  if (_buildResult.success) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ 构建成功，耗时: ${duration}s`);

    // 保存新的哈希缓存
    saveHashCache(newHashes);

    return true;
  } else {
    console._error('❌ 构建失败:', _buildResult._error);
    return false;
  }
}

/**
 * 监听文件变更
 */
function watchFiles() {
  console.log('👀 启动文件监听模式...');
  console.log('监听目录:', buildConfig.watchDirs.join(', '));
  console.log('按 Ctrl+C 退出监听\n');

  let buildTimeout = null;

  const chokidar = require('chokidar');

  const watcher = chokidar.watch(buildConfig.watchDirs, {
    ignored: buildConfig.excludePatterns,
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('all', (event, filePath) => {
    console.log(`📝 文件变更: ${event} ${filePath}`);

    // 防抖：延迟执行构建
    if (buildTimeout) {
      clearTimeout(buildTimeout);
    }

    buildTimeout = setTimeout(() => {
      performIncrementalBuild();
    }, 1000); // 1秒延迟
  });

  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\n👋 停止文件监听...');
    watcher.close();
    process.exit(0);
  });
}

/**
 * 清理构建缓存
 */
function cleanCache() {
  console.log('🧹 清理构建缓存...');

  try {
    if (fs.existsSync(buildConfig.cacheDir)) {
      fs.rmSync(buildConfig.cacheDir, { recursive: true, force: true });
      console.log('✅ 构建缓存已清理');
    } else {
      console.log('ℹ️  没有找到构建缓存');
    }
  } catch (_error) {
    console._error('❌ 清理缓存失败:', _error.message);
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
🔨 增量构建工具

用法:
  node scripts/incremental-build.js [命令]

命令:
  build     执行增量构建（默认）
  watch     监听文件变更并自动构建
  clean     清理构建缓存
  help      显示帮助信息

示例:
  node scripts/incremental-build.js build
  node scripts/incremental-build.js watch
  node scripts/incremental-build.js clean
`);
}

/**
 * 主函数
 */
function main() {
  const command = process.argv[2] || 'build';

  switch (command) {
    case 'build':
      performIncrementalBuild();
      break;
    case 'watch':
      // 检查是否安装了chokidar
      try {
        require('chokidar');
        watchFiles();
      } catch (_error) {
        console._error('❌ 监听模式需要安装 chokidar:');
        console.log('npm install --save-dev chokidar');
      }
      break;
    case 'clean':
      cleanCache();
      break;
    case 'help':
      showHelp();
      break;
    default:
      console.error(`❌ 未知命令: ${command}`);
      showHelp();
      process.exit(1);
  }
}

// 运行主函数
main();
