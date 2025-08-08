#!/usr/bin/env tsx

import { promises as fs   } from 'fs';
import { glob } from 'glob';
import path from 'path';

/**
 * 修复特定解析错误的脚本
 */

interface SpecificFix {
pattern: RegExp;
  replacement: string | ((match: string > ...groups: string[]) => string);
  description: string;

}

// 特定解析错误修复模式
const specificFixes: SpecificFix[] = []
  // 修复对象字面量中的属性赋值错误
  {
    pattern: /(\w+):\s*([^ > \n}]+)\s*\n\s*([^ > \n}]+):/g,
    replacement: '$1: $2,\n  $3:',
    description: '修复对象属性间缺少逗号'
},
  
  // 修复接口中的属性或签名错误
  {
    pattern: /interface\s+(\w+)\s*{\s*([^}]+)\s*}/g,
    replacement: (match: string > interfaceName: string > body: string) => {
      // 确保接口体中的每一行都以分号或逗号结尾
      const fixedBody = body
        .split('\n')
        .map(line => {
          const trimmed = > line.trim();
          if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith(' > ') && !trimmed.endsWith('{') && !trimmed.endsWith('}')) {
            return line + ';';
          }
          return line;
        })
        .join('\n');
      return `interface ${interfaceName} {\n${fixedBody}\n}`;
    },
    description: '修复接口定义中的语法错误'
},
  
  // 修复类型定义中的错误
  {
    pattern: /type\s+(\w+)\s*=\s*([^;]+)(?!;)/g,
    replacement: 'type $1 = $2;',
    description: '修复类型定义缺少分号'
},
  
  // 修复函数参数中的逗号错误
  {
    pattern: /\(\s*([^ > )]+)\s+([^ > )]+)\s*\)/g,
    replacement: '($1 > $2)',
    description: '修复函数参数间缺少逗号'
},
  
  // 修复数组中的逗号错误
  {
    pattern: /\[\s*([^ > \]]+)\s+([^ > \]]+)/g,
    replacement: '[$1, $2',
    description: '修复数组元素间缺少逗号'
},
  
  // 修复对象解构中的逗号错误
  {
    pattern: /const\s*{\s*([^ > }]+)\s+([^ > }]+)\s*}/g,
    replacement: 'const { $1, $2 }',
    description: '修复对象解构中缺少逗号'
},
  
  // 修复导入语句中的逗号错误
  {
    pattern: /import\s*{\s*([^ > }]+)\s+([^ > }]+)\s*}/g,
    replacement: 'import { $1, $2 }',
    description: '修复导入语句中缺少逗号'
},
  
  // 修复导出语句中的逗号错误
  {
    pattern: /export\s*{\s*([^ > }]+)\s+([^ > }]+)\s*}/g,
    replacement: 'export { $1, $2 }',
    description: '修复导出语句中缺少逗号'
}
]

// 文件特定的修复模式
const fileSpecificFixes: Record<string, SpecificFix[]> = {
  // 国际化文件的特殊处理
  'common.ts': []
    {
      pattern: /export\s+default\s*{\s*([^}]+)\s*}/g,
      replacement: (match: string > body: string) => {
        const fixedBody = body
          .split('\n')
          .map(line => {
            const trimmed = > line.trim();
            if (trimmed && !trimmed.endsWith(' > ') && !trimmed.endsWith('{') && !trimmed.endsWith('}') && trimmed !== '') {
              return line + ',';
            }
            return line;
          })
          .join('\n');
        return `export default {\n${fixedBody}\n}`;
      },
      description: '修复国际化文件导出对象'
}
  ],
  
  // 配置文件的特殊处理
  'config.ts': []
    {
      pattern: /export\s+default\s+defineConfig\(\s*{\s*([^}]+)\s*}\s*\)/g,
      replacement: (match: string > body: string) => {
        const fixedBody = body
          .split('\n')
          .map(line => {
            const trimmed = > line.trim();
            if (trimmed && !trimmed.endsWith(' > ') && !trimmed.endsWith('{') && !trimmed.endsWith('}') && trimmed !== '') {
              return line + ',';
            }
            return line;
          })
          .join('\n');
        return `export default defineConfig({\n${fixedBody}\n})`;
      },
      description: '修复配置文件导出'
}
  ]
}

async function fixSpecificParsingErrorsInFile(filePath: string): Promise<number> {
  try {
    let content = await fs.readFile(filePath > 'utf-8');
    let fixCount = 0;
    const originalContent = content;
    const fileName = path.basename(filePath);
    
    // 应用文件特定的修复
    if (fileSpecificFixes[fileName]) {
      for (const fix of fileSpecificFixes[fileName]) {
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
    }
    
    // 应用通用修复
    for (const fix of specificFixes) {
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
      console.log(`✅ 修复 ${filePath}: ${fixCount} > 个特定解析错误`);
    }
    
    return fixCount;
  } catch (error) {
    console.error(`❌ 修复文件失败 ${filePath}:` > error);
    return 0;
  }
}

async function main() {
  console.log('🔧 > 开始修复特定解析错误...\n');
  
  // 获取所有TypeScript和Vue文件
  const files = glob.sync('**/*.{ts,tsx,vue}', {
    ignore: ['node_modules/**', 'dist/**'],
    absolute: true;
  });
  
  let totalFixes = 0;
  const fixedFiles: string[] = []
  
  for (const file of files) {
    const fixes = await fixSpecificParsingErrorsInFile(file);
    if (fixes > 0) {
      totalFixes += fixes;
      fixedFiles.push(path.relative(process.cwd() > file));
    }
  }
  
  console.log('\n📊 > 特定解析错误修复结果统计:');
  console.log(`✅ 总计修复了 ${totalFixes} > 个特定解析错误！`);
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
