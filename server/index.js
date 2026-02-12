/**
 * WebSocket сервер для обмена WebRTC сигналами между пирами
 * Запуск: node server/index.js
 * Порт по умолчанию: 3005
 */

const WebSocket = require('ws')
const http = require('http')

const PORT = process.env.PORT || 3005
const server = http.createServer((req, res) => {
  // Обработка HTTP запросов для проверки здоровья сервера
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', service: 'stork-signaling' }))
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

const wss = new WebSocket.Server({ server })

const peers = new Map()

wss.on('connection', (ws, req) => {
  let peerId = null

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString())

      switch (msg.type) {
        case 'register':
          peerId = msg.peerId
          peers.set(peerId, { ws, peerId })
          ws.send(JSON.stringify({ type: 'registered', peerId }))
          break

        case 'signal':
          const target = peers.get(msg.targetPeerId)
          if (target?.ws?.readyState === WebSocket.OPEN) {
            target.ws.send(JSON.stringify({
              type: 'signal',
              fromPeerId: peerId,
              signal: msg.signal,
              chatId: msg.chatId
            }))
          }
          break

        case 'group_signal':
          const targets = (msg.targetPeerIds || []).filter(id => id !== peerId)
          targets.forEach(targetId => {
            const t = peers.get(targetId)
            if (t?.ws?.readyState === WebSocket.OPEN) {
              t.ws.send(JSON.stringify({
                type: 'group_signal',
                fromPeerId: peerId,
                signal: msg.signal,
                chatId: msg.chatId,
                targetPeerId: targetId
              }))
            }
          })
          break

        case 'direct_message':
          const dmTarget = peers.get(msg.targetPeerId)
          if (dmTarget?.ws?.readyState === WebSocket.OPEN) {
            dmTarget.ws.send(JSON.stringify({
              type: 'direct_message',
              targetPeerId: msg.targetPeerId,
              chatId: msg.chatId,
              payload: msg.payload
            }))
          }
          break

        case 'group_message':
          const groupTarget = peers.get(msg.targetPeerId)
          if (groupTarget?.ws?.readyState === WebSocket.OPEN) {
            groupTarget.ws.send(JSON.stringify({
              type: 'group_message',
              targetPeerId: msg.targetPeerId,
              chatId: msg.chatId,
              payload: msg.payload
            }))
          }
          break

        case 'group_update':
          const targetPeer = peers.get(msg.targetPeerId)
          if (targetPeer?.ws?.readyState === WebSocket.OPEN) {
            targetPeer.ws.send(JSON.stringify({
              type: 'group_update',
              targetPeerId: msg.targetPeerId,
              data: msg.data
            }))
          }
          break

        case 'avatar_update':
          const avatarTarget = peers.get(msg.targetPeerId)
          if (avatarTarget?.ws?.readyState === WebSocket.OPEN) {
            avatarTarget.ws.send(JSON.stringify({
              type: 'avatar_update',
              targetPeerId: msg.targetPeerId,
              fromPeerId: peerId,
              avatar: msg.avatar
            }))
          }
          break
      }
    } catch (e) {
      console.error('Parse error:', e)
    }
  })

  ws.on('close', () => {
    if (peerId) peers.delete(peerId)
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Signaling server: ws://0.0.0.0:${PORT}`)
  console.log(`Health check: http://0.0.0.0:${PORT}/health`)
})
