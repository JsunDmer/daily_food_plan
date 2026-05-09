<template>
  <div class="recipe-image-shell" :style="{ aspectRatio }">
    <img
      ref="imageEl"
      class="recipe-image-el"
      :class="{ loaded: isLoaded }"
      :src="currentSrc"
      :alt="alt"
      :loading="loadingMode"
      decoding="async"
      @load="handleLoad"
      @error="handleError"
    />
    <div v-if="!isLoaded" class="recipe-image-skeleton" aria-hidden="true"></div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const PLACEHOLDER_SRC = '/images/recipes/placeholder.svg'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '菜谱图片' },
  lazy: { type: Boolean, default: true },
  aspectRatio: { type: String, default: '1 / 1' }
})

const currentSrc = ref(props.src || PLACEHOLDER_SRC)
const isLoaded = ref(false)
const imageEl = ref(null)

const loadingMode = computed(() => (props.lazy ? 'lazy' : 'eager'))

watch(
  () => props.src,
  (next) => {
    currentSrc.value = next || PLACEHOLDER_SRC
    isLoaded.value = false
  }
)

watch(
  () => currentSrc.value,
  async () => {
    await nextTick()
    if (imageEl.value?.complete && imageEl.value.naturalWidth > 0) {
      isLoaded.value = true
    }
  },
  { immediate: true }
)

function handleLoad() {
  isLoaded.value = true
}

function handleError() {
  if (currentSrc.value !== PLACEHOLDER_SRC) {
    currentSrc.value = PLACEHOLDER_SRC
    isLoaded.value = false
    return
  }
  isLoaded.value = true
}

onMounted(() => {
  if (imageEl.value?.complete && imageEl.value.naturalWidth > 0) {
    isLoaded.value = true
  }
})
</script>

<style scoped>
.recipe-image-shell {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: inherit;
  line-height: 0;
  background: linear-gradient(135deg, #fff1e7 0%, #ffe8d6 60%, #ffe0c7 100%);
}

.recipe-image-shell::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 45%, rgba(232, 93, 4, 0.08) 100%);
}

.recipe-image-el {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.02);
  transition: opacity 220ms ease, transform 260ms ease;
}

.recipe-image-el.loaded {
  opacity: 1;
  transform: scale(1);
}

.recipe-image-skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, rgba(255, 255, 255, 0.12) 8%, rgba(255, 255, 255, 0.52) 18%, rgba(255, 255, 255, 0.12) 33%);
  background-size: 220% 100%;
  animation: recipe-image-shimmer 1.3s linear infinite;
}

@keyframes recipe-image-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -120% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .recipe-image-el {
    transition: none;
    transform: none;
  }

  .recipe-image-skeleton {
    animation: none;
  }
}
</style>
