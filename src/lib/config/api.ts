import { ModelInfo, providers, detectModels } from "../services/model-detection";
import { getCachedModels, cacheModels } from "./cache";

export interface ApiConfig {
  selectedModel: string;
  selectedProvider: string;
  customApiKey?: string;
}

const defaultConfig: ApiConfig = {
  selectedModel: "claude-3-sonnet-20240229",  // 更新为新的模型 ID
  selectedProvider: "aihub",
  customApiKey: undefined
};

// Get available providers
export const getProviders = () => providers;

// Get or detect models for a provider
export const getProviderModels = async (providerName: string = "aihub"): Promise<ModelInfo[]> => {
  const provider = providers.find(p => p.name === providerName);
  if (!provider) {
    console.error('Provider not found:', providerName);
    return [];
  }

  // Try to get cached models first
  const cached = getCachedModels(providerName);
  if (cached) return cached;

  // If no cache, detect models
  try {
    const models = await detectModels(provider.baseUrl, provider.apiKey);
    // 缓存新获取的模型数据
    cacheModels(providerName, models);
    return models;
  } catch (error) {
    console.error('Error detecting models:', error);
    return [];
  }
};

// Get provider configuration
export const getProviderConfig = (providerName: string = "aihub") => {
  const provider = providers.find(p => p.name === providerName);
  if (!provider) {
    throw new Error(`未知的服务提供商: ${providerName}`);
  }
  return provider;
};

// Get current configuration with validation
export const getApiConfig = (): ApiConfig => {
  if (typeof window === 'undefined') return defaultConfig;
  
  try {
    const savedConfig = localStorage.getItem('apiConfig');
    if (!savedConfig) return defaultConfig;

    const config = JSON.parse(savedConfig);
    
    // Validate provider
    if (!providers.find(p => p.name === config.selectedProvider)) {
      return { ...defaultConfig };
    }

    // Reset to default model if saved model doesn't exist anymore
    if (!config.selectedModel || config.selectedModel === 'claude-3-sonnet') {
      return {
        ...config,
        selectedModel: defaultConfig.selectedModel
      };
    }

    return {
      ...defaultConfig,
      ...config,
      selectedProvider: config.selectedProvider || defaultConfig.selectedProvider
    };
  } catch {
    return defaultConfig;
  }
};

// Save configuration with validation
export const setApiConfig = (config: ApiConfig): void => {
  if (typeof window === 'undefined') return;

  // Validate provider
  const provider = providers.find(p => p.name === config.selectedProvider);
  if (!provider) {
    console.error('Invalid provider:', config.selectedProvider);
    return;
  }

  // Validate model ID format
  if (!config.selectedModel || typeof config.selectedModel !== 'string') {
    console.error('Invalid model:', config.selectedModel);
    return;
  }

  const finalConfig = {
    ...config,
    selectedProvider: config.selectedProvider || defaultConfig.selectedProvider,
    selectedModel: config.selectedModel
  };

  localStorage.setItem('apiConfig', JSON.stringify(finalConfig));
  console.log('Saved config:', finalConfig);
};
