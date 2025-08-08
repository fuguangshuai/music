#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import glob

def fix_specific_typescript_errors(content):
    """修复特定的TypeScript语法错误"""
    
    # 1. 修复函数参数类型注解: (param:, Type) -> (param: Type)
    # 但要小心不要破坏正确的语法
    content = re.sub(r'\(([^)]*):,\s*([^)]*)\)', r'(\1: \2)', content)
    
    # 2. 修复变量声明中的类型注解: variable:, Type -> variable: Type
    content = re.sub(r'(\w+):,\s*(\w+)', r'\1: \2', content)
    
    # 3. 修复watch函数的特殊情况
    # watch(() => value,  => { -> watch(() => value, () => {
    content = re.sub(r'watch\(\(\)\s*=>\s*([^,]+),\s*=>\s*\{', r'watch(() => \1, () => {', content)
    
    # 4. 修复对象字面量中多余的逗号
    content = re.sub(r'{\s*,', r'{', content)
    content = re.sub(r',\s*}', r'}', content)
    
    # 5. 修复数组访问: displays[] -> displays[0]
    content = re.sub(r'(\w+)\[\]\s*;', r'\1[0];', content)
    content = re.sub(r'(\w+)\[\]\.', r'\1[0].', content)
    
    # 6. 修复比较操作符: length, 0 -> length > 0
    content = re.sub(r'length,\s*0\)', r'length > 0)', content)
    
    # 7. 修复格式化字符串中的数组访问
    content = re.sub(r'\$\{(\w+)\[\]\.(\w+)\}', r'${\1[0].\2}', content)
    
    # 8. 修复函数返回类型注解
    content = re.sub(r'\):\s*(\w+)\s*=>', r'): \1 =>', content)
    
    return content

def fix_file(file_path):
    """修复单个文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 应用修复
        content = fix_specific_typescript_errors(content)
        
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
    print("开始精确修复剩余的TypeScript语法错误...")
    
    # 只修复有问题的文件
    problem_files = [
        'src/main/lyric.ts',
        'src/main/modules/fileManager.ts',
        'src/main/modules/loginWindow.ts'
    ]
    
    fixed_count = 0
    for file_path in problem_files:
        if os.path.exists(file_path):
            if fix_file(file_path):
                fixed_count += 1
        else:
            print(f"文件不存在: {file_path}")
    
    print(f"精确修复完成！共修复了 {fixed_count} 个文件")
    
    # 运行类型检查
    print("正在运行类型检查验证修复结果...")
    os.system('npm run typecheck')

if __name__ == '__main__':
    main()
