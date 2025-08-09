#!/usr/bin/env node
/**
 * 🔧 脚本工具函数库
 * 提供所有脚本共享的工具函数，避免重复实现
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 执行命令的统一接口
 * @param {string} command - 要执行的命令
 * @param {object} options - 执行选项
 * @returns {object} 执行结果
 */
function executeCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return {
      success: true,
      output: result,
      time: Date.now() // 添加时间戳用于性能分析
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || error.stderr || '',
      time: Date.now()
    };
  }
}

/**
 * 异步执行命令（用于长时间运行的进程）
 * @param {string} command - 命令
 * @param {array} args - 参数数组
 * @param {object} options - 选项
 * @returns {Promise} Promise对象
 */
function spawnCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, code });
      } else {
        reject({ success: false, code, error: `Process exited with code ${code}` });
      }
    });

    child.on('error', (error) => {
      reject({ success: false, error: error.message });
    });
  });
}

/**
 * 检查文件或目录是否存在
 * @param {string} filePath - 文件路径
 * @returns {boolean} 是否存在
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * 确保目录存在
 * @param {string} dirPath - 目录路径
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 读取JSON文件
 * @param {string} filePath - 文件路径
 * @param {object} defaultValue - 默认值
 * @returns {object} JSON对象
 */
function readJsonFile(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn(`读取JSON文件失败: ${filePath}`, error.message);
  }
  return defaultValue;
}

/**
 * 写入JSON文件
 * @param {string} filePath - 文件路径
 * @param {object} data - 数据对象
 */
function writeJsonFile(filePath, data) {
  try {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`写入JSON文件失败: ${filePath}`, error.message);
    return false;
  }
}

/**
 * 格式化时间
 * @param {number} ms - 毫秒数
 * @returns {string} 格式化的时间字符串
 */
function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(2);
  return `${seconds}s`;
}

/**
 * 日志工具
 */
const log = {
  info: (message) => console.log(`ℹ️  ${message}`),
  success: (message) => console.log(`✅ ${message}`),
  warning: (message) => console.log(`⚠️  ${message}`),
  error: (message) => console.error(`❌ ${message}`),
  title: (message) => {
    console.log('\n' + '='.repeat(50));
    console.log(`🎯 ${message}`);
    console.log('='.repeat(50));
  }
};

/**
 * 统一的错误处理工具 - 企业级错误管理
 * @description 提供一致的错误处理模式，确保错误信息格式统一
 */
const errorHandler = {
  /**
   * 安全执行函数，带统一错误处理
   * @param {Function} fn - 要执行的函数
   * @param {object} options - 选项
   * @param {string} options.context - 错误上下文描述
   * @param {boolean} options.exitOnError - 是否在错误时退出进程
   * @param {Function} options.fallback - 错误时的回退函数
   * @returns {Promise<any>} 执行结果
   */
  async safeExecute(fn, options = {}) {
    const { context = '操作', exitOnError = false, fallback } = options;

    try {
      return await fn();
    } catch (error) {
      const errorInfo = this.parseError(error);
      log.error(`${context}失败: ${errorInfo.message}`);

      if (errorInfo.details) {
        console.error('详细信息:', errorInfo.details);
      }

      if (fallback && typeof fallback === 'function') {
        log.info('尝试使用回退方案...');
        try {
          return await fallback();
        } catch (fallbackError) {
          log.error(`回退方案也失败了: ${this.parseError(fallbackError).message}`);
        }
      }

      if (exitOnError) {
        process.exit(1);
      }

      throw error;
    }
  },

  /**
   * 解析错误对象，提取有用信息
   * @param {Error|object} error - 错误对象
   * @returns {object} 解析后的错误信息
   */
  parseError(error) {
    if (!error) {
      return { message: '未知错误', details: null };
    }

    // 处理execSync错误
    if (error.stdout || error.stderr) {
      return {
        message: error.message || '命令执行失败',
        details: error.stdout || error.stderr,
        code: error.status || error.code
      };
    }

    // 处理标准Error对象
    if (error instanceof Error) {
      return {
        message: error.message,
        details: error.stack,
        name: error.name
      };
    }

    // 处理字符串错误
    if (typeof error === 'string') {
      return { message: error, details: null };
    }

    // 处理对象错误
    return {
      message: error.message || error.error || '未知错误',
      details: JSON.stringify(error, null, 2)
    };
  },

  /**
   * 统一的命令执行错误处理
   * @param {string} command - 命令
   * @param {object} error - 错误对象
   * @param {object} options - 选项
   */
  handleCommandError(command, error, options = {}) {
    const { context = '命令执行', showOutput = true } = options;
    const errorInfo = this.parseError(error);

    log.error(`${context}失败: ${command}`);
    log.error(`错误信息: ${errorInfo.message}`);

    if (showOutput && errorInfo.details) {
      console.error('输出详情:');
      console.error(errorInfo.details.slice(0, 1000)); // 限制输出长度
    }
  },

  /**
   * 统一的文件操作错误处理
   * @param {string} operation - 操作类型
   * @param {string} filePath - 文件路径
   * @param {object} error - 错误对象
   */
  handleFileError(operation, filePath, error) {
    const errorInfo = this.parseError(error);
    log.error(`文件${operation}失败: ${filePath}`);
    log.error(`错误原因: ${errorInfo.message}`);
  },

  /**
   * 创建带错误处理的异步包装器
   * @param {Function} asyncFn - 异步函数
   * @param {string} context - 上下文描述
   * @returns {Function} 包装后的函数
   */
  wrapAsync(asyncFn, context) {
    return async (...args) => {
      return this.safeExecute(() => asyncFn(...args), { context });
    };
  },

  /**
   * 验证必需参数
   * @param {object} params - 参数对象
   * @param {string[]} required - 必需参数列表
   * @throws {Error} 参数缺失时抛出错误
   */
  validateRequired(params, required) {
    const missing = required.filter((key) => params[key] === undefined || params[key] === null);
    if (missing.length > 0) {
      throw new Error(`缺少必需参数: ${missing.join(', ')}`);
    }
  }
};

/**
 * 检查项目基本状态
 * @returns {boolean} 项目状态是否正常
 */
function checkProjectHealth() {
  const checks = [
    { name: 'package.json', path: 'package.json' },
    { name: 'tsconfig.json', path: 'tsconfig.web.json' },
    { name: 'src目录', path: 'src' },
    { name: 'node_modules', path: 'node_modules' }
  ];

  let allGood = true;

  log.title('项目健康检查');

  checks.forEach(({ name, path }) => {
    if (fileExists(path)) {
      log.success(`${name} 存在`);
    } else {
      log.error(`${name} 缺失`);
      allGood = false;
    }
  });

  return allGood;
}

module.exports = {
  executeCommand,
  spawnCommand,
  fileExists,
  ensureDir,
  readJsonFile,
  writeJsonFile,
  formatTime,
  log,
  checkProjectHealth,
  errorHandler
};
