import { useState } from 'react'
import type { Credentials, NotificationBody } from './api'
import { ChatSidebar } from './components/ChatSidebar'
import { Conversation } from './components/Conversation'
import { CredentialsForm } from './components/CredentialsForm'
import { clearCredentials, loadCredentials, saveCredentials } from './session'
import type { Chat, Message } from './types'
import { useNotifications } from './useNotifications'

export default function App() {
  const [credentials, setCredentials] = useState(loadCredentials)
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)

  const receiveError = useNotifications(credentials, (body: NotificationBody) => {
    const incoming = toIncomingMessage(body)
    if (!incoming) return

    const { message, chatName } = incoming
    setChats((current) =>
      current.some((chat) => chat.id === message.chatId)
        ? current
        : [...current, { id: message.chatId, title: chatName }],
    )
    setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]))
    setActiveChatId((current) => current ?? message.chatId)
  })

  const connect = (accepted: Credentials) => {
    saveCredentials(accepted)
    setCredentials(accepted)
  }

  const logout = () => {
    clearCredentials()
    setCredentials(null)
    setChats([])
    setMessages([])
    setActiveChatId(null)
  }

  const openChat = (chat: Chat) => {
    setChats((current) => (current.some((item) => item.id === chat.id) ? current : [...current, chat]))
    setActiveChatId(chat.id)
  }

  if (!credentials) return <CredentialsForm onReady={connect} />

  const activeChat = chats.find((chat) => chat.id === activeChatId)

  return (
    <div className="card workspace">
      <ChatSidebar
        credentials={credentials}
        chats={chats}
        activeChatId={activeChatId}
        onSelect={setActiveChatId}
        onCreate={openChat}
        onLogout={logout}
      />
      {activeChat ? (
        <Conversation
          credentials={credentials}
          chat={activeChat}
          messages={messages.filter((message) => message.chatId === activeChat.id)}
          onSent={(message) => setMessages((current) => [...current, message])}
        />
      ) : (
        <section className="conversation empty">
          <p className="placeholder">Создайте чат по номеру телефона, чтобы начать переписку.</p>
        </section>
      )}
      {receiveError && <p className="error floating">{receiveError}</p>}
    </div>
  )
}

function toIncomingMessage(body: NotificationBody) {
  if (body.typeWebhook !== 'incomingMessageReceived') return null
  if (body.messageData?.typeMessage !== 'textMessage') return null

  const chatId = body.senderData?.chatId
  const text = body.messageData.textMessageData?.textMessage
  if (!chatId || !text) return null

  const message: Message = {
    id: body.idMessage ?? `incoming-${Date.now()}`,
    chatId,
    text,
    outgoing: false,
    timestamp: body.timestamp ? body.timestamp * 1000 : Date.now(),
  }

  return { message, chatName: body.senderData?.chatName || body.senderData?.senderName || chatId }
}
