import React, { useEffect, useRef, useState } from 'react'
import './MessageList.css'

const openAttachment = (attachment) => {
  const { data, fileName } = attachment
  if (!data) return
  const match = data.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    window.open(data, '_blank')
    return
  }
  const mime = match[1] || 'application/octet-stream'
  const ext = (fileName || '').toLowerCase().split('.').pop()
  const canDisplay = ['pdf', 'txt'].includes(ext) || mime === 'application/pdf' || mime?.startsWith('text/')
  try {
    const binary = atob(match[2])
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    if (canDisplay) {
      a.target = '_blank'
      a.rel = 'noopener'
    } else {
      a.download = fileName || 'file'
    }
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
  } catch (e) {
    console.error('Failed to open attachment:', e)
    const a = document.createElement('a')
    a.href = data
    a.download = fileName || 'file'
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}

const MessageList = ({ messages, isGroup }) => {
  const messagesEndRef = useRef(null)
  const [lightboxImage, setLightboxImage] = useState(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="empty-messages">
          <p>Нет сообщений</p>
          <span>Начните переписку</span>
        </div>
      ) : (
        messages.map((message, index) => (
          <div
            key={`${message.id}-${index}`}
            className={`message ${message.isOwn ? 'message-own' : 'message-other'}`}
          >
            <div className="message-bubble">
              {isGroup && !message.isOwn && (message.senderName || message.senderId) && (
                <span className="message-sender">{message.senderName || message.senderId}</span>
              )}
              {message.attachment && (
                <div className="message-attachment">
                  {message.attachment.type === 'image' && (
                    <button
                      type="button"
                      className="message-attachment-img-btn"
                      onClick={() => setLightboxImage(message.attachment.data)}
                    >
                      <img src={message.attachment.data} alt="" className="message-attachment-img" />
                    </button>
                  )}
                  {message.attachment.type === 'video' && (
                    <video src={message.attachment.data} controls className="message-attachment-video" />
                  )}
                  {message.attachment.type === 'document' && (
                    <button
                      type="button"
                      className="message-attachment-doc"
                      onClick={() => openAttachment(message.attachment)}
                    >
                      📄 {message.attachment.fileName}
                    </button>
                  )}
                </div>
              )}
              {message.text && <p className="message-text">{message.text}</p>}
              <span className="message-time">{formatTime(message.timestamp)}</span>
            </div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
      {lightboxImage && (
        <div
          className="message-lightbox"
          onClick={() => setLightboxImage(null)}
        >
          <button type="button" className="message-lightbox-close" onClick={() => setLightboxImage(null)}>×</button>
          <img
            src={lightboxImage}
            alt=""
            className="message-lightbox-img"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

export default MessageList
