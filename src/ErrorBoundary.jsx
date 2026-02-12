import React from 'react'

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 24,
          fontFamily: 'system-ui',
          background: '#1e1e1e',
          color: '#fff',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16
        }}>
          <h2 style={{ color: '#ff6b6b' }}>Ошибка приложения</h2>
          <pre style={{
            background: '#333',
            padding: 16,
            borderRadius: 8,
            overflow: 'auto',
            maxWidth: '90%',
            fontSize: 12
          }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#25d366',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Обновить страницу
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
