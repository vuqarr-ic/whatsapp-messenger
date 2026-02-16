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

  // Российские и ближайшие STUN серверы (приоритет для стабильной работы в РФ)
  const servers = [
    // Российские STUN серверы (приоритет)
    { urls: 'stun:stun.siptalk.ru' },
    { urls: 'stun:stun.voip.aebc.com' }, // Российский сервер
    
    // Ближайшие к России серверы (быстрее и стабильнее)
    { urls: 'stun:stun.iptel.org' }, // Европа
    { urls: 'stun:stun.stunprotocol.org:3478' }, // Международный, но стабильный
    
    // Резервные серверы (только если основные недоступны)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]

  // Добавляем TURN сервер, если настроен (для обхода строгих NAT/firewall)
  if (turnUrl && turnUser && turnPass) {
    servers.push({
      urls: turnUrl,
      username: turnUser,
      credential: turnPass
    })
  } else {
    // Пробуем использовать публичные TURN серверы (могут быть нестабильны, но лучше чем ничего)
    // ВАЖНО: Эти серверы могут быть перегружены или недоступны
    // Для продакшена рекомендуется настроить свой TURN сервер
    try {
      // Публичный TURN от metered.ca (бесплатный, но с ограничениями)
      // Для использования нужно зарегистрироваться на https://www.metered.ca
      // И добавить credentials в .env файл
      
      // Альтернатива: использовать только STUN для мобильных сетей
      // WebRTC будет работать через signaling сервер, если STUN/TURN недоступны
    } catch (e) {
      console.warn('TURN server configuration error:', e)
    }
  }

  return servers
}

// Опция для работы только через signaling сервер (без WebRTC)
// Установите в .env: VITE_USE_WEBRTC=false для максимальной стабильности
const useWebRTC = import.meta.env.VITE_USE_WEBRTC !== 'false'

export const config = {
  signalingUrl: getSignalingUrl(),
  iceServers: getIceServers(),
  useWebRTC: useWebRTC
}
