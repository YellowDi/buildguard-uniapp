<script setup lang="ts">
import { ref } from 'vue'
import MobileInspectionReport from './components/report/MobileInspectionReport.vue'
import BuildingDetail from './components/report/BuildingDetail.vue'

const currentView = ref<'list' | 'detail'>('detail')
</script>

<template>
  <main class="min-h-screen bg-[#ECECEC]">
    <BuildingDetail v-if="currentView === 'detail'" />
    <MobileInspectionReport v-else />
  </main>
</template>
