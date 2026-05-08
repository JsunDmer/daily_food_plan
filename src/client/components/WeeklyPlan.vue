<template>
  <div class="weekly-plan">
    <div v-if="days.length === 0" class="empty-state">
      <p>点击上方「生成一周计划」开始</p>
    </div>
    <template v-else>
      <div v-if="isMobile" class="mobile-day-view">
        <div class="mobile-day-switcher">
          <button
            type="button"
            class="day-nav-btn"
            :disabled="activeDayIndex <= 0"
            aria-label="查看前一天"
            @click="goPrevDay"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>

          <div class="day-tabs" role="tablist" aria-label="选择星期">
            <button
              v-for="(day, index) in days"
              :key="day.dayIndex"
              type="button"
              role="tab"
              class="day-tab"
              :class="{ active: index === activeDayIndex, today: isTodayDay(day) }"
              :aria-selected="index === activeDayIndex"
              @click="setActiveDay(index)"
            >
              <span class="day-name">{{ day.day }}</span>
              <span v-if="day.displayDate" class="day-date">{{ day.displayDate }}</span>
            </button>
          </div>

          <button
            type="button"
            class="day-nav-btn"
            :disabled="activeDayIndex >= days.length - 1"
            aria-label="查看后一天"
            @click="goNextDay"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <p class="day-progress">第 {{ activeDayIndex + 1 }} / {{ days.length }} 天</p>

        <transition name="day-fade" mode="out-in">
          <DayPlan
            v-if="activeDay"
            :key="activeDay.dayIndex"
            :day="activeDay"
            :isToday="isTodayDay(activeDay)"
            @regenerate="handleRegenerateDay"
          />
        </transition>
      </div>

      <div v-else class="days-grid">
        <DayPlan
          v-for="day in days"
          :key="day.dayIndex"
          :day="day"
          :isToday="isTodayDay(day)"
          @regenerate="handleRegenerateDay"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DayPlan from './DayPlan.vue'
import { getTodayString } from '../services/dateUtils.js'

const props = defineProps({
  days: { type: Array, default: () => [] },
  currentWeek: { type: String, default: '' }
})

const emit = defineEmits(['regenerate-day'])
const isMobile = ref(typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false)
const activeDayIndex = ref(0)

const activeDay = computed(() => props.days[activeDayIndex.value] || null)

let mediaQuery = null
let removeMediaListener = null

watch(
  () => props.days,
  (days, previousDays) => {
    if (!days.length) {
      activeDayIndex.value = 0
      return
    }

    if (!previousDays?.length) {
      activeDayIndex.value = 0
      return
    }

    if (activeDayIndex.value >= days.length) {
      activeDayIndex.value = days.length - 1
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (typeof window === 'undefined') return

  mediaQuery = window.matchMedia('(max-width: 767px)')
  const handleMediaChange = (event) => {
    isMobile.value = event.matches
  }

  isMobile.value = mediaQuery.matches

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleMediaChange)
    removeMediaListener = () => mediaQuery.removeEventListener('change', handleMediaChange)
  } else {
    mediaQuery.addListener(handleMediaChange)
    removeMediaListener = () => mediaQuery.removeListener(handleMediaChange)
  }
})

onBeforeUnmount(() => {
  if (removeMediaListener) {
    removeMediaListener()
  }
})

function setActiveDay(index) {
  activeDayIndex.value = index
}

function goPrevDay() {
  if (activeDayIndex.value > 0) {
    activeDayIndex.value -= 1
  }
}

function goNextDay() {
  if (activeDayIndex.value < props.days.length - 1) {
    activeDayIndex.value += 1
  }
}

function handleRegenerateDay(dayIndex) {
  emit('regenerate-day', dayIndex)
}

function isTodayDay(day) {
  return day.date === getTodayString()
}
</script>

<style scoped>
.weekly-plan {
  margin-top: var(--space-lg);
}

.empty-state {
  text-align: center;
  padding: 80px var(--space-lg);
  color: var(--text-secondary);
  font-size: 1rem;
}

.empty-state p {
  font-size: 1.1rem;
  color: var(--text-muted);
}

.days-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
}

.mobile-day-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.mobile-day-switcher {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs);
  background: var(--card-bg);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.day-nav-btn {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.day-nav-btn svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  stroke-width: 2.5;
  fill: none;
}

.day-nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.day-nav-btn:not(:disabled):active {
  transform: scale(0.96);
}

.day-tabs {
  flex: 1;
  display: flex;
  gap: var(--space-xs);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 2px;
}

.day-tabs::-webkit-scrollbar {
  display: none;
}

.day-tab {
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: 999px;
  padding: 6px 10px;
  min-height: 36px;
  white-space: nowrap;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  line-height: 1.2;
}

.day-name {
  display: block;
}

.day-date {
  display: block;
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--text-muted);
}

.day-tab.active {
  color: var(--primary-dark);
  border-color: rgba(232, 93, 4, 0.35);
  background: var(--primary-subtle);
}

.day-tab.today {
  border-color: var(--success);
  background: var(--success-light);
}

.day-tab.today .day-date {
  color: var(--success);
}

.day-tab.active.today {
  background: var(--primary-subtle);
}

.day-tab:focus-visible,
.day-nav-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.day-progress {
  text-align: center;
  font-size: 0.76rem;
  color: var(--text-muted);
}

.day-fade-enter-active,
.day-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.day-fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.day-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

@media (min-width: 600px) {
  .days-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .days-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1200px) {
  .days-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 767px) {
  .day-tab {
    min-height: 40px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .day-fade-enter-active,
  .day-fade-leave-active {
    transition: none;
  }
}
</style>