/**
 * 通用API响应处理工具
 * 统一处理API响应的类型断言和错误处理
 */

export interface ApiResponse<T = any> {
  data: T;
  code?: number;
  message?: string;
  status?: number;
}

/**
 * 处理API响应，提取data字段
 * @param response API响应对象
 * @returns 提取的data数据
 */
export const handleApiResponse = <T>(response: unknown): T => {
  return (response as ApiResponse<T>).data;
};

/**
 * 安全的API调用包装器
 * @param apiCall API调用函数
 * @returns Promise<T> 返回处理后的数据
 */
export const safeApiCall = async <T>(apiCall: () => Promise<unknown>): Promise<T> => {
  try {
    const response = await apiCall();
    return handleApiResponse<T>(response);
  } catch (error) {
    console.error('API调用失败:', error);
    throw error;
  }
};

/**
 * 批量处理API响应
 * @param responses API响应数组
 * @returns 处理后的数据数组
 */
export const handleBatchApiResponse = <T>(responses: unknown[]): T[] => {
  return responses.map(response => handleApiResponse<T>(response));
};

/**
 * 检查API响应是否成功
 * @param response API响应对象
 * @returns 是否成功
 */
export const isApiSuccess = (response: unknown): boolean => {
  const apiResponse = response as ApiResponse;
  return apiResponse.code === 200 || apiResponse.status === 200;
};

/**
 * 获取API响应错误信息
 * @param response API响应对象
 * @returns 错误信息
 */
export const getApiErrorMessage = (response: unknown): string => {
  const apiResponse = response as ApiResponse;
  return apiResponse.message || '未知错误';
};

/**
 * 类型安全的API响应处理器
 * @param response API响应对象
 * @param validator 可选的验证函数
 * @returns 处理后的数据
 */
export const safeHandleApiResponse = <T>(
  response: unknown,
  validator?: (data: any) => data is T
): T => {
  const data = handleApiResponse(response);
  
  if (validator && !validator(data)) {
    throw new Error('API响应数据格式不正确');
  }
  
  return data as T;
};
