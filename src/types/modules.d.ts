/**
 * 第三方模块类型声明 - 企业级类型安全版本
 * @description 为第三方模块提供具体的类型定义，确保类型安全
 * @version TypeScript 5.0+
 */

/**
 * 网易云音乐API服务器模块
 * @description 提供网易云音乐API的服务器实现
 */
declare module 'netease-cloud-music-api-alger/server' {
  /**
   * 服务器配置接口
   */
  interface ServerConfig {
    readonly port?: number;
    readonly host?: string;
    readonly cors?: boolean;
    readonly cookiePath?: string;
    readonly realIP?: boolean;
  }

  /**
   * 服务器实例接口
   */
  interface ServerInstance {
    readonly listen: (port: number, callback?: () => void) => void;
    readonly close: (callback?: () => void) => void;
    readonly address: () => { port: number; family: string; address: string } | null;
  }

  /**
   * 网易云音乐API服务器对象
   * @description 提供网易云音乐API服务的主要接口
   */
  interface NcmApiServer {
    /**
     * 启动网易云音乐API服务
     * @param config 服务器配置
     * @returns Promise<void>
     */
    readonly serveNcmApi: (config?: ServerConfig) => Promise<void>;

    /**
     * 创建服务器实例
     * @param config 服务器配置
     * @returns 服务器实例
     */
    readonly createServer?: (config?: ServerConfig) => ServerInstance;
  }

  const server: NcmApiServer;
  export default server;
}

/**
 * 解锁网易云音乐服务器模块
 * @description 提供音乐解锁服务的匹配功能
 */
declare module '@unblockneteasemusic/server' {
  /**
   * 平台类型
   */
  type Platform = 'qq' | 'migu' | 'kugou' | 'pyncmd' | 'joox' | 'gdmusic' | 'stellar' | 'cloud';

  /**
   * 音乐信息接口
   */
  interface MusicInfo {
    readonly name: string;
    readonly artists?: Array<{ readonly name: string }>;
    readonly album?: { readonly name: string };
    readonly ar?: Array<{ readonly name: string }>;
    readonly al?: { readonly name: string };
  }

  /**
   * 匹配结果接口 - 兼容现有代码结构
   */
  interface MatchResult {
    readonly url?: string;
    readonly br?: number;
    readonly size?: number;
    readonly md5?: string;
    readonly platform?: Platform;
    readonly gain?: number;
    readonly quality?: 'standard' | 'higher' | 'exhigh' | 'lossless';
  }

  /**
   * 音乐匹配函数 - 兼容现有调用方式
   * @param id 音乐ID
   * @param platforms 平台列表
   * @param songData 歌曲数据
   * @returns 匹配结果的Promise
   */
  function match(id: number, platforms?: Platform[], songData?: MusicInfo): Promise<MatchResult>;

  export default match;
}

/**
 * 扩展 ImportMeta 接口以支持 Vite 的 glob 功能
 * @description 为Vite的动态导入提供类型安全支持
 */
interface ImportMeta {
  /**
   * Vite glob 导入功能
   * @param pattern 文件匹配模式
   * @param options 导入选项
   * @returns 匹配文件的模块映射
   */
  glob<T = unknown>(
    pattern: string,
    options?: {
      readonly eager?: boolean;
      readonly as?: 'raw' | 'url';
    }
  ): Record<string, T>;

  /**
   * Vite 环境变量
   */
  readonly env: {
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly PROD: boolean;
    readonly DEV: boolean;
    readonly SSR: boolean;
    readonly [key: string]: string | boolean | undefined;
  };
}
