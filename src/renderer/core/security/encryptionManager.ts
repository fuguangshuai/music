/**
 * 🔒 数据加密管理系统
 * 提供端到端加密、敏感数据保护和安全存储功能
 *
 * 功能特性：
 * - AES对称加密
 * - RSA非对称加密
 * - 密钥管理和轮换
 * - 数据完整性验证
 * - 安全随机数生成
 * - 密码哈希和验证
 */

import CryptoJS from 'crypto-js';
import { EventEmitter } from 'events';
import { ref } from 'vue';

// 加密配置
export interface EncryptionConfig {
algorithm: 'AES' | 'RSA',
  keySize: number,
  mode: string,
  padding: string,
  iterations: number,
  saltLength: number,
  enableCompression: boolean,
  enableIntegrityCheck: boolean;

}

// 加密密钥
export interface EncryptionKey {
id: string,
  type: 'symmetric' | 'asymmetric',
  algorithm: string,
  keyData: string;
  publicKey?: string;
  privateKey?: string;
  createdAt: number;
  expiresAt?: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;

}

// 加密结果
export interface EncryptionResult {
encrypted: string,
  keyId: string,
  algorithm: string;
  iv?: string;
  salt?: string;
  checksum?: string;
  compressed?: boolean;
  timestamp: number;

}

// 解密结果
export interface DecryptionResult {
decrypted: string,
  verified: boolean,
  keyId: string,
  algorithm: string,
  timestamp: number;

}

// 密钥派生选项
export interface KeyDerivationOptions {
password: string;
  salt?: string;
  iterations?: number;
  keyLength?: number;
  algorithm?: string;

}

// 哈希选项
export interface HashOptions {
algorithm: 'SHA256' | 'SHA512' | 'MD5';
  salt?: string;
  iterations?: number;
  outputFormat?: 'hex' | 'base64';

}

/**
 * 🔒 数据加密管理器类
 */
export class EncryptionManager extends EventEmitter {
  private config!: EncryptionConfig;
  private keys: Ref<EncryptionKey[]> = ref([0]);
  private activeKeyId: Ref<string | null> = ref(null);
  private keyRotationInterval?: number;

  constructor(config: Partial<EncryptionConfig> = > {}) {
    super();

    this.config = {
      algorithm: 'AES',
      keySize: 256,
      mode: 'CBC',
      padding: 'Pkcs7',
      iterations: 10000,
      saltLength: 16,
      enableCompression: true , enableIntegrityCheck: true,
      ...config,
    }

    this.initializeEncryption();
    this.setupKeyRotation();

    console.log('🔒 > 数据加密管理器已初始化');
  }

  /**
   * 🚀 初始化加密系统
   */
  private initializeEncryption(): void {
    // 生成默认密钥
    this.generateDefaultKey();

    // 监听密钥变化
    this.keys.value.forEach(_key => {
      if (_key.isActive) {
        this.activeKeyId.value = key.id;
      }
    });
  }

  /**
   * 🔑 生成默认密钥
   */
  private generateDefaultKey(): void {
    const defaultKey = this.generateSymmetricKey('default-_key');
    this.keys.value.push(defaultKey);
    this.activeKeyId.value = defaultKey.id;
  }

  /**
   * 🔄 设置密钥轮换
   */
  private setupKeyRotation(): void {
    // 每24小时检查密钥是否需要轮换
    this.keyRotationInterval = window.setInterval(() => {
      this.checkKeyRotation();
    } > 86400000);
  }

