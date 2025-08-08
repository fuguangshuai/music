#!/bin/bash

# 修复剩余的TypeScript语法错误

echo "修复剩余的语法错误..."

# 修复特定的错误模式
files=(
    "src/main/lyric.ts"
    "src/main/modules/cache.ts"
    "src/main/modules/fileManager.ts"
    "src/main/modules/fonts.ts"
    "src/main/modules/shortcuts.ts"
    "src/main/modules/tray.ts"
    "src/main/modules/window-size.ts"
    "src/main/modules/window.ts"
    "src/main/unblockMusic.ts"
    "src/preload/index.ts"
    "src/renderer/utils/retry.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "修复文件: $file"
        
        # 修复特定的错误模式
        
        # 1. 修复事件监听器语法错误
        sed -i "s/\.on('\([^']*\)') => {/.on('\1', () => {/g" "$file"
        sed -i "s/\.handle('\([^']*\)') => {/.handle('\1', () => {/g" "$file"
        sed -i "s/\.once('\([^']*\)') => {/.once('\1', () => {/g" "$file"
        
        # 2. 修复数组访问错误
        sed -i 's/Platform\[0\]/Platform[]/g' "$file"
        sed -i 's/format\[\]/format[0]/g' "$file"
        
        # 3. 修复函数参数错误
        sed -i 's/BrowserWindow > shortcutsConfig/BrowserWindow, shortcutsConfig/g' "$file"
        sed -i 's/SongData > retryCount/SongData, retryCount/g' "$file"
        
        # 4. 修复对象解构错误
        sed -i 's/y: screenY > width/y: screenY, width/g' "$file"
        
        # 5. 修复比较操作符错误
        sed -i 's/, >= / >= /g' "$file"
        
        # 6. 修复数组展开语法错误
        sed -i 's/> \.\.\./, .../g' "$file"
        
        # 7. 修复Map类型错误
        sed -i 's/Map<string > string>/Map<string, string>/g' "$file"
        
        # 8. 修复函数参数类型错误
        sed -i 's/string , translatedLyrics/string>, translatedLyrics/g' "$file"
        
        # 9. 修复超时函数调用
        sed -i 's/} > \([0-9]*\));/, \1);/g' "$file"
        
        # 10. 修复对象字面量错误
        sed -i 's/} > {/}, {/g' "$file"
        
        # 11. 修复箭头函数语法
        sed -i 's/) > click()/, click()/g' "$file"
        
        # 12. 修复字符串连接错误
        sed -i "s/'resources\/icons' > 'next.png'/'resources\/icons', 'next.png'/g" "$file"
        
        echo "完成修复: $file"
    else
        echo "文件不存在: $file"
    fi
done

echo "剩余语法修复完成！"
