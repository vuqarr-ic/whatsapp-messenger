import React, { useState, useEffect } from 'react'
import './NicknameModal.css'

const NicknameModal = ({ currentNickname, onSave, onClose }) => {
  const [value, setValue] = useState(currentNickname || '')

  useEffect(() => {
    setValue(currentNickname || '')
  }, [currentNickname])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave?.(value.trim())
    onClose?.()
  }

  return (
    <div className="nickname-modal-overlay" onClick={onClose}>
      <div className="nickname-modal" onClick={e => e.stopPropagation()}>
        <h3>Ваш ник</h3>
        <p className="nickname-modal-hint">Как вас будут видеть в чатах</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Введите ник"
            maxLength={32}
            autoFocus
          />
          <div className="nickname-modal-actions">
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NicknameModal
