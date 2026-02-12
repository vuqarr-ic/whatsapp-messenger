/**
 * Конфигурация приложения
 * Для работы через интернет: .env с VITE_SIGNALING_URL=wss://your-server.com
 * STUN серверы необходимы для WebRTC через NAT (интернет)
 */

const getSignalingUrl = () => {
  const url = import.meta.env.VITE_SIGNALING_URL
  if (url) return url
  const host = window.location.hostname
  const port = import.meta.env.VITE_SIGNALING_PORT || 3005
  if (host === 'localhost' || host === '127.0.0.1') {
    return `ws://${host}:${port}`
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${host}:${port}`
}

const getIceServers = () => {
  const turnUrl = import.meta.env.VITE_TURN_URL
  const turnUser = import.meta.env.VITE_TURN_USER
  const turnPass = import.meta.env.VITE_TURN_PASS

  const servers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]

  if (turnUrl && turnUser && turnPass) {
    servers.push({
      urls: turnUrl,
      username: turnUser,
      credential: turnPass
    })
  }

  return servers
}

export const config = {
  signalingUrl: getSignalingUrl(),
  iceServers: getIceServers(),
  useWebRTC: true
}
