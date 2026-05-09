<template>
  <div class="recipe-image-shell" :style="shellStyle">
    <img
      v-if="!isBroken"
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
    <div v-if="!isLoaded && !isBroken" class="recipe-image-skeleton" aria-hidden="true"></div>
    <div v-if="isBroken" class="recipe-image-fallback">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%" aria-hidden="true">
        <circle cx="200" cy="170" r="56" fill="#ffffff" fill-opacity="0.82"/>
        <path d="M170 175c0-17 13-30 30-30s30 13 30 30c0 11-6 20-14 25l8 19h-10l-7-15a31 31 0 0 1-7 1 31 31 0 0 1-7-1l-7 15h-10l8-19c-8-5-14-14-14-25z" fill="#e85d04"/>
        <rect x="112" y="256" width="176" height="34" rx="17" fill="#ffffff" fill-opacity="0.86"/>
        <text x="200" y="278" text-anchor="middle" font-size="20" font-weight="600" font-family="system-ui, -apple-system, sans-serif" fill="#b54a00">暂无图片</text>
      </svg>
    </div>
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
const isBroken = ref(false)
const imageEl = ref(null)

const loadingMode = computed(() => (props.lazy ? 'lazy' : 'eager'))

const shellStyle = computed(() => {
  if (!props.aspectRatio) return {}
  const parts = props.aspectRatio.split('/')
  if (parts.length === 2) {
    const w = parseFloat(parts[0].trim())
    const h = parseFloat(parts[1].trim())
    if (w > 0 && h > 0) {
      return { paddingBottom: `${(h / w) * 100}%` }
    }
  }
  return { aspectRatio: props.aspectRatio }
})

watch(
  () => props.src,
  (next) => {
    currentSrc.value = next || PLACEHOLDER_SRC
    isLoaded.value = false
    isBroken.value = false
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
  isBroken.value = true
  isLoaded.value = true
}

onMounted(() => {
  if (imageEl.value?.complete && imageEl.value.naturalWidth > 0) {
    isLoaded.value = true
  } else if (imageEl.value?.complete && imageEl.value.naturalWidth === 0) {
    handleError()
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 45%, rgba(232, 93, 4, 0.08) 100%);
}

.recipe-image-el {
  position: absolute;
  top: 0;
  left: 0;
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(110deg, rgba(255, 255, 255, 0.12) 8%, rgba(255, 255, 255, 0.52) 18%, rgba(255, 255, 255, 0.12) 33%);
  background-size: 220% 100%;
  animation: recipe-image-shimmer 1.3s linear infinite;
}

.recipe-image-fallback {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
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
