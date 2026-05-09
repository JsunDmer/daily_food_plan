<template>
  <div class="dish-card">
    <div class="dish-card-image">
      <RecipeImage :src="getDishImage(dish)" :alt="dish.name" />
    </div>
    <div class="dish-card-content">
      <div class="dish-name">{{ dish.name }}</div>
      <div class="dish-desc" v-if="dish.description">{{ dish.description }}</div>
      <IngredientList :ingredients="dish.ingredients" />
    </div>
  </div>
</template>

<script setup>
import IngredientList from './IngredientList.vue'
import RecipeImage from './RecipeImage.vue'

defineProps({
  dish: { type: Object, required: true }
})

function getDishImage(dish) {
  if (dish.image) return dish.image
  if (!dish.id) return '/images/recipes/placeholder.svg'
  return `/images/recipes/${dish.id}.jpg`
}
</script>

<style scoped>
.dish-card {
  display: flex;
  gap: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  transition: all var(--transition-normal);
}

.dish-card:hover {
  background: var(--card-hover);
  transform: translateX(4px);
}

.dish-card-content {
  flex: 1;
  min-width: 0;
}

.dish-card-image {
  width: 88px;
  min-width: 88px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--bg-secondary);
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
    gap: var(--space-sm);
  }

  .dish-card-image {
    width: 74px;
    min-width: 74px;
  }

  .dish-name {
    font-size: 0.9rem;
  }
}
</style>