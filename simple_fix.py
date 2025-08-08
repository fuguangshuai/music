#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import glob

def fix_file(file_path):
    """修复单个文件中的语法错误"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 基本的替换规则
        replacements = [
            # 修复箭头函数
            (r' =, ', r' => '),
            # 修复函数参数分隔符
            (r'\(([^)]*) > ([^)]*)\)', r'(\1, \2)'),
            # 修复对象属性分隔符
            (r': ([^>]*) > ([a-zA-Z_][a-zA-Z0-9_]*:)', r': \1, \2'),
            # 修复字符串后的分隔符
            (r"' > ", r"', "),
            (r'" > ', r'", '),
            # 修复数组和对象结束符
            (r' > }', r', }'),
            (r' > ]', r', ]'),
            (r' > \)', r', )'),
            # 修复事件监听器
            (r"on\('([^']*)' > ", r"on('\1', "),
            (r"handle\('([^']*)' > ", r"handle('\1', "),
            # 修复类型注解
            (r'string > ', r'string, '),
            (r'number > ', r'number, '),
            (r'boolean > ', r'boolean, '),
            (r'unknown > ', r'unknown, '),
            # 修复比较操作符
            (r', = ', r' >= '),
            # 修复数组索引
            (r'\[\] >', r'[0] >'),
            (r'\[\]\)', r'[0])'),
            (r'\[\];', r'[0];'),
            (r'\[\] \|\| ', r'[0] || '),
            (r'\[\]\.value', r'[0].value'),
            # 修复Record类型
            (r'Record<string > unknown>', r'Record<string, unknown>'),
            # 修复更多复杂的语法错误
            (r': \(\): void =>', r': () => '),
            (r'get:, \(\): void =>', r'get: () => '),
            (r'set: newData => \{;', r'set: newData => {'),
            (r'} > timeout', r'}, timeout'),
            (r'Platform\[0\]', r'Platform[]'),
            (r'Song\[0\]', r'Song[]'),
            (r'string\[0\]', r'string[]'),
            (r': number =, ', r': number = '),
            (r': string =, ', r': string = '),
            (r': boolean =, ', r': boolean = '),
            (r'watch\( \(\) => ', r'watch(() => '),
            (r'\{ data:, ', r'{ data: '),
            (r'>=, ', r'>= '),
            (r'<=, ', r'<= '),
            (r'>, ', r'> '),
            (r'<, ', r'< '),
            (r'\+, ', r'+ '),
            (r'-, ', r'- '),
            (r'\*, ', r'* '),
            (r'/, ', r'/ '),
        ]
        
        # 应用所有替换规则
        for pattern, replacement in replacements:
            content = re.sub(pattern, replacement, content)
        
        # 如果内容有变化，写回文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"修复完成: {file_path}")
            return True
        else:
            print(f"无需修复: {file_path}")
            return False
            
    except Exception as e:
        print(f"修复失败 {file_path}: {e}")
        return False

def main():
    """主函数"""
    print("开始修复TypeScript语法错误...")
    
    # 获取所有需要修复的文件
    patterns = [
        'plugins/**/*.ts',
        'src/**/*.ts',
        'src/**/*.vue',
        'src/**/*.d.ts'
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
    
    print(f"修复完成！共修复了 {fixed_count} 个文件")
    
    # 运行类型检查
    print("正在运行类型检查验证修复结果...")
    os.system('npm run typecheck')

if __name__ == '__main__':
    main()
