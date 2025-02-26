"use client";

import { useState, useEffect } from "react";
import { getApiConfig, setApiConfig, ApiConfig, getProviders, getProviderConfig, getProviderModels } from "@/lib/config/api";
import { ModelInfo } from "@/lib/services/model-detection";
import { getCachedModels } from "@/lib/config/cache";
import { cn } from "@/lib/utils/cn";

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiConfigModal({ isOpen, onClose }: ApiConfigModalProps) {
  const [config, setConfig] = useState<ApiConfig>(getApiConfig());
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const providers = getProviders();

  // 加载当前提供商的模型列表
  const loadModels = async (providerName: string, forceUpdate: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      // 先尝试获取缓存的模型列表
      const cachedModels = getCachedModels(providerName);
      if (!forceUpdate && cachedModels && cachedModels.length > 0) {
        setModels(cachedModels);
        // 检查当前选择的模型是否在列表中
        if (!cachedModels.find((m: ModelInfo) => m.id === config.selectedModel)) {
          setConfig(prev => ({
            ...prev,
            selectedModel: cachedModels[0].id
          }));
        }
      } else {
        // 如果没有缓存或强制更新，则从API获取
        const models = await getProviderModels(providerName);
        setModels(models);
        if (models.length > 0 && !models.find((m: ModelInfo) => m.id === config.selectedModel)) {
          setConfig(prev => ({
            ...prev,
            selectedModel: models[0].id
          }));
        }
      }
    } catch (error) {
      console.error('Error loading models:', error);
      setError(error instanceof Error ? error.message : "加载模型列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 手动刷新模型列表
  const handleRefreshModels = () => {
    if (config.selectedProvider) {
      loadModels(config.selectedProvider, true);
    }
  };

  // 当提供商改变时加载模型列表
  useEffect(() => {
    if (config.selectedProvider) {
      loadModels(config.selectedProvider, false);
    }
  }, [config.selectedProvider]);

  // 当配置对话框打开时检查模型列表
  useEffect(() => {
    if (isOpen && config.selectedProvider) {
      loadModels(config.selectedProvider, false);
    }
  }, [isOpen]);

  const handleProviderChange = (provider: string) => {
    setConfig(prev => ({
      ...prev,
      selectedProvider: provider,
      customApiKey: undefined // 清除自定义 API Key
    }));
  };

  const handleSave = () => {
    if (!config.selectedModel || !config.selectedProvider) {
      setError("请选择服务提供商和模型");
      return;
    }
    setApiConfig(config);
    onClose();
  };

  const currentProvider = config.selectedProvider ? getProviderConfig(config.selectedProvider) : undefined;
  const selectedModel = models.find((m: ModelInfo) => m.id === config.selectedModel);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">AI 模型配置</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              服务提供商
            </label>
            <select
              value={config.selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white bg-white dark:bg-gray-900"
            >
              {providers.map((provider) => (
                <option key={provider.name} value={provider.name}>
                  {provider.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                可用模型
              </label>
              <button
                onClick={handleRefreshModels}
                disabled={loading}
                className={cn(
                  "text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {loading ? "更新中..." : "更新列表"}
              </button>
            </div>
            <select
              value={config.selectedModel}
              onChange={(e) => setConfig(prev => ({ ...prev, selectedModel: e.target.value }))}
              disabled={loading}
              className={cn(
                "w-full rounded-lg border px-4 py-2 bg-white dark:bg-gray-900",
                "border-gray-300 dark:border-gray-700 dark:text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <option value="">加载中...</option>
              ) : models.length > 0 ? (
                models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))
              ) : (
                <option value="">暂无可用模型</option>
              )}
            </select>
            {loading && (
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                正在检测可用模型...
              </div>
            )}
            {error && (
              <div className="mt-1 text-sm text-red-500 flex justify-between items-center">
                <span>{error}</span>
                <button
                  onClick={() => loadModels(config.selectedProvider)}
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400"
                >
                  重试
                </button>
              </div>
            )}
            {selectedModel?.description && (
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {selectedModel.description}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              自定义 API Key (可选)
            </label>
            <input
              type="text"
              value={config.customApiKey || ""}
              onChange={(e) => setConfig(prev => ({ ...prev, customApiKey: e.target.value || undefined }))}
              placeholder={currentProvider?.apiKey}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          {currentProvider && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 space-y-1">
              <div>Base URL: {currentProvider.baseUrl}</div>
              {loading && <div>检测中...</div>}
              {!loading && models.length > 0 && (
                <div>可用模型数: {models.length}</div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !config.selectedModel}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white rounded-lg",
              "bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
