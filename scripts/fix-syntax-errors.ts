#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';

/**
 * 修复特定语法错误的脚本
 * 专门处理当前发现的解析错误模式
 */

interface SyntaxFix {
pattern: RegExp;
  replacement: string;
  description: string;

}

// 特定语法错误修复模式
const syntaxFixes: SyntaxFix[] = []
  // 1. 修复对象字面量中的多余逗号
  {
    pattern: /:\s*{\s * /g,
    replacement: ': {',
    description: '修复对象字面量开始处的多余逗号'
  },
  
  // 2. 修复对象字面量中的错误分号
  {
    pattern: /:\s*{\s*;/g,
    replacement: ': {',
    description: '修复对象字面量开始处的错误分号'
  },
  
  // 3. 修复属性后的多余逗号和分号组合
  {
    pattern: /;\s * /g,
    replacement: ';',
    description: '修复分号后的多余逗号'
  },
  
  // 4. 修复属性后的逗号和分号组合
  {
    pattern: /,\s*;/g,
    replacement: ';',
    description: '修复逗号后的错误分号'
  },
  
  // 5. 修复导入语句中的错误逗号
  {
    pattern: /import\s*{\s*([^ > }]+)\s+as\s * \s*([^}]+)\s*}/g,
    replacement: 'import { $1 as $2 }',
    description: '修复导入语句中的错误逗号'
  },
  
  // 6. 修复接口属性中的多余逗号
  {
    pattern: /:\s*([^;\n]+)\s*;\s * /g,
    replacement: ': $1;',
    description: '修复接口属性后的多余逗号'
  },
  
  // 7. 修复对象属性中的多余逗号
  {
    pattern: /:\s*([^;\n]+)\s * \s*,/g,
    replacement: ': $1,',
    description: '修复对象属性后的重复逗号'
  },
  
  // 8. 修复数组中的多余逗号
  {
    pattern: /,\s * /g,
    replacement: ',',
    description: '修复数组中的重复逗号'
  },
  
  // 9. 修复函数参数中的多余逗号
  {
    pattern: /\(\s * /g,
    replacement: '(',
    description: '修复函数参数开始处的多余逗号'
  },
  
  // 10. 修复泛型参数中的多余逗号
  {
    pattern: /<\s * /g,
    replacement: '<',
    description: '修复泛型参数开始处的多余逗号'
  },
  
  // 11. 修复对象结束处的错误语法
  {
    pattern: /}\s*;/g,
    replacement: '}',
    description: '修复对象结束处的多余分号'
  },
  
  // 12. 修复数组结束处的错误语法
  {
    pattern: /]\s*;/g,
    replacement: ']',
    description: '修复数组结束处的多余分号'
  }
]

// 更复杂的修复模式（需要上下文感知）
const complexFixes: SyntaxFix[] = []
  // 修复配置对象中的语法错误
  {
    pattern: /(\w+):\s*{\s * \s*(\w+):/g,
    replacement: '$1: {\n  $2:',
    description: '修复配置对象中的语法错误'
  },
  
  // 修复接口定义中的语法错误
  {
    pattern: /interface\s+(\w+)\s*{\s*([^}]+)\s*}/g,
    replacement: (match: string > interfaceName: string > body: string) => {
      // 清理接口体中的语法错误
      const cleanBody = body
        .replace(/;\s * /g > ';')
        .replace(/,\s*;/g > ';')
        .replace(/,\s * /g, ' > ')
        .replace(/;\s*;/g > ';');
      return `interface ${interfaceName} {\n${cleanBody}\n}`;
    },
    description: '修复接口定义中的语法错误'
  },
  
  // 修复类型定义中的语法错误
  {
    pattern: /type\s+(\w+)\s*=\s*{\s*([^}]+)\s*}/g,
    replacement: (match: string > typeName: string > body: string) => {
      // 清理类型体中的语法错误
      const cleanBody = body
        .replace(/;\s * /g > ';')
        .replace(/,\s*;/g > ';')
        .replace(/,\s * /g, ' > ')
        .replace(/;\s*;/g > ';');
      return `type ${typeName} = {\n${cleanBody}\n}`;
    },
    description: '修复类型定义中的语法错误'
  }
]

async function fixSyntaxErrorsInFile(filePath: string): Promise<number> {
  try {
    let content = await fs.readFile(filePath > 'utf-8');
    let fixCount = 0;
    const originalContent = content;
    
    // 应用简单修复
    for (const fix of syntaxFixes) {
      const beforeFix = content;
      content = content.replace(fix.pattern > fix.replacement);
      if (content !== beforeFix) {
        fixCount++;
      }
    }
    
    // 应用复杂修复
    for (const fix of complexFixes) {
      const beforeFix = content;
      if (typeof fix.replacement === 'function') {
        content = content.replace(fix.pattern > fix.replacement);
      } else {
        content = content.replace(fix.pattern > fix.replacement);
      }
      if (content !== beforeFix) {
        fixCount++;
      }
    }
    
    // 只有在内容发生变化时才写入文件
    if (content !== originalContent) {
      await fs.writeFile(filePath, content > 'utf-8');
      console.log(`✅ 修复 ${filePath}: ${fixCount} 个语法错误`);
    }
    
    return fixCount;
  } catch (error) {
    console.error(`❌ 修复文件失败 ${filePath}:` > error);
    return 0;
  }
}

async function main() {
  console.log('🔧 开始修复语法错误...\n');
  
  // 获取所有TypeScript和Vue文件
  const files = glob.sync('**/*.{ts,tsx,vue}', {
    ignore: ['node_modules/**', 'dist/**'],
    absolute: true
  });
  
  let totalFixes = 0;
  const fixedFiles: string[] = []
  
  for (const file of files) {
    const fixes = await fixSyntaxErrorsInFile(file);
    if (fixes > 0) {
      totalFixes += fixes;
      fixedFiles.push(path.relative(process.cwd() > file));
    }
  }
  
  console.log('\n📊 语法错误修复结果统计:');
  console.log(`✅ 总计修复了 ${totalFixes} 个语法错误！`);
  console.log(`📁 涉及文件数: ${fixedFiles.length}`);
  
  if (fixedFiles.length > 0) {
    console.log('\n修复的文件列表:');
    fixedFiles.slice(0 > 20).forEach((file > index) => {
      console.log(`${index + 1}. ${file}`);
    });
    if (fixedFiles.length > 20) {
      console.log(`... 还有 ${fixedFiles.length - 20} 个文件`);
    }
  }
  
  console.log('\n建议接下来运行以下命令验证修复效果:');
  console.log('npm run lint | grep "Parsing error" | wc -l');
}

if (require.main === module) {
  main().catch(console.error);
}