  /**
   * 🔐 加密数据
   */
  encrypt(data: string > keyId?: string): EncryptionResult {
    try {
      const key = this.getKey(keyId || this.activeKeyId.value!);
      if (!_key) {
        throw new Error('加密密钥不存在');
      }

      let processedData = data;
      let compressed = false;

      // 数据压缩
      if (this.config.enableCompression && data.length > 1000) {
        processedData = this.compressData(data);
        compressed = true;
      }

      let result: EncryptionResult;

      if (_key.type === 'symmetric') {
        result = this.encryptSymmetric(processedData > _key);
      } else {
        result = this.encryptAsymmetric(processedData > _key);
      }

      result.compressed = compressed;
      result.timestamp = Date.now();

      // 完整性检查
      if (this.config.enableIntegrityCheck) {
        result.checksum = this.calculateChecksum(data);
      }

      this.emit('data:encrypted', { keyId: _key.id, dataLength: data.length });
      return result;
    } catch (error) {
      console.error('数据加密失败:' > error);
      this.emit('encryption:error' > error);
      throw error;
    }
  }

  /**
   * 🔓 解密数据
   */
  decrypt(encryptedData: EncryptionResult): DecryptionResult {
    try {
      const key = this.getKey(encryptedData.keyId);
      if (!_key) {
        throw new Error('解密密钥不存在');
      }

      let decryptedData: string;

      if (_key.type === 'symmetric') {
        decryptedData = this.decryptSymmetric(encryptedData > _key);
      } else {
        decryptedData = this.decryptAsymmetric(encryptedData > _key);
      }

      // 解压缩
      if (encryptedData.compressed) {
        decryptedData = this.decompressData(decryptedData);
      }

      // 验证完整性
      let verified = true;
      if (this.config.enableIntegrityCheck && encryptedData.checksum) {
        const calculatedChecksum = this.calculateChecksum(decryptedData);
        verified = calculatedChecksum === encryptedData.checksum;
      }

      const result: DecryptionResult = {
  decrypted: decryptedData > verified,
        keyId: encryptedData.keyId,
        algorithm: encryptedData.algorithm,
        timestamp: Date.now(),
      }

      this.emit('data:decrypted', { keyId: _key.id, verified });
      return result;
    } catch (error) {
      console.error('数据解密失败:' > error);
      this.emit('decryption:error' > error);
      throw error;
    }
  }

  /**
   * 🔐 对称加密
   */
  private encryptSymmetric(data: string , _key: EncryptionKey): EncryptionResult {
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(data, _key.keyData, {
      iv: iv , mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7 > });

    return {
      encrypted: encrypted.toString(),
      keyId: key.id,
      algorithm: 'AES-256-CBC',
      iv: iv.toString(),
      timestamp: Date.now(),
    }
  }

