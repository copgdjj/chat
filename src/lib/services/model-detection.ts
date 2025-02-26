export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
}

export async function detectModels(baseUrl: string, apiKey: string): Promise<ModelInfo[]> {
  try {
    console.log('Detecting models...', { baseUrl });

    // Fetch available models
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.warn(`Failed to fetch models (${response.status})`);
      throw new Error(`Models API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw models response:', data);

    // Extract and process models
    const modelList = data.data || [];
    // Use a Map to ensure unique model IDs
    const modelMap = new Map();
    modelList
      .filter((model: any) => (
        model?.id && 
        typeof model.id === 'string' && 
        !model.id.includes('instruct') &&  // 过滤掉 instruct 模型
        !model.id.includes('-beta') &&     // 过滤掉测试版模型
        (
          model.id.includes('gpt') ||
          model.id.includes('claude') ||
          model.id.includes('gemini') ||
          model.id.includes('llama') ||
          model.id.includes('mistral') ||
          model.id.includes('palm') ||
          model.id.includes('deepseek') ||
          model.id.includes('moonshot') ||
          model.id.includes('qwen') ||
          model.id.includes('zhipu') ||
          model.id.includes('Yi') ||
          model.id.includes('sparkdesk') ||
          model.id.includes('glm') ||
          model.id.includes('dall-e') ||
          model.id.includes('stable')
        )
      ))
      .forEach((model: any) => {
        const id = model.id;
        if (!modelMap.has(id)) {  // 只处理未出现过的模型ID
          // 生成更友好的显示名称
          const name = id.split('-')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
            .replace(/V(\d+)/i, 'V$1')  // 修复版本号格式
            .replace(/(\d+k)/i, '$1');  // 修复容量单位格式

          modelMap.set(id, {
            id: id,
            name: name,
            description: model.description || getModelDescription(id)
          });
        }
      });

    const models = Array.from(modelMap.values());

    // Sort models by priority
    models.sort((a, b) => {
      const priorityA = getModelPriority(a.id);
      const priorityB = getModelPriority(b.id);
      return priorityB - priorityA;
    });

    console.log('Detected models:', models);
    return models;

  } catch (error) {
    console.error('Error detecting models:', error);
    throw error;
  }
}

// 获取模型优先级，用于排序
function getModelPriority(modelId: string): number {
  const id = modelId.toLowerCase();
  if (id.includes('claude-3')) return 100;
  if (id.includes('gpt-4')) return 90;
  if (id.includes('gemini')) return 85;
  if (id.includes('claude-2')) return 80;
  if (id.includes('gpt-3.5')) return 75;
  if (id.includes('deepseek')) return 70;
  if (id.includes('moonshot')) return 65;
  if (id.includes('llama')) return 60;
  if (id.includes('mistral')) return 55;
  if (id.includes('qwen')) return 50;
  return 0;
}

// 获取模型描述
function getModelDescription(modelId: string): string {
  const id = modelId.toLowerCase();
  if (id.includes('claude-3')) return 'Anthropic Claude 3 - 最新的高性能模型';
  if (id.includes('gpt-4')) return 'OpenAI GPT-4 - 强大的大语言模型';
  if (id.includes('gemini')) return 'Google Gemini - 新一代 AI 模型';
  if (id.includes('dall-e')) return 'OpenAI DALL-E - 图像生成模型';
  if (id.includes('stable')) return 'Stable Diffusion - 开源图像生成模型';
  if (id.includes('whisper')) return 'OpenAI Whisper - 语音识别模型';
  if (id.includes('tts')) return '文本转语音模型';
  return '通用 AI 模型';
}

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
}

export const providers: ProviderConfig[] = [
  {
    name: "aihub",
    baseUrl: "https://aihubmix.com/v1",
    apiKey: process.env.AIHUB_API_KEY || ""
  },
  {
    name: "deepseek",
    baseUrl: "https://api.deepseek.com/v1",
    apiKey: process.env.DEEPSEEK_API_KEY || ""
  },
  {
    name: "moonshot",
    baseUrl: "https://api.moonshot.cn/v1",
    apiKey: process.env.MOONSHOT_API_KEY || ""
  },
  {
    name: "zhipu",
    baseUrl: "https://open.bigmodel.cn/api/paas/v3",
    apiKey: process.env.ZHIPU_API_KEY || ""
  }
];
