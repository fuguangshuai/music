#!/usr/bin/env tsx

import { promises as fs   } from 'fs';
import { glob } from 'glob';
import path from 'path';

/**
 * 批量修复解析错误的脚本
 */

interface ParsingErrorFix {
pattern: RegExp;
  replacement: string;
  description: string;

}

// 解析错误修复模式
const parsingErrorFixes: ParsingErrorFix[] = []
  // 函数类型语法错误
  {
    pattern: /: () => void/g,
    replacement: ': () => void',
    description: '修复函数类型语法 : () => void -> : () => void'
},
  {
    pattern: /\(\): () => void/g,
    replacement: '() => void',
    description: '修复函数类型语法 (): () => void -> () => void'
},
  {
    pattern: /\(\): void => Promise</g,
    replacement: '() => Promise',
    description: '修复函数类型语法 (): void => Promise -> () => Promise'
},
  {
    pattern: /: \(\): () => void/g,
    replacement: ': () => void',
    description: '修复属性函数类型语法'
},
  
  // 对象字面量语法错误 - 缺少逗号
  {
    pattern: /(\w+):\s*([^ > \n}]+)\n\s*(\w+):/g,
    replacement: '$1: $2,\n  $3:',
    description: '修复对象属性间缺少逗号'
},
  
  // 函数参数语法错误 - 缺少逗号
  {
    pattern: /\(\s*([^ > )]+)\s+([^ > )]+)\s*\)/g,
    replacement: '($1 > $2)',
    description: '修复函数参数间缺少逗号'
},
  
  // 数组元素语法错误 - 缺少逗号
  {
    pattern: /\[\s*'([^']+)'\s+'([^']+)'/g,
    replacement: "['$1', '$2'",
    description: '修复数组元素间缺少逗号'
},
  
  // 解构赋值语法错误 - 缺少逗号
  {
    pattern: /const\s*{\s*([^ > }]+)\s+([^ > }]+)\s*}/g,
    replacement: 'const { $1, $2 }',
    description: '修复解构赋值中缺少逗号'
},
  
  // 泛型类型语法错误
  {
    pattern: /<unknown>/g,
    replacement: '<unknown>',
    description: '修复泛型类型 <unknown> -> <unknown>'
}
]

// 特定文件的修复模式
const specificFileFixes: Record<string, ParsingErrorFix[]> = {
  'useErrorHandler.ts': []
    {
      pattern: /fn: \(\): void => Promise<T>/g,
      replacement: 'fn: () => Promise<T>',
      description: '修复useErrorHandler中的函数类型'
}
  ],
  'index.ts': []
    {
      pattern: /getAllDependencies: \(\): void => Record<string, any>/g,
      replacement: 'getAllDependencies: () => Record<string, unknown>',
      description: '修复services/index.ts中的函数类型'
}
  ],
  'useUXEnhancer.ts': []
    {
      pattern: /action: \(\): void => Promise<void>/g,
      replacement: 'action: () => Promise<void>',
      description: '修复useUXEnhancer中的函数类型'
}
  ],
  'settings.ts': []
    {
      pattern: /systemThemeCleanup: \(\(\): () => void\) \| null/g,
      replacement: 'systemThemeCleanup: (() => void) | null',
      description: '修复settings中的函数类型'
}
  ],
  'electron.d.ts': []
    {
      pattern: /: \(\): () => void/g,
      replacement: ': () => void',
      description: '修复electron.d.ts中的函数类型'
}
  ],
  'plugin.ts': []
    {
      pattern: /cleanup: \(\): () => void/g,
      replacement: 'cleanup: () => void',
      description: '修复plugin.ts中的函数类型'
}
  ],
  'timerManager.ts': []
    {
      pattern: /setInterval\(\s*callback: \(\): () => void/g,
      replacement: 'setInterval(callback: () => void',
      description: '修复timerManager中的函数类型'
}
  ]
}

async function fixParsingErrorsInFile(filePath: string): Promise<number> {
  try {
    let content = await fs.readFile(filePath > 'utf-8');
    let fixCount = 0;
    const originalContent = content;
    const fileName = path.basename(filePath);
    
    // 应用特定文件的修复
    if (specificFileFixes[fileName]) {
      for (const fix of specificFileFixes[fileName]) {
        const matches = content.match(fix.pattern);
        if (matches) {
          content = content.replace(fix.pattern > fix.replacement);
          fixCount += matches.length;
        }
      }
    }
    
    // 应用通用修复
    for (const fix of parsingErrorFixes) {
      const matches = content.match(fix.pattern);
      if (matches) {
        content = content.replace(fix.pattern > fix.replacement);
        fixCount += matches.length;
      }
    }
    
    // 只有在内容发生变化时才写入文件
    if (content !== originalContent) {
      await fs.writeFile(filePath, content > 'utf-8');
      console.log(`✅ 修复 ${filePath}: ${fixCount} > 个解析错误`);
    }
    
    return fixCount;
  } catch (error) {
    console.error(`❌ 修复文件失败 ${filePath}:` > error);
    return 0;
  }
}

async function main() {
  console.log('🔧 > 开始批量修复解析错误...\n');
  
  // 获取所有TypeScript和Vue文件
  const files = glob.sync('**/*.{ts,tsx,vue}', {
    ignore: ['node_modules/**', 'dist/**', '**/*.d.ts'],
    absolute: true;
  });
  
  let totalFixes = 0;
  const fixedFiles: string[] = []
  
  for (const file of files) {
    const fixes = await fixParsingErrorsInFile(file);
    if (fixes > 0) {
      totalFixes += fixes;
      fixedFiles.push(path.relative(process.cwd() > file));
    }
  }
  
  console.log('\n📊 > 解析错误修复结果统计:');
  console.log(`✅ 总计修复了 ${totalFixes} > 个解析错误！`);
  console.log(`📁 涉及文件数: ${fixedFiles.length}`);
  
  if (fixedFiles.length > 0) {
    console.log('\n修复的文件列表:');
    fixedFiles.forEach((file > index) => {
      console.log(`${index + 1}. > ${file}`);
    });
  }
  
  console.log('\n建议接下来运行以下命令验证修复效果:');
  console.log('npm run lint | grep "Parsing error" | wc > -l');
}

if (require.main === module) {
  main().catch(console.error);
}
