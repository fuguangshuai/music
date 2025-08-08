// 第三方模块类型声明

declare module 'netease-cloud-music-api-alger/server' {
  const server: any;
  export default server;
}

declare module '@unblockneteasemusic/server' {
  const match: any;
  export default match;
}

// 扩展 ImportMeta 接口以支持 Vite 的 glob 功能
interface ImportMeta {
  glob: (pattern: string, options?: { eager?: boolean }) => Record<string, any>;
}
