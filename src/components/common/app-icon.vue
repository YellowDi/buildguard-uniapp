<script setup lang="ts">
import { computed } from 'vue'
import { ICON_PATHS } from '@/shared/ui/icon-paths'

const props = withDefaults(
  defineProps<{
    name: keyof typeof ICON_PATHS | string
    color?: string
  }>(),
  {
    color: '#5c5c5c',
  },
)

const src = computed(() => {
  const paths = ICON_PATHS[props.name]
  if (!paths) return ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${props.color}">${paths
    .map((path) => `<path d="${path}"/>`)
    .join('')}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
})
</script>

<template>
  <image class="app-icon" :src="src" mode="aspectFit" />
</template>