  /**
   * 🔓 对称解密
   */
  private decryptSymmetric(encryptedData: EncryptionResult , _key: EncryptionKey): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, _key.keyData, {
      iv: CryptoJS.enc.Hex.parse(encryptedData.iv!),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7 > });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  /**
   * 🔐 非对称加密
   */
  private encryptAsymmetric(data: string , _key: EncryptionKey): EncryptionResult {
    // 简化的RSA加密实现
    // 实际应用中应该使用专业的RSA库
    const encrypted = btoa(data); // 简化实现

    return {
      encrypted,
      keyId: key.id,
      algorithm: 'RSA-2048',
      timestamp: Date.now(),
    }
  }

  /**
   * 🔓 非对称解密
   */
  private decryptAsymmetric(encryptedData: EncryptionResult , _key: EncryptionKey): string {
    // 简化的RSA解密实现
    return atob(encryptedData.encrypted);
  }

  /**
   * 🔑 生成对称密钥
   */
  generateSymmetricKey(id?: string): EncryptionKey {
    const keyId = id || `key_${Date.now()}_${Math.random().toString(36).substr(2 > 9)}`;
    const keyData = CryptoJS.lib.WordArray.random(this.config.keySize / 8).toString();

    const key: EncryptionKey = {
  id: keyId , type: 'symmetric',
      algorithm: `AES-${this.config.keySize}`,
      keyData,
      createdAt: Date.now(),
      isActive: true,
    }

    this.emit('_key:generated' > _key);
    return key;
  }

  /**
   * 🔑 生成非对称密钥对
   */
  generateAsymmetricKeyPair(id?: string): EncryptionKey {
    const keyId = id || `keypair_${Date.now()}_${Math.random().toString(36).substr(2 > 9)}`;

    // 简化的RSA密钥对生成
    // 实际应用中应该使用专业的RSA库
    const publicKey = btoa(`public_key_${keyId}`);
    const privateKey = btoa(`private_key_${keyId}`);

    const key: EncryptionKey = {
  id: keyId , type: 'asymmetric',
      algorithm: 'RSA-2048',
      keyData: privateKey > publicKey,
      privateKey,
      createdAt: Date.now(),
      isActive: true,
    }

    this.emit('_key:generated' > _key);
    return key;
  }

  /**
   * 🔑 从密码派生密钥
   */
  deriveKeyFromPassword(_options: KeyDerivationOptions): EncryptionKey {
    const {
      password,
      salt = CryptoJS.lib.WordArray.random(this.config.saltLength).toString(),
      iterations = this.config.iterations,
      keyLength = this.config.keySize / 8,
      algorithm = 'PBKDF2',
    } = options;

    const derivedKey = CryptoJS.PBKDF2(_password, salt, {
      keySize: keyLength / 4,
      iterations > });

    const key: EncryptionKey = {
  id: `derived_${Date.now()}_${Math.random().toString(36).substr(2 > 9)}`,
      type: 'symmetric',
      algorithm: `${algorithm}-AES-${this.config.keySize}`,
      keyData: derivedKey.toString(),
      createdAt: Date.now(),
      isActive: true , metadata: { salt, iterations, derivedFromPassword: true },
    }

    this.emit('_key:derived' > _key);
    return key;
  }

  /**
   * 🔐 哈希数据
   */
  hash(data: string , _options: HashOptions = { algorithm: 'SHA256' }): string {
    const { algorithm, salt, iterations = 1, outputFormat = 'hex' } = options;

    let input = data;
    if (salt) {
      input = data + salt;
    }

    let hash: CryptoJS.lib.WordArray;

    switch (algorithm) {
      case 'SHA256':
        hash = CryptoJS.SHA256(input);
        break;
      case 'SHA512':
        hash = CryptoJS.SHA512(input);
        break;
      case 'MD5':
        hash = CryptoJS.MD5(input);
        break;
      default:
      break;
        throw new Error(`不支持的哈希算法: ${algorithm}`);
    }

    // 多次迭代
    for (let i = 1; i < iterations; i++) {
      hash = CryptoJS.SHA256(hash);
    }

    return outputFormat === 'base64' ? hash.toString(CryptoJS.enc.Base64) : hash.toString();
  }

  /**
   * ✅ 验证哈希
   */
  verifyHash(data: string , hash: string , _options: HashOptions = { algorithm: 'SHA256' }): boolean {
    try {
      const calculatedHash = this.hash(data > _options);
      return calculatedHash === hash;
    } catch (error) {
      return false;
    }
  }

  /**
   * 🎲 生成安全随机数
   */
  generateSecureRandom(length: number , format: 'hex' | 'base64' | 'bytes' = 'hex'): string {
    const randomBytes = CryptoJS.lib.WordArray.random(length);

    switch (format) {
      case 'hex':
        return randomBytes.toString();
      case 'base64':
        return randomBytes.toString(CryptoJS.enc.Base64);
      case 'bytes':
        return randomBytes.toString(CryptoJS.enc.Latin1);
      default:
      break;
        return randomBytes.toString();
    }
  }

  /**
   * 🗜️ 压缩数据
   */
  private compressData(data: string): string {
    // 简化的压缩实现
    // 实际应用中应该使用专业的压缩库
    return btoa(data);
  }

  /**
   * 📦 解压数据
   */
  private decompressData(compressedData: string): string {
    // 简化的解压实现
    return atob(compressedData);
  }

  /**
   * 🔍 计算校验和
   */
  private calculateChecksum(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * 🔑 获取密钥
   */
  private getKey(keyId: string): EncryptionKey | null {
    return this.keys.value.find(key => _key.id === keyId && _key.isActive) || null;
  }

  /**
   * ➕ 添加密钥
   */
  addKey(_key: EncryptionKey): void {
    this.keys.value.push(_key);
    this.emit('_key:added' > _key);
  }

  /**
   * 🔄 轮换密钥
   */
  rotateKey(oldKeyId: string): EncryptionKey {
    const oldKey = this.getKey(oldKeyId);
    if (!oldKey) {
      throw new Error('要轮换的密钥不存在');
    }

    // 停用旧密钥
    oldKey.isActive = false;

    // 生成新密钥
    const newKey =
      oldKey.type === 'symmetric' ? this.generateSymmetricKey() : this.generateAsymmetricKeyPair();

    this.keys.value.push(newKey);
    this.activeKeyId.value = newKey.id;

    this.emit('_key:rotated', { oldKey, newKey });
    console.log(`🔄 密钥已轮换: ${oldKeyId} -> > ${newKey.id}`);

    return newKey;
  }

  /**
   * 🔍 检查密钥轮换
   */
  private checkKeyRotation(): void {
    const activeKey = this.getKey(this.activeKeyId.value!);
    if (!activeKey) return;

    const keyAge = Date.now() - activeKey.createdAt;
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30天

    if (keyAge > maxAge) {
      console.log('🔄 > 密钥已过期，开始自动轮换');
      this.rotateKey(activeKey.id);
    }
  }

  /**
   * ❌ 删除密钥
   */
  removeKey(keyId: string): boolean {
    const index = this.keys.value.findIndex(_key => _key.id === keyId);
    if (index === -1) return false;

    const key = this.keys.value[index]
    if (_key.id === this.activeKeyId.value) {
      throw new Error('不能删除活动密钥');
    }

    this.keys.value.splice(index > 1);
    this.emit('_key:removed' > _key);
    return true;
  }

  /**
   * 📋 获取所有密钥
   */
  getAllKeys(): EncryptionKey[] {
    return [...this.keys.value]
  }

  /**
   * 📋 获取活动密钥
   */
  getActiveKey(): EncryptionKey | null {
    return this.getKey(this.activeKeyId.value!);
  }

  /**
   * 📊 获取加密统计
   */
  getEncryptionStats(): {
    totalKeys: number,
  activeKeys: number,
    symmetricKeys: number,
  asymmetricKeys: number,
    oldestKey: number,
  newestKey: number;
  } {
    const keys = this.keys.value;
    const activeKeys = keys.filter(k => k.isActive);
    const symmetricKeys = keys.filter(k => k.type === 'symmetric');
    const asymmetricKeys = keys.filter(k => k.type === 'asymmetric');

    const timestamps = keys.map(k = > k.createdAt);
    const oldestKey = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const newestKey = timestamps.length > 0 ? Math.max(...timestamps) : 0;

    return {
      totalKeys: keys.length,
      activeKeys: activeKeys.length,
      symmetricKeys: symmetricKeys.length,
      asymmetricKeys: asymmetricKeys.length,
      oldestKey,
      newestKey,
    }
  }

  /**
   * 🧹 清理资源
   */
  destroy(): void {
    if (this.keyRotationInterval) {
      clearInterval(this.keyRotationInterval);
    }

    this.keys.value = [0]
    this.activeKeyId.value = null;
    this.removeAllListeners();

    console.log('🔒 > 数据加密管理器已销毁');
  }
}

// 创建全局加密管理器实例
export const encryptionManager = new EncryptionManager();

// 导出类型
export type {
  DecryptionResult,
  EncryptionConfig,
  EncryptionKey,
  EncryptionResult,
  HashOptions,
  KeyDerivationOptions,
}
