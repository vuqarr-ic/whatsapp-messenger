/**
 * P2P сервис: WebRTC для реального обмена + fallback на localStorage для локальной разработки
 */

import SimplePeer from 'simple-peer'
import { config } from '../config'

const USE_WEBRTC = config.useWebRTC

class P2PService {
  constructor() {
    this.connections = new Map()
    this.onMessageCallback = null
    this.onConnectionCallback = null
    this.onGroupUpdateCallback = null
    this.onAvatarUpdateCallback = null
    this.isInitialized = false
    this.myPeerId = null
    this.storageListener = null
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.isCleaningUp = false
  }

  initialize({ onMessage, onConnection, onGroupUpdate, onAvatarUpdate, myPeerId }) {
    this.onMessageCallback = onMessage
    this.onConnectionCallback = onConnection
    this.onGroupUpdateCallback = onGroupUpdate
    this.onAvatarUpdateCallback = onAvatarUpdate
    this.myPeerId = myPeerId
    this.isInitialized = true
    this.isCleaningUp = false

    this.setupStorageListener()
    if (USE_WEBRTC) {
      this.connectSignaling()
    }
    console.log('P2P Service initialized, Peer ID:', myPeerId, USE_WEBRTC ? '(WebRTC)' : '(local)')
  }

  connectSignaling() {
    try {
      this.ws = new WebSocket(config.signalingUrl)
      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.ws.send(JSON.stringify({ type: 'register', peerId: this.myPeerId }))
      }
      this.ws.onmessage = (e) => {
        try {
          this.handleSignalingMessage(JSON.parse(e.data))
        } catch (err) {
          console.warn('Failed to parse signaling message:', err)
        }
      }
      this.ws.onclose = () => {
        if (!this.isCleaningUp && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          setTimeout(() => this.connectSignaling(), 2000 * this.reconnectAttempts)
        }
      }
      this.ws.onerror = () => {
        if (this.isCleaningUp) return
      }
    } catch (e) {
      console.warn('Signaling unavailable, using localStorage fallback')
      this.setupStorageListener()
    }
  }

  handleSignalingMessage(msg) {
    if (msg.type === 'signal') {
      this.handlePeerSignal(msg.fromPeerId, msg.signal, msg.chatId)
    } else if (msg.type === 'group_signal') {
      this.handlePeerSignal(msg.fromPeerId, msg.signal, msg.chatId, msg.targetPeerId)
    } else if (msg.type === 'direct_message' || msg.type === 'group_message') {
      if (msg.targetPeerId === this.myPeerId && this.onMessageCallback) {
        const p = msg.payload || {}
        this.onMessageCallback(msg.chatId, {
          ...p,
          chatId: p.chatId || msg.chatId
        })
      }
    } else if (msg.type === 'group_update') {
      if (msg.targetPeerId === this.myPeerId && this.onGroupUpdateCallback) {
        this.onGroupUpdateCallback(msg.data)
      }
    } else if (msg.type === 'avatar_update') {
      if (msg.targetPeerId === this.myPeerId && this.onAvatarUpdateCallback) {
        this.onAvatarUpdateCallback(msg.fromPeerId, msg.avatar)
      }
    }
  }

  sendSignal(targetPeerId, signal, chatId, targetPeerIds = null) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    if (targetPeerIds) {
      this.ws.send(JSON.stringify({
        type: 'group_signal',
        targetPeerIds,
        signal,
        chatId
      }))
    } else {
      this.ws.send(JSON.stringify({
        type: 'signal',
        targetPeerId,
        signal,
        chatId
      }))
    }
  }

  handlePeerSignal(fromPeerId, signal, chatId, targetPeerId = null) {
    const key = chatId
    let conn = this.connections.get(key)

    if (!conn) {
      const isInitiator = false
      conn = this.createPeerConnection(key, fromPeerId, chatId, isInitiator)
      this.connections.set(key, conn)
    }

    try {
      conn.peer.signal(signal)
    } catch (e) {
      console.warn('Signal error:', e)
    }
  }

  createPeerConnection(key, peerId, chatId, initiator) {
    const peer = new SimplePeer({
      initiator,
      trickle: true,
      config: { iceServers: config.iceServers }
    })

    peer.on('signal', (signal) => {
      const conn = this.connections.get(key)
      if (conn?.peerId) {
        this.sendSignal(conn.peerId, signal, chatId)
      }
    })

    peer.on('connect', () => {
      const conn = this.connections.get(key)
      if (conn) {
        conn.connected = true
        if (this.onConnectionCallback) {
          this.onConnectionCallback(peerId, chatId)
        }
      }
    })

    peer.on('data', (data) => {
      try {
        const envelope = JSON.parse(data.toString())
        if (envelope.targetPeerId === this.myPeerId && this.onMessageCallback) {
          this.onMessageCallback(envelope.chatId, envelope.payload || envelope)
        }
      } catch (e) {
        console.error('Parse error:', e)
      }
    })

    peer.on('error', (err) => console.warn('Peer error:', err))
    peer.on('close', () => this.connections.delete(key))

    return { peer, peerId, chatId, connected: false }
  }

  connectToPeer(peerId, chatId) {
    if (!this.isInitialized) return

    const key = chatId
    if (this.connections.has(key)) return

    if (this.ws?.readyState === WebSocket.OPEN) {
      const conn = this.createPeerConnection(key, peerId, chatId, true)
      this.connections.set(key, conn)
    } else {
      this.connections.set(key, { peerId, connected: true, chatId })
      setTimeout(() => {
        if (this.onConnectionCallback) this.onConnectionCallback(peerId, chatId)
      }, 500)
    }
  }

  setupStorageListener() {
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener)
    }
    this.storageListener = (e) => {
      if (e.key?.startsWith('p2p_avatar_update_')) {
        try {
          const data = e.newValue ? JSON.parse(e.newValue) : null
          if (data?.targetPeerId === this.myPeerId && this.onAvatarUpdateCallback) {
            this.onAvatarUpdateCallback(data.fromPeerId, data.avatar)
            localStorage.removeItem(e.key)
          }
        } catch (err) {}
        return
      }
      if (e.key?.startsWith('p2p_group_update_')) {
        try {
          const data = e.newValue ? JSON.parse(e.newValue) : null
          if (data?.targetPeerId === this.myPeerId && this.onGroupUpdateCallback) {
            this.onGroupUpdateCallback(data)
            localStorage.removeItem(e.key)
          }
        } catch (err) {}
        return
      }
      if (e.key?.startsWith('p2p_message_')) {
        try {
          const m = e.newValue ? JSON.parse(e.newValue) : null
          if (m?.targetPeerId === this.myPeerId && this.onMessageCallback) {
            this.onMessageCallback(m.chatId, {
              text: m.text,
              senderId: m.senderPeerId,
              senderName: m.senderName,
              id: m.id,
              timestamp: m.timestamp,
              isGroup: m.isGroup,
              groupName: m.groupName,
              participants: m.participants,
              createdBy: m.createdBy,
              admins: m.admins,
              attachment: m.attachment
            })
            localStorage.removeItem(e.key)
          }
        } catch (err) {}
      }
    }
    window.addEventListener('storage', this.storageListener)
  }

  sendViaWebRTC(peerId, payload) {
    const conn = Array.from(this.connections.values()).find(c => c.peerId === peerId && c.connected)
    if (conn?.peer) {
      try {
        const messageStr = JSON.stringify({
          targetPeerId: peerId,
          chatId: payload.chatId,
          payload: {
            text: payload.text,
            senderId: payload.senderId,
            senderName: payload.senderName,
            id: payload.id,
            timestamp: payload.timestamp,
            attachment: payload.attachment
          }
        })
        const messageSize = new Blob([messageStr]).size
        if (messageSize > 64 * 1024) {
          console.warn('Message too large for WebRTC data channel, falling back to signaling')
          return false
        }
        conn.peer.send(messageStr)
        return true
      } catch (e) {
        console.warn('Failed to send via WebRTC:', e)
        return false
      }
    }
    return false
  }

  sendViaSignaling(targetPeerId, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'group_message',
        targetPeerId,
        chatId: payload.chatId,
        payload
      }))
      return true
    }
    return false
  }

  sendMessage(peerId, message) {
    const conn = Array.from(this.connections.values()).find(c => c.peerId === peerId)
    if (!conn) {
      console.warn('Connection not found for peer:', peerId)
      return false
    }

    const payload = {
      text: message.text,
      senderId: this.myPeerId,
      senderName: message.senderName || null,
      id: message.id,
      timestamp: message.timestamp || Date.now(),
      attachment: message.attachment,
      chatId: conn.chatId
    }

    // Пробуем отправить через WebRTC, если соединение установлено
    if (conn.connected && conn.peer) {
      const sent = this.sendViaWebRTC(peerId, payload)
      if (sent) {
        return true
      }
      // Если WebRTC не сработал, продолжаем через signaling
    }

    // Отправляем через signaling сервер (более надёжно)
    if (USE_WEBRTC && this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({
          type: 'direct_message',
          targetPeerId: peerId,
          chatId: conn.chatId,
          payload: {
            text: payload.text,
            senderId: payload.senderId,
            senderName: payload.senderName,
            id: payload.id,
            timestamp: payload.timestamp,
            attachment: payload.attachment
          }
        }))
        return true
      } catch (e) {
        console.warn('Failed to send via signaling:', e)
      }
    }

    // Fallback на localStorage (для локальной разработки)
    const key = `p2p_message_${Date.now()}_${Math.random()}`
    const data = {
      senderPeerId: this.myPeerId,
      targetPeerId: peerId,
      chatId: conn.chatId,
      text: payload.text,
      senderId: payload.senderId,
      senderName: payload.senderName,
      id: payload.id,
      timestamp: payload.timestamp,
      attachment: payload.attachment
    }
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (e) {
      return false
    }
  }

  sendGroupMessage(groupId, groupName, participants, message) {
    if (!this.isInitialized) return false

    const participantIds = participants.map(p => (typeof p === 'string' ? p : p.peerId))
    const payload = {
      text: message.text,
      senderId: this.myPeerId,
      senderName: message.senderName || null,
      id: message.id,
      timestamp: message.timestamp || Date.now(),
      attachment: message.attachment,
      chatId: groupId,
      isGroup: true,
      groupName,
      participants: participantIds,
      createdBy: message.createdBy,
      admins: message.admins
    }

    if (USE_WEBRTC && this.ws?.readyState === WebSocket.OPEN) {
      participantIds.forEach(targetPeerId => {
        if (targetPeerId === this.myPeerId) return
        this.ws.send(JSON.stringify({
          type: 'group_message',
          targetPeerId,
          chatId: groupId,
          payload: { ...payload, targetPeerId }
        }))
      })
      return true
    }

    let sent = 0
    participantIds.forEach(targetPeerId => {
      if (targetPeerId === this.myPeerId) return
      const key = `p2p_message_${Date.now()}_${Math.random()}_${targetPeerId}`
      const data = { ...payload, targetPeerId }
      try {
        localStorage.setItem(key, JSON.stringify(data))
        sent++
      } catch (e) {}
    })
    return sent > 0
  }

  sendGroupUpdate(groupId, groupName, participants, admins, targetPeerIds, avatar = null) {
    if (!this.isInitialized) return false

    const data = { groupId, groupName, participants, admins, avatar }

    if (USE_WEBRTC && this.ws?.readyState === WebSocket.OPEN) {
      targetPeerIds.forEach(targetPeerId => {
        if (targetPeerId === this.myPeerId) return
        this.ws.send(JSON.stringify({
          type: 'group_update',
          targetPeerId,
          data
        }))
      })
      return true
    }

    targetPeerIds.forEach(targetPeerId => {
      if (targetPeerId === this.myPeerId) return
      const key = `p2p_group_update_${Date.now()}_${Math.random()}_${targetPeerId}`
      try {
        localStorage.setItem(key, JSON.stringify({ ...data, targetPeerId }))
      } catch (e) {}
    })
    return true
  }

  sendAvatarUpdate(targetPeerId, avatar) {
    if (!this.isInitialized) return false
    if (USE_WEBRTC && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'avatar_update',
        targetPeerId,
        fromPeerId: this.myPeerId,
        avatar
      }))
      return true
    }
    try {
      const key = `p2p_avatar_update_${Date.now()}_${Math.random()}`
      localStorage.setItem(key, JSON.stringify({
        targetPeerId,
        fromPeerId: this.myPeerId,
        avatar
      }))
      return true
    } catch (e) {
      return false
    }
  }

  disconnect(chatId) {
    const conn = this.connections.get(chatId)
    if (conn?.peer) {
      conn.peer.destroy()
    }
    this.connections.delete(chatId)
  }

  cleanup() {
    this.isCleaningUp = true
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener)
    }
    this.connections.forEach(c => c.peer?.destroy())
    this.connections.clear()
    if (this.ws) {
      this.ws.onclose = null
      this.ws.onerror = null
      if (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN) {
        this.ws.close()
      }
      this.ws = null
    }
  }
}

export const p2pService = new P2PService()
