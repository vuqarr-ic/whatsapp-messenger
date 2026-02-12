import React, { useRef } from 'react'
import './AvatarPicker.css'

const MAX_SIZE = 128

const resizeImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > height) {
          if (width > MAX_SIZE) {
            height = (height * MAX_SIZE) / width
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width = (width * MAX_SIZE) / height
            height = MAX_SIZE
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const AvatarPicker = ({ currentAvatar, onSelect, onRemove, onClose }) => {
  const inputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    try {
      const dataUrl = await resizeImage(file)
      onSelect?.(dataUrl)
      onClose?.()
    } catch (err) {
      console.error('Avatar load error:', err)
      alert('Не удалось загрузить изображение')
    }
    e.target.value = ''
  }

  const handleRemove = () => {
    onRemove?.()
    onClose?.()
  }

  return (
    <div className="avatar-picker-overlay" onClick={onClose}>
      <div className="avatar-picker" onClick={e => e.stopPropagation()}>
        <h3>Аватар</h3>
        {currentAvatar && (
          <div className="avatar-picker-preview">
            <img src={currentAvatar} alt="Текущий аватар" />
          </div>
        )}
        <div className="avatar-picker-actions">
          <button
            type="button"
            className="avatar-picker-btn primary"
            onClick={() => inputRef.current?.click()}
          >
            Выбрать фото
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            hidden
          />
          {currentAvatar && (
            <button
              type="button"
              className="avatar-picker-btn remove"
              onClick={handleRemove}
            >
              Удалить
            </button>
          )}
          <button type="button" className="avatar-picker-btn" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}

export default AvatarPicker
