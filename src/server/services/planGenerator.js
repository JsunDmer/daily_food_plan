import fs from 'fs/promises'
import path from 'path'
import config from '../config/index.js'
import { readRecipes, readPrefs } from './recipeManager.js'

const PLANS_PATH = path.join(config.dataDir, 'plans.json')

const DINGDONG_BASE = 'https://www.100.me/'

// 每日餐食结构：早餐3样 + 晚餐4菜
const MEAL_STRUCTURE = {
  breakfast: [
    { category: 'breakfast_staple', count: 1, label: '主食' },
    { category: 'breakfast_side', count: 1, label: '副食' },
    { category: 'breakfast_drink', count: 1, label: '饮品' }
  ],
  dinner: [
    { category: 'dinner_meat', count: 1, label: '荤菜' },
    { category: 'dinner_veg', count: 2, label: '素菜' },
    { category: 'dinner_soup', count: 1, label: '汤' }
  ]
}

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// 获取当前月份对应的季节
function getCurrentSeason() {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

// 为食材生成叮咚买菜搜索链接
function getDingdongUrl(ingredientName) {
  return `${DINGDONG_BASE}${encodeURIComponent(ingredientName)}`
}

// 多维度加权随机选择
function weightedRandomSelect(candidates, usedIds, season, nutritionBalance) {
  // 计算每个候选菜品的得分
  const scored = candidates.map(recipe => {
    let score = Math.random() * 0.5 + 0.5 // 基础随机分 [0.5, 1.0]

    // 喜好权重
    const weight = recipe._weight || 1.0
    if (weight === 0) return { recipe, score: 0 } // 不喜欢的直接排除
    score *= weight

    // 季节系数
    if (recipe.season && recipe.season.length < 4) {
      if (recipe.season.includes(season)) {
        score *= 1.2 // 当季菜加分
      } else {
        score *= 0.6 // 反季菜降分
      }
    }

    // 营养均衡系数
    if (recipe.nutrition && nutritionBalance) {
      const fatCount = nutritionBalance.fat || 0
      const proteinCount = nutritionBalance.protein || 0
      if (recipe.nutrition.fat === 'high' && fatCount > 2) {
        score *= 0.5 // 已选太多高脂菜，降低该类系数
      }
      if (recipe.nutrition.protein === 'high' && proteinCount > 3) {
        score *= 0.7
      }
    }

    // 去重惩罚
    if (usedIds.has(recipe.id)) {
      score *= 0.1
    }

    return { recipe, score }
  })

  // 过滤掉得分为 0 的（不喜欢的）
  const valid = scored.filter(s => s.score > 0)
  if (valid.length === 0) {
    // 如果全部被排除，从原始候选中随机选一个
    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  // 按得分排序，取前几名中随机选（加入一定随机性）
  valid.sort((a, b) => b.score - a.score)
  const topN = Math.min(3, valid.length)
  const pick = Math.floor(Math.random() * topN)
  return valid[pick].recipe
}

// 生成一天的计划
function generateDayPlan(allRecipes, prefs, season, usedIds, nutritionBalance) {
  const dayPlan = { breakfast: [], dinner: [] }

  for (const mealType of ['breakfast', 'dinner']) {
    for (const slot of MEAL_STRUCTURE[mealType]) {
      // 获取该分类下所有菜品，排除不喜欢的
      const candidates = allRecipes.filter(r => {
        if (r.category !== slot.category) return false
        if (prefs.weights[r.id] === 0) return false
        return true
      })

      for (let i = 0; i < slot.count; i++) {
        if (candidates.length === 0) continue
        const selected = weightedRandomSelect(candidates, usedIds, season, nutritionBalance)
        usedIds.add(selected.id)

        // 更新营养均衡计数
        if (selected.nutrition) {
          nutritionBalance[selected.nutrition.fat] = (nutritionBalance[selected.nutrition.fat] || 0) + 1
          nutritionBalance[selected.nutrition.protein] = (nutritionBalance[selected.nutrition.protein] || 0) + 1
        }

        dayPlan[mealType].push({
          ...selected,
          _weight: undefined,
          ingredients: selected.ingredients.map(ing => ({
            ...ing,
            dingdongUrl: getDingdongUrl(ing.name)
          }))
        })
      }
    }
  }

  return dayPlan
}

// 生成一周计划
export async function generateWeekPlan() {
  const data = await readRecipes()
  const prefs = await readPrefs()
  const season = getCurrentSeason()

  // 为每个菜谱附上用户权重
  const allRecipes = data.recipes.map(r => ({
    ...r,
    _weight: prefs.weights[r.id] || 1.0
  }))

  const usedIds = new Set()
  const nutritionBalance = {}
  const weekPlan = []

  for (let i = 0; i < 7; i++) {
    const dayPlan = generateDayPlan(allRecipes, prefs, season, usedIds, nutritionBalance)
    weekPlan.push({
      day: WEEKDAYS[i],
      dayIndex: i,
      ...dayPlan
    })
  }

  // 汇总采购清单
  const shoppingList = buildShoppingList(weekPlan)

  const plan = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    season,
    days: weekPlan,
    shoppingList
  }

  // 保存当前计划
  await fs.writeFile(PLANS_PATH, JSON.stringify({ current: plan }, null, 2), 'utf-8')
  return plan
}

// 重新生成单日计划
export async function regenerateDay(dayIndex) {
  const plansData = JSON.parse(await fs.readFile(PLANS_PATH, 'utf-8'))
  if (!plansData.current) {
    throw new Error('没有当前计划，请先生成一周计划')
  }

  const data = await readRecipes()
  const prefs = await readPrefs()
  const season = getCurrentSeason()

  const allRecipes = data.recipes.map(r => ({
    ...r,
    _weight: prefs.weights[r.id] || 1.0
  }))

  // 收集本周其他天已用的菜品 ID
  const usedIds = new Set()
  plansData.current.days.forEach((day, idx) => {
    if (idx !== dayIndex) {
      day.breakfast.forEach(d => usedIds.add(d.id))
      day.dinner.forEach(d => usedIds.add(d.id))
    }
  })

  const nutritionBalance = {}
  const newDayPlan = generateDayPlan(allRecipes, prefs, season, usedIds, nutritionBalance)

  plansData.current.days[dayIndex] = {
    day: WEEKDAYS[dayIndex],
    dayIndex,
    ...newDayPlan
  }

  // 重新汇总采购清单
  plansData.current.shoppingList = buildShoppingList(plansData.current.days)

  await fs.writeFile(PLANS_PATH, JSON.stringify(plansData, null, 2), 'utf-8')
  return plansData.current
}

// 获取当前计划
export async function getCurrentPlan() {
  const data = JSON.parse(await fs.readFile(PLANS_PATH, 'utf-8'))
  return data.current
}

// 汇总采购清单（按天分组）
function buildShoppingList(weekDays) {
  const result = []

  for (const day of weekDays) {
    const dayIngredients = []
    const allMeals = [...day.breakfast, ...day.dinner]

    for (const dish of allMeals) {
      for (const ing of dish.ingredients) {
        dayIngredients.push({
          name: ing.name,
          amount: ing.amount,
          dishName: dish.name,
          dingdongUrl: getDingdongUrl(ing.name)
        })
      }
    }

    result.push({
      day: day.day,
      dayIndex: day.dayIndex,
      ingredients: dayIngredients
    })
  }

  return result
}
