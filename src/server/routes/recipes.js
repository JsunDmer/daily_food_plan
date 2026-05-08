import { Router } from 'express'
import {
  getRecipes, getRecipeById, addRecipe, updateRecipe,
  favoriteRecipe, dislikeRecipe, unfavoriteRecipe, undislikeRecipe,
  getCategories
} from '../services/recipeManager.js'

const router = Router()

// 获取菜谱列表（支持分类筛选）
router.get('/', async (req, res) => {
  try {
    const { category, season } = req.query
    const recipes = await getRecipes({ category, season })
    res.json({ success: true, data: recipes })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 获取分类定义
router.get('/categories', async (req, res) => {
  try {
    const categories = await getCategories()
    res.json({ success: true, data: categories })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 获取单个菜谱
router.get('/:id', async (req, res) => {
  try {
    const recipe = await getRecipeById(req.params.id)
    if (!recipe) {
      return res.status(404).json({ success: false, message: '菜谱不存在' })
    }
    res.json({ success: true, data: recipe })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 添加自定义菜谱
router.post('/', async (req, res) => {
  try {
    const { name, category } = req.body
    if (!name || !category) {
      return res.status(400).json({ success: false, message: '菜名和分类为必填项' })
    }
    const recipe = await addRecipe(req.body)
    res.json({ success: true, data: recipe })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 修改菜谱
router.put('/:id', async (req, res) => {
  try {
    const recipe = await updateRecipe(req.params.id, req.body)
    if (!recipe) {
      return res.status(404).json({ success: false, message: '菜谱不存在' })
    }
    res.json({ success: true, data: recipe })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 标记喜欢
router.post('/:id/favorite', async (req, res) => {
  try {
    const prefs = await favoriteRecipe(req.params.id)
    res.json({ success: true, data: prefs })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 标记不喜欢
router.post('/:id/dislike', async (req, res) => {
  try {
    const prefs = await dislikeRecipe(req.params.id)
    res.json({ success: true, data: prefs })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 取消喜欢
router.delete('/:id/favorite', async (req, res) => {
  try {
    const prefs = await unfavoriteRecipe(req.params.id)
    res.json({ success: true, data: prefs })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 取消不喜欢
router.delete('/:id/dislike', async (req, res) => {
  try {
    const prefs = await undislikeRecipe(req.params.id)
    res.json({ success: true, data: prefs })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
