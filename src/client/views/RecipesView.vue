<template>
  <div class="recipes-view">
    <div class="recipes-header">
      <h2 class="section-title">菜谱库</h2>
      <button class="btn btn-primary" @click="showAddForm = true">添加菜谱</button>
    </div>

    <!-- 分类 Tab -->
    <div class="category-tabs">
      <button
        v-for="(label, key) in categories"
        :key="key"
        :class="['tab-btn', { active: activeCategory === key }]"
        @click="activeCategory = key"
      >
        <span>{{ label }}</span>
        <span class="tab-count">{{ categoryCounts[key] || 0 }}</span>
      </button>
    </div>

    <div class="filter-bar">
      <div class="search-box">
        <input
          v-model.trim="searchKeyword"
          type="search"
          placeholder="搜索菜名/描述/食材/标签"
        />
      </div>

      <select v-model="selectedSeason" class="filter-select" aria-label="按季节筛选">
        <option value="">全部季节</option>
        <option value="spring">春季</option>
        <option value="summer">夏季</option>
        <option value="autumn">秋季</option>
        <option value="winter">冬季</option>
      </select>

      <select v-model="selectedCost" class="filter-select" aria-label="按费用筛选">
        <option value="">全部费用</option>
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
      </select>
    </div>

    <div v-if="!loading" class="results-meta">
      <span>当前显示 {{ filteredRecipes.length }} 道菜谱</span>
      <button v-if="hasActiveFilters" class="clear-filter-btn" @click="clearFilters">
        清除筛选
      </button>
    </div>

    <!-- 菜谱列表 -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="recipe-grid">
      <div v-for="recipe in filteredRecipes" :key="recipe.id" class="recipe-card" :class="{ disliked: recipe.isDisliked }">
        <div class="recipe-image-container">
          <RecipeImage :src="getRecipeImage(recipe)" :alt="recipe.name" aspect-ratio="16 / 9" />
        </div>
        <div class="recipe-card-header">
          <h4 class="recipe-name">{{ recipe.name }}</h4>
          <span class="recipe-category">{{ categories[recipe.category] || recipe.category }}</span>
        </div>
        <p class="recipe-desc" v-if="recipe.description">{{ recipe.description }}</p>
        <div class="recipe-ingredients">
          <span v-for="ing in recipe.ingredients.slice(0, 4)" :key="ing.name" class="ingredient-tag">
            {{ ing.name }}
          </span>
          <span v-if="recipe.ingredients.length > 4" class="ingredient-more">
            +{{ recipe.ingredients.length - 4 }}种
          </span>
        </div>
        <div class="recipe-meta">
          <span v-if="recipe.cost" :class="['meta-tag', `cost-${recipe.cost}`]">
            {{ costLabel(recipe.cost) }}
          </span>
          <span v-if="recipe.nutrition" class="meta-tag">
            {{ recipe.nutrition.calories }}千卡
          </span>
        </div>
        <div class="recipe-actions">
          <button
            :class="['action-btn', recipe.isFavorite ? 'fav-active' : 'fav']"
            @click="toggleFavorite(recipe)"
            :title="recipe.isFavorite ? '取消喜欢' : '喜欢'"
          >
            {{ recipe.isFavorite ? '已喜欢' : '喜欢' }}
          </button>
          <button
            :class="['action-btn', recipe.isDisliked ? 'dislike-active' : 'dislike']"
            @click="toggleDislike(recipe)"
            :title="recipe.isDisliked ? '取消不喜欢' : '不喜欢'"
          >
            {{ recipe.isDisliked ? '已不喜欢' : '不喜欢' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 添加菜谱弹窗 -->
    <div v-if="showAddForm" class="modal-overlay" @click.self="showAddForm = false">
      <div class="modal">
        <h3 class="modal-title">添加自定义菜谱</h3>
        <form @submit.prevent="handleAddRecipe">
          <div class="form-group">
            <label>菜名 *</label>
            <input v-model="newRecipe.name" type="text" required placeholder="请输入菜名" />
          </div>
          <div class="form-group">
            <label>分类 *</label>
            <select v-model="newRecipe.category" required>
              <option v-for="(label, key) in categories" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>描述</label>
            <input v-model="newRecipe.description" type="text" placeholder="简短描述" />
          </div>
          <div class="form-group">
            <label>食材（每行一种，格式：食材名,用量）</label>
            <textarea v-model="ingredientsText" rows="4" placeholder="五花肉,500g&#10;生抽,2勺&#10;冰糖,30g"></textarea>
          </div>
          <div class="form-group">
            <label>费用等级</label>
            <select v-model="newRecipe.cost">
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-ghost" @click="showAddForm = false">取消</button>
            <button type="submit" class="btn btn-primary">添加</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getRecipes, addRecipe, favoriteRecipe, dislikeRecipe, unfavoriteRecipe, undislikeRecipe } from '../services/index.js'
import RecipeImage from '../components/RecipeImage.vue'

const categories = ref({
  breakfast_staple: '早餐-主食',
  breakfast_side: '早餐-副食',
  breakfast_drink: '早餐-饮品',
  dinner_meat: '晚餐-荤菜',
  dinner_veg: '晚餐-素菜',
  dinner_soup: '晚餐-汤'
})

const recipes = ref([])
const activeCategory = ref('breakfast_staple')
const loading = ref(false)
const showAddForm = ref(false)
const newRecipe = ref({
  name: '',
  category: 'breakfast_staple',
  description: '',
  cost: 'medium'
})
const ingredientsText = ref('')
const searchKeyword = ref('')
const selectedSeason = ref('')
const selectedCost = ref('')

const categoryCounts = computed(() => {
  return recipes.value.reduce((acc, recipe) => {
    acc[recipe.category] = (acc[recipe.category] || 0) + 1
    return acc
  }, {})
})

const filteredRecipes = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  const list = recipes.value
    .filter(recipe => recipe.category === activeCategory.value)
    .filter(recipe => {
      if (selectedSeason.value && !recipe.season?.includes(selectedSeason.value)) {
        return false
      }
      if (selectedCost.value && recipe.cost !== selectedCost.value) {
        return false
      }
      if (!keyword) return true

      const haystack = [
        recipe.name,
        recipe.description,
        ...(recipe.tags || []),
        ...(recipe.ingredients || []).map(ing => ing.name)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(keyword)
    })

  return list.sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
    if (a.isDisliked !== b.isDisliked) return a.isDisliked ? 1 : -1
    return getRecipeOrderScore(b) - getRecipeOrderScore(a)
  })
})

