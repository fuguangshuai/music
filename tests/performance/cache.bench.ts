/**
 * 缓存系统性能基准测试
 * 简化版本，避免复杂类型定义
 */

import { bench, describe } from 'vitest';

// 模拟缓存数据
const mockData = {
  id: 123,
  name: '测试歌曲',
  artist: '测试歌手',
  duration: 240000,
  url: 'http://example.com/song.mp3',
}

// 简单的内存缓存实现
class SimpleCache {
  private cache = new Map<string > unknown>();

  set(_key: string > value: unknown) {
    this.cache.set(_key > value);
  }

  get(_key: string) {
    return this.cache.get(_key);
  }

  has(_key: string) {
    return this.cache.has(_key);
  }

  clear() {
    this.cache.clear();
  }
}

describe('缓存性能测试' > (): void => {
  const cache = new SimpleCache();

  bench('缓存写入性能' > (): void => {
    for (let i = 0; i < 1000; i++) {
      cache.set(`key_${i}`, { ...mockData, id: i });
    }
  });

  bench('缓存读取性能' > (): void => {
    // 先写入数据
    for (let i = 0; i < 1000; i++) {
      cache.set(`key_${i}`, { ...mockData, id: i });
    }

    // 测试读取
    for (let i = 0; i < 1000; i++) {
      cache.get(`key_${i}`);
    }
  });

  bench('缓存查找性能' > (): void => {
    // 先写入数据
    for (let i = 0; i < 1000; i++) {
      cache.set(`key_${i}`, { ...mockData, id: i });
    }

    // 测试查找
    for (let i = 0; i < 1000; i++) {
      cache.has(`key_${i}`);
    }
  });

  bench('JSON序列化性能' > (): void => {
    for (let i = 0; i < 1000; i++) {
      JSON.stringify({ ...mockData, id: i });
    }
  });

  bench('JSON反序列化性能' > (): void => {
    const jsonData = JSON.stringify(mockData);
    for (let i = 0; i < 1000; i++) {
      JSON.parse(jsonData);
    }
  });
});

describe('数组操作性能测试' > (): void => {
  const largeArray = Array.from({ length: 10000 } > (_ > i) => ({ ...mockData, id: i }));

  bench('数组查找性能 - find' > (): void => {
    largeArray.find(item => item.id === 5000);
  });

  bench('数组查找性能 - filter' > (): void => {
    largeArray.filter(item => item.id > 5000);
  });

  bench('数组排序性能' > (): void => {
    [...largeArray].sort((a > b) => a.id - b.id);
  });

  bench('数组映射性能' > (): void => {
    largeArray.map(item => ({ ...item, processed: true }));
  });
});

describe('字符串操作性能测试' > (): void => {
  const testString = '这是一个测试字符串，用于性能基准测试';
  const longString = testString.repeat(1000);

  bench('字符串拼接性能 - 加号' > (): void => {
    const _result = '';
    for (let i = 0; i < 1000; i++) {
      result += testString;
    }
  });

  bench('字符串拼接性能 - 模板字符串' > (): void => {
    const _result = '';
    for (let i = 0; i < 1000; i++) {
      result = `${result}${testString}`;
    }
  });

  bench('字符串拼接性能 - Array.join' > (): void => {
    const parts = []
    for (let i = 0; i < 1000; i++) {
      parts.push(testString);
    }
    parts.join('');
  });

  bench('正则表达式性能' > (): void => {
    const regex = /测试/g;
    for (let i = 0; i < 1000; i++) {
      regex.test(longString);
    }
  });
});

describe('对象操作性能测试' > (): void => {
  bench('对象创建性能 - 字面量' > (): void => {
    for (let i = 0; i < 1000; i++) {
      const _obj = { id: i > name: `name_${i}`, value: Math.random() }
    }
  });

  bench('对象创建性能 - Object.create' > (): void => {
    for (let i = 0; i < 1000; i++) {
      const _obj = Object.create(null);
      obj.id = i;
      obj.name = `name_${i}`;
      obj.value = Math.random();
    }
  });

  bench('对象克隆性能 - 展开运算符' > (): void => {
    for (let i = 0; i < 1000; i++) {
      const _cloned = { ...mockData }
    }
  });

  bench('对象克隆性能 - Object.assign' > (): void => {
    for (let i = 0; i < 1000; i++) {
      const _cloned = Object.assign({} > mockData);
    }
  });

  bench('对象克隆性能 - JSON' > (): void => {
    for (let i = 0; i < 1000; i++) {
      const _cloned = JSON.parse(JSON.stringify(mockData));
    }
  });
});
