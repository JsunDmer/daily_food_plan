import fs from 'fs/promises'
import path from 'path'
import config from '../config/index.js'

const RECIPES_PATH = path.join(config.dataDir, 'recipes.json')
const PREFS_PATH = path.join(config.dataDir, 'userPrefs.json')

// 读取菜谱库
export async function readRecipes() {
  const data = await fs.readFile(RECIPES_PATH, 'utf-8')
  return JSON.parse(data)
}

// 写入菜谱库
async function writeRecipes(data) {
  await fs.writeFile(RECIPES_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

// 读取用户喜好
export async function readPrefs() {
  const data = await fs.readFile(PREFS_PATH, 'utf-8')
  return JSON.parse(data)
}

// 写入用户喜好
export async function writePrefs(data) {
  await fs.writeFile(PREFS_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

// 获取所有菜谱（支持分类筛选）
export async function getRecipes(filters = {}) {
  const data = await readRecipes()
  let recipes = data.recipes
  if (filters.category) {
    recipes = recipes.filter(r => r.category === filters.category)
  }
  if (filters.season) {
    recipes = recipes.filter(r => r.season.includes(filters.season))
  }
  const prefs = await readPrefs()
  return recipes.map(r => ({
    ...r,
    isFavorite: prefs.favorites.includes(r.id),
    isDisliked: prefs.dislikes.includes(r.id),
    weight: prefs.weights[r.id] || 1.0
  }))
}

// 获取单个菜谱
export async function getRecipeById(id) {
  const data = await readRecipes()
  const recipe = data.recipes.find(r => r.id === id)
  if (!recipe) return null
  const prefs = await readPrefs()
  return {
    ...recipe,
    isFavorite: prefs.favorites.includes(id),
    isDisliked: prefs.dislikes.includes(id),
    weight: prefs.weights[id] || 1.0
  }
}

// 添加自定义菜谱
export async function addRecipe(recipeData) {
  const data = await readRecipes()
  const prefs = await readPrefs()
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
  data.recipes.push(recipe)
  await writeRecipes(data)
  prefs.customRecipes.push(id)
  await writePrefs(prefs)
  return recipe
}

// 修改菜谱
export async function updateRecipe(id, recipeData) {
  const data = await readRecipes()
  const idx = data.recipes.findIndex(r => r.id === id)
  if (idx === -1) return null
  data.recipes[idx] = { ...data.recipes[idx], ...recipeData, id }
  await writeRecipes(data)
  return data.recipes[idx]
}

// 标记喜欢
export async function favoriteRecipe(id) {
  const prefs = await readPrefs()
  if (!prefs.favorites.includes(id)) {
    prefs.favorites.push(id)
    prefs.weights[id] = 2.0
  }
  // 从不喜欢列表移除
  prefs.dislikes = prefs.dislikes.filter(d => d !== id)
  if (prefs.weights[id] === 0) prefs.weights[id] = 2.0
  await writePrefs(prefs)
  return prefs
}

// 标记不喜欢
export async function dislikeRecipe(id) {
  const prefs = await readPrefs()
  if (!prefs.dislikes.includes(id)) {
    prefs.dislikes.push(id)
    prefs.weights[id] = 0
  }
  // 从喜欢列表移除
  prefs.favorites = prefs.favorites.filter(f => f !== id)
  await writePrefs(prefs)
  return prefs
}

// 取消喜欢
export async function unfavoriteRecipe(id) {
  const prefs = await readPrefs()
  prefs.favorites = prefs.favorites.filter(f => f !== id)
  if (prefs.weights[id] === 2.0) {
    delete prefs.weights[id]
  }
  await writePrefs(prefs)
  return prefs
}

// 取消不喜欢
export async function undislikeRecipe(id) {
  const prefs = await readPrefs()
  prefs.dislikes = prefs.dislikes.filter(d => d !== id)
  if (prefs.weights[id] === 0) {
    delete prefs.weights[id]
  }
  await writePrefs(prefs)
  return prefs
}

// 获取用户喜好
export async function getPrefs() {
  return readPrefs()
}

// 获取分类定义
export async function getCategories() {
  const data = await readRecipes()
  return data.categories
}
