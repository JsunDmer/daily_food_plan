// 客户端计划生成器（移植自 server/services/planGenerator.js）
// 使用 localStorage 替代服务端文件 IO

import recipesData from '../data/recipes.json'
import { loadPrefs, savePlan, loadPlan } from './localData.js'

const DINGDONG_BASE = 'https://www.100.me/'

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

function getCurrentSeason() {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

function getDingdongUrl(ingredientName) {
  return `${DINGDONG_BASE}${encodeURIComponent(ingredientName)}`
}

function weightedRandomSelect(candidates, usedIds, season, nutritionBalance) {
  const scored = candidates.map(recipe => {
    let score = Math.random() * 0.5 + 0.5
    const weight = recipe._weight || 1.0
    if (weight === 0) return { recipe, score: 0 }
    score *= weight
    if (recipe.season && recipe.season.length < 4) {
      if (recipe.season.includes(season)) {
        score *= 1.2
      } else {
        score *= 0.6
      }
    }
    if (recipe.nutrition && nutritionBalance) {
      const fatCount = nutritionBalance.fat || 0
      const proteinCount = nutritionBalance.protein || 0
      if (recipe.nutrition.fat === 'high' && fatCount > 2) {
        score *= 0.5
      }
      if (recipe.nutrition.protein === 'high' && proteinCount > 3) {
        score *= 0.7
      }
    }
    if (usedIds.has(recipe.id)) {
      score *= 0.1
    }
    return { recipe, score }
  })

  const valid = scored.filter(s => s.score > 0)
  if (valid.length === 0) {
    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  valid.sort((a, b) => b.score - a.score)
  const topN = Math.min(3, valid.length)
  const pick = Math.floor(Math.random() * topN)
  return valid[pick].recipe
}

function generateDayPlan(allRecipes, prefs, season, usedIds, nutritionBalance) {
  const dayPlan = { breakfast: [], dinner: [] }

  for (const mealType of ['breakfast', 'dinner']) {
    for (const slot of MEAL_STRUCTURE[mealType]) {
      const candidates = allRecipes.filter(r => {
        if (r.category !== slot.category) return false
        if (prefs.weights[r.id] === 0) return false
        return true
      })

      for (let i = 0; i < slot.count; i++) {
        if (candidates.length === 0) continue
        const selected = weightedRandomSelect(candidates, usedIds, season, nutritionBalance)
        usedIds.add(selected.id)

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

export function generateWeekPlan() {
  const prefs = loadPrefs()
  const season = getCurrentSeason()

  const allRecipes = recipesData.recipes.map(r => ({
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

  const shoppingList = buildShoppingList(weekPlan)

  const plan = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    season,
    days: weekPlan,
    shoppingList
  }

  savePlan(plan)
  return plan
}

export function regenerateDay(dayIndex) {
  const currentPlan = loadPlan()
  if (!currentPlan) {
    throw new Error('没有当前计划，请先生成一周计划')
  }

  const prefs = loadPrefs()
  const season = getCurrentSeason()

  const allRecipes = recipesData.recipes.map(r => ({
    ...r,
    _weight: prefs.weights[r.id] || 1.0
  }))

  const usedIds = new Set()
  currentPlan.days.forEach((day, idx) => {
    if (idx !== dayIndex) {
      day.breakfast.forEach(d => usedIds.add(d.id))
      day.dinner.forEach(d => usedIds.add(d.id))
    }
  })

  const nutritionBalance = {}
  const newDayPlan = generateDayPlan(allRecipes, prefs, season, usedIds, nutritionBalance)

  currentPlan.days[dayIndex] = {
    day: WEEKDAYS[dayIndex],
    dayIndex,
    ...newDayPlan
  }

  currentPlan.shoppingList = buildShoppingList(currentPlan.days)
  savePlan(currentPlan)
  return currentPlan
}

export function getCurrentPlan() {
  return loadPlan()
}
