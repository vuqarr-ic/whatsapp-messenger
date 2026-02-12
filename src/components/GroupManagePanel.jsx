import React, { useState } from 'react'
import { useChat } from '../context/ChatContext'
import './GroupManagePanel.css'

const MAX_GROUP_PARTICIPANTS = 100

const GroupManagePanel = ({ chat, onClose }) => {
  const {
    myPeerId,
    isGroupAdmin,
    isGroupCreator,
    addGroupParticipant,
    removeGroupParticipant,
    setGroupAdmin
  } = useChat()

  const [newParticipantId, setNewParticipantId] = useState('')
  const [error, setError] = useState('')

  const participants = (chat.participants || []).map(p => p.peerId || p)
  const allMembers = [...participants, myPeerId].filter(Boolean)
  const admins = chat.admins || []
  // Права: админ, создатель, или участник в группе без админов (для старых групп)
  const canManage =
    isGroupAdmin(chat) ||
    isGroupCreator(chat) ||
    (chat.type === 'group' && admins.length === 0 && allMembers.includes(myPeerId))

  const handleAdd = () => {
    setError('')
    const ok = addGroupParticipant(chat.id, newParticipantId)
    if (ok) {
      setNewParticipantId('')
    } else {
      if (participants.length >= MAX_GROUP_PARTICIPANTS - 1) {
        setError(`Максимум ${MAX_GROUP_PARTICIPANTS} участников`)
      } else if (newParticipantId.trim() === myPeerId) {
        setError('Нельзя добавить себя')
      } else {
        setError('Не удалось добавить участника')
      }
    }
  }

  const handleRemove = (peerId) => {
    if (peerId === chat.createdBy) return
    removeGroupParticipant(chat.id, peerId)
  }

  const handleToggleAdmin = (peerId) => {
    if (!isGroupCreator(chat)) return
    const isAdmin = admins.includes(peerId)
    setGroupAdmin(chat.id, peerId, !isAdmin)
  }

  return (
    <div className="group-manage-overlay" onClick={onClose}>
      <div className="group-manage-panel" onClick={e => e.stopPropagation()}>
        <div className="group-manage-header">
          <h2>Участники группы</h2>
          <button className="group-manage-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="group-manage-name">{chat.name}</div>

        {canManage && (
          <div className="group-manage-add">
            <input
              type="text"
              value={newParticipantId}
              onChange={e => setNewParticipantId(e.target.value)}
              placeholder="Peer ID для добавления"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            />
            <button disabled={participants.length >= MAX_GROUP_PARTICIPANTS - 1} onClick={handleAdd}>
              Добавить
            </button>
          </div>
        )}
        {error && <div className="group-manage-error">{error}</div>}

        <div className="group-manage-list">
          {allMembers.map(peerId => {
            const isAdmin = admins.includes(peerId)
            const isCreator = peerId === chat.createdBy
            const isMe = peerId === myPeerId

            return (
              <div key={peerId} className="group-manage-item">
                <div className="group-manage-item-info">
                  <code className="group-manage-peer">{peerId}</code>
                  <span className="group-manage-badges">
                    {isMe && <span className="badge me">Вы</span>}
                    {isCreator && <span className="badge creator">Создатель</span>}
                    {isAdmin && !isCreator && <span className="badge admin">Админ</span>}
                  </span>
                </div>
                <div className="group-manage-item-actions">
                  {isGroupCreator(chat) && !isCreator && (
                    <button
                      type="button"
                      className="btn-admin"
                      onClick={() => handleToggleAdmin(peerId)}
                      title={isAdmin ? 'Снять права админа' : 'Сделать админом'}
                    >
                      {isAdmin ? '👑' : '⬆'}
                    </button>
                  )}
                  {canManage && !isMe && !isCreator && (
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => handleRemove(peerId)}
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="group-manage-footer">
          <span>{allMembers.length} / {MAX_GROUP_PARTICIPANTS}</span>
          <button className="btn-done" onClick={onClose}>Готово</button>
        </div>
      </div>
    </div>
  )
}

export default GroupManagePanel
