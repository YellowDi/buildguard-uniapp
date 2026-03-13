<script setup lang="ts">
import { computed, ref } from 'vue'
import { DEMO_USERS, authenticateDemoUser, resolveHomePath, saveSession, type DemoUser } from '@/shared/auth/session'
import { goToPage } from '@/services/platform/navigation'
import { useTheme } from '@/services/platform/theme'

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const { isDark } = useTheme()

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
    <view class="shell login-shell">
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
              <text class="app-icon ri-user-line input-icon" />
              <input v-model="username" class="input" placeholder="请输入用户名" />
            </view>
          </view>

          <view class="field">
            <text class="label">密码</text>
            <view class="input-wrap">
              <text class="app-icon ri-lock-line input-icon" />
              <input v-model="password" class="input" password placeholder="请输入密码（至少 6 位）" />
            </view>
          </view>

          <view v-if="error" class="error-text">
            <text class="app-icon ri-error-warning-line" />
            <text>{{ error }}</text>
          </view>

          <view class="btn btn-primary submit-btn" :class="{ disabled: !canSubmit }" @tap="submit">
            <text v-if="loading" class="app-icon ri-loader-4-line spinner" />
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
                <text class="app-icon ri-arrow-right-line quick-arrow" />
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
  padding: 48rpx;
}

.login-center {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
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
}

.brand-subtitle {
  font-size: 24rpx;
  color: #5c5c5c;
}

.form-card {
  padding: 32rpx;
}

.field + .field {
  margin-top: 24rpx;
}

.label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.input-wrap {
  height: 92rpx;
  border-radius: 20rpx;
  border: 1px solid #ebebeb;
  background: #ffffff;
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 0 24rpx;
}

.input-icon {
  font-size: 32rpx;
  color: #5c5c5c;
}

.input {
  flex: 1;
  font-size: 30rpx;
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
}

.submit-btn.disabled {
  opacity: 0.5;
}

.spinner {
  animation: spin 1s linear infinite;
}

.quick-card {
  margin-top: 28rpx;
  padding: 24rpx;
  border: 1px dashed #d4d4d4;
  border-radius: 24rpx;
  background: #fafafa;
}

.quick-title {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
}

.quick-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 32rpx;
  color: #5c5c5c;
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
  background: #ffffff;
  border: 1px solid #ebebeb;
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
}

.quick-desc,
.quick-meta {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 32rpx;
  color: #5c5c5c;
}

.trade-chip {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: #eef6ff;
  color: #006adc;
  font-size: 22rpx;
}

.quick-arrow {
  margin-top: 6rpx;
  font-size: 30rpx;
  color: #a3a3a3;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
