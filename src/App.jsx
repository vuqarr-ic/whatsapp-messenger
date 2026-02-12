import React, { useState } from 'react'
import ChatList from './components/ChatList'
import ChatWindow from './components/ChatWindow'
import ConnectionPanel from './components/ConnectionPanel'
import StorkLogo from './components/StorkLogo'
import { ChatProvider } from './context/ChatContext'
import './App.css'

function App() {
  const [currentChat, setCurrentChat] = useState(null)
  const [showConnectionPanel, setShowConnectionPanel] = useState(false)

  return (
    <ChatProvider>
      <div className="app">
        <div className="app-container">
          <ChatList 
            onSelectChat={setCurrentChat}
            onNewChat={() => setShowConnectionPanel(true)}
            onChatDeleted={(chat) => {
              if (currentChat?.id === chat?.id) setCurrentChat(null)
            }}
          />
          {currentChat ? (
            <ChatWindow 
              chat={currentChat}
              onBack={() => setCurrentChat(null)}
            />
          ) : (
            <div className="empty-chat">
              <div className="empty-chat-content">
                <StorkLogo size={120} className="empty-chat-logo" />
                <h2>Выберите чат или создайте новый</h2>
                <button 
                  className="new-chat-button"
                  onClick={() => setShowConnectionPanel(true)}
                >
                  Новый чат
                </button>
              </div>
            </div>
          )}
        </div>
        {showConnectionPanel && (
          <ConnectionPanel 
            onClose={() => setShowConnectionPanel(false)}
            onChatCreated={(chat) => {
              setCurrentChat(chat)
              setShowConnectionPanel(false)
            }}
          />
        )}
      </div>
    </ChatProvider>
  )
}

export default App
