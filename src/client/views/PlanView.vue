<template>
  <div class="plan-view">
    <WeekNavigator :weekKey="currentWeek" @change="handleWeekChange" />
    <GenerateBar @generate="handleGenerate" @regenerate-all="handleRegenerateAll" :loading="loading" :has-plan="!!plan" />
    <WeeklyPlan :days="plan?.days || []" :currentWeek="currentWeek" @regenerate-day="handleRegenerateDay" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import WeeklyPlan from '../components/WeeklyPlan.vue'
import GenerateBar from '../components/GenerateBar.vue'
import WeekNavigator from '../components/WeekNavigator.vue'
import { generatePlan, getCurrentPlan, regenerateDay } from '../services/index.js'
import { getCurrentWeekKey } from '../services/dateUtils.js'

const plan = ref(null)
const loading = ref(false)
const currentWeek = ref(getCurrentWeekKey())

function getErrorMessage(err, fallback = '请稍后重试') {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err) return err
  return fallback
}

function ensureServiceData(res, fallbackMessage) {
  if (!res?.success) {
    throw new Error(res?.message || fallbackMessage)
  }
  if (!res.data) {
    throw new Error(fallbackMessage)
  }
  return res.data
}

async function loadPlan(weekKey) {
  try {
    const res = await getCurrentPlan(weekKey)
    if (res?.success && res.data) {
      plan.value = res.data
    } else {
      plan.value = null
    }
  } catch {
    plan.value = null
  }
}

onMounted(async () => {
  await loadPlan(currentWeek.value)
})

async function handleGenerate() {
  if (loading.value) return
  loading.value = true
  try {
    const res = await generatePlan(currentWeek.value)
    plan.value = ensureServiceData(res, '未生成计划数据')
  } catch (err) {
    alert('生成失败：' + getErrorMessage(err))
  } finally {
    loading.value = false
  }
}

async function handleRegenerateAll() {
  if (loading.value) return
  loading.value = true
  try {
    const res = await generatePlan(currentWeek.value)
    plan.value = ensureServiceData(res, '未生成计划数据')
  } catch (err) {
    alert('重新生成失败：' + getErrorMessage(err))
  } finally {
    loading.value = false
  }
}

async function handleRegenerateDay(dayIndex) {
  try {
    const res = await regenerateDay(dayIndex, currentWeek.value)
    plan.value = ensureServiceData(res, '未返回当天计划数据')
  } catch (err) {
    alert('重新生成失败：' + getErrorMessage(err))
  }
}

function handleWeekChange(newWeek) {
  currentWeek.value = newWeek
  loadPlan(newWeek)
}
</script>

<style scoped>
.plan-view {
  padding-bottom: 80px;
}

@media (min-width: 768px) {
  .plan-view {
    padding-bottom: var(--space-xl);
  }
}
</style>