import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'

;(function initTheme() {
  const v = localStorage.getItem('buildguard-theme')
  const isDark =
    v === 'dark' || (v !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  if (isDark) document.documentElement.classList.add('dark')
  else document.documentElement.classList.remove('dark')
})()

createApp(App).use(router).mount('#app')
