<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/common/app-icon.vue'
import { DEMO_USERS, authenticateDemoUser, resolveHomePath, saveSession, type DemoUser } from '@/shared/auth/session'
import { goToPage } from '@/services/platform/navigation'
import { useTopSafeAreaVars } from '@/services/platform/layout'
import { useTheme } from '@/services/platform/theme'

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const { isDark } = useTheme()
const topSafeAreaVars = useTopSafeAreaVars()

const canSubmit = computed(() => username.value.trim() && password.value.length >= 6 && !loading.value)

async function submit() {
  if (!canSubmit.value) return
  loading.value = true
  error.value = ''
  await new Promise((resolve) => setTimeout(resolve, 250))
  const user = authenticateDemoUser(username.value, password.value)
  loading.value = false
  if (!user) {
    error.value = '账号或密码错误，请使用下方测试账号或快捷登录。'
    return
  }
  saveSession(user)
  goToPage(resolveHomePath(user.role), true)
}

function quickLogin(user: DemoUser) {
  if (loading.value) return
  error.value = ''
  saveSession(user)
  goToPage(resolveHomePath(user.role), true)
}
</script>

<template>
  <view class="app-page" :class="{ 'theme-dark': isDark }">
    <view class="shell login-shell" :style="topSafeAreaVars">
      <view class="login-center">
        <view class="brand">
          <image class="brand-logo" src="/static/temp_logo.png" mode="aspectFit" />
          <view class="brand-copy">
            <text class="brand-title">BuildGuard</text>
            <text class="brand-subtitle">登录以继续使用</text>
          </view>
        </view>

        <view class="card form-card">
          <view class="field">
            <text class="label">用户名</text>
            <view class="input-wrap">
              <AppIcon name="ri-user-line" class="input-icon" :color="isDark ? '#a3a3a3' : '#5c5c5c'" />
              <input
                v-model="username"
                class="input"
                placeholder="请输入用户名"
                :placeholder-style="`color:${isDark ? '#737373' : '#a3a3a3'}`"
              />
            </view>
          </view>

          <view class="field">
            <text class="label">密码</text>
            <view class="input-wrap">
              <AppIcon name="ri-lock-line" class="input-icon" :color="isDark ? '#a3a3a3' : '#5c5c5c'" />
              <input
                v-model="password"
                class="input"
                password
                placeholder="请输入密码（至少 6 位）"
                :placeholder-style="`color:${isDark ? '#737373' : '#a3a3a3'}`"
              />
            </view>
          </view>

          <view v-if="error" class="error-text">
            <AppIcon name="ri-error-warning-line" color="#e5484d" />
            <text>{{ error }}</text>
          </view>

          <view
            class="btn btn-primary submit-btn"
            :class="{ disabled: !canSubmit, ready: !!canSubmit && !loading, loading }"
            @tap="submit"
          >
            <AppIcon v-if="loading" name="ri-loader-4-line" class="spinner" :color="isDark ? '#262626' : '#ffffff'" />
            <text>{{ loading ? '登录中…' : '登录' }}</text>
          </view>

          <view class="quick-card">
            <text class="quick-title">快捷登录</text>
            <text class="quick-subtitle">临时测试入口。检修身份查看巡检数据；维修身份按工种查看对应维修任务。</text>
            <view class="quick-list">
              <view v-for="user in DEMO_USERS" :key="user.id" class="quick-item" @tap="quickLogin(user)">
                <view class="quick-main">
                  <image class="quick-avatar" :src="user.avatarUrl" mode="aspectFill" />
                  <view class="quick-copy">
                    <view class="quick-head">
                      <text class="quick-name">{{ user.displayName }}</text>
                      <text class="chip">{{ user.roleLabel }}</text>
                      <text v-if="user.specialtyLabel" class="trade-chip">{{ user.specialtyLabel }}</text>
                    </view>
                    <text class="quick-desc">{{ user.description }}</text>
                    <text class="quick-meta">账号 {{ user.username }} / 密码 {{ user.password }}</text>
                  </view>
                </view>
                <AppIcon name="ri-arrow-right-line" class="quick-arrow" :color="isDark ? '#a3a3a3' : '#a3a3a3'" />
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.login-shell {
  justify-content: center;
  padding: calc(var(--safe-top-offset, 0px) + 24px) 16px 48rpx;
}

.login-center {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
  width: 100%;
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.brand-logo {
  width: 112rpx;
  height: 112rpx;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(23, 23, 23, 0.1);
}

.brand-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.brand-title {
  font-size: 40rpx;
  line-height: 52rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.brand-subtitle {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.form-card {
  padding: 32rpx;
  overflow: hidden;
}

.field + .field {
  margin-top: 24rpx;
}

.label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.input-wrap {
  height: 92rpx;
  border-radius: 20rpx;
  border: 1px solid var(--border-subtle);
  background: var(--bg-card);
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
}

.input-icon {
  font-size: 32rpx;
}

.input {
  flex: 1;
  font-size: 30rpx;
  color: var(--text-primary);
}

.error-text {
  margin-top: 18rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: #e5484d;
  font-size: 24rpx;
}

.submit-btn {
  margin-top: 28rpx;
  box-shadow:
    0 10rpx 20rpx rgba(23, 23, 23, 0.08),
    inset 0 -2rpx 0 rgba(255, 255, 255, 0.08);
}

.submit-btn.ready {
  background: var(--text-primary);
  color: var(--bg-card);
}

.submit-btn.ready:active {
  opacity: 0.92;
}

.theme-dark .submit-btn.ready {
  box-shadow:
    0 10rpx 20rpx rgba(0, 0, 0, 0.2),
    inset 0 -2rpx 0 rgba(23, 23, 23, 0.08);
}

.submit-btn.disabled {
  background: #e5e5e5;
  color: var(--text-tertiary);
  box-shadow: none;
  opacity: 1;
}

.theme-dark .submit-btn.disabled {
  background: var(--bg-softer);
  color: var(--text-secondary);
}

.submit-btn.loading {
  opacity: 0.94;
}

.spinner {
  animation: spin 1s linear infinite;
}

.quick-card {
  margin-top: 28rpx;
  padding: 24rpx;
  border: 1px dashed var(--border-strong);
  border-radius: 24rpx;
  background: var(--bg-muted);
}

.quick-title {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.quick-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 32rpx;
  color: var(--text-secondary);
}

.quick-list {
  margin-top: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.quick-item {
  padding: 24rpx;
  border-radius: 24rpx;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12rpx;
}

.quick-main {
  flex: 1;
  display: flex;
  gap: 18rpx;
}

.quick-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  background: var(--bg-softer);
}

.quick-copy {
  flex: 1;
}

.quick-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  align-items: center;
}

.quick-name {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.quick-desc,
.quick-meta {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 32rpx;
  color: var(--text-secondary);
}

.quick-meta {
  font-size: 20rpx;
  line-height: 30rpx;
  color: var(--text-tertiary);
}

.trade-chip {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: var(--bg-chip-info);
  color: var(--brand-blue);
  font-size: 22rpx;
}

.quick-arrow {
  margin-top: 6rpx;
  font-size: 30rpx;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
