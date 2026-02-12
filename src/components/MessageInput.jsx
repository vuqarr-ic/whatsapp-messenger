import React, { useState, useRef, useEffect } from 'react'
import './MessageInput.css'

const ACCEPT_TYPES = 'image/*,video/*,.pdf,.doc,.docx,.txt,.xls,.xlsx'

const getFileType = (file) => {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'document'
}

const MessageInput = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('')
  const [pendingAttachment, setPendingAttachment] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file || disabled) return
    const reader = new FileReader()
    reader.onload = () => {
      setPendingAttachment({
        type: getFileType(file),
        data: reader.result,
        fileName: file.name
      })
    }
    reader.onerror = () => {
      alert('Ошибка при чтении файла')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const text = message.trim()
    if ((text || pendingAttachment) && !disabled && !isSending) {
      setIsSending(true)
      const attachment = pendingAttachment
      onSend(text || '', attachment)
      setMessage('')
      setPendingAttachment(null)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
      setTimeout(() => setIsSending(false), 100)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const clearAttachment = () => setPendingAttachment(null)

  return (
    <div className="message-input-container">
      {pendingAttachment && (
        <div className="message-attachment-preview">
          {pendingAttachment.type === 'image' && (
            <img src={pendingAttachment.data} alt="" className="attachment-preview-img" />
          )}
          {pendingAttachment.type === 'video' && (
            <video src={pendingAttachment.data} className="attachment-preview-video" />
          )}
          {pendingAttachment.type === 'document' && (
            <span className="attachment-preview-doc">📄 {pendingAttachment.fileName}</span>
          )}
          <button type="button" className="attachment-preview-remove" onClick={clearAttachment}>×</button>
        </div>
      )}
      <form className="message-input-form" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_TYPES}
          onChange={handleFileSelect}
          className="message-file-input"
        />
        <button
          type="button"
          className="attach-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Фото, видео, документ"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="message-input-wrapper">
          <textarea
            ref={textareaRef}
            className="message-input"
            placeholder={disabled ? "Подключение..." : "Введите сообщение"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            rows={1}
          />
          <button
            type="submit"
            className="send-button"
            disabled={(!message.trim() && !pendingAttachment) || disabled || isSending}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}

export default MessageInput
