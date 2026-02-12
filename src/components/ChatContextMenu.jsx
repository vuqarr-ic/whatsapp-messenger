import React, { useState, useEffect } from 'react'
import { useChat } from '../context/ChatContext'
import AvatarPicker from './AvatarPicker'
import './ChatContextMenu.css'

const ChatContextMenu = ({ chat, position, onClose, onDelete, onRename }) => {
  const { deleteChat, renameChat, setChatAvatar } = useChat()
  const [showRenameInput, setShowRenameInput] = useState(false)
  const [renameValue, setRenameValue] = useState(chat?.name || '')
  const [showIdModal, setShowIdModal] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  useEffect(() => {
    const handleClick = () => onClose()
    const handleEscape = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const getDisplayId = () => {
    if (!chat) return ''
    const lines = [`ID чата: ${chat.id}`]
    if (chat.type === 'direct' && chat.peerId) {
      lines.push(`Peer ID: ${chat.peerId}`)
    }
    if (chat.type === 'group') {
      const participants = (chat.participants || []).map(p => p.peerId || p)
      participants.forEach((p, i) => lines.push(`Участник ${i + 1}: ${p}`))
    }
    return lines.join('\n')
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm(`Удалить "${chat.name}"? История сообщений будет удалена.`)) {
      deleteChat(chat.id)
      onDelete?.(chat)
    }
    onClose()
  }

  const handleRename = (e) => {
    e.stopPropagation()
    setShowRenameInput(true)
  }

  const submitRename = (e) => {
    e?.stopPropagation()
    if (renameValue.trim()) {
      renameChat(chat.id, renameValue.trim())
      onRename?.(chat)
    }
    setShowRenameInput(false)
    onClose()
  }

  const handleViewId = (e) => {
    e.stopPropagation()
    setShowIdModal(true)
  }

  const copyId = () => {
    navigator.clipboard.writeText(getDisplayId())
    alert('ID скопирован в буфер обмена')
  }

  if (!chat) return null

  return (
    <>
      <div
        className="chat-context-menu"
        style={{ left: position.x, top: position.y }}
        onClick={e => e.stopPropagation()}
      >
        {showRenameInput ? (
          <div className="context-menu-rename">
            <input
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitRename()}
              autoFocus
            />
            <button type="button" onClick={submitRename}>Готово</button>
          </div>
        ) : (
          <>
            <button type="button" onClick={handleViewId}>
              <span>Просмотр ID</span>
            </button>
            <button type="button" onClick={handleRename}>
              <span>Изменить название</span>
            </button>
            <button type="button" onClick={() => { setShowAvatarPicker(true) }}>
              <span>Изменить аватар</span>
            </button>
            <button type="button" className="context-menu-delete" onClick={handleDelete}>
              <span>Удалить</span>
            </button>
          </>
        )}
      </div>
      {showIdModal && (
        <div className="chat-id-modal-overlay" onClick={() => { setShowIdModal(false); onClose() }}>
          <div className="chat-id-modal" onClick={e => e.stopPropagation()}>
            <h3>ID и данные</h3>
            <pre className="chat-id-content">{getDisplayId()}</pre>
            <div className="chat-id-actions">
              <button type="button" onClick={copyId}>Копировать</button>
              <button type="button" onClick={() => { setShowIdModal(false); onClose() }}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
      {showAvatarPicker && (
        <AvatarPicker
          currentAvatar={chat?.avatar}
          onSelect={(dataUrl) => { setChatAvatar(chat.id, dataUrl); onClose() }}
          onRemove={() => setChatAvatar(chat.id, null)}
          onClose={() => { setShowAvatarPicker(false); onClose() }}
        />
      )}
    </>
  )
}

export default ChatContextMenu
