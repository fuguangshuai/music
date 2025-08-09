/**
 * 类型定义统一导出文件
 *
 * 此文件统一导出项目中所有的类型定义，提供清晰的类型使用指南
 *
 * @author TypeScript重构项目组
 * @since v4.11.0
 */

// ==================== 向后兼容类型 ====================

/**
 * @deprecated 使用 StandardApiResponse 替代
 */
export interface IData<T> {
  code: number;
  data: T;
  result: T;
}

// ==================== 核心API类型 ====================

export type {
  EnhancedAlbum,
  EnhancedArtist,
  EnhancedPlaylist,
  EnhancedSearchResult,
  EnhancedSong,
  EnhancedUser,
  PaginatedApiResponse,
  StandardApiResponse
} from './enhanced-api-types';

// ==================== 通用类型 ====================

export type {
  Album,
  Artist,
  BaseResponse,
  Playlist,
  ProxyConfig,
  Song,
  StorageValue,
  UnifiedApiResponse
} from './common';

// ==================== 业务类型 ====================

export type { IArtist } from './artist';
export type { ILyric, ILyricText, IRecommendMusic, SongResult } from './music';
export type { IHotSearch, ISearchDetail } from './search';

// ==================== API响应类型 ====================

export type { BaseApiResponse, PaginatedResponse, RecommendedApiResponse } from './api-responses';

// ==================== 类型使用指南 ====================

/**
 * 类型安全最佳实践
 *
 * 1. **优先使用具体类型**
 *    - ✅ 使用 `StandardApiResponse<EnhancedSong>`
 *    - ❌ 避免 `StandardApiResponse<unknown>`
 *
 * 2. **API响应处理**
 *    - 使用 `handleApiResponse()` 进行类型安全的响应处理
 *    - 提供类型守卫函数进行运行时验证
 *
 * 3. **组件中的类型使用**
 *    - 使用 `extractSearchSongs()` 等工具函数替代类型断言
 *    - 避免使用 `(data as any)` 进行类型断言
 *
 * 4. **新增类型定义**
 *    - 在 `enhanced-api-types.ts` 中定义业务相关类型
 *    - 在 `common.ts` 中定义通用工具类型
 *    - 提供完整的 TSDoc 文档
 *
 * @example
 * ```typescript
 * // ✅ 推荐的类型安全用法
 * import { StandardApiResponse, EnhancedSong } from '@/types';
 * import { handleApiResponse, isEnhancedSong } from '@/utils/typeSafeHelpers';
 *
 * const response: StandardApiResponse<EnhancedSong> = await api.getSong(id);
 * const song = handleApiResponse(response, isEnhancedSong);
 *
 * // ❌ 避免的不安全用法
 * const song = (response as any).data;
 * ```
 */

// ==================== 迁移指南 ====================

/**
 * 从旧类型到新类型的迁移指南
 *
 * | 旧类型 | 新类型 | 说明 |
 * |--------|--------|------|
 * | `ApiResponse<T>` | `StandardApiResponse<T>` | 统一API响应类型 |
 * | `BaseApiResponse<T>` | `StandardApiResponse<T>` | 移除重复定义 |
 * | `BaseResponse<T>` | `StandardApiResponse<T>` | 统一响应格式 |
 * | `(data as any)` | `extractSearchSongs(data)` | 使用类型安全工具 |
 * | `unknown` 默认参数 | 具体类型参数 | 提供精确类型 |
 *
 * @see {@link ../utils/typeSafeHelpers.ts} 类型安全工具函数
 * @see {@link ../utils/apiResponseHandler.ts} API响应处理器
 */
