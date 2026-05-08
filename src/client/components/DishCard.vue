<template>
  <div class="dish-card">
    <div class="dish-name">{{ dish.name }}</div>
    <div class="dish-desc" v-if="dish.description">{{ dish.description }}</div>
    <IngredientList :ingredients="dish.ingredients" />
  </div>
</template>

<script setup>
import IngredientList from './IngredientList.vue'

defineProps({
  dish: { type: Object, required: true }
})
</script>

<style scoped>
.dish-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  transition: all var(--transition-normal);
}

.dish-card:hover {
  background: var(--card-hover);
  transform: translateX(4px);
}

.dish-name {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 2px;
  color: var(--text-primary);
}

.dish-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
  line-height: 1.4;
}

@media (max-width: 767px) {
  .dish-card {
    padding: var(--space-sm) var(--space-md);
  }

  .dish-name {
    font-size: 0.9rem;
  }
}
</style>