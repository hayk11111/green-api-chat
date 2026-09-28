import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Credentials } from '../api'
import { sendMessage } from '../api'
import type { Chat, Message } from '../types'

type Props = {
  credentials: Credentials
  chat: Chat
  messages: Message[]
  onSent: (message: Message) => void
}

export function Conversation({ credentials, chat, messages, onSent }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const outgoing = text.trim()
    if (!outgoing) return

    setSending(true)
    setError(null)
    try {
      const idMessage = await sendMessage(credentials, chat.id, outgoing)
      onSent({
        id: idMessage || `local-${Date.now()}`,
        chatId: chat.id,
        text: outgoing,
        outgoing: true,
        timestamp: Date.now(),
      })
      setText('')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Не удалось отправить сообщение.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="conversation">
      <header className="conversation-header">
        <span className="chat-title">{chat.title}</span>
        <span className="chat-id">chatId: {chat.id}</span>
      </header>

      <div className="messages">
        {messages.length === 0 && <p className="placeholder">Сообщений пока нет.</p>}
        {messages.map((message) => (
          <div key={message.id} className={message.outgoing ? 'bubble outgoing' : 'bubble incoming'}>
            <span className="bubble-text">{message.text}</span>
            <time>{formatTime(message.timestamp)}</time>
          </div>
        ))}
        <div ref={bottom} />
      </div>

      {error && <p className="error">{error}</p>}

      <form className="composer" onSubmit={submit}>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Сообщение"
          maxLength={4000}
        />
        <button type="submit" disabled={sending || !text.trim()}>
          {sending ? '…' : 'Отправить'}
        </button>
      </form>
    </section>
  )
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}
