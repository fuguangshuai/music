# 🔧 ESLint修复最佳实践指南

## 📋 修复优先级原则

### 1. 错误级别分类

```
🔴 解析错误 (Parsing Errors) - 最高优先级
🟠 类型错误 (Type Errors) - 高优先级
🟡 代码质量问题 - 中优先级
🟢 代码风格问题 - 低优先级
```

### 2. 修复顺序

1. **解析错误** - 阻止编译，必须优先修复
2. **any类型问题** - 影响类型安全
3. **未使用变量** - 代码清洁度
4. **缺少返回类型** - 代码可读性
5. **格式问题** - 代码一致性

## 🛠️ 修复工具使用指南

### 自动修复工具

```bash
# 运行自动修复
npm run lint -- --fix

# 修复特定文件
npx eslint src/path/to/file.ts --fix

# 修复特定规则
npx eslint . --fix --ext .ts,.vue --rule "no-unused-vars: error"
```

### 批量修复脚本

```bash
# 运行我们创建的修复工具
npx tsx scripts/fix-all-eslint-errors.ts
npx tsx scripts/fix-critical-eslint-errors.ts
npx tsx scripts/fix-emit-variable-names.ts
```

## 🎯 常见问题修复方法

### 1. 解析错误修复

#### 对象字面量语法错误

```typescript
// ❌ 错误
const obj = {
  prop1
  prop2
  prop3
};

// ✅ 正确
const obj = {
  prop1,
  prop2,
  prop3
};
```

#### 函数参数语法错误

```typescript
// ❌ 错误
function fn(param1: string
  param2: number
): void {}

// ✅ 正确
function fn(
  param1: string,
  param2: number
): void {}
```

### 2. Vue组件修复

#### emit变量名问题

```vue
<!-- ❌ 错误 -->
<script setup lang="ts">
const _emit = defineEmits<{
  update: [value: string];
}>();
</script>

<!-- ✅ 正确 -->
<script setup lang="ts">
const emit = defineEmits<{
  update: [value: string];
}>();
</script>
```

### 3. TypeScript类型修复

#### any类型替换

```typescript
// ❌ 避免使用any
function process(data: any): any {
  return data;
}

// ✅ 使用具体类型
function process<T>(data: T): T {
  return data;
}

// ✅ 或使用unknown
function process(data: unknown): unknown {
  return data;
}
```

#### 函数返回类型

```typescript
// ❌ 缺少返回类型
function calculate(a: number, b: number) {
  return a + b;
}

// ✅ 明确返回类型
function calculate(a: number, b: number): number {
  return a + b;
}
```

### 4. 未使用变量处理

#### 添加下划线前缀

```typescript
// ❌ 未使用的变量
function handler(event: Event, data: unknown) {
  console.log('handled');
}

// ✅ 标记未使用的参数
function handler(_event: Event, _data: unknown) {
  console.log('handled');
}
```

## 📝 代码质量检查清单

### 提交前检查

- [ ] 运行 `npm run lint` 确保无错误
- [ ] 运行 `npm run type-check` 确保类型正确
- [ ] 运行 `npm run format` 确保格式一致
- [ ] 检查是否有未使用的导入和变量

### 代码审查检查

- [ ] 是否有硬编码的any类型
- [ ] 函数是否有明确的返回类型
- [ ] 是否有未处理的Promise
- [ ] 错误处理是否完整

## 🔄 持续改进流程

### 1. 定期质量检查

```bash
# 每周运行质量检查
npm run lint
npm run type-check
npm run test

# 生成质量报告
npx tsx scripts/quality-check.ts
```

### 2. 自动化集成

```yaml
# .github/workflows/quality.yml
name: Code Quality
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
```

### 3. 团队规范

- 建立代码审查流程
- 定期进行代码质量培训
- 制定编码规范文档
- 设置质量门禁

## 🎯 目标设定

### 短期目标（1-2周）

- [ ] 修复所有解析错误
- [ ] 修复关键的any类型问题
- [ ] 建立自动化检查流程

### 中期目标（1个月）

- [ ] 错误数量减少到50个以下
- [ ] 建立完整的质量监控体系
- [ ] 团队培训和规范制定

### 长期目标（3个月）

- [ ] 实现0错误0警告
- [ ] 建立持续改进机制
- [ ] 代码质量文化建设

## 📚 参考资源

### ESLint配置

- [ESLint官方文档](https://eslint.org/docs/)
- [TypeScript ESLint规则](https://typescript-eslint.io/rules/)
- [Vue ESLint插件](https://eslint.vuejs.org/)

### 最佳实践

- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Vue.js Style Guide](https://vuejs.org/style-guide/)

---

**更新时间**: 2024年12月 **适用版本**: ESLint 8.x, TypeScript 5.x, Vue 3.x
