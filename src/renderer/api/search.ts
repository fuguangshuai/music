import request from '@/utils/request';

/**
 * 搜索参数接口
 */
export interface SearchParams {
  keywords: string;
  type: number;
  limit?: number;
  offset?: number;
}

/**
 * 🔍 搜索内容
 * @param params 搜索参数
 * @returns 搜索结果
 */
export const getSearch = (params: SearchParams) => {
  return request.get('/cloudsearch', {
    params
  });
};
