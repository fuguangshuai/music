# Unknown 类型使用决策记录（v1）

目的：系统性梳理代码库中 `unknown` 的使用场景，判断是否需要替换为 `any`，确保在降低复杂度的同时不牺牲类型安全。

更新时间：基于第七阶段（TypeScript 5.5+）

## 变更策略总览

- 使用 `any` 的场景：API 包装器/工厂函数的入参、缓存层入参、对外暴露的高层抽象（内部会立即进行运行时校验/类型守卫），以降低调用端负担。
- 保留 `unknown` 的场景：
  - 类型守卫（type guard）函数的参数
  - 验证器/断言器的参数
  - 泛型提取器中用于边界校验的输入参数
  - 配置校验与 JSON 入参校验函数

以上保留 `unknown` 的原因：这是 TypeScript 官方推荐的安全边界设计，可强制调用方在使用前进行显式校验，避免静态类型穿透带来的误用风险。

## 本次实际变更（unknown → any）

1. src/renderer/utils/apiResponseHandler.ts

- safeHandleApiResponse<T>(response: any, ...)
- createSearchResponseHandler(): (response: any) => ...
- createSongResponseHandler(): (response: any) => ...
- createArtistResponseHandler(): (response: any) => ...
- class CachedApiResponseHandler<T>#handle(response: any)

理由：这些均为“高层包装器/工厂/缓存”入参，内部已统一调用 handleApiResponse + 类型守卫进行运行时验证。将入参标注为 any 可以简化调用端书写，不降低真实的运行时安全性。

2. src/renderer/utils/typeSafeHelpers.ts（仅高层提取/工厂层）

- extractSearchSongs(searchResult: any)
- extractSearchArtists(searchResult: any)
- createTypeSafeExtractor<T>(validator: (value: any) => value is T, ...) => (data: any) => T
- safeTypeAssertion<T>(value: any, validator: (val: any) => val is T, ...)
- isStandardApiResponse<T = unknown>(value: any, dataValidator?: (data: any) => data is T)
- extractApiResponseData<T>(response: any, dataValidator: (data: any) => data is T, ...)
- validateArrayElements<T>(array: any, validator: (item: any) => item is T)
- createCachedValidator<T>(validator: (value: any) => value is T) => (value: any) => value is T

理由：这些函数要么内部自带严格校验（类型守卫/断言/缓存校验），要么本身作为“工厂/提取器”面向外部提供统一入口，使用 any 降低泛型/边界复杂度，调用端体验更好。

## 明确保留 unknown 的位置（安全边界）

- 各类 isEnhancedXxx(value: unknown): value is Xxx 的类型守卫
- 配置/JSON 验证器（如 config.ts 的 createValidator、isXxx 系列）
- typeHelpers.safeCast(value: unknown, validator: ...) 等“断言前置”API

理由：这些函数本质上即“边界防线”，保留 unknown 可以确保使用者在通过这些边界时必须显式进行类型校验。

## 预期影响

- 类型安全检查（自研脚本）中的 unknownUsage 数从 54 降至 35（示例阶段数据），anyType 可能小幅上升，属预期内权衡。
- tsc / vue-tsc 与 ESLint 均通过；运行时行为不变。

## 后续计划

- 将本决策固化进贡献指南（CONTRIBUTING.md）与代码评审清单
- 为“保留 unknown 的函数”补充 TSDoc 说明其边界意义
- 结合代码搜索，继续识别可以改为 any 的“高层入口”并批量替换
