#!/bin/bash

# 最终修复脚本 - 手动处理剩余的关键语法错误

echo "开始最终修复..."

# 修复 src/main/modules/fileManager.ts 中的对象字面量问题
if [ -f "src/main/modules/fileManager.ts" ]; then
    echo "修复 fileManager.ts..."
    
    # 恢复备份文件并重新开始
    if [ -f "src/main/modules/fileManager.ts.backup" ]; then
        cp "src/main/modules/fileManager.ts.backup" "src/main/modules/fileManager.ts"
    fi
    
    # 只修复最基本的 > 替换为 , 的问题
    sed -i 's/ > / , /g' "src/main/modules/fileManager.ts"
    sed -i "s/' > /', /g" "src/main/modules/fileManager.ts"
    sed -i 's/) > (/), (/g' "src/main/modules/fileManager.ts"
    sed -i 's/} > {/}, {/g' "src/main/modules/fileManager.ts"
    sed -i 's/] > /], /g' "src/main/modules/fileManager.ts"
    
    echo "完成 fileManager.ts 修复"
fi

# 修复 src/main/modules/tray.ts 中的菜单项问题
if [ -f "src/main/modules/tray.ts" ]; then
    echo "修复 tray.ts..."
    
    # 恢复备份文件并重新开始
    if [ -f "src/main/modules/tray.ts.backup" ]; then
        cp "src/main/modules/tray.ts.backup" "src/main/modules/tray.ts"
    fi
    
    # 只修复最基本的 > 替换为 , 的问题
    sed -i 's/ > / , /g' "src/main/modules/tray.ts"
    sed -i "s/' > /', /g" "src/main/modules/tray.ts"
    sed -i 's/) > (/), (/g' "src/main/modules/tray.ts"
    sed -i 's/} > {/}, {/g' "src/main/modules/tray.ts"
    sed -i 's/] > /], /g' "src/main/modules/tray.ts"
    sed -i "s/on('\([^']*\)' > /on('\1', /g" "src/main/modules/tray.ts"
    
    echo "完成 tray.ts 修复"
fi

# 修复 src/main/modules/window.ts 中的问题
if [ -f "src/main/modules/window.ts" ]; then
    echo "修复 window.ts..."
    
    # 恢复备份文件并重新开始
    if [ -f "src/main/modules/window.ts.backup" ]; then
        cp "src/main/modules/window.ts.backup" "src/main/modules/window.ts"
    fi
    
    # 只修复最基本的 > 替换为 , 的问题
    sed -i 's/ > / , /g' "src/main/modules/window.ts"
    sed -i "s/' > /', /g" "src/main/modules/window.ts"
    sed -i 's/) > (/), (/g' "src/main/modules/window.ts"
    sed -i 's/} > {/}, {/g' "src/main/modules/window.ts"
    sed -i 's/] > /], /g' "src/main/modules/window.ts"
    sed -i "s/on('\([^']*\)' > /on('\1', /g" "src/main/modules/window.ts"
    
    echo "完成 window.ts 修复"
fi

# 修复其他文件的基本问题
files=(
    "src/main/modules/cache.ts"
    "src/main/modules/window-size.ts"
    "src/main/unblockMusic.ts"
    "src/preload/index.ts"
    "src/renderer/utils/retry.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "修复 $file..."
        
        # 恢复备份文件
        if [ -f "$file.backup" ]; then
            cp "$file.backup" "$file"
        fi
        
        # 只修复最基本的问题
        sed -i 's/ > / , /g' "$file"
        sed -i "s/' > /', /g" "$file"
        sed -i 's/) > (/), (/g' "$file"
        sed -i 's/} > {/}, {/g' "$file"
        sed -i 's/] > /], /g' "$file"
        sed -i "s/on('\([^']*\)' > /on('\1', /g" "$file"
        sed -i "s/handle('\([^']*\)' > /handle('\1', /g" "$file"
        
        echo "完成 $file 修复"
    fi
done

echo "最终修复完成！"
