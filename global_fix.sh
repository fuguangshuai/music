#!/bin/bash

# 全局修复脚本 - 修复所有文件中逗号被错误替换为 > 符号的问题

echo "开始全局修复TypeScript语法错误..."
echo "这将修复所有文件中逗号被错误替换为 > 符号的问题"

# 获取所有需要修复的文件
files=(
    "plugins/example-plugin/index.ts"
    "src/preload/index.d.ts"
    "src/renderer/api/artist.ts"
    "src/renderer/api/gdmusic.ts"
    "src/renderer/api/list.ts"
    "src/renderer/api/login.ts"
    "src/renderer/api/music.ts"
    "src/renderer/api/mv.ts"
    "src/renderer/api/playlist.ts"
    "src/renderer/api/search.ts"
    "src/renderer/api/user.ts"
)

# 添加更多需要修复的文件
more_files=(
    "src/renderer/components/common/MusicListNavigator.ts"
    "src/renderer/components/ui/index.ts"
    "src/renderer/composables/useErrorHandler.ts"
    "src/renderer/const/bar-const.ts"
    "src/renderer/core/config/index.ts"
    "src/renderer/core/i18n/i18nManager.ts"
    "src/renderer/core/i18n/localizationFormatter.ts"
    "src/renderer/core/i18n/resourceManager.ts"
    "src/renderer/core/performance/deepAnalyzer.ts"
    "src/renderer/core/performance/optimizationEngine.ts"
    "src/renderer/core/performance/renderingMonitor.ts"
    "src/renderer/core/performance/reportGenerator.ts"
    "src/renderer/core/performance/userExperienceMonitor.ts"
    "src/renderer/core/plugin/index.ts"
    "src/renderer/core/plugin/plugins/advancedI18nPlugin.ts"
    "src/renderer/core/plugin/plugins/advancedPerformancePlugin.ts"
    "src/renderer/core/plugin/plugins/advancedSecurityPlugin.ts"
    "src/renderer/core/plugin/plugins/advancedStatePlugin.ts"
    "src/renderer/core/plugin/plugins/performancePlugin.ts"
    "src/renderer/core/plugin/plugins/securityPlugin.ts"
    "src/renderer/core/pluginSystem.ts"
    "src/renderer/core/security/authManager.ts"
    "src/renderer/core/security/encryptionManager.ts"
    "src/renderer/core/security/permissionManager.ts"
    "src/renderer/core/services/index.ts"
    "src/renderer/core/state/stateDevtools.ts"
    "src/renderer/core/state/stateManager.ts"
    "src/renderer/core/state/statePersistence.ts"
    "src/renderer/directive/loading/index.ts"
    "src/renderer/examples/i18n-demo.ts"
    "src/renderer/examples/modularization-demo.ts"
    "src/renderer/examples/performance-monitoring-demo.ts"
    "src/renderer/examples/security-demo.ts"
    "src/renderer/examples/state-management-demo.ts"
    "src/renderer/hooks/IndexDBHook.ts"
    "src/renderer/hooks/MusicHistoryHook.ts"
    "src/renderer/hooks/MusicHook.ts"
    "src/renderer/hooks/MusicListHook.ts"
    "src/renderer/hooks/useDownload.ts"
    "src/renderer/hooks/usePerformanceMonitor.ts"
    "src/renderer/hooks/useSmartCache.ts"
    "src/renderer/hooks/useSmartPreload.ts"
    "src/renderer/hooks/useSongItem.ts"
    "src/renderer/hooks/useUXEnhancer.ts"
    "src/renderer/plugins/index.ts"
    "src/renderer/router/home.ts"
    "src/renderer/router/index.ts"
    "src/renderer/router/other.ts"
    "src/renderer/services/audioPreloadService.ts"
    "src/renderer/services/audioService.ts"
    "src/renderer/services/cacheService.ts"
    "src/renderer/services/eqService.ts"
    "src/renderer/services/performanceMonitor.ts"
    "src/renderer/services/playControlService.ts"
    "src/renderer/shims-vue.d.ts"
    "src/renderer/store/index.ts"
    "src/renderer/store/modules/lyric.ts"
    "src/renderer/store/modules/menu.ts"
    "src/renderer/store/modules/music.ts"
    "src/renderer/store/modules/player.ts"
    "src/renderer/store/modules/search.ts"
    "src/renderer/store/modules/settings.ts"
    "src/renderer/store/modules/user.ts"
    "src/renderer/stores/musicPlayerStore.ts"
    "src/renderer/types/electron.d.ts"
    "src/renderer/types/howler.d.ts"
    "src/renderer/types/lyric.ts"
    "src/renderer/types/plugin.ts"
    "src/renderer/utils/accessibility.ts"
    "src/renderer/utils/appShortcuts.ts"
    "src/renderer/utils/cacheUtils.ts"
    "src/renderer/utils/codeQualityAnalyzer.ts"
    "src/renderer/utils/config.ts"
    "src/renderer/utils/env.ts"
    "src/renderer/utils/errorHandler.ts"
    "src/renderer/utils/fileOperation.ts"
    "src/renderer/utils/formatters.ts"
    "src/renderer/utils/imageLoader.ts"
    "src/renderer/utils/index.ts"
    "src/renderer/utils/linearColor.ts"
    "src/renderer/utils/memoryOptimizer.ts"
    "src/renderer/utils/modules/async/index.ts"
    "src/renderer/utils/modules/format/index.ts"
    "src/renderer/utils/modules/validation/index.ts"
    "src/renderer/utils/performanceMonitor.ts"
    "src/renderer/utils/request.ts"
    "src/renderer/utils/request_music.ts"
    "src/renderer/utils/requestFactory.ts"
    "src/renderer/utils/securityChecker.ts"
    "src/renderer/utils/shortcutToast.ts"
    "src/renderer/utils/timerManager.ts"
    "src/renderer/utils/typeHelpers.ts"
    "src/renderer/utils/validators.ts"
)

