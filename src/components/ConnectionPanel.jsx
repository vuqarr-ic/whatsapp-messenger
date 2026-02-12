import React, { useState } from 'react'
import { useChat } from '../context/ChatContext'
import './ConnectionPanel.css'

const MAX_GROUP_PARTICIPANTS = 100

const ConnectionPanel = ({ onClose, onChatCreated }) => {
  const { createChat, createGroup, myPeerId } = useChat()
  const [mode, setMode] = useState('chat') // 'chat' | 'group'
  const [name, setName] = useState('')
  const [peerId, setPeerId] = useState('')
  const [participants, setParticipants] = useState([])
  const [newParticipantId, setNewParticipantId] = useState('')
  const [showMyId, setShowMyId] = useState(false)

  const handleSubmitChat = (e) => {
    e.preventDefault()
    if (name.trim() && peerId.trim()) {
      const chat = createChat(name.trim(), peerId.trim())
      onChatCreated(chat)
    }
  }

  const handleSubmitGroup = (e) => {
    e.preventDefault()
    if (name.trim() && participants.length > 0) {
      const group = createGroup(name.trim(), participants)
      onChatCreated(group)
    }
  }

  const addParticipant = () => {
    const id = newParticipantId.trim()
    if (!id || participants.includes(id) || id === myPeerId) return
    if (participants.length >= MAX_GROUP_PARTICIPANTS) {
      alert(`Максимум ${MAX_GROUP_PARTICIPANTS} участников`)
      return
    }
    setParticipants([...participants, id])
    setNewParticipantId('')
  }

  const removeParticipant = (id) => {
    setParticipants(participants.filter(p => p !== id))
  }

  const copyMyId = () => {
    navigator.clipboard.writeText(myPeerId)
    alert('ID скопирован в буфер обмена')
  }

  return (
    <div className="connection-panel-overlay" onClick={onClose}>
      <div className="connection-panel" onClick={(e) => e.stopPropagation()}>
        <div className="connection-panel-header">
          <h2>{mode === 'group' ? 'Новая группа' : 'Новый чат'}</h2>
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="connection-tabs">
          <button
            type="button"
            className={`connection-tab ${mode === 'chat' ? 'active' : ''}`}
            onClick={() => setMode('chat')}
          >
            Чат
          </button>
          <button
            type="button"
            className={`connection-tab ${mode === 'group' ? 'active' : ''}`}
            onClick={() => setMode('group')}
          >
            Группа
          </button>
        </div>

        {mode === 'chat' ? (
          <form className="connection-form" onSubmit={handleSubmitChat}>
            <div className="form-group">
              <label>Имя контакта</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите имя"
                required
              />
            </div>
            <div className="form-group">
              <label>Peer ID собеседника</label>
              <input
                type="text"
                value={peerId}
                onChange={(e) => setPeerId(e.target.value)}
                placeholder="Введите Peer ID"
                required
              />
            </div>
            <div className="my-peer-id-section">
              <button
                type="button"
                className="show-my-id-button"
                onClick={() => setShowMyId(!showMyId)}
              >
                {showMyId ? 'Скрыть' : 'Показать'} мой Peer ID
              </button>
              {showMyId && (
                <div className="my-peer-id">
                  <code>{myPeerId}</code>
                  <button type="button" onClick={copyMyId} className="copy-button">
                    Копировать
                  </button>
                </div>
              )}
            </div>
            <div className="form-actions">
              <button type="button" onClick={onClose} className="cancel-button">
                Отмена
              </button>
              <button type="submit" className="create-button">
                Создать чат
              </button>
            </div>
          </form>
        ) : (
          <form className="connection-form" onSubmit={handleSubmitGroup}>
            <div className="form-group">
              <label>Название группы</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите название"
                required
              />
            </div>
            <div className="form-group">
              <label>Участники (до {MAX_GROUP_PARTICIPANTS})</label>
              <div className="participant-input-row">
                <input
                  type="text"
                  value={newParticipantId}
                  onChange={(e) => setNewParticipantId(e.target.value)}
                  placeholder="Peer ID участника"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
                />
                <button type="button" onClick={addParticipant} className="add-participant-btn">
                  Добавить
                </button>
              </div>
              <div className="participants-list">
                {participants.map((p) => (
                  <div key={p} className="participant-chip">
                    <code>{p}</code>
                    <button type="button" onClick={() => removeParticipant(p)} className="remove-chip">×</button>
                  </div>
                ))}
              </div>
              <span className="participant-count">{participants.length} / {MAX_GROUP_PARTICIPANTS}</span>
            </div>
            <div className="my-peer-id-section">
              <button
                type="button"
                className="show-my-id-button"
                onClick={() => setShowMyId(!showMyId)}
              >
                {showMyId ? 'Скрыть' : 'Показать'} мой Peer ID
              </button>
              {showMyId && (
                <div className="my-peer-id">
                  <code>{myPeerId}</code>
                  <button type="button" onClick={copyMyId} className="copy-button">
                    Копировать
                  </button>
                </div>
              )}
            </div>
            <div className="form-actions">
              <button type="button" onClick={onClose} className="cancel-button">
                Отмена
              </button>
              <button type="submit" className="create-button" disabled={participants.length === 0}>
                Создать группу
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ConnectionPanel
