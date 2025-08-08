#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re

def fix_specific_errors():
    """修复特定的语法错误"""
    
    # 修复 src/main/modules/cache.ts
    cache_file = 'src/main/modules/cache.ts'
    if os.path.exists(cache_file):
        with open(cache_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修复逗号操作符错误
        content = re.sub(r'if \(cleanedSize, ', r'if (cleanedSize >= ', content)
        content = re.sub(r'if \(cleanedCount, ', r'if (cleanedCount > ', content)
        # 修复数组初始化
        content = re.sub(r'const toDelete: string\[\] = \[0\];', r'const toDelete: string[] = [];', content)
        
        with open(cache_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"修复完成: {cache_file}")
    
    # 修复 src/main/modules/fileManager.ts
    filemanager_file = 'src/main/modules/fileManager.ts'
    if os.path.exists(filemanager_file):
        with open(filemanager_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修复数组初始化
        content = re.sub(r'\}\[\] = \[0\];', r'}[] = [];', content)
        content = re.sub(r'const mergedLines: string\[\] = \[0\];', r'const mergedLines: string[] = [];', content)
        # 修复数组类型注解
        content = re.sub(r'as \{ name: string \}\[0\]', r'as { name: string }[]', content)
        # 修复store.get调用
        content = re.sub(r"downloadStore\.get\('history', \[0\]\)", r"downloadStore.get('history', [])", content)
        content = re.sub(r'as Record<string, unknown>\[0\]', r'as Record<string, unknown>[]', content)
        
        with open(filemanager_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"修复完成: {filemanager_file}")
    
    # 修复 src/main/modules/tray.ts
    tray_file = 'src/main/modules/tray.ts'
    if os.path.exists(tray_file):
        with open(tray_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修复MenuItemConstructorOptions数组类型
        content = re.sub(r'as MenuItemConstructorOptions\[0\]', r'as MenuItemConstructorOptions[]', content)
        content = re.sub(r': \[0\]\) as MenuItemConstructorOptions', r': []) as MenuItemConstructorOptions[]', content)
        
        with open(tray_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"修复完成: {tray_file}")
    
    # 修复 src/main/modules/window-size.ts
    windowsize_file = 'src/main/modules/window-size.ts'
    if os.path.exists(windowsize_file):
        with open(windowsize_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修复比较操作符
        content = re.sub(r'if \(scaleFactor, ', r'if (scaleFactor > ', content)
        content = re.sub(r'} else if \(scaleFactor, ', r'} else if (scaleFactor > ', content)
        
        with open(windowsize_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"修复完成: {windowsize_file}")
    
    # 修复 src/main/unblockMusic.ts
    unblock_file = 'src/main/unblockMusic.ts'
    if os.path.exists(unblock_file):
        with open(unblock_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修复数组类型注解
        content = re.sub(r'as unknown\[0\]', r'as unknown[]', content)
        
        with open(unblock_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"修复完成: {unblock_file}")
    
    # 修复 src/preload/index.ts
    preload_file = 'src/preload/index.ts'
    if os.path.exists(preload_file):
        with open(preload_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修复数组类型注解
        content = re.sub(r'unknown\[0\]', r'unknown[]', content)
        
        with open(preload_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"修复完成: {preload_file}")
    
    # 修复 src/renderer/types/api-responses.ts
    apiresponses_file = 'src/renderer/types/api-responses.ts'
    if os.path.exists(apiresponses_file):
        with open(apiresponses_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修复数组类型注解
        content = re.sub(r'Artist\[0\]', r'Artist[]', content)
        content = re.sub(r'Album\[0\]', r'Album[]', content)
        content = re.sub(r'Playlist\[0\]', r'Playlist[]', content)
        content = re.sub(r'SongUrl\[0\]', r'SongUrl[]', content)
        content = re.sub(r'unknown\[0\]', r'unknown[]', content)
        
        with open(apiresponses_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"修复完成: {apiresponses_file}")

def main():
    """主函数"""
    print("开始修复剩余的特定语法错误...")
    fix_specific_errors()
    print("修复完成！")
    
    # 运行类型检查
    print("正在运行类型检查验证修复结果...")
    os.system('npm run typecheck')

if __name__ == '__main__':
    main()
