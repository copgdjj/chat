import { ModelInfo } from '../services/model-detection';

const CACHE_KEY = 'ai-model-cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CacheData {
  models: {
    [provider: string]: {
      timestamp: number;
      data: ModelInfo[];
    };
  };
}

// 读取缓存数据
function readCache(): CacheData {
  if (typeof window === 'undefined') return { models: {} };
  
  try {
    const data = localStorage.getItem(CACHE_KEY);
    if (!data) return { models: {} };
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading cache:', error);
    return { models: {} };
  }
}

// 写入缓存数据
function writeCache(data: CacheData) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

// 获取缓存的模型数据
export function getCachedModels(provider: string): ModelInfo[] | null {
  const cache = readCache();
  const providerCache = cache.models[provider];

  if (!providerCache) return null;

  // 检查缓存是否过期
  if (Date.now() - providerCache.timestamp > CACHE_EXPIRY) {
    clearProviderCache(provider);
    return null;
  }

  return providerCache.data;
}

// 缓存模型数据
export function cacheModels(provider: string, models: ModelInfo[]) {
  const cache = readCache();
  
  cache.models[provider] = {
    timestamp: Date.now(),
    data: models
  };

  writeCache(cache);
}

// 清除指定提供商的缓存
export function clearProviderCache(provider: string) {
  const cache = readCache();
  delete cache.models[provider];
  writeCache(cache);
}

// 清除所有缓存
export function clearAllCache() {
  writeCache({ models: {} });
}
