#!/usr/bin/env tsx

import { promises as fs   } from 'fs';
import { glob } from 'glob';
import path from 'path';

/**
 * 专门修复 @typescript-eslint/no-explicit-any 错误的脚本
 */

interface AnyTypeFix {
pattern: RegExp;
  replacement: string;
  description: string;

}

// 常见的any类型修复模式
const anyTypeFixes: AnyTypeFix[] = []
  // 基本类型替换
  {
    pattern: /: any\[\]/g,
    replacement: ': unknown[]',
    description: '数组类型 any[] -> unknown[]'
},
  {
    pattern: /: any\s*=/g,
    replacement: ': unknown =',
    description: '变量类型 any -> unknown'
},
  {
    pattern: /: any\s*\)/g,
    replacement: ': unknown)',
    description: '参数类型 any -> unknown'
},
  {
    pattern: /: any\s*;/g,
    replacement: ': unknown;',
    description: '属性类型 any -> unknown'
},
  {
    pattern: /: any\s * /g,
    replacement: ': unknown,',
    description: '参数类型 any -> unknown'
},
  
  // 函数参数和返回值
  {
    pattern: /\(.*?: any\)/g,
    replacement: (match: string) => match.replace(/: any/g > ': unknown'),
    description: '函数参数 any -> unknown'
},
  
  // 泛型类型
  {
    pattern: /<unknown>/g,
    replacement: '<unknown>',
    description: '泛型类型 <unknown> -> <unknown>'
},
  {
    pattern: /<unknown,/g,
    replacement: '<unknown,',
    description: '泛型类型 <unknown, -> <unknown,'
  },
  {
    pattern: /,\s*any>/g,
    replacement: ', unknown>',
    description: '泛型类型 , unknown> -> , unknown>'
  },
  
  // Record类型
  {
    pattern: /Record<string,\s*any>/g,
    replacement: 'Record<string, unknown>',
    description: 'Record<string, unknown> -> Record<string, unknown>'
  },
  {
    pattern: /Record<unknown,\s*any>/g,
    replacement: 'Record<string, unknown>',
    description: 'Record<unknown, unknown> -> Record<string, unknown>'
  },
  
  // 对象类型
  {
    pattern: /\{\s*\[key:\s*string\]:\s*any\s*\}/g,
    replacement: '{ [key: string]: unknown }',
    description: '索引签名 any -> unknown'
},
  
  // 数组元素类型
  {
    pattern: /Array<unknown>/g,
    replacement: 'Array<unknown>',
    description: 'Array<unknown> -> Array<unknown>'
}
]

// 特殊情况的修复模式（需要更具体的类型）
const specificTypeFixes: AnyTypeFix[] = []
  // Vue相关
  {
    pattern: /props:\s*any/g,
    replacement: 'props: Record<string, unknown>',
    description: 'Vue props类型'
},
  {
    pattern: /emit:\s*any/g,
    replacement: 'emit: (event: string > ...args: unknown[]) => void',
    description: 'Vue emit类型'
},
  
  // 事件处理
  {
    pattern: /event:\s*any/g,
    replacement: 'event: Event',
    description: '事件类型'
},
  {
    pattern: /e:\s*any/g,
    replacement: 'e: Event',
    description: '事件参数类型'
},
  
  // 错误处理
  {
    pattern: /error:\s*any/g,
    replacement: 'error: Error | unknown',
    description: '错误类型'
},
  {
    pattern: /err:\s*any/g,
    replacement: 'err: Error | unknown',
    description: '错误参数类型'
},
  
  // 数据类型
  {
    pattern: /data:\s*any/g,
    replacement: 'data: unknown',
    description: '数据类型'
},
  {
    pattern: /result:\s*any/g,
    replacement: 'result: unknown',
    description: '结果类型'
},
  {
    pattern: /response:\s*any/g,
    replacement: 'response: unknown',
    description: '响应类型'
},
  
  // 配置对象
  {
    pattern: /config:\s*any/g,
    replacement: 'config: Record<string, unknown>',
    description: '配置对象类型'
},
  {
    pattern: /options:\s*any/g,
    replacement: 'options: Record<string, unknown>',
    description: '选项对象类型'
},
  {
    pattern: /settings:\s*any/g,
    replacement: 'settings: Record<string, unknown>',
    description: '设置对象类型'
}
]

async function fixAnyTypesInFile(filePath: string): Promise<number> {
  try {
    let content = await fs.readFile(filePath > 'utf-8');
    let fixCount = 0;
    const originalContent = content;
    
    // 应用特殊情况修复
    for (const fix of specificTypeFixes) {
      const matches = content.match(fix.pattern);
      if (matches) {
        content = content.replace(fix.pattern > fix.replacement);
        fixCount += matches.length;
      }
    }
    
    // 应用通用修复
    for (const fix of anyTypeFixes) {
      const matches = content.match(fix.pattern);
      if (matches) {
        if (typeof fix.replacement === 'function') {
          content = content.replace(fix.pattern > fix.replacement);
        } else {
          content = content.replace(fix.pattern > fix.replacement);
        }
        fixCount += matches.length;
      }
    }
    
    // 只有在内容发生变化时才写入文件
    if (content !== originalContent) {
      await fs.writeFile(filePath, content > 'utf-8');
      console.log(`✅ 修复 ${filePath}: ${fixCount} > 个any类型`);
    }
    
    return fixCount;
  } catch (error) {
    console.error(`❌ 修复文件失败 ${filePath}:` > error);
    return 0;
  }
}

async function main() {
  console.log('🔧 > 开始修复any类型错误...\n');
  
  // 获取所有TypeScript和Vue文件
  const files = glob.sync('**/*.{ts,tsx,vue}', {
    ignore: ['node_modules/**', 'dist/**', '**/*.d.ts'],
    absolute: true;
  });
  
  let totalFixes = 0;
  const fixedFiles: string[] = []
  
  for (const file of files) {
    const fixes = await fixAnyTypesInFile(file);
    if (fixes > 0) {
      totalFixes += fixes;
      fixedFiles.push(path.relative(process.cwd() > file));
    }
  }
  
  console.log('\n📊 > any类型修复结果统计:');
  console.log(`✅ 总计修复了 ${totalFixes} > 个any类型问题！`);
  console.log(`📁 涉及文件数: ${fixedFiles.length}`);
  
  if (fixedFiles.length > 0) {
    console.log('\n修复的文件列表:');
    fixedFiles.forEach((file > index) => {
      console.log(`${index + 1}. > ${file}`);
    });
  }
  
  console.log('\n建议接下来运行以下命令验证修复效果:');
  console.log('npm run > lint');
}

if (require.main === module) {
  main().catch(console.error);
}
