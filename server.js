// 海音保健 Pi 商店后端 —— Pi 支付 Server Approval / Server Completion
// 只做两件事：
//   POST /api/approve   { paymentId }              -> 调 Pi API 批准这笔付款
//   POST /api/complete  { paymentId, txid }        -> 调 Pi API 完成这笔付款
//   GET  /api/payment/:paymentId                   -> 查一笔付款的状态（调试用）
//   GET  /health                                   -> 健康检查
//
// 环境变量：
//   PI_API_KEY   必填，Pi 开发者后台的 API Key（不要写进代码、不要提交到仓库）
//   PI_API_BASE  选填，默认 https://api.testnet.minepi.com（测试网）；主网用 https://api.minepi.com
//   PORT         选填，默认 3000（Altare 会注入 $PORT）

const express = require('express')
const app = express()

const API_KEY = process.env.PI_API_KEY || ''
const API_BASE = (process.env.PI_API_BASE || 'https://api.testnet.minepi.com').replace(/\/$/, '')
const PORT = parseInt(process.env.PORT || '3000', 10)

app.use(express.json())

// GitHub Pages 前端跨域调用
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

function piHeaders() {
  return {
    'Authorization': 'Key ' + API_KEY,
    'Content-Type': 'application/json'
  }
}

async function piCall(path, method, body) {
  const res = await fetch(API_BASE + path, {
    method: method,
    headers: piHeaders(),
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch (e) { data = { raw: text } }
  if (!res.ok) {
    const err = new Error('Pi API ' + res.status + ': ' + text)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

app.get('/health', function (req, res) {
  res.json({ ok: true, apiBase: API_BASE, hasKey: !!API_KEY })
})

// 批准付款：前端 onReadyForServerApproval 拿到 paymentId 后调这里
app.post('/api/approve', async function (req, res) {
  try {
    if (!API_KEY) return res.status(500).json({ ok: false, error: '服务器未配置 PI_API_KEY' })
    const paymentId = req.body && req.body.paymentId
    if (!paymentId) return res.status(400).json({ ok: false, error: '缺少 paymentId' })
    const data = await piCall('/v2/payments/' + encodeURIComponent(paymentId) + '/approve', 'POST')
    res.json({ ok: true, payment: data })
  } catch (err) {
    console.error('approve failed:', err.message)
    res.status(err.status || 500).json({ ok: false, error: err.message })
  }
})

// 完成付款：前端 onReadyForServerCompletion 拿到 paymentId + txid 后调这里
app.post('/api/complete', async function (req, res) {
  try {
    if (!API_KEY) return res.status(500).json({ ok: false, error: '服务器未配置 PI_API_KEY' })
    const paymentId = req.body && req.body.paymentId
    const txid = req.body && req.body.txid
    if (!paymentId || !txid) return res.status(400).json({ ok: false, error: '缺少 paymentId 或 txid' })
    const data = await piCall('/v2/payments/' + encodeURIComponent(paymentId) + '/complete', 'POST', { txid: txid })
    res.json({ ok: true, payment: data })
  } catch (err) {
    console.error('complete failed:', err.message)
    res.status(err.status || 500).json({ ok: false, error: err.message })
  }
})

// 查一笔付款的状态
app.get('/api/payment/:paymentId', async function (req, res) {
  try {
    if (!API_KEY) return res.status(500).json({ ok: false, error: '服务器未配置 PI_API_KEY' })
    const data = await piCall('/v2/payments/' + encodeURIComponent(req.params.paymentId), 'GET')
    res.json({ ok: true, payment: data })
  } catch (err) {
    console.error('get payment failed:', err.message)
    res.status(err.status || 500).json({ ok: false, error: err.message })
  }
})

app.listen(PORT, function () {
  console.log('Haiyin Pi backend listening on :' + PORT + ' apiBase=' + API_BASE + ' hasKey=' + !!API_KEY)
})
