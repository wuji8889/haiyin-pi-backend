# 海音保健 Pi 商店后端

Pi 支付的服务器确认（Server Approval / Server Completion）。

## 接口

- `POST /api/approve` `{ paymentId }` —— 批准一笔付款
- `POST /api/complete` `{ paymentId, txid }` —— 完成一笔付款
- `GET /api/payment/:paymentId` —— 查一笔付款的状态
- `GET /health` —— 健康检查

## 环境变量

- `PI_API_KEY` 必填，Pi 开发者后台的 API Key（不要写进代码、不要提交到仓库）
- `PI_API_BASE` 选填，默认 `https://api.testnet.minepi.com`（测试网）；主网用 `https://api.minepi.com`
- `PORT` 选填，默认 `3000`

## 本地运行

```sh
npm install
PI_API_KEY=xxx node server.js
```

## 部署（Altare）

镜像 `node:20-alpine`，端口 `3000`，启动命令从本仓库拉代码并启动，环境变量设 `PI_API_KEY`。
