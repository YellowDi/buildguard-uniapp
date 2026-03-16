# BuildGuard UniApp

BuildGuard 的 `uni-app` 项目，用于小程序和 `uni-app` H5 构建链路。

## 开发

```bash
pnpm install
pnpm dev:mp-weixin
```

## 环境变量与敏感信息

本仓库通过本地 `.env` 管理微信 `AppID`，不在源码中提交真实值。

```bash
cp .env.example .env
```

```env
WECHAT_APP_ID=你的微信小程序AppID
VITE_WECHAT_APP_ID=你的微信小程序AppID
```

## 构建

```bash
pnpm build:mp-weixin
pnpm build:h5
```

## 说明

- 当前仓库仅负责 `uni-app` 版本。
