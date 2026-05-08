<template>
  <div class="meal-section" :style="{ borderLeftColor: color }">
    <div class="meal-title" :style="{ color: color }">{{ title }}</div>
    <div class="dish-list">
      <DishCard v-for="dish in meals" :key="dish.id" :dish="dish" />
    </div>
  </div>
</template>

<script setup>
import DishCard from './DishCard.vue'

defineProps({
  title: { type: String, required: true },
  type: { type: String, required: true },
  meals: { type: Array, default: () => [] },
  color: { type: String, default: 'var(--primary)' }
})
</script>

<style scoped>
.meal-section {
  padding: var(--space-md) var(--space-lg);
  border-left: 4px solid;
  position: relative;
}

.meal-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.05;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.meal-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: var(--space-sm);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.dish-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

@media (max-width: 767px) {
  .meal-section {
    padding: var(--space-md);
  }

  .meal-title {
    font-size: 0.85rem;
  }
}
</style>