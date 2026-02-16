import React, { createContext, useContext, useState, useEffect } from 'react'
import { storageService } from '../services/storageService'
import { p2pService } from '../services/p2pService'

const ChatContext = createContext()

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within ChatProvider')
  }
  return context
}

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState({})
  const [myPeerId, setMyPeerId] = useState(null)
  const [myNickname, setMyNicknameState] = useState('')

  useEffect(() => {
    // Сначала определяем мой peerId (у каждой вкладки свой)
    const savedPeerId = storageService.getMyPeerId()

    // Корректно вычисляем peerId один раз
    let peerId = savedPeerId
    if (!peerId) {
      peerId = generatePeerId()
      storageService.saveMyPeerId(peerId)
    }
    setMyPeerId(peerId)

    // Загружаем чаты и сообщения, привязанные именно к этому peerId
    const savedChats = storageService.getChats(peerId)
    const savedMessages = storageService.getAllMessages(peerId)

    setChats(savedChats)
    setMessages(savedMessages)
    setMyNicknameState(storageService.getMyNickname(peerId))

    // Инициализируем P2P сервис
    p2pService.initialize({
      onMessage: handleIncomingMessage,
      onConnection: handleNewConnection,
      onGroupUpdate: handleGroupUpdate,
      onAvatarUpdate: handleAvatarUpdate,
      myPeerId: peerId
    })

    // Восстанавливаем подключения для уже существующих чатов
    savedChats.forEach(chat => {
      if (chat.type === 'direct' && chat.peerId) {
        p2pService.connectToPeer(chat.peerId, chat.id)
      }
    })

    // Очистка при размонтировании (важно в dev из‑за StrictMode)
    return () => {
      p2pService.cleanup()
    }
  }, [])

  const generatePeerId = () => {
    return 'peer_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
  }

  const handleIncomingMessage = (chatId, message) => {
    const newMessage = {
      id: message.id || (Date.now().toString() + '_' + Math.random().toString(36).slice(2, 8)),
      text: message.text || '',
      senderId: message.senderId,
      senderName: message.senderName || null,
      timestamp: message.timestamp || Date.now(),
      isOwn: false,
      attachment: message.attachment || null
    }

    addMessageToChat(chatId, newMessage, {
      isGroup: message.isGroup,
      groupName: message.groupName,
      participants: message.participants,
      createdBy: message.createdBy,
      admins: message.admins
    })
  }

  const handleGroupUpdate = (data) => {
    const { groupId, groupName, participants, admins, avatar } = data
    setChats(prevChats => {
      const idx = prevChats.findIndex(c => c.id === groupId)
      let updated
      if (idx >= 0) {
        updated = [...prevChats]
        updated[idx] = {
          ...updated[idx],
          name: groupName,
          participants: (participants || []).map(p => ({ peerId: p })),
          admins: admins || [],
          ...(avatar !== undefined && { avatar })
        }
      } else {
        const newGroup = {
          id: groupId,
          type: 'group',
          name: groupName,
          participants: (participants || []).map(p => ({ peerId: p })),
          admins: admins || [],
          createdBy: admins?.[0],
          lastMessage: '',
          lastMessageTime: Date.now(),
          isConnected: true,
          unreadCount: 0,
          ...(avatar !== undefined && { avatar })
        }
        updated = [...prevChats, newGroup]
      }
      const currentPeerId = storageService.getMyPeerId()
      if (currentPeerId) storageService.saveChats(currentPeerId, updated)
      return updated
    })
  }

  const handleAvatarUpdate = (fromPeerId, avatar) => {
    setChats(prevChats => {
      const idx = prevChats.findIndex(c => c.type === 'direct' && c.peerId === fromPeerId)
      if (idx < 0) return prevChats
      const updated = [...prevChats]
      updated[idx] = { ...updated[idx], avatar: avatar || null }
      const currentPeerId = storageService.getMyPeerId()
      if (currentPeerId) storageService.saveChats(currentPeerId, updated)
      return updated
    })
  }

  const handleNewConnection = (peerId, chatId) => {
    // Обновляем статус подключения чата
    setChats(prevChats => {
      const updated = prevChats.map(chat => 
        chat.id === chatId 
          ? { ...chat, isConnected: true, peerId }
          : chat
      )
      if (myPeerId) {
        storageService.saveChats(myPeerId, updated)
      }
      return updated
    })
  }

  const createChat = (name, peerId) => {
    const newChat = {
      id: Date.now().toString(),
      type: 'direct',
      name,
      peerId,
      lastMessage: '',
      lastMessageTime: Date.now(),
      isConnected: false,
      unreadCount: 0
    }

    const updatedChats = [...chats, newChat]
    setChats(updatedChats)
    if (myPeerId) {
      storageService.saveChats(myPeerId, updatedChats)
    }

    p2pService.connectToPeer(peerId, newChat.id)
    return newChat
  }

  const isGroupAdmin = (chat) => {
    if (!chat || chat.type !== 'group') return false
    const admins = chat.admins || []
    return admins.includes(myPeerId)
  }

  const isGroupCreator = (chat) => {
    return chat && chat.type === 'group' && chat.createdBy === myPeerId
  }

  const broadcastGroupUpdate = (chat) => {
    const participants = chat.participants || []
    const allParticipants = [...participants.map(p => p.peerId || p), myPeerId].filter(Boolean)
    p2pService.sendGroupUpdate(
      chat.id,
      chat.name,
      allParticipants.map(p => (typeof p === 'string' ? p : p.peerId)),
      chat.admins || [],
      allParticipants,
      chat.avatar
    )
  }

  const addGroupParticipant = (chatId, peerId) => {
    const chat = chats.find(c => c.id === chatId)
    if (!chat || chat.type !== 'group' || !isGroupAdmin(chat)) return false
    const pid = peerId.trim()
    if (!pid || pid === myPeerId) return false
    const participants = chat.participants || []
    if (participants.some(p => (p.peerId || p) === pid)) return false
    const max = 100
    if (participants.length + 2 > max) return false

    const newParticipants = [...participants, { peerId: pid }]
    const updatedChat = { ...chat, participants: newParticipants }
    setChats(prev => {
      const next = prev.map(c => c.id === chatId ? updatedChat : c)
      if (myPeerId) storageService.saveChats(myPeerId, next)
      return next
    })
    broadcastGroupUpdate(updatedChat)
    return true
  }

  const removeGroupParticipant = (chatId, peerId) => {
    const chat = chats.find(c => c.id === chatId)
    if (!chat || chat.type !== 'group' || !isGroupAdmin(chat)) return false
    if (peerId === chat.createdBy) return false
    const participants = (chat.participants || []).filter(p => (p.peerId || p) !== peerId)
    if (participants.length === chat.participants.length) return false

    const updatedChat = { ...chat, participants }
    setChats(prev => {
      const next = prev.map(c => c.id === chatId ? updatedChat : c)
      if (myPeerId) storageService.saveChats(myPeerId, next)
      return next
    })
    broadcastGroupUpdate(updatedChat)
    return true
  }

  const setGroupAdmin = (chatId, peerId, isAdmin) => {
    const chat = chats.find(c => c.id === chatId)
    if (!chat || chat.type !== 'group' || !isGroupCreator(chat)) return false
    const admins = chat.admins || []
    if (isAdmin) {
      if (admins.includes(peerId)) return true
      const newAdmins = [...admins, peerId]
      const updatedChat = { ...chat, admins: newAdmins }
      setChats(prev => {
        const next = prev.map(c => c.id === chatId ? updatedChat : c)
        if (myPeerId) storageService.saveChats(myPeerId, next)
        return next
      })
      broadcastGroupUpdate(updatedChat)
    } else {
      const newAdmins = admins.filter(a => a !== peerId)
      if (newAdmins.length === 0) return false
      const updatedChat = { ...chat, admins: newAdmins }
      setChats(prev => {
        const next = prev.map(c => c.id === chatId ? updatedChat : c)
        if (myPeerId) storageService.saveChats(myPeerId, next)
        return next
      })
      broadcastGroupUpdate(updatedChat)
    }
    return true
  }

  const createGroup = (name, participants) => {
    const groupId = 'group_' + Date.now()
    const participantList = participants.map(p => 
      typeof p === 'string' ? { peerId: p } : p
    )

    const newChat = {
      id: groupId,
      type: 'group',
      name,
      participants: participantList,
      createdBy: myPeerId,
      admins: [myPeerId],
      lastMessage: '',
      lastMessageTime: Date.now(),
      isConnected: true,
      unreadCount: 0
    }

    const updatedChats = [...chats, newChat]
    setChats(updatedChats)
    if (myPeerId) {
      storageService.saveChats(myPeerId, updatedChats)
    }
    return newChat
  }

  const addMessageToChat = (chatId, message, groupInfo = {}) => {
    setMessages(prevMessages => {
      const chatMessages = prevMessages[chatId] || []
      if (message.id && chatMessages.some(m => m.id === message.id)) {
        return prevMessages
      }
      const updated = {
        ...prevMessages,
        [chatId]: [...chatMessages, message]
      }
      if (myPeerId) {
        storageService.saveMessages(myPeerId, chatId, updated[chatId])
      }

      // Обновляем последнее сообщение в чате
      setChats(prevChats => {
        const existingChat = prevChats.find(chat => chat.id === chatId)
        let updatedChats

        const lastPreview = message.text || (message.attachment ? (message.attachment.type === 'image' ? 'Фото' : message.attachment.type === 'video' ? 'Видео' : 'Документ') : '')

        if (existingChat) {
          updatedChats = prevChats.map(chat => {
            if (chat.id !== chatId) return chat
            const updates = {
              lastMessage: lastPreview,
              lastMessageTime: message.timestamp,
              unreadCount: message.isOwn ? chat.unreadCount : chat.unreadCount + 1
            }
            if (!message.isOwn && message.senderName && chat.type === 'direct' && chat.peerId === message.senderId) {
              updates.name = message.senderName
            }
            return { ...chat, ...updates }
          })
        } else if (!message.isOwn) {
          if (groupInfo.isGroup) {
            const newChat = {
              id: chatId,
              type: 'group',
              name: groupInfo.groupName || 'Группа',
              participants: (groupInfo.participants || []).map(p => ({ peerId: p })),
              createdBy: groupInfo.createdBy,
              admins: groupInfo.admins || [groupInfo.createdBy || message.senderId].filter(Boolean),
              lastMessage: lastPreview,
              lastMessageTime: message.timestamp,
              isConnected: true,
              unreadCount: 1
            }
            updatedChats = [...prevChats, newChat]
          } else {
            const newChat = {
              id: chatId,
              type: 'direct',
              name: message.senderName || message.senderId || 'Новый контакт',
              peerId: message.senderId,
              lastMessage: lastPreview,
              lastMessageTime: message.timestamp,
              isConnected: true,
              unreadCount: 1
            }
            updatedChats = [...prevChats, newChat]
            if (newChat.peerId) {
              p2pService.connectToPeer(newChat.peerId, newChat.id)
            }
          }
        } else {
          updatedChats = prevChats
        }

        if (myPeerId) {
          storageService.saveChats(myPeerId, updatedChats)
        }
        return updatedChats
      })
      
      return updated
    })
  }

  const sendMessage = (chatId, text, attachment) => {
    const chat = chats.find(c => c.id === chatId)
    if (!chat) {
      alert('Чат не найден.')
      return
    }
    // Разрешаем отправку, если есть подключение к signaling серверу, даже без WebRTC
    const isSignalingConnected = p2pService.isSignalingConnected?.() || false
    if (!chat.isConnected && !isSignalingConnected) {
      alert('Чат не подключен. Дождитесь подключения.')
      return
    }
    // Если чат не помечен как подключенный, но signaling работает - обновляем статус
    if (!chat.isConnected && isSignalingConnected) {
      setChats(prevChats => {
        const updated = prevChats.map(c =>
          c.id === chatId ? { ...c, isConnected: true } : c
        )
        if (myPeerId) {
          storageService.saveChats(myPeerId, updated)
        }
        return updated
      })
    }

    const messageId = Date.now().toString() + '_' + Math.random().toString(36).slice(2, 8)
    const senderName = myNickname.trim() || null
    const message = {
      id: messageId,
      text: text || '',
      senderId: myPeerId,
      senderName,
      timestamp: Date.now(),
      isOwn: true,
      attachment: attachment || null
    }

    addMessageToChat(chatId, message)

    const lastPreview = attachment
      ? (attachment.type === 'image' ? 'Фото' : attachment.type === 'video' ? 'Видео' : 'Документ')
      : text

    if (chat.type === 'group') {
      const participants = chat.participants || []
      const allParticipants = [...participants.map(p => p.peerId || p), myPeerId].filter(Boolean)
      p2pService.sendGroupMessage(chat.id, chat.name, allParticipants, {
        id: messageId,
        senderName,
        text: text || '',
        senderId: myPeerId,
        timestamp: message.timestamp,
        createdBy: chat.createdBy,
        admins: chat.admins || [],
        attachment: attachment || null
      })
    } else {
      p2pService.sendMessage(chat.peerId, {
        id: messageId,
        chatId,
        text: text || '',
        senderId: myPeerId,
        senderName,
        timestamp: message.timestamp,
        attachment: attachment || null
      })
    }
  }

  const deleteChat = (chatId) => {
    p2pService.disconnect(chatId)
    setChats(prev => {
      const updated = prev.filter(c => c.id !== chatId)
      if (myPeerId) {
        storageService.saveChats(myPeerId, updated)
      }
      return updated
    })
    setMessages(prev => {
      const updated = { ...prev }
      delete updated[chatId]
      if (myPeerId) {
        storageService.deleteMessages(myPeerId, chatId)
      }
      return updated
    })
  }

  const renameChat = (chatId, newName) => {
    const name = newName?.trim()
    if (!name) return
    setChats(prev => {
      const updated = prev.map(c =>
        c.id === chatId ? { ...c, name } : c
      )
      if (myPeerId) storageService.saveChats(myPeerId, updated)
      return updated
    })
  }

  const setChatAvatar = (chatId, avatarDataUrl) => {
    const chat = chats.find(c => c.id === chatId)
    if (!chat) return
    setChats(prev => {
      const updated = prev.map(c =>
        c.id === chatId ? { ...c, avatar: avatarDataUrl || null } : c
      )
      if (myPeerId) storageService.saveChats(myPeerId, updated)
      return updated
    })
    if (chat.type === 'group') {
      if (isGroupAdmin(chat)) {
        const updatedChat = { ...chat, avatar: avatarDataUrl || null }
        broadcastGroupUpdate(updatedChat)
      }
    } else if (chat.peerId) {
      p2pService.sendAvatarUpdate(chat.peerId, avatarDataUrl || null)
    }
  }

  const setMyNickname = (nickname) => {
    const trimmed = (nickname || '').trim()
    setMyNicknameState(trimmed)
    if (myPeerId) {
      storageService.saveMyNickname(myPeerId, trimmed)
    }
  }

  const value = {
    chats,
    messages,
    myPeerId,
    myNickname,
    setMyNickname,
    createChat,
    createGroup,
    sendMessage,
    getChatMessages: (chatId) => messages[chatId] || [],
    isGroupAdmin,
    isGroupCreator,
    addGroupParticipant,
    removeGroupParticipant,
    setGroupAdmin,
    deleteChat,
    renameChat,
    setChatAvatar
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
