/**
 * Конфигурация приложения
 * Для работы через интернет: .env с VITE_SIGNALING_URL=wss://your-server.com
 * STUN серверы необходимы для WebRTC через NAT (интернет)
 */

const getSignalingUrl = () => {
  const url = import.meta.env.VITE_SIGNALING_URL
  if (url) {
    // Убираем слэш в конце, если есть
    return url.replace(/\/$/, '')
  }
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

  // Множество публичных STUN серверов для обхода блокировок
  const servers = [
    // Google STUN (может быть заблокирован в некоторых регионах)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // Альтернативные публичные STUN серверы
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun.voiparound.com' },
    { urls: 'stun:stun.voipbuster.com' },
    { urls: 'stun:stun.voipstunt.com' },
    { urls: 'stun:stun.voxgratia.org' },
    { urls: 'stun:stun.ekiga.net' },
    { urls: 'stun:stun.fwdnet.net' },
    { urls: 'stun:stun.ideasip.com' },
    { urls: 'stun:stun.iptel.org' },
    { urls: 'stun:stun.rixtelecom.se' },
    { urls: 'stun:stun.schlund.de' },
    { urls: 'stun:stunserver.org' },
    { urls: 'stun:stun.sipgate.net' },
    { urls: 'stun:stun.sipgate.net:10000' },
    { urls: 'stun:stun.siptalk.ru' },
    { urls: 'stun:stun.softjoys.com' },
    { urls: 'stun:stun.voip.aebc.com' },
    { urls: 'stun:stun.voiparound.com' },
    { urls: 'stun:stun.voipbuster.com' },
    { urls: 'stun:stun.voipstunt.com' },
    { urls: 'stun:stun.voxgratia.org' },
    
    // Дополнительные резервные серверы
    { urls: 'stun:stun.1und1.de' },
    { urls: 'stun:stun.gmx.net' },
    { urls: 'stun:stun.callwithus.com' },
    { urls: 'stun:stun.counterpath.com' },
    { urls: 'stun:stun.internetcalls.com' }
  ]

  // Добавляем TURN сервер, если настроен (для обхода строгих NAT/firewall)
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
