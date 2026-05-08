// 客户端数据服务层
// 替代原 server API 调用，改为纯客户端数据访问

import recipesData from '../data/recipes.json'
import {
  loadPrefs, savePrefs, loadCustomRecipes, addCustomRecipe,
  updateCustomRecipe
} from './localData.js'

import { generateWeekPlan, getCurrentPlan, regenerateDay } from './planGenerator.js'

const SUCCESS = (data) => ({ success: true, data })
const ERROR = (msg) => ({ success: false, message: msg })

function getAllRecipes() {
  const prefs = loadPrefs()
  const customs = loadCustomRecipes()
  const builtInRecipes = recipesData.recipes.map(r => enrichWithPrefs(r, prefs))
  const customRecipes = customs.map(r => enrichWithPrefs(r, prefs, true))
  return [...builtInRecipes, ...customRecipes]
}

function enrichWithPrefs(recipe, prefs, isCustom = false) {
  return {
    ...recipe,
    isFavorite: prefs.favorites.includes(recipe.id),
    isDisliked: prefs.dislikes.includes(recipe.id),
    weight: prefs.weights[recipe.id] || 1.0,
    isCustom
  }
}

// 根据 id 查找菜谱（内置 + 自定义）
function findRecipeById(id) {
  const prefs = loadPrefs()
  const builtIn = recipesData.recipes.find(r => r.id === id)
  if (builtIn) return enrichWithPrefs(builtIn, prefs)
  const customs = loadCustomRecipes()
  const custom = customs.find(r => r.id === id)
  if (custom) return enrichWithPrefs(custom, prefs, true)
  return null
}

// == 计划相关 ============================================================

export { generateWeekPlan as generatePlan, getCurrentPlan, regenerateDay }

// == 菜谱相关 ============================================================

export function getRecipes(filters = {}) {
  let recipes = getAllRecipes()
  if (filters.category) {
    recipes = recipes.filter(r => r.category === filters.category)
  }
  if (filters.season) {
    recipes = recipes.filter(r => r.season && r.season.includes(filters.season))
  }
  return SUCCESS(recipes)
}

export function getRecipe(id) {
  const recipe = findRecipeById(id)
  if (!recipe) {
    return ERROR('菜谱不存在')
  }
  return SUCCESS(recipe)
}

export function addRecipe(data) {
  if (!data.name || !data.category) {
    return ERROR('菜名和分类为必填项')
  }
  const recipe = addCustomRecipe(data)
  return SUCCESS(recipe)
}

export function updateRecipe(id, data) {
  const prefs = loadPrefs()
  const isCustom = prefs.customRecipes.includes(id)
  if (isCustom) {
    const updated = updateCustomRecipe(id, data)
    if (!updated) return ERROR('菜谱不存在')
    return SUCCESS(updated)
  }
  // 内置菜谱：将覆盖字段保存到 customRecipes 中
  const existing = findRecipeById(id)
  if (!existing) return ERROR('菜谱不存在')
  const merged = { ...existing, ...data, id }
  const saved = addCustomRecipe(merged)
  return SUCCESS(saved)
}

// == 用户偏好 ============================================================

export function favoriteRecipe(id) {
  const prefs = loadPrefs()
  if (!prefs.favorites.includes(id)) {
    prefs.favorites.push(id)
    prefs.weights[id] = 2.0
  }
  prefs.dislikes = prefs.dislikes.filter(d => d !== id)
  if (prefs.weights[id] === 0) prefs.weights[id] = 2.0
  savePrefs(prefs)
  return SUCCESS(prefs)
}

export function dislikeRecipe(id) {
  const prefs = loadPrefs()
  if (!prefs.dislikes.includes(id)) {
    prefs.dislikes.push(id)
    prefs.weights[id] = 0
  }
  prefs.favorites = prefs.favorites.filter(f => f !== id)
  savePrefs(prefs)
  return SUCCESS(prefs)
}

export function unfavoriteRecipe(id) {
  const prefs = loadPrefs()
  prefs.favorites = prefs.favorites.filter(f => f !== id)
  if (prefs.weights[id] === 2.0) {
    delete prefs.weights[id]
  }
  savePrefs(prefs)
  return SUCCESS(prefs)
}

export function undislikeRecipe(id) {
  const prefs = loadPrefs()
  prefs.dislikes = prefs.dislikes.filter(d => d !== id)
  if (prefs.weights[id] === 0) {
    delete prefs.weights[id]
  }
  savePrefs(prefs)
  return SUCCESS(prefs)
}

export function getCategories() {
  return SUCCESS(recipesData.categories)
}
