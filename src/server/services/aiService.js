import config from '../config/index.js'

// AI 服务 - 用于搭配优化和种子数据生成（可选功能）
// 当 AI API key 未配置时，回退到本地算法

export async function optimizeWithAI(weekPlan) {
  if (!config.ai.apiKey) {
    return weekPlan
  }

  // AI 搭配优化：调用 LLM 分析一周计划的营养搭配、口味多样性
  // 暂未实现，后续可扩展
  return weekPlan
}

export async function generateSeedRecipes(category, count) {
  if (!config.ai.apiKey) {
    throw new Error('请配置 AI_API_KEY 以使用 AI 生成菜谱功能')
  }

  // AI 生成菜谱：调用 LLM 生成指定分类的菜谱数据
  // 暂未实现，后续可扩展
  throw new Error('AI 生成菜谱功能开发中')
}
