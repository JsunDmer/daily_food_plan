// 客户端本地数据持久化（localStorage 替代服务端文件 IO）
// 提供与 server/services/recipeManager.js 等效的数据接口

const PREFS_KEY = 'daily_food_plan_prefs'
const PLAN_KEY = 'daily_food_plan_current'
const CUSTOM_RECIPES_KEY = 'daily_food_plan_custom_recipes'
const PLANS_KEY = 'daily_food_plan_plans'

const DEFAULT_PREFS = {
  favorites: [],
  dislikes: [],
  customRecipes: [],
  weights: {}
}

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

// == 用户偏好 ==============================================================

export function loadPrefs() {
  const raw = localStorage.getItem(PREFS_KEY)
  if (!raw) {
    savePrefs(DEFAULT_PREFS)
    return { ...DEFAULT_PREFS }
  }
  return { ...DEFAULT_PREFS, ...safeJsonParse(raw, DEFAULT_PREFS) }
}

export function savePrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

// == 计划 ==================================================================

export function loadPlan() {
  const raw = localStorage.getItem(PLAN_KEY)
  if (!raw) return null
  return safeJsonParse(raw, null)
}

export function savePlan(plan) {
  if (plan) {
    localStorage.setItem(PLAN_KEY, JSON.stringify(plan))
  } else {
    localStorage.removeItem(PLAN_KEY)
  }
}

// == 自定义菜谱 ============================================================

export function loadCustomRecipes() {
  const raw = localStorage.getItem(CUSTOM_RECIPES_KEY)
  if (!raw) return []
  return safeJsonParse(raw, [])
}

export function saveCustomRecipes(recipes) {
  localStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(recipes))
}

export function addCustomRecipe(recipeData) {
  const recipes = loadCustomRecipes()
  const id = `c${String(Date.now()).slice(-6)}`
  const recipe = {
    id,
    name: recipeData.name,
    category: recipeData.category,
    tags: recipeData.tags || [],
    season: recipeData.season || ['spring', 'summer', 'autumn', 'winter'],
    ingredients: recipeData.ingredients || [],
    nutrition: recipeData.nutrition || { calories: 0, protein: 'medium', fat: 'medium' },
    cost: recipeData.cost || 'medium',
    description: recipeData.description || ''
  }
  recipes.push(recipe)
  saveCustomRecipes(recipes)

  const prefs = loadPrefs()
  if (!prefs.customRecipes.includes(id)) {
    prefs.customRecipes.push(id)
    savePrefs(prefs)
  }

  return recipe
}

export function updateCustomRecipe(id, data) {
  const recipes = loadCustomRecipes()
  const idx = recipes.findIndex(r => r.id === id)
  if (idx === -1) return null
  recipes[idx] = { ...recipes[idx], ...data, id }
  saveCustomRecipes(recipes)
  return recipes[idx]
}

// == 多周计划存储 (周导航) ==================================================

function loadAllPlans() {
  const raw = localStorage.getItem(PLANS_KEY)
  if (!raw) return {}
  return safeJsonParse(raw, {})
}

function saveAllPlans(plans) {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans))
}

export function loadPlanByWeek(weekKey) {
  const plans = loadAllPlans()
  return plans[weekKey] || null
}

export function savePlanByWeek(weekKey, plan) {
  const plans = loadAllPlans()
  plans[weekKey] = plan
  saveAllPlans(plans)
}

export function removePlanByWeek(weekKey) {
  const plans = loadAllPlans()
  delete plans[weekKey]
  saveAllPlans(plans)
}

export function getAllWeekKeys() {
  const plans = loadAllPlans()
  return Object.keys(plans).sort()
}
