import React, { useState } from 'react'
import { useChat } from '../context/ChatContext'
import ChatContextMenu from './ChatContextMenu'
import ChatAvatar from './ChatAvatar'
import NicknameModal from './NicknameModal'
import StorkLogo from './StorkLogo'
import './ChatList.css'

const ChatList = ({ onSelectChat, onNewChat, onChatDeleted }) => {
  const { chats, myNickname, setMyNickname } = useChat()
  const [contextMenu, setContextMenu] = useState(null)
  const [showNicknameModal, setShowNicknameModal] = useState(false)

  const handleContextMenu = (e, chat) => {
    e.preventDefault()
    setContextMenu({
      chat,
      position: { x: e.clientX, y: e.clientY }
    })
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return 'сейчас'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <div className="chat-list-brand">
          <StorkLogo size={36} className="stork-logo" />
          <h1>STORK</h1>
        </div>
        <div className="chat-list-header-actions">
          <button
            className="new-chat-icon nickname-btn"
            onClick={() => setShowNicknameModal(true)}
            title={myNickname ? `Ник: ${myNickname}` : 'Установить ник'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <button className="new-chat-icon" onClick={onNewChat} title="Новый чат">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
          </svg>
        </button>
        </div>
      </div>
      {showNicknameModal && (
        <NicknameModal
          currentNickname={myNickname}
          onSave={setMyNickname}
          onClose={() => setShowNicknameModal(false)}
        />
      )}
      <div className="chat-list-items">
        {chats.length === 0 ? (
          <div className="empty-chat-list">
            <p>Нет чатов</p>
            <button onClick={onNewChat} className="create-first-chat">
              Создать первый чат
            </button>
          </div>
        ) : (
          chats.map(chat => (
            <div
              key={chat.id}
              className={`chat-item ${chat.type === 'group' ? 'chat-item-group' : ''}`}
              onClick={() => onSelectChat(chat)}
              onContextMenu={e => handleContextMenu(e, chat)}
            >
              <div className="chat-avatar-wrap">
                <ChatAvatar chat={chat} size={49} />
              </div>
              <div className="chat-info">
                <div className="chat-header">
                  <span className="chat-name">{chat.name}</span>
                  <span className="chat-time">{formatTime(chat.lastMessageTime)}</span>
                </div>
                <div className="chat-footer">
                  <span className="chat-last-message">
                    {chat.lastMessage || 'Нет сообщений'}
                  </span>
                  {chat.unreadCount > 0 && (
                    <span className="chat-unread">{chat.unreadCount}</span>
                  )}
                </div>
                {chat.isConnected && (
                  <div className="chat-status connected">●</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {contextMenu && (
        <ChatContextMenu
          chat={contextMenu.chat}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onDelete={(chat) => {
            onChatDeleted?.(chat)
            setContextMenu(null)
          }}
        />
      )}
    </div>
  )
}

export default ChatList
