<template>
  <div class="plan-view">
    <GenerateBar @generate="handleGenerate" @regenerate-all="handleRegenerateAll" :loading="loading" :has-plan="!!plan" />
    <WeeklyPlan :days="plan?.days || []" @regenerate-day="handleRegenerateDay" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import WeeklyPlan from '../components/WeeklyPlan.vue'
import GenerateBar from '../components/GenerateBar.vue'
import { generatePlan, getCurrentPlan, regenerateDay } from '../services/index.js'

const plan = ref(null)
const loading = ref(false)

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

onMounted(async () => {
  try {
    const res = await getCurrentPlan()
    if (res?.success && res.data) {
      plan.value = res.data
    }
  } catch {}
})

async function handleGenerate() {
  if (loading.value) return
  loading.value = true
  try {
    const res = await generatePlan()
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
    const res = await generatePlan()
    plan.value = ensureServiceData(res, '未生成计划数据')
  } catch (err) {
    alert('重新生成失败：' + getErrorMessage(err))
  } finally {
    loading.value = false
  }
}

async function handleRegenerateDay(dayIndex) {
  try {
    const res = await regenerateDay(dayIndex)
    plan.value = ensureServiceData(res, '未返回当天计划数据')
  } catch (err) {
    alert('重新生成失败：' + getErrorMessage(err))
  }
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