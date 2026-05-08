import { Router } from 'express'
import { generateWeekPlan, getCurrentPlan, regenerateDay } from '../services/planGenerator.js'

const router = Router()

// 生成一周计划
router.post('/generate', async (req, res) => {
  try {
    const plan = await generateWeekPlan()
    res.json({ success: true, data: plan })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 获取当前计划
router.get('/current', async (req, res) => {
  try {
    const plan = await getCurrentPlan()
    if (!plan) {
      return res.json({ success: true, data: null })
    }
    res.json({ success: true, data: plan })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 重新生成某一天的计划
router.post('/regenerate-day', async (req, res) => {
  try {
    const { dayIndex } = req.body
    if (dayIndex === undefined || dayIndex < 0 || dayIndex > 6) {
      return res.status(400).json({ success: false, message: 'dayIndex 必须是 0-6 的整数' })
    }
    const plan = await regenerateDay(dayIndex)
    res.json({ success: true, data: plan })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
