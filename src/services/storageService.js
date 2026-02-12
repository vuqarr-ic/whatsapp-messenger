const CHATS_KEY_PREFIX = 'whatsapp_chats_'
const MESSAGES_PREFIX = 'whatsapp_messages_'
const PEER_ID_KEY = 'whatsapp_peer_id'
const NICKNAME_KEY_PREFIX = 'whatsapp_nickname_'

export const storageService = {
  getChats(ownerPeerId) {
    try {
      const key = CHATS_KEY_PREFIX + ownerPeerId
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error loading chats:', error)
      return []
    }
  },

  saveChats(ownerPeerId, chats) {
    try {
      const key = CHATS_KEY_PREFIX + ownerPeerId
      localStorage.setItem(key, JSON.stringify(chats))
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Consider clearing old data.')
        alert('Недостаточно места в хранилище. Удалите старые чаты или сообщения.')
      } else {
        console.error('Error saving chats:', error)
      }
    }
  },

  getMessages(ownerPeerId, chatId) {
    try {
      const key = MESSAGES_PREFIX + ownerPeerId + '_' + chatId
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error loading messages:', error)
      return []
    }
  },

  saveMessages(ownerPeerId, chatId, messages) {
    try {
      const key = MESSAGES_PREFIX + ownerPeerId + '_' + chatId
      localStorage.setItem(key, JSON.stringify(messages))
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Consider clearing old messages.')
        alert('Недостаточно места в хранилище. Удалите старые сообщения.')
      } else {
        console.error('Error saving messages:', error)
      }
    }
  },

  deleteMessages(ownerPeerId, chatId) {
    try {
      localStorage.removeItem(MESSAGES_PREFIX + ownerPeerId + '_' + chatId)
    } catch (error) {
      console.error('Error deleting messages:', error)
    }
  },

  getAllMessages(ownerPeerId) {
    const chats = this.getChats(ownerPeerId)
    const messages = {}
    
    chats.forEach(chat => {
      messages[chat.id] = this.getMessages(ownerPeerId, chat.id)
    })
    
    return messages
  },

  getMyPeerId() {
    try {
      // Используем localStorage для сохранения peerId между сессиями
      // Это позволяет сохранять чаты и сообщения при перезагрузке страницы
      return localStorage.getItem(PEER_ID_KEY)
    } catch (error) {
      console.error('Error loading peer ID:', error)
      return null
    }
  },

  saveMyPeerId(peerId) {
    try {
      localStorage.setItem(PEER_ID_KEY, peerId)
    } catch (error) {
      console.error('Error saving peer ID:', error)
    }
  },

  getMyNickname(peerId) {
    try {
      const key = NICKNAME_KEY_PREFIX + (peerId || '')
      return localStorage.getItem(key) || ''
    } catch (error) {
      console.error('Error loading nickname:', error)
      return ''
    }
  },

  saveMyNickname(peerId, nickname) {
    try {
      const key = NICKNAME_KEY_PREFIX + (peerId || '')
      localStorage.setItem(key, (nickname || '').trim())
    } catch (error) {
      console.error('Error saving nickname:', error)
    }
  },

  clearAll() {
    try {
      // Полная очистка всех данных мессенджера (для отладки)
      Object.keys(localStorage)
        .filter(key => key.startsWith(CHATS_KEY_PREFIX) || key.startsWith(MESSAGES_PREFIX) || key.startsWith(NICKNAME_KEY_PREFIX))
        .forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.error('Error clearing storage:', error)
    }
  }
}
