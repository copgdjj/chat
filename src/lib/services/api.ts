import { getApiConfig, getProviderConfig } from "../config/api";
import { ModelInfo } from "./model-detection";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

interface ApiError extends Error {
  name: string;
  message: string;
  status?: number;
  code?: string;
}

interface ModelConfig {
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// 基于模型特征获取配置
function getModelConfig(modelId: string): ModelConfig {
  const defaultConfig: ModelConfig = {
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9
  };

  const id = modelId.toLowerCase();

  if (id.includes('claude-3')) {
    return {
      ...defaultConfig,
      maxTokens: 4096,
      temperature: 0.7
    };
  }

  if (id.includes('gpt-4')) {
    return {
      ...defaultConfig,
      maxTokens: 4096,
      temperature: 0.7,
      frequencyPenalty: 0,
      presencePenalty: 0
    };
  }

  if (id.includes('gemini')) {
    return {
      ...defaultConfig,
      maxTokens: 8192,
      temperature: 0.7
    };
  }

  if (id.includes('32k')) {
    return { ...defaultConfig, maxTokens: 32768 };
  }

  if (id.includes('16k')) {
    return { ...defaultConfig, maxTokens: 16384 };
  }

  if (id.includes('128k')) {
    return { ...defaultConfig, maxTokens: 128000 };
  }

  return defaultConfig;
}

export async function sendChatMessage(message: string, history: ChatMessage[] = []): Promise<string> {
  const config = getApiConfig();
  
  try {
    if (!config.selectedProvider) {
      throw new Error("未选择服务提供商");
    }

    const provider = getProviderConfig(config.selectedProvider);
    const apiKey = config.customApiKey || provider.apiKey;

    // Validate config
    if (!apiKey) {
      throw new Error("API 配置不完整，请检查 API Key。");
    }

    if (!config.selectedModel) {
      throw new Error("未选择模型，请先在配置中选择要使用的模型。");
    }

    // Get model settings based on model ID
    const modelConfig = getModelConfig(config.selectedModel);

    // Debug logging for configuration
    console.log('API Config:', { 
      provider: provider.name,
      baseUrl: provider.baseUrl,
      model: config.selectedModel,
      settings: modelConfig,
      historyLength: history.length,
      hasCustomKey: !!config.customApiKey
    });

    // Create messages array with history
    const messages = [
      ...history,
      { role: "user" as const, content: message }
    ];

    const url = `${provider.baseUrl}/chat/completions`;
    const payload = {
      model: config.selectedModel,
      messages: messages,
      temperature: modelConfig.temperature,
      top_p: modelConfig.topP,
      max_tokens: modelConfig.maxTokens,
      frequency_penalty: modelConfig.frequencyPenalty,
      presence_penalty: modelConfig.presencePenalty,
      stream: false,
      stop: null
    };

    // Debug logging for request
    console.log('Request URL:', url);
    console.log('Request payload:', {
      model: payload.model,
      messagesCount: messages.length,
      settings: {
        temperature: payload.temperature,
        max_tokens: payload.max_tokens,
        top_p: payload.top_p
      },
      lastMessage: messages[messages.length - 1].content.slice(0, 50) + "..."
    });

    // Make API request with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://aihubmix.com",
          "X-Title": "AIHub API"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      // Log response status and headers
      console.log('Response status:', response.status);
      console.log('Response headers:', {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });

      if (!response.ok) {
        let errorMessage: string;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || "API 请求失败";
          console.log('Error response:', errorData);
        } catch (e) {
          errorMessage = `请求失败，状态码 ${response.status}`;
          console.log('Failed to parse error response:', e);
        }

        if (response.status === 401) {
          throw new Error("API Key 无效或已过期，请检查配置。");
        } else if (response.status === 404) {
          throw new Error("API 端点未找到，请检查 URL。");
        } else if (response.status === 429) {
          throw new Error("请求过于频繁，请稍后再试。");
        }

        throw new Error(`API 错误 (${response.status}): ${errorMessage}`);
      }

      const data = await response.json();
      
      if (!data || typeof data !== 'object') {
        throw new Error("API 响应格式无效");
      }

      console.log('Success response:', {
        model: data.model,
        choices: data.choices?.length,
        usage: data.usage,
        firstMessagePreview: data.choices?.[0]?.message?.content?.slice(0, 50) + "..."
      });

      const content = data.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        console.log('Invalid content in response:', data);
        throw new Error("API 响应中没有有效的内容");
      }

      return content;

    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("请求超时，请稍后重试");
      }
      throw error;
    }

  } catch (error: unknown) {
    // Enhanced error logging
    console.error("API Error:", {
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : "未知错误",
      stack: error instanceof Error ? error.stack : undefined,
      status: (error as ApiError).status,
      config: {
        provider: config.selectedProvider,
        model: config.selectedModel,
        hasCustomKey: !!config.customApiKey
      }
    });
    
    if (error instanceof Error) {
      throw new Error(`API 错误: ${error.message}`);
    }
    throw new Error("调用 API 时发生意外错误");
  }
}
