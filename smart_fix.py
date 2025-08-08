#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import glob

def fix_typescript_syntax(content):
    """修复TypeScript语法错误"""
    
    # 1. 修复函数参数类型注解: (param:, Type) -> (param: Type)
    content = re.sub(r'\(([^)]*):,\s*([^)]*)\)', r'(\1: \2)', content)
    
    # 2. 修复变量类型注解: variable:, Type -> variable: Type
    content = re.sub(r'(\w+):,\s*(\w+)', r'\1: \2', content)
    
    # 3. 修复箭头函数: => -> =>
    content = re.sub(r'=>>', r'=>', content)
    content = re.sub(r'=>', r'=>', content)
    
    # 4. 修复watch函数调用
    content = re.sub(r'watch\(\s*\(\)\s*=>\s*([^)]+)\(\)', r'watch(() => \1, ', content)
    content = re.sub(r'watch\(\s*([^)]+)\(\)\s*=>', r'watch(\1, ', content)
    
    # 5. 修复对象字面量中的逗号
    content = re.sub(r'{\s*,', r'{', content)
    content = re.sub(r':\s*\(\):\s*void\s*=>', r': () =>', content)
    
    # 6. 修复数组类型注解
    content = re.sub(r'(\w+)\[0\]', r'\1[]', content)
    
    # 7. 修复比较操作符
    content = re.sub(r'>=>', r'>=', content)
    content = re.sub(r'<=>', r'<=', content)
    
    # 8. 修复for循环中的操作符
    content = re.sub(r'i\s*\+=>', r'i +=', content)
    
    # 9. 修复函数调用中的逗号
    content = re.sub(r'\(\s*([^,)]+),\s*([^)]+)\s*\)', r'(\1, \2)', content)
    
    # 10. 修复catch语句
    content = re.sub(r'catch\s*\(\s*(\w+):,\s*(\w+)\s*\)', r'catch (\1: \2)', content)
    
    # 11. 修复inject类型注解
    content = re.sub(r'inject<\([^)]*\|,\s*([^)]*)\)', r'inject<(\1)', content)
    
    # 12. 修复computed返回值
    content = re.sub(r'\?\s*([^:]+)\s*:,\s*([^)]+)\)', r'? \1 : \2)', content)
    
    # 13. 修复解构赋值
    content = re.sub(r'const\s*{\s*([^:]+):,\s*([^}]+)\s*}', r'const { \1: \2 }', content)
    
    # 14. 修复数组初始化
    content = re.sub(r'=\s*\[0\];', r'= [];', content)
    
    # 15. 修复函数返回类型
    content = re.sub(r'\):\s*(\w+)\s*=>', r'): \1 =>', content)
    
    return content

def fix_vue_syntax(content):
    """修复Vue特定的语法错误"""
    
    # 修复watch函数的特殊情况
    content = re.sub(r'watch\(\s*\(\)\s*=>\s*([^(]+)\(([^)]*)\)\s*=>', r'watch(() => \1, (\2) =>', content)
    
    # 修复emit定义
    content = re.sub(r'\(e:,\s*([^)]+)\):\s*void;', r'(e: \1): void;', content)
    
    # 修复computed属性
    content = re.sub(r'computed\(\(\)\s*=>\s*\(([^)]*)\s*\?\s*([^:]*)\s*:,\s*([^)]*)\)', r'computed(() => (\1 ? \2 : \3)', content)
    
    return content

def fix_file(file_path):
    """修复单个文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 应用TypeScript修复
        content = fix_typescript_syntax(content)
        
        # 如果是Vue文件，应用Vue特定修复
        if file_path.endswith('.vue'):
            content = fix_vue_syntax(content)
        
        # 如果内容有变化，写回文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"修复完成: {file_path}")
            return True
        else:
            return False
            
    except Exception as e:
        print(f"修复失败 {file_path}: {e}")
        return False

def main():
    """主函数"""
    print("开始智能修复TypeScript语法错误...")
    
    # 获取所有需要修复的文件
    patterns = [
        'src/**/*.ts',
        'src/**/*.vue',
        'plugins/**/*.ts'
    ]
    
    files_to_fix = []
    for pattern in patterns:
        files_to_fix.extend(glob.glob(pattern, recursive=True))
    
    # 去重
    files_to_fix = list(set(files_to_fix))
    
    print(f"找到 {len(files_to_fix)} 个文件需要检查")
    
    fixed_count = 0
    for file_path in files_to_fix:
        if fix_file(file_path):
            fixed_count += 1
    
    print(f"智能修复完成！共修复了 {fixed_count} 个文件")
    
    # 运行类型检查
    print("正在运行类型检查验证修复结果...")
    os.system('npm run typecheck')

if __name__ == '__main__':
    main()