const hasActiveFilters = computed(() => {
  return Boolean(searchKeyword.value.trim() || selectedSeason.value || selectedCost.value)
})

function costLabel(cost) {
  const map = { low: '省钱', medium: '适中', high: '小贵' }
  return map[cost] || cost
}

function getRecipeOrderScore(recipe) {
  const rawId = String(recipe.id || '')
  const idNumber = Number((rawId.match(/(\d+)$/) || [0, 0])[1])

  // 自定义菜谱通常使用时间戳后缀，给它更高基准分，默认靠前展示。
  if (recipe.isCustom) return 1000000 + idNumber
  return idNumber
}

function getRecipeImage(recipe) {
  if (recipe.image) return recipe.image
  if (!recipe.id) return '/images/recipes/placeholder.svg'
  return `/images/recipes/${recipe.id}.jpg`
}

function clearFilters() {
  searchKeyword.value = ''
  selectedSeason.value = ''
  selectedCost.value = ''
}

async function fetchRecipes() {
  loading.value = true
  try {
    const res = await getRecipes()
    recipes.value = res.data
  } catch (err) {
    console.error('获取菜谱失败', err)
  } finally {
    loading.value = false
  }
}

async function toggleFavorite(recipe) {
  try {
    if (recipe.isFavorite) {
      await unfavoriteRecipe(recipe.id)
    } else {
      await favoriteRecipe(recipe.id)
    }
    await fetchRecipes()
  } catch (err) {
    console.error('操作失败', err)
  }
}

async function toggleDislike(recipe) {
  try {
    if (recipe.isDisliked) {
      await undislikeRecipe(recipe.id)
    } else {
      await dislikeRecipe(recipe.id)
    }
    await fetchRecipes()
  } catch (err) {
    console.error('操作失败', err)
  }
}

