import React from 'react'
import './ChatAvatar.css'

const AVATAR_COLORS = [
  '#667eea',
  '#764ba2',
  '#f093fb',
  '#4facfe',
  '#43e97b',
  '#fa709a',
  '#fee140',
  '#30cfd0'
]

const getColorForName = (name) => {
  const index = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[Math.abs(index) % AVATAR_COLORS.length]
}

const ChatAvatar = ({ chat, size = 49 }) => {
  const hasAvatar = chat?.avatar
  const isGroup = chat?.type === 'group'
  const initial = chat?.name?.charAt(0)?.toUpperCase() || '?'

  if (hasAvatar) {
    return (
      <div
        className="chat-avatar chat-avatar-image"
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        <img src={chat.avatar} alt={chat.name} />
      </div>
    )
  }

  if (isGroup) {
    return (
      <div
        className="chat-avatar chat-avatar-group"
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          background: getColorForName(chat.name)
        }}
      >
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      </div>
    )
  }

  return (
    <div
      className="chat-avatar chat-avatar-initial"
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        background: `linear-gradient(135deg, ${getColorForName(chat.name)} 0%, ${getColorForName(chat.name + '1')} 100%)`,
        fontSize: size * 0.45
      }}
    >
      {initial}
    </div>
  )
}

export default ChatAvatar