# 添加Vue文件
vue_files=(
    "src/renderer/App.vue"
    "src/renderer/components/common/ArtistDrawer.vue"
    "src/renderer/components/common/BaseButton.vue"
    "src/renderer/components/common/BaseCard.vue"
    "src/renderer/components/common/ErrorBoundary.vue"
    "src/renderer/components/common/PlaylistDrawer.vue"
    "src/renderer/components/common/SearchItem.vue"
    "src/renderer/components/common/SkeletonUI.vue"
    "src/renderer/components/common/songItemCom/BaseSongItem.vue"
    "src/renderer/components/common/songItemCom/CompactSongItem.vue"
    "src/renderer/components/common/songItemCom/ListSongItem.vue"
    "src/renderer/components/common/songItemCom/MiniSongItem.vue"
    "src/renderer/components/common/songItemCom/SongItemDropdown.vue"
    "src/renderer/components/common/songItemCom/StandardSongItem.vue"
    "src/renderer/views/music/MusicListPage.vue"
    "src/renderer/views/search/index.vue"
    "src/renderer/views/set/index.vue"
)

# 合并所有文件列表
all_files=("${files[@]}" "${more_files[@]}" "${vue_files[@]}")

# 批量修复函数
fix_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "修复文件: $file"
        
        # 创建备份
        cp "$file" "$file.backup.$(date +%s)"
        
        # 基本的 > 替换为 , 的修复
        # 1. 修复函数参数分隔符: (param1 > param2) -> (param1, param2)
        sed -i 's/(\([^)>]*\) > \([^)>]*\))/(\1, \2)/g' "$file"
        
        # 2. 修复对象属性分隔符: prop: value > prop2: -> prop: value, prop2:
        sed -i 's/: \([^>]*\) > \([a-zA-Z_][a-zA-Z0-9_]*\):/: \1, \2:/g' "$file"
        
        # 3. 修复字符串后的分隔符: 'string' > -> 'string',
        sed -i "s/' > /', /g" "$file"
        sed -i 's/" > /", /g' "$file"
        
        # 4. 修复数组和对象结束符: } > -> },
        sed -i 's/ > }/, }/g' "$file"
        sed -i 's/ > ]/, ]/g' "$file"
        sed -i 's/ > )/, )/g' "$file"
        
        # 5. 修复事件监听器: on('event' > callback) -> on('event', callback)
        sed -i "s/on('\([^']*\)' > /on('\1', /g" "$file"
        sed -i "s/handle('\([^']*\)' > /handle('\1', /g" "$file"
        
        # 6. 修复类型注解: Type > Type2 -> Type, Type2
        sed -i 's/string > /string, /g' "$file"
        sed -i 's/number > /number, /g' "$file"
        sed -i 's/boolean > /boolean, /g' "$file"
        sed -i 's/unknown > /unknown, /g' "$file"
        
        # 7. 修复箭头函数: item = > -> item =>
        sed -i 's/ = > / => /g' "$file"
        
        # 8. 修复比较操作符: , = -> >=
        sed -i 's/, = / >= /g' "$file"
        
        # 9. 修复数组索引: [0] -> [0]
        sed -i 's/\[\] >/[0] >/g' "$file"
        sed -i 's/\[\])/[0])/g' "$file"
        sed -i 's/\[\];/[0];/g' "$file"
        
        # 10. 修复Record类型: Record<string > unknown> -> Record<string, unknown>
        sed -i 's/Record<string > unknown>/Record<string, unknown>/g' "$file"

        # 11. 修复更多复杂的语法错误
        sed -i 's/=, /=> /g' "$file"
        sed -i 's/: (): void =>/: () => /g' "$file"
        sed -i 's/get:, (): void =>/get: () => /g' "$file"
        sed -i 's/set: newData => {;/set: newData => {/g' "$file"
        sed -i 's/} > timeout/}, timeout/g' "$file"
        sed -i 's/\[\] >/[0] >/g' "$file"
        sed -i 's/\[\])/[0])/g' "$file"
        sed -i 's/\[\];/[0];/g' "$file"
        sed -i 's/\[\] || /[0] || /g' "$file"
        sed -i 's/\[\]\.value/[0].value/g' "$file"
        sed -i 's/Platform\[0\]/Platform[]/g' "$file"
        sed -i 's/Song\[0\]/Song[]/g' "$file"
        sed -i 's/string\[0\]/string[]/g' "$file"
        sed -i 's/: number =, /: number = /g' "$file"
        sed -i 's/: string =, /: string = /g' "$file"
        sed -i 's/: boolean =, /: boolean = /g' "$file"
        sed -i 's/watch( () => /watch(() => /g' "$file"
        sed -i 's/() => {/() => {/g' "$file"
        sed -i 's/{ data:, /{ data: /g' "$file"
        sed -i 's/>=, />= /g' "$file"
        sed -i 's/<=, /<= /g' "$file"
        sed -i 's/>, /> /g' "$file"
        sed -i 's/<, /< /g' "$file"
        sed -i 's/+, /+ /g' "$file"
        sed -i 's/-, /- /g' "$file"
        sed -i 's/\*, /* /g' "$file"
        sed -i 's/\/, // /g' "$file"
        
        echo "完成修复: $file"
    else
        echo "文件不存在: $file"
    fi
}

# 批量处理所有文件
for file in "${all_files[@]}"; do
    fix_file "$file"
done

echo "全局修复完成！"
echo "正在运行类型检查验证修复结果..."

# 运行类型检查
npm run typecheck
