import React from 'react'

/**
 * Логотип STORK — аист, доставляющий сообщения
 */
const StorkLogo = ({ size = 40, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Крыло (тёмное) */}
    <path
      d="M14 38 C 20 28 32 24 44 28 C 50 30 52 26 48 24 C 40 20 26 24 18 32 Z"
      fill="#2d3748"
    />
    {/* Тело (белое) */}
    <ellipse cx="28" cy="40" rx="12" ry="10" fill="#fff" stroke="#2d3748" strokeWidth="1.5" />
    {/* Шея и голова */}
    <path
      d="M22 32 L 14 18 L 12 8"
      stroke="#fff"
      strokeWidth="5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M22 32 L 14 18 L 12 8"
      stroke="#2d3748"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Голова */}
    <circle cx="14" cy="10" r="5" fill="#fff" stroke="#2d3748" strokeWidth="1.5" />
    <circle cx="15" cy="9" r="1" fill="#2d3748" />
    {/* Клюв */}
    <path d="M18 11 L 30 10 L 28 14 L 18 13 Z" fill="#dd6b20" />
    {/* Пузырь сообщения (зелёный — цвет мессенджера) */}
    <g transform="translate(24, 2)">
      <rect x="0" y="0" width="18" height="18" rx="4" fill="#25d366" />
      <path d="M6 8 L 14 8 M 6 13 L 12 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  </svg>
)

export default StorkLogo
