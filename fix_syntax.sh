#!/bin/bash

# 修复TypeScript语法错误的脚本
# 主要修复逗号被错误替换为 > 符号的问题

echo "开始修复TypeScript语法错误..."

# 获取所有需要修复的TypeScript文件
files=(
    "src/main/lyric.ts"
    "src/main/modules/cache.ts"
    "src/main/modules/config.ts"
    "src/main/modules/fileManager.ts"
    "src/main/modules/fonts.ts"
    "src/main/modules/loginWindow.ts"
    "src/main/modules/shortcuts.ts"
    "src/main/modules/tray.ts"
    "src/main/modules/window-size.ts"
    "src/main/modules/window.ts"
    "src/main/server.ts"
    "src/main/unblockMusic.ts"
    "src/preload/index.ts"
    "src/renderer/utils/retry.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "修复文件: $file"
        
        # 备份原文件
        cp "$file" "$file.backup"
        
        # 修复常见的错误模式
        
        # 1. 修复对象属性分隔符: prop: value > prop2: -> prop: value, prop2:
        sed -i 's/: \([^>]*\) > \([a-zA-Z_][a-zA-Z0-9_]*\):/: \1, \2:/g' "$file"
        
        # 2. 修复函数调用参数: func('param' > callback) -> func('param', callback)
        sed -i "s/' > (/', (/g" "$file"
        sed -i 's/) > (/), (/g' "$file"

        # 3. 修复事件监听器: on('event' > callback) -> on('event', callback)
        sed -i "s/on('\([^']*\)' > /on('\1', /g" "$file"
        sed -i "s/on('\([^']*\)') => {/on('\1', () => {/g" "$file"
        sed -i "s/handle('\([^']*\)') => {/handle('\1', () => {/g" "$file"
        sed -i "s/once('\([^']*\)') => {/once('\1', () => {/g" "$file"
        
        # 4. 修复数组和对象中的分隔符
        sed -i 's/ > }/, }/g' "$file"
        sed -i 's/ > ]/, ]/g' "$file"
        sed -i 's/ > )/, )/g' "$file"
        
        # 5. 修复函数参数分隔符
        sed -i 's/(\([^)]*\) > \([^)]*\))/(\1, \2)/g' "$file"
        
        # 6. 修复比较操作符被错误替换的问题
        sed -i 's/  && =/  >=/g' "$file"
        sed -i 's/ && =/ >=/g' "$file"
        
        # 7. 修复对象字面量中的属性分隔符
        sed -i 's/\([a-zA-Z0-9_]*\): \([^>]*\) > \([a-zA-Z0-9_]*\):/\1: \2, \3:/g' "$file"

        # 8. 修复更多特殊情况
        sed -i 's/Record<string > unknown>/Record<string, unknown>/g' "$file"
        sed -i 's/\[\] >/[0]/g' "$file"
        sed -i 's/map(item =, /map(item => /g' "$file"
        sed -i 's/map(a =, /map(a => /g' "$file"
        sed -i 's/some(item = && /some(item => /g' "$file"
        sed -i 's/, = /, >= /g' "$file"
        sed -i 's/\[\]\.value/[0].value/g' "$file"
        sed -i 's/\[\] || /[0] || /g' "$file"
        sed -i 's/\[\])/[0])/g' "$file"
        sed -i 's/\[\];/[0];/g' "$file"
        
        echo "完成修复: $file"
    else
        echo "文件不存在: $file"
    fi
done

echo "语法修复完成！"
echo "请运行 'npm run typecheck' 来验证修复结果"
