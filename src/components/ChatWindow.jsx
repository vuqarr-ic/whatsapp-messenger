import React, { useState } from 'react'
import { useChat } from '../context/ChatContext'
import MessageInput from './MessageInput'
import MessageList from './MessageList'
import GroupManagePanel from './GroupManagePanel'
import ChatAvatar from './ChatAvatar'
import './ChatWindow.css'

const ChatWindow = ({ chat, onBack }) => {
  const { chats, getChatMessages, sendMessage, isGroupAdmin } = useChat()
  const [showGroupManage, setShowGroupManage] = useState(false)
  const latestChat = chats.find(c => c.id === chat?.id) || chat
  const messages = getChatMessages(chat.id)
  const canManageGroup = latestChat.type === 'group' && isGroupAdmin(latestChat)

  const handleSendMessage = (text, attachment) => {
    if (text.trim() || attachment) {
      sendMessage(chat.id, text.trim(), attachment)
    }
  }

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <button className="back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="chat-header-info">
          <div className="chat-header-avatar">
            <ChatAvatar chat={latestChat} size={42} />
          </div>
          <div className="chat-header-details">
            <h2>{latestChat.name}</h2>
            <span className="chat-status-text">
              {latestChat.type === 'group'
                ? `Группа • ${Math.max(1, (latestChat.participants || []).length + 1)} участников`
                : latestChat.isConnected ? 'В сети' : 'Подключение...'}
            </span>
          </div>
        </div>
        {latestChat.type === 'group' && (
          <button
            className="group-manage-header-btn"
            onClick={() => setShowGroupManage(true)}
            title={canManageGroup ? 'Управление участниками' : 'Участники группы'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </button>
        )}
      </div>
      {showGroupManage && (
        <GroupManagePanel chat={latestChat} onClose={() => setShowGroupManage(false)} />
      )}
      <MessageList messages={messages} isGroup={latestChat.type === 'group'} />
      <MessageInput onSend={handleSendMessage} disabled={!latestChat.isConnected} />
    </div>
  )
}

export default ChatWindow