async function handleAddRecipe() {
  // 解析食材文本
  const ingredients = ingredientsText.value
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const parts = line.split(',').map(s => s.trim())
      return { name: parts[0], amount: parts[1] || '适量' }
    })

  try {
    await addRecipe({
      ...newRecipe.value,
      ingredients,
      tags: [],
      season: ['spring', 'summer', 'autumn', 'winter'],
      nutrition: { calories: 0, protein: 'medium', fat: 'medium' }
    })
    showAddForm.value = false
    newRecipe.value = { name: '', category: 'breakfast_staple', description: '', cost: 'medium' }
    ingredientsText.value = ''
    await fetchRecipes()
  } catch (err) {
    alert('添加失败：' + err.message)
  }
}

onMounted(fetchRecipes)
</script>

<style scoped>
.recipes-view {
  padding-bottom: 80px;
}

.recipes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
  gap: var(--space-md);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.category-tabs {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 4px;
  margin-left: calc(-1 * var(--space-lg));
  margin-right: calc(-1 * var(--space-lg));
  padding-left: var(--space-lg);
  padding-right: var(--space-lg);
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--card-bg);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all var(--transition-normal);
  white-space: nowrap;
  min-height: 44px;
}

.tab-count {
  margin-left: 6px;
  font-size: 0.72rem;
  opacity: 0.8;
}

.tab-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
  box-shadow: 0 2px 6px rgba(232, 93, 4, 0.25);
}

.tab-btn:hover:not(.active) {
  border-color: var(--primary-light);
  color: var(--primary);
  background: var(--primary-subtle);
}

.filter-bar {
  display: grid;
  grid-template-columns: 1.8fr 1fr 1fr;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.search-box input,
.filter-select {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card-bg);
  padding: 0 12px;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.search-box input::placeholder {
  color: var(--text-muted);
}

.results-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.clear-filter-btn {
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--card-bg);
  color: var(--text-secondary);
  padding: 6px 12px;
  min-height: 32px;
  font-size: 0.78rem;
  cursor: pointer;
}

.clear-filter-btn:hover {
  border-color: var(--primary-light);
  color: var(--primary);
}

.recipe-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-md);
}

@media (min-width: 480px) {
  .recipe-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .recipe-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-lg);
  }
}

.recipe-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: var(--space-lg);
  box-shadow: var(--shadow);
  transition: all var(--transition-normal);
}

.recipe-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.recipe-card.disliked {
  opacity: 0.5;
}

.recipe-image-container {
  margin: calc(-1 * var(--space-lg)) calc(-1 * var(--space-lg)) var(--space-md);
  overflow: hidden;
  border-radius: var(--radius) var(--radius) 0 0;
}

.recipe-image-container :deep(.recipe-image-shell) {
  border-radius: 0;
  max-height: clamp(150px, 34vw, 210px);
}

.recipe-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.recipe-name {
  font-size: 1rem;
  font-weight: 600;
}

.recipe-category {
  font-size: 0.7rem;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
  color: var(--text-secondary);
}

.recipe-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.recipe-ingredients {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.ingredient-tag {
  font-size: 0.7rem;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text-secondary);
}

.ingredient-more {
  font-size: 0.7rem;
  color: var(--primary);
  padding-top: 2px;
}

.recipe-meta {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.meta-tag {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.recipe-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: white;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.fav:hover, .fav-active {
  background: var(--fav-color);
  color: white;
  border-color: var(--fav-color);
}

.fav-active {
  background: var(--fav-color);
  color: white;
  border-color: var(--fav-color);
}

.dislike:hover, .dislike-active {
  background: var(--dislike-color);
  color: white;
  border-color: var(--dislike-color);
}

.dislike-active {
  background: var(--dislike-color);
  color: white;
  border-color: var(--dislike-color);
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: var(--radius);
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.9rem;
}

.form-group textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

@media (max-width: 767px) {
  .filter-bar {
    grid-template-columns: 1fr;
  }

  .results-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);
  }
}
</style>